// Google reviews + Instagram feed, served by the Worker (replaces the Elfsight widgets).
//
// Works out of the box with the seed data in reviews.json / instagram.json.
// Goes live automatically once these secrets exist (dashboard → Settings → Variables and Secrets):
//   GOOGLE_PLACES_KEY  Google Maps Platform key with "Places API (New)" enabled
//   GOOGLE_PLACE_ID    optional — found automatically from the business name if missing
//   IG_ACCESS_TOKEN    Instagram long-lived token (Instagram API with Instagram Login)
// Data is cached in the BOOKINGS KV namespace; a cron trigger refreshes it every 6 hours.
import SEED_REVIEWS from './reviews.json';
import SEED_IG from './instagram.json';

const PLACE_QUERY = 'Azimuth Holidays - Sailing Boat Tours in Lagos';
export const MAPS_URL = 'https://www.google.com/maps?cid=5744400195281062448';
const HOURS = 3600e3;

const out = (data, maxAge = 900) => new Response(JSON.stringify(data), {
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}` } });

// ------------------------------------------------------------- Google reviews
async function placeId(env) {
  if (env.GOOGLE_PLACE_ID) return env.GOOGLE_PLACE_ID;
  const cached = await env.BOOKINGS.get('g:placeid');
  if (cached) return cached;
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY, 'X-Goog-FieldMask': 'places.id' },
    body: JSON.stringify({ textQuery: PLACE_QUERY, locationBias: { circle: { center: { latitude: 37.11, longitude: -8.674 }, radius: 3000 } } }),
  });
  const j = await r.json();
  const id = j.places?.[0]?.id;
  if (id) await env.BOOKINGS.put('g:placeid', id);
  return id;
}

async function fetchGoogle(env, lang) {
  const id = await placeId(env);
  if (!id) throw new Error('place not found');
  const r = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=${lang}`, {
    headers: { 'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri' } });
  if (!r.ok) throw new Error('places ' + r.status);
  const p = await r.json();
  return {
    rating: p.rating, count: p.userRatingCount, url: p.googleMapsUri || MAPS_URL,
    writeUrl: `https://search.google.com/local/writereview?placeid=${id}`,
    reviews: (p.reviews || []).map(v => {
      const original = v.originalText || v.text || {};
      return { name: v.authorAttribution?.displayName, photo: v.authorAttribution?.photoUri, profile: v.authorAttribution?.uri,
        rating: v.rating, date: (v.publishTime || '').slice(0, 7), lang: (original.languageCode || '').slice(0, 2), text: original.text || '' };
    }).filter(v => v.text),
  };
}

export function seedReviews() {
  return { source: 'seed', rating: SEED_REVIEWS.rating, count: SEED_REVIEWS.count, url: MAPS_URL, reviews: SEED_REVIEWS.reviews };
}

async function reviews(env, lang, force) {
  if (!env.GOOGLE_PLACES_KEY) return seedReviews();
  const key = 'g:reviews:' + lang;
  const c = await env.BOOKINGS.get(key, 'json');
  if (c && !force && Date.now() - c.at < 12 * HOURS) return c.data;
  try {
    const live = await fetchGoogle(env, lang);
    // live reviews first (Google returns up to 5), then the saved ones not already shown
    const names = new Set(live.reviews.map(v => v.name));
    const data = { source: 'google', ...live, reviews: [...live.reviews, ...SEED_REVIEWS.reviews.filter(v => !names.has(v.name))] };
    await env.BOOKINGS.put(key, JSON.stringify({ at: Date.now(), data }));
    return data;
  } catch (e) { console.error('reviews', e); return c?.data || seedReviews(); }
}

// ------------------------------------------------------------- Instagram
async function igToken(env) {
  const saved = await env.BOOKINGS.get('ig:token', 'json');
  // a token pasted in the dashboard wins over an older refreshed one
  if (env.IG_ACCESS_TOKEN && (!saved || saved.from !== env.IG_ACCESS_TOKEN.slice(-12))) return { token: env.IG_ACCESS_TOKEN, at: 0, from: env.IG_ACCESS_TOKEN.slice(-12) };
  return saved;
}

async function refreshToken(env, t) {
  if (Date.now() - (t.at || 0) < 7 * 24 * HOURS) return t;
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t.token)}`);
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) { // try again in a day
    console.error('ig refresh', JSON.stringify(j).slice(0, 200));
    const k = { ...t, at: Date.now() - 6 * 24 * HOURS };
    await env.BOOKINGS.put('ig:token', JSON.stringify(k));
    return k;
  }
  const n = { token: j.access_token, at: Date.now(), from: t.from };
  await env.BOOKINGS.put('ig:token', JSON.stringify(n));
  return n;
}

export function seedInstagram() {
  return { source: 'seed', posts: SEED_IG.posts.map(({ src, ...p }) => ({ ...p, img: `/api/ig/${p.id}.jpg` })) };
}

async function instagram(env, force) {
  let t = await igToken(env);
  if (!t) return seedInstagram();
  const c = await env.BOOKINGS.get('ig:feed', 'json');
  if (c && !force && Date.now() - c.at < 1 * HOURS) return c.data;
  try {
    t = await refreshToken(env, t);
    const r = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${encodeURIComponent(t.token)}`);
    const j = await r.json();
    if (!j.data) throw new Error(JSON.stringify(j).slice(0, 200));
    const posts = j.data.map(m => ({ id: m.id, permalink: m.permalink, type: m.media_type, date: (m.timestamp || '').slice(0, 10),
      caption: (m.caption || '').slice(0, 300), src: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url }));
    await Promise.all(posts.map(p => env.BOOKINGS.put('ig:src:' + p.id, p.src, { expirationTtl: 3 * 24 * 3600 })));
    const data = { source: 'instagram', posts: posts.map(({ src, ...p }) => ({ ...p, img: `/api/ig/${p.id}.jpg` })) };
    await env.BOOKINGS.put('ig:feed', JSON.stringify({ at: Date.now(), data }));
    return data;
  } catch (e) { console.error('instagram', e); return c?.data || seedInstagram(); }
}

// Instagram image URLs expire after a few days, so each picture is copied once into KV
// and served from the site's own domain.
async function igImage(env, id) {
  if (!/^[\w-]{5,40}$/.test(id)) return null;
  const hit = await env.BOOKINGS.getWithMetadata('igimg:' + id, 'arrayBuffer');
  if (hit.value) return new Response(hit.value, { headers: { 'content-type': hit.metadata?.type || 'image/jpeg', 'cache-control': 'public, max-age=2592000, immutable' } });
  const src = (await env.BOOKINGS.get('ig:src:' + id)) || SEED_IG.posts.find(p => p.id === id)?.src;
  if (!src) return null;
  const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } }).catch(() => null);
  if (!r || !r.ok) return null;
  const type = r.headers.get('content-type') || 'image/jpeg';
  const buf = await r.arrayBuffer();
  await env.BOOKINGS.put('igimg:' + id, buf, { metadata: { type } });
  return new Response(buf, { headers: { 'content-type': type, 'cache-control': 'public, max-age=2592000, immutable' } });
}

// ------------------------------------------------------------- routes + cron
export async function social(url, env) {
  const p = url.pathname;
  if (p === '/api/reviews') return out(await reviews(env, url.searchParams.get('lang') === 'pt' ? 'pt' : 'en'));
  if (p === '/api/instagram') return out(await instagram(env));
  const m = p.match(/^\/api\/ig\/([\w-]+)\.jpg$/);
  if (m) return (await igImage(env, m[1])) || new Response('Not found', { status: 404 });
  return null;
}

export async function refreshSocial(env) {
  const feed = await instagram(env, true);
  await Promise.all(feed.posts.map(p => igImage(env, p.id).catch(() => null)));
  await Promise.all(['en', 'pt'].map(l => reviews(env, l, true).catch(() => null)));
}
