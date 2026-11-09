// Static site generator for azimuthholidays.com (no dependencies).
//   node build.mjs          -> writes HTML, sitemap, llms.txt into ./public
// On Cloudflare (Workers Builds) it also downloads the photos into public/img/p
// so the site no longer depends on Squarespace.
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { SITE, PHOTOS, PROGRAMS, BOAT, FAQ, photoRemote } from './src/content.mjs';

const OUT = 'public';
const legacy = JSON.parse(await readFile('src/legacy.json', 'utf8'));
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const { createHash } = await import('node:crypto');
const ver = async f => createHash('sha1').update(await readFile(join('public/assets', f))).digest('hex').slice(0, 10);
const V = { css: await ver('site.css'), site: await ver('site.js'), booking: await ver('booking.js') };

// ------------------------------------------------------------- photos
const localPhotos = {};
async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function fetchPhotos() {
  await mkdir(join(OUT, 'img/p'), { recursive: true });
  await Promise.all(Object.keys(PHOTOS).map(async key => {
    let ok = true;
    for (const w of [750, 1500]) {
      const file = join(OUT, 'img/p', `${key}-${w}.jpg`);
      if (await exists(file)) continue;
      try {
        const r = await fetch(photoRemote(key, w), { signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error(r.status);
        await writeFile(file, Buffer.from(await r.arrayBuffer()));
      } catch { ok = false; }
    }
    if (ok) localPhotos[key] = true;
  }));
  console.log(`photos local: ${Object.keys(localPhotos).length}/${Object.keys(PHOTOS).length}`);
}
const src = (k, w) => localPhotos[k] ? `/img/p/${k}-${w}.jpg` : photoRemote(k, w);
const abs = (k) => localPhotos[k] ? `${SITE.url}/img/p/${k}-1500.jpg` : photoRemote(k, 1500);
const img = (k, L, { cls = '', eager = false, sizes = '(max-width: 800px) 100vw, 50vw' } = {}) =>
  `<img ${cls ? `class="${cls}" ` : ''}src="${src(k, 1500)}" srcset="${src(k, 750)} 750w, ${src(k, 1500)} 1500w" sizes="${sizes}" alt="${esc(PHOTOS[k][L === 'pt' ? 2 : 1])}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

// ------------------------------------------------------------- helpers
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const eur = (n, L) => new Intl.NumberFormat(L === 'pt' ? 'pt-PT' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fdate = (s, L, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(s + 'T12:00:00Z').toLocaleDateString(L === 'pt' ? 'pt-PT' : 'en-GB', o);
const pages = []; // for sitemap

const R = { // routes
  home: { en: '/', pt: '/pt/' },
  boat: { en: '/the-boat/', pt: '/pt/o-barco/' },
  contact: { en: '/contact/', pt: '/pt/contactos/' },
  terms: { en: '/terms/', pt: '/pt/termos/' },
  blog: { en: '/blog/' },
  prog: (p, L) => (L === 'pt' ? '/pt/experiencias/' : '/experiences/') + p.slug[L] + '/',
};

const U = {
  en: { lagos: 'Lagos Tours', atlantic: 'Atlantic 2027', boat: 'The Boat', contact: 'Contact', journal: 'Journal', book: 'Book now', other: 'PT', otherName: 'Português',
    from: 'from', perBoat: 'per boat', view: 'View & book', waTip: 'Chat on WhatsApp', duration: 'Duration', guests: 'Up to {n} guests', departure: 'Marina de Lagos',
    includes: 'What’s included', dates: '2027 departures', route: 'Route', book2: 'Book your date', home: 'Home', experiences: 'Experiences', related: 'Other experiences',
    footerAbout: 'Family-run sailing company based in Lagos, Algarve. Private sailing tours, sea crossings and island-hopping expeditions in the Atlantic aboard the yacht Angela.',
    explore: 'Explore', company: 'Company', terms: 'Terms & Conditions', rights: 'All rights reserved.' },
  pt: { lagos: 'Passeios em Lagos', atlantic: 'Atlântico 2027', boat: 'O Barco', contact: 'Contactos', journal: 'Blog', book: 'Reservar', other: 'EN', otherName: 'English',
    from: 'desde', perBoat: 'por barco', view: 'Ver e reservar', waTip: 'Fale connosco no WhatsApp', duration: 'Duração', guests: 'Até {n} convidados', departure: 'Marina de Lagos',
    includes: 'O que está incluído', dates: 'Partidas 2027', route: 'Rota', book2: 'Reserve a sua data', home: 'Início', experiences: 'Experiências', related: 'Outras experiências',
    footerAbout: 'Empresa familiar de vela sediada em Lagos, Algarve. Passeios privados à vela, travessias oceânicas e expedições entre ilhas no Atlântico a bordo do veleiro Angela.',
    explore: 'Explorar', company: 'Empresa', terms: 'Termos e Condições', rights: 'Todos os direitos reservados.' },
};

const priceLabel = (p, L) => {
  if (p.kind === 'fixed') { const min = Math.min(...p.options.map(o => o.per === 'person' ? o.price : o.price)); return [`${U[L].from} ${eur(min, L)}`, p.options[0].per === 'person' ? (L === 'pt' ? 'por pessoa' : 'per person') : (L === 'pt' ? 'charter privado' : 'private charter')]; }
  if (p.price.type === 'fixed') return [eur(p.price.amount, L), p.price.unit[L]];
  return [`${U[L].from} ${eur(p.price.low, L)}`, p.price.unit[L]];
};

// ------------------------------------------------------------- JSON-LD
const ORG_ID = `${SITE.url}/#organization`;
const orgLd = L => ({
  '@context': 'https://schema.org', '@type': ['TravelAgency', 'LocalBusiness'], '@id': ORG_ID,
  name: SITE.name, alternateName: ['Azimuth Holidays', 'Azimuth Sailing'], legalName: SITE.legalName,
  url: SITE.url, logo: `${SITE.url}/img/logo.png`, image: abs('aerial'),
  description: L === 'pt' ? 'Passeios privados à vela em Lagos (Algarve), travessias atlânticas para Porto Santo e Açores e férias à vela entre as ilhas dos Açores, a bordo do veleiro Angela (Bavaria 49).'
    : 'Private sailing tours in Lagos (Algarve, Portugal), Atlantic sea crossings to Porto Santo and the Azores, and Azores island-hopping sailing holidays aboard the yacht Angela (Bavaria 49).',
  telephone: SITE.phoneDisplay, email: SITE.email, priceRange: '€€€', currenciesAccepted: 'EUR',
  address: { '@type': 'PostalAddress', streetAddress: SITE.address.street, addressLocality: SITE.address.locality, addressRegion: SITE.address.region, postalCode: SITE.address.postalCode, addressCountry: SITE.address.country },
  geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
  areaServed: ['Lagos', 'Algarve', 'Madeira', 'Porto Santo', 'Azores'],
  knowsLanguage: ['en', 'pt'], sameAs: [SITE.instagram, SITE.facebook],
  founder: { '@type': 'Person', name: `Captain ${SITE.captain}`, jobTitle: 'Skipper' },
});
const crumbsLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE.url + url })) });

function tripLd(p, L) {
  const url = SITE.url + R.prog(p, L);
  const base = { '@context': 'https://schema.org', '@type': 'TouristTrip', '@id': url + '#trip', name: p.seoTitle[L], description: p.tagline[L] + ' ' + p.body[L][0],
    url, image: [abs(p.photo), ...p.gallery.map(abs)], provider: { '@id': ORG_ID }, touristType: L === 'pt' ? ['Casais', 'Famílias', 'Grupos de amigos', 'Viajantes de aventura'] : ['Couples', 'Families', 'Groups of friends', 'Adventure travellers'],
    inLanguage: L, itinerary: { '@type': 'ItemList', itemListElement: (p.route ? p.route.split(' → ') : p.from ? [p.from, p.to] : ['Marina de Lagos', 'Algarve coast', 'Marina de Lagos']).map((n, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Place', name: n } })) } };
  if (p.kind === 'fixed') {
    base.offers = p.options.map(o => ({ '@type': 'Offer', name: o.label[L], price: o.price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url }));
    const events = p.departures.map(d => ({ '@context': 'https://schema.org', '@type': 'Event', name: `${p.title[L]} — ${fdate(d.start, L)}`, startDate: d.start, endDate: d.end,
      eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: p.from, address: { '@type': 'PostalAddress', addressLocality: p.from, addressCountry: 'PT' } },
      image: [abs(p.photo)], description: p.tagline[L], organizer: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      offers: { '@type': 'Offer', price: Math.min(...p.options.map(o => o.price)), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url, validFrom: '2026-11-01' },
      maximumAttendeeCapacity: p.maxGuests }));
    return [base, ...events];
  }
  const pr = p.price;
  base.offers = pr.type === 'season'
    ? { '@type': 'AggregateOffer', lowPrice: pr.low, highPrice: pr.high, priceCurrency: 'EUR', url, availability: 'https://schema.org/InStock' }
    : { '@type': 'Offer', price: pr.amount, priceCurrency: 'EUR', url, availability: 'https://schema.org/InStock' };
  return [base];
}

// ------------------------------------------------------------- layout
const waIcon = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.6l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.8C5.1 10 10 5.3 16 5.3s10.9 4.7 10.9 10.5S22 26.4 16 26.4zm6-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.3 3.4c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';
const menuIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg>';

function layout({ L, path, alt, title, desc, image = 'aerial', body, ld = [], solid = false, scripts = '' }) {
  const u = U[L], home = R.home[L];
  const altLang = L === 'en' ? 'pt' : 'en';
  const canonical = SITE.url + path;
  pages.push({ path, alt, L });
  const hreflang = alt ? `<link rel="alternate" hreflang="${L === 'en' ? 'en' : 'pt-PT'}" href="${canonical}">
<link rel="alternate" hreflang="${L === 'en' ? 'pt-PT' : 'en'}" href="${SITE.url + alt}">
<link rel="alternate" hreflang="x-default" href="${SITE.url + (L === 'en' ? path : alt)}">` : '';
  return `<!doctype html>
<html lang="${L === 'pt' ? 'pt-PT' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
${hreflang}
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="${abs(image)}"><meta property="og:locale" content="${L === 'pt' ? 'pt_PT' : 'en_GB'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b2a3e">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/png" href="/img/icon-192.png"><link rel="apple-touch-icon" href="/img/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Jost:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=${V.css}">
${[orgLd(L), ...ld].map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">${L === 'pt' ? 'Saltar para o conteúdo' : 'Skip to content'}</a>
<header class="site-header${solid ? ' always' : ''}"><div class="wrap bar">
  <a class="logo" href="${home}" aria-label="${SITE.name}"><img class="light" src="/img/logo-white.png" alt="${SITE.name}" width="114" height="40"><img class="dark" src="/img/logo.png" alt="${SITE.name}" width="114" height="40"></a>
  <button class="menu-toggle" aria-label="Menu" aria-expanded="false">${menuIcon}</button>
  <nav class="nav" aria-label="Main">
    <a href="${home}#lagos">${u.lagos}</a><a href="${home}#atlantic">${u.atlantic}</a><a href="${R.boat[L]}">${u.boat}</a><a href="${R.contact[L]}">${u.contact}</a>
    ${alt ? `<a class="lang" href="${alt}" hreflang="${altLang}" lang="${altLang}" title="${u.otherName}">${u.other}</a>` : `<a class="lang" href="${R.home[altLang]}" lang="${altLang}">${u.other}</a>`}
    <a class="btn" href="${home}#experiences">${u.book}</a>
  </nav></div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
 <div class="fgrid">
  <div><img src="/img/logo-white.png" alt="${SITE.name}" width="140" height="49" style="margin-bottom:18px"><p>${u.footerAbout}</p></div>
  <div><h4>${u.explore}</h4><ul>${PROGRAMS.filter(p => p.group === 'lagos').map(p => `<li><a href="${R.prog(p, L)}">${p.title[L]}</a></li>`).join('')}</ul></div>
  <div><h4>${u.atlantic}</h4><ul>${PROGRAMS.filter(p => p.group === 'atlantic').map(p => `<li><a href="${R.prog(p, L)}">${p.title[L]}</a></li>`).join('')}</ul></div>
  <div><h4>${u.company}</h4><ul><li><a href="${R.boat[L]}">${u.boat}</a></li><li><a href="${R.contact[L]}">${u.contact}</a></li><li><a href="/blog/">${u.journal}</a></li><li><a href="${R.terms[L]}">${u.terms}</a></li>
   <li><a href="https://wa.me/${SITE.whatsapp}" rel="noopener">WhatsApp</a> · <a href="${SITE.instagram}" rel="noopener">Instagram</a></li><li><a href="mailto:${SITE.email}">${SITE.email}</a></li></ul></div>
 </div>
 <div class="legal"><span>© ${new Date().getFullYear()} ${SITE.legalName} — ${u.rights}</span><span>Marina de Lagos · 37°06′N 8°40′W</span></div>
</div></footer>
<a class="wa" href="https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(L === 'pt' ? 'Olá! Gostaria de saber mais sobre as experiências à vela da Azimuth.' : 'Hello! I would like to know more about Azimuth sailing experiences.')}" target="_blank" rel="noopener" aria-label="WhatsApp"><span class="tip">${u.waTip}</span>${waIcon}</a>
<script src="/assets/site.js?v=${V.site}" defer></script>
${scripts}
</body></html>`;
}

// ------------------------------------------------------------- components
function card(p, L) {
  const [pr, unit] = priceLabel(p, L);
  const tag = p.group === 'atlantic' ? (p.route ? (L === 'pt' ? 'Açores' : 'Azores') : (L === 'pt' ? 'Travessia' : 'Crossing')) : p.duration[L].split('·')[0].trim();
  return `<a class="card reveal" href="${R.prog(p, L)}"><div class="ph">${img(p.photo, L, { sizes: '(max-width: 620px) 100vw, 25vw' })}<span class="tag">${esc(tag)}</span></div>
  <div class="bd"><h3>${p.title[L]}</h3><p class="meta">${p.tagline[L]}</p><div class="price"><b>${pr}</b><span>${unit}</span></div></div></a>`;
}

function homePage(L) {
  const lagos = PROGRAMS.filter(p => p.group === 'lagos'), atl = PROGRAMS.filter(p => p.group === 'atlantic');
  const t = L === 'pt' ? {
    title: 'Passeios à Vela em Lagos, Algarve e Travessias no Atlântico | Azimuth',
    desc: 'Passeios privados à vela em Lagos (Algarve): meio dia, dia inteiro e pôr do sol. Travessias para Porto Santo e Açores e férias à vela entre ilhas em 2027. Reserve online.',
    h1: 'Experiências à vela <b>para lá do horizonte.</b>', p: 'Passeios privados a partir da Marina de Lagos e expedições oceânicas no Atlântico — em pequenos grupos, a bordo do veleiro Angela, como parte da tripulação.',
    c1: 'Passeios em Lagos', c2: 'Expedições 2027',
    introE: 'Vela na sua forma mais pura', introH: 'Uma experiência autêntica do Atlântico.', introP: 'Somos uma empresa familiar de Lagos. Não fazemos turismo de massas nem “party boats”: navegamos a sério, com grupos pequenos, um skipper com longa experiência oceânica e tempo para aprender, nadar e simplesmente estar no mar.',
    pil: [['Grupos pequenos', 'O barco é só do seu grupo nos passeios em Lagos; nas expedições, no máximo 5 a 6 convidados.'], ['Faça parte da tripulação', 'Ao leme, a afinar velas, a fazer quartos — participa tanto quanto quiser.'], ['Experiência comprovada', `O Capitão ${SITE.captain} conduz cada viagem com segurança, calma e conhecimento do oceano.`]],
    lagosH: 'Passeios privados à vela em Lagos', lagosP: 'Partidas da Marina de Lagos. Grutas, falésias da Ponta da Piedade e enseadas escondidas, com bebidas e petiscos a bordo.',
    atlH: 'Expedições no Atlântico — 2027', atlP: 'Travessias oceânicas e semanas entre ilhas: de Lagos à Madeira, da Madeira aos Açores e entre as ilhas do grupo central.',
    boatH: 'Angela — a sua casa a flutuar no Atlântico', boatP: 'Um Bavaria 49 de 15 metros, espaçoso e confortável, preparado tanto para passeios costeiros como para travessias oceânicas.',
    specs: [[BOAT.cabins, 'cabines'], [BOAT.bathrooms, 'casas de banho'], [BOAT.sleeps, 'pernoitas a bordo']], boatBtn: 'Conhecer o barco',
    revH: 'O que dizem os nossos convidados', revP: 'Avaliações reais no Google.', revBtn: 'Ver todas no Google',
    igH: 'No mar, todos os dias', igP: 'Siga a nossa vida a bordo no Instagram.', igBtn: 'Seguir @azimuthholidays',
    faqH: 'Perguntas frequentes', ctaH: 'O valor está na viagem, não só no destino.', ctaP: 'Diga-nos as datas e o tipo de experiência que procura — respondemos pessoalmente.',
  } : {
    title: 'Sailing Tours in Lagos, Algarve & Atlantic Sea Crossings | Azimuth',
    desc: 'Private sailing tours in Lagos, Algarve: half-day, full-day and sunset. Atlantic sea crossings to Porto Santo and the Azores and island-hopping sailing holidays in 2027. Book online.',
    h1: 'Sailing experiences <b>beyond the horizon.</b>', p: 'Private tours from Marina de Lagos and ocean expeditions across the Atlantic — in small groups, aboard the yacht Angela, as part of the crew.',
    c1: 'Lagos sailing tours', c2: '2027 expeditions',
    introE: 'Sailing in its purest form', introH: 'An authentic Atlantic experience.', introP: 'We are a family-run company from Lagos. No mass tourism, no party boats: we sail for real, with small groups, a skipper with long ocean experience, and time to learn, swim and simply be at sea.',
    pil: [['Small groups', 'The boat is only for your group on Lagos tours; on expeditions, a maximum of 5 to 6 guests.'], ['Become part of the crew', 'At the helm, trimming sails, keeping watch — take part as much as you like.'], ['Proven experience', `Captain ${SITE.captain} leads every voyage with safety, calm and deep ocean knowledge.`]],
    lagosH: 'Private sailing tours in Lagos', lagosP: 'Departing from Marina de Lagos. Caves, the Ponta da Piedade cliffs and hidden coves, with drinks and snacks on board.',
    atlH: 'Atlantic expeditions — 2027', atlP: 'Ocean crossings and island weeks: from Lagos to Madeira, from Madeira to the Azores and between the islands of the central group.',
    boatH: 'Angela — your floating home on the Atlantic', boatP: 'A spacious and comfortable 15-metre Bavaria 49, equipped for coastal cruises and open-ocean passages alike.',
    specs: [[BOAT.cabins, 'cabins'], [BOAT.bathrooms, 'bathrooms'], [BOAT.sleeps, 'guests overnight']], boatBtn: 'Meet the boat',
    revH: 'What our guests say', revP: 'Real reviews on Google.', revBtn: 'See all on Google',
    igH: 'At sea, every day', igP: 'Follow our life on board on Instagram.', igBtn: 'Follow @azimuthholidays',
    faqH: 'Frequently asked questions', ctaH: 'The value is in the journey, not only the destination.', ctaP: 'Tell us your dates and the kind of experience you are looking for — we reply personally.',
  };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ[L].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const listLd = { '@context': 'https://schema.org', '@type': 'ItemList', name: L === 'pt' ? 'Experiências à vela' : 'Sailing experiences',
    itemListElement: PROGRAMS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + R.prog(p, L), name: p.title[L] })) };
  const body = `
<section class="hero">
  ${img('aerial', L, { cls: 'bg', eager: true, sizes: '100vw' })}
  <div class="wrap"><span class="eyebrow" style="color:#bfe3f4">Lagos · Madeira · ${L === 'pt' ? 'Açores' : 'Azores'}</span>
    <h1>${t.h1}</h1><p>${t.p}</p>
    <div class="ctas"><a class="btn light" href="#lagos">${t.c1}</a><a class="btn outline-light" href="#atlantic">${t.c2}</a></div></div>
  <div class="coords">37°06′N · 8°40′W<br>Marina de Lagos</div>
</section>

<section id="experiences"><div class="wrap">
  <span class="eyebrow">${t.introE}</span>
  <div class="split"><h2 style="margin:0">${t.introH}</h2><p class="lead" style="margin:0">${t.introP}</p></div>
  <div class="pillars">${t.pil.map((x, i) => `<div class="pillar reveal"><span class="n">0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
</div></section>

<section id="lagos" class="bg-sand"><div class="wrap">
  <div class="section-head"><div><span class="eyebrow">Lagos · Algarve</span><h2>${t.lagosH}</h2></div><p class="lead">${t.lagosP}</p></div>
  <div class="cards">${lagos.map(p => card(p, L)).join('')}</div>
</div></section>

<section id="atlantic" class="bg-navy"><div class="wrap">
  <div class="section-head"><div><span class="eyebrow">${L === 'pt' ? 'Oceano Atlântico' : 'Atlantic Ocean'}</span><h2>${t.atlH}</h2></div><p class="lead">${t.atlP}</p></div>
  <div class="route"><div class="stop"><b>Lagos</b><small>37°06′N 8°40′W</small></div><div class="stop"><b>Porto Santo</b><small>33°04′N 16°20′W</small></div><div class="stop"><b>Ponta Delgada</b><small>37°44′N 25°40′W</small></div><div class="stop"><b>${L === 'pt' ? 'Grupo Central' : 'Central Azores'}</b><small>38°39′N 27°13′W</small></div></div>
  <div class="cards">${atl.map(p => card(p, L)).join('')}</div>
</div></section>

<section><div class="wrap split">
  <div class="mosaic reveal">${img('bavaria', L)}${img('saloon', L, { sizes: '25vw' })}${img('cabin', L, { sizes: '25vw' })}</div>
  <div><span class="eyebrow">${BOAT.model} · ${BOAT.length}</span><h2>${t.boatH}</h2><p class="lead">${t.boatP}</p>
   <div class="specs">${t.specs.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
   <a class="btn ghost" href="${R.boat[L]}">${t.boatBtn} →</a></div>
</div></section>

<section class="bg-sand" id="reviews"><div class="wrap">
  <div class="section-head"><div><span class="eyebrow">Google</span><h2>${t.revH}</h2></div><a class="btn ghost" href="${SITE.googleReviewsUrl}" target="_blank" rel="noopener">${t.revBtn} →</a></div>
  <div class="widget-box" data-elfsight><div class="elfsight-app-${SITE.elfsight.reviews}" data-elfsight-app-lazy></div></div>
</div></section>

<section id="instagram"><div class="wrap">
  <div class="section-head"><div><span class="eyebrow">Instagram</span><h2>${t.igH}</h2></div><a class="btn ghost" href="${SITE.instagram}" target="_blank" rel="noopener">${t.igBtn} →</a></div>
  <div class="widget-box" data-elfsight><div class="elfsight-app-${SITE.elfsight.instagram}" data-elfsight-app-lazy></div></div>
</div></section>

<section class="bg-sand" id="faq"><div class="wrap">
  <span class="eyebrow">FAQ</span><h2>${t.faqH}</h2>
  <div class="faq">${FAQ[L].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</div></section>

<section class="cta-band">${img('sunsetSun', L, { sizes: '100vw' })}<div class="wrap">
  <h2>${t.ctaH}</h2><p class="lead" style="color:#d4e6f0;margin:0 auto">${t.ctaP}</p>
  <div class="ctas"><a class="btn light" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a><a class="btn outline-light" href="${R.contact[L]}">${U[L].contact}</a></div>
</div></section>`;
  return layout({ L, path: R.home[L], alt: R.home[L === 'en' ? 'pt' : 'en'], title: t.title, desc: t.desc, body, ld: [faqLd, listLd] });
}

function programPage(p, L) {
  const u = U[L], other = L === 'en' ? 'pt' : 'en';
  const [pr, unit] = priceLabel(p, L);
  const facts = [`⏱ ${p.duration[L]}`, `👥 ${u.guests.replace('{n}', p.maxGuests)}`, `📍 ${p.group === 'lagos' ? u.departure : (p.route || `${p.from} → ${p.to}`)}`];
  const datesTable = p.kind === 'fixed' ? `<h2 style="font-size:1.6rem">${u.dates}</h2>
    <table class="dates-table"><thead><tr><th>${L === 'pt' ? 'Início' : 'Start'}</th><th>${L === 'pt' ? 'Fim' : 'End'}</th>${p.departures[0].checkin ? `<th>Check-in</th>` : ''}</tr></thead><tbody>
    ${p.departures.map(d => `<tr><td>${fdate(d.start, L)}</td><td>${fdate(d.end, L)}</td>${d.checkin ? `<td>${fdate(d.checkin, L)}</td>` : ''}</tr>`).join('')}</tbody></table>
    <table class="dates-table"><thead><tr><th>${L === 'pt' ? 'Opção' : 'Option'}</th><th>${L === 'pt' ? 'Preço' : 'Price'}</th></tr></thead><tbody>${p.options.map(o => `<tr><td>${o.label[L]}</td><td>${eur(o.price, L)}</td></tr>`).join('')}</tbody></table>` :
    p.price.type === 'season' ? `<table class="dates-table"><thead><tr><th>${L === 'pt' ? 'Época' : 'Season'}</th><th>${L === 'pt' ? 'Preço' : 'Price'}</th></tr></thead><tbody>
    <tr><td>${L === 'pt' ? 'Época alta (junho – setembro)' : 'High season (June – September)'}</td><td>${p.price.from ? u.from + ' ' : ''}${eur(p.price.high, L)}</td></tr>
    <tr><td>${L === 'pt' ? 'Época baixa (outubro – maio)' : 'Low season (October – May)'}</td><td>${p.price.from ? u.from + ' ' : ''}${eur(p.price.low, L)}</td></tr></tbody></table>` : '';
  const related = PROGRAMS.filter(x => x.id !== p.id && x.group === p.group).slice(0, 3);
  const data = { id: p.id, lang: L, kind: p.kind, title: p.title[L], whatsapp: SITE.whatsapp, maxGuests: p.maxGuests, months: p.months, times: p.times,
    price: p.price, options: p.options, departures: p.departures, minNights: p.minNights };
  const body = `
<section class="hero small">${img(p.photo, L, { cls: 'bg', eager: true, sizes: '100vw' })}
  <div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${R.home[L]}">${u.home}</a> / <a href="${R.home[L]}#${p.group}">${p.group === 'lagos' ? u.lagos : u.atlantic}</a></nav>
  <h1>${p.title[L]}</h1><p>${p.tagline[L]}</p></div></section>
<section><div class="wrap program">
  <article>
    <ul class="facts">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    ${p.body[L].map((x, i) => `<p class="${i === 0 ? 'lead' : ''}">${x}</p>`).join('')}
    <div class="gallery3">${p.gallery.map(k => img(k, L, { sizes: '(max-width: 800px) 33vw, 260px' })).join('')}</div>
    <h2 style="font-size:1.6rem">${u.includes}</h2>
    <ul class="includes">${p.includes[L].map(x => `<li>${x}</li>`).join('')}</ul>
    ${datesTable}
    <p class="note">${L === 'pt' ? 'Os preços estão em euros. Combustível, taxas de marina e extras não indicados como incluídos podem ser cobrados à parte — ver ' : 'Prices in euros. Fuel, marina fees and extras not listed as included may be charged separately — see '}<a href="${R.terms[L]}">${u.terms}</a>.</p>
  </article>
  <aside class="booking" id="booking" aria-label="${u.book2}">
    <header><small>${u.book2}</small><div class="p">${pr} <span>${unit}</span></div></header>
    <div class="body"><noscript>${L === 'pt' ? 'Ative o JavaScript ou fale connosco por WhatsApp.' : 'Enable JavaScript or contact us on WhatsApp.'}</noscript></div>
  </aside>
</div></section>
<section class="bg-sand"><div class="wrap"><h2>${u.related}</h2><div class="cards cards-${related.length}">${related.map(x => card(x, L)).join('')}</div></div></section>
<script type="application/json" id="az-program">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  const ld = [...tripLd(p, L), crumbsLd([[u.home, R.home[L]], [p.group === 'lagos' ? u.lagos : u.atlantic, R.home[L] + '#' + p.group], [p.title[L], R.prog(p, L)]])];
  const minP = p.kind === 'fixed' ? Math.min(...p.options.map(o => o.price)) : p.price.type === 'season' ? p.price.low : p.price.amount;
  const desc = `${p.tagline[L]} ${p.duration[L]}. ${u.from[0].toUpperCase() + u.from.slice(1)} ${eur(minP, L)}. ${L === 'pt' ? 'Reserve online a sua data.' : 'Book your date online.'}`;
  return layout({ L, path: R.prog(p, L), alt: R.prog(p, other), title: `${p.seoTitle[L]} | Azimuth`, desc, image: p.photo, body, ld,
    scripts: `<script src="/assets/booking.js?v=${V.booking}" defer></script>` });
}

function boatPage(L) {
  const t = L === 'pt' ? {
    title: 'Veleiro Angela — Bavaria 49 em Lagos | Azimuth Sailing Holidays', desc: 'Conheça o Angela, veleiro Bavaria 49 de 15 m com 5 cabines e 3 casas de banho, para passeios em Lagos e travessias no Atlântico.',
    h1: 'Angela', sub: 'A sua casa a flutuar no Atlântico — luxuosa, espaçosa e feita para momentos inesquecíveis no mar.',
    p: ['Suba a bordo do nosso veleiro de 15 metros — um dos mais espaçosos da sua categoria — equipado tanto para passeios costeiros como para viagens longas no mar.', 'Com 5 cabines (3 duplas e 2 twin), 3 casas de banho e alojamento para até 8 convidados (10 em passeios de dia), o Angela combina conforto, funcionalidade e estilo. O salão é luminoso, com uma grande zona de estar e mesa de refeições.'],
    fh: 'A bordo', f: ['Salão convertível com zona lounge', 'Cozinha equipada: forno, frigorífico/congelador, loiça e utensílios', 'Aquecimento em cada cabine', 'Som interior/exterior com ligação ao telemóvel', 'Navegação: GPS, piloto automático, radar, AIS, VHF, vento e profundidade', 'Churrasco, plataforma de banho, chuveiro exterior com água quente, bote', 'Dupla roda de leme, guincho elétrico de âncora, velas de enrolar, bimini e capota', 'Pranchas de paddle e material de snorkel'],
    capH: `Capitão ${SITE.captain}`, capP: 'Skipper com vasta experiência oceânica, conduz cada viagem com segurança, calma e o gosto de partilhar o mar. Nas travessias, ensina navegação, meteorologia e manobra a quem quiser fazer parte da tripulação.',
    gal: 'Galeria',
  } : {
    title: 'Sailing Yacht Angela — Bavaria 49 in Lagos | Azimuth Sailing Holidays', desc: 'Meet Angela, a 15 m Bavaria 49 sailing yacht with 5 cabins and 3 bathrooms, for private tours in Lagos and Atlantic sea crossings.',
    h1: 'Angela', sub: 'Your floating home on the Atlantic — luxurious, spacious and made for unforgettable moments at sea.',
    p: ['Step aboard our 15-metre sailing yacht — one of the most spacious of its kind — equipped for both short coastal cruises and extended sea adventures.', 'With 5 cabins (3 double and 2 twin), 3 bathrooms and accommodation for up to 8 overnight guests (10 for day charters), Angela blends comfort, functionality and style. The saloon is bright and airy, with a large seating area and dining table.'],
    fh: 'On board', f: ['Convertible saloon with lounge area', 'Fully equipped galley: oven, fridge/freezer, crockery and cookware', 'Heating in every cabin', 'Interior/exterior speakers with phone connectivity', 'Navigation: GPS, autopilot, radar, AIS, VHF, wind and depth instruments', 'Barbecue, swim platform, hot outdoor shower, inflatable dinghy', 'Twin helm wheels, electric anchor winch, furling sails, bimini & dodger', 'Paddle boards and snorkelling gear'],
    capH: `Captain ${SITE.captain}`, capP: 'A skipper with extensive ocean experience who leads every voyage with safety, calm and a love of sharing the sea. On crossings he teaches navigation, weather and sail handling to anyone who wants to be part of the crew.',
    gal: 'Gallery',
  };
  const gal = ['angela', 'deck', 'cockpit', 'saloon', 'cabin', 'bunk', 'food', 'helm', 'aerialSup', 'sup', 'swimCliffs', 'coupleSunset', 'boyHelm', 'cave', 'picnic'];
  const body = `
<section class="hero small">${img('bavaria', L, { cls: 'bg', eager: true, sizes: '100vw' })}<div class="wrap"><span class="eyebrow" style="color:#bfe3f4">${BOAT.model} · ${BOAT.length}</span><h1>${t.h1}</h1><p>${t.sub}</p></div></section>
<section><div class="wrap split">
  <div>${t.p.map((x, i) => `<p class="${i ? '' : 'lead'}">${x}</p>`).join('')}
   <div class="specs">${[[BOAT.cabins, L === 'pt' ? 'cabines' : 'cabins'], [BOAT.bathrooms, L === 'pt' ? 'casas de banho' : 'bathrooms'], [BOAT.sleeps + '/' + BOAT.dayGuests, L === 'pt' ? 'noite / dia' : 'overnight / day']].map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div></div>
  <div><h2 style="font-size:1.6rem">${t.fh}</h2><ul class="includes" style="grid-template-columns:1fr">${t.f.map(x => `<li>${x}</li>`).join('')}</ul></div>
</div></section>
<section class="bg-navy"><div class="wrap split rev"><div class="mosaic">${img('crew', L)}${img('helm', L, { sizes: '25vw' })}${img('ropeSunset', L, { sizes: '25vw' })}</div>
  <div><span class="eyebrow">Skipper</span><h2>${t.capH}</h2><p class="lead">${t.capP}</p></div></div></section>
<section id="gallery"><div class="wrap"><h2>${t.gal}</h2><div class="gallery3">${gal.map(k => img(k, L, { sizes: '(max-width: 800px) 33vw, 380px' })).join('')}</div></div></section>`;
  return layout({ L, path: R.boat[L], alt: R.boat[L === 'en' ? 'pt' : 'en'], title: t.title, desc: t.desc, image: 'bavaria', body,
    ld: [crumbsLd([[U[L].home, R.home[L]], [U[L].boat, R.boat[L]]])] });
}

function contactPage(L) {
  const t = L === 'pt' ? { title: 'Contactos e Reservas | Azimuth Sailing Holidays, Lagos', desc: 'Fale com a Azimuth: WhatsApp, e-mail e pedidos de orçamento para passeios à vela em Lagos, charters e travessias no Atlântico.',
    h1: 'Contactos', sub: 'Tem uma pergunta ou quer planear uma experiência à medida? Respondemos pessoalmente.',
    fh: 'Pedido de informação', send: 'Enviar mensagem', ok: 'Obrigado! Recebemos a sua mensagem e respondemos em breve.', err: 'Não foi possível enviar. Use o WhatsApp ou o e-mail.' }
    : { title: 'Contact & Bookings | Azimuth Sailing Holidays, Lagos', desc: 'Contact Azimuth: WhatsApp, email and quote requests for private sailing tours in Lagos, charters and Atlantic sea crossings.',
    h1: 'Contact us', sub: 'Have a question or want to plan a tailor-made experience? We reply personally.',
    fh: 'Send an enquiry', send: 'Send message', ok: 'Thank you! We received your message and will reply shortly.', err: 'We could not send it. Please use WhatsApp or email.' };
  const f = L === 'pt' ? ['Nome', 'E-mail', 'Telemóvel / WhatsApp', 'Experiência de interesse', 'Datas preferidas e n.º de convidados', 'Mensagem'] : ['Name', 'Email', 'Phone / WhatsApp', 'Experience of interest', 'Preferred dates and number of guests', 'Message'];
  const body = `
<section class="hero small">${img('bow', L, { cls: 'bg', eager: true, sizes: '100vw' })}<div class="wrap"><h1>${t.h1}</h1><p>${t.sub}</p></div></section>
<section><div class="wrap split" style="align-items:start">
 <div>
  <span class="eyebrow">Azimuth Sailing Holidays</span>
  <p class="lead"><b>WhatsApp</b><br><a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">${SITE.phoneDisplay}</a></p>
  <p class="lead"><b>E-mail</b><br><a href="mailto:${SITE.email}">${SITE.email}</a></p>
  <p class="lead"><b>${L === 'pt' ? 'Ponto de partida' : 'Departure point'}</b><br>Marina de Lagos, 8600-780 Lagos, Portugal</p>
  <p class="lead"><b>Instagram</b><br><a href="${SITE.instagram}" target="_blank" rel="noopener">@azimuthholidays</a></p>
  <iframe title="Marina de Lagos" loading="lazy" style="width:100%;height:300px;border:0;border-radius:14px" src="https://www.google.com/maps?q=Marina+de+Lagos,+Portugal&output=embed"></iframe>
 </div>
 <form class="booking" id="enquiry" style="position:static" novalidate>
  <header><small>${t.fh}</small></header><div class="body">
   <div class="field"><label>${f[0]}</label><input name="name" required autocomplete="name"></div>
   <div class="row2"><div class="field"><label>${f[1]}</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>${f[2]}</label><input name="phone" type="tel" required autocomplete="tel"></div></div>
   <div class="field"><label>${f[3]}</label><select name="interest">${PROGRAMS.map(p => `<option>${p.title[L]}</option>`).join('')}<option>${L === 'pt' ? 'Outro / à medida' : 'Other / tailor-made'}</option></select></div>
   <div class="field"><label>${f[4]}</label><input name="when"></div>
   <div class="field"><label>${f[5]}</label><textarea name="notes" rows="4"></textarea></div>
   <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
   <button class="btn block" type="submit">${t.send}</button><div id="enq-msg"></div></div>
 </form>
</div></section>`;
  const script = `<script>document.getElementById('enquiry').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,m=document.getElementById('enq-msg'),d=Object.fromEntries(new FormData(f));
if(!d.name||!/.+@.+\\..+/.test(d.email||'')||!d.phone){m.className='msg err';m.textContent=${JSON.stringify(L === 'pt' ? 'Preencha nome, e-mail e telemóvel.' : 'Please fill in name, email and phone.')};return}
const b=f.querySelector('button');b.disabled=true;try{const r=await fetch('/api/booking',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...d,program:'enquiry',lang:'${L}',consent:true,page:location.pathname})});const j=await r.json();if(!j.ok)throw 0;f.querySelector('.body').innerHTML='<div class="done"><div class="tick">✓</div><p>${t.ok}</p></div>'}catch(_){b.disabled=false;m.className='msg err';m.textContent=${JSON.stringify(t.err)}}});</script>`;
  return layout({ L, path: R.contact[L], alt: R.contact[L === 'en' ? 'pt' : 'en'], title: t.title, desc: t.desc, image: 'bow', body, solid: false, scripts: script,
    ld: [{ '@context': 'https://schema.org', '@type': 'ContactPage', url: SITE.url + R.contact[L], about: { '@id': ORG_ID } }] });
}

const TERMS_PT = await readFile('src/terms-pt.html', 'utf8');
function termsPage(L) {
  const html = L === 'pt' ? TERMS_PT : legacy.terms.replace(/<h2>.*?<\/h2>/, '');
  const h = L === 'pt' ? 'Termos e Condições' : 'Terms & Conditions';
  const body = `<section style="padding-top:140px"><div class="wrap article"><span class="eyebrow">${SITE.legalName}</span><h1 style="font-size:2.6rem">${h}</h1>
   <p class="lead">${L === 'pt' ? 'Condições gerais para charter de veleiro com skipper.' : 'General terms & conditions for skippered yacht charter.'}</p>${html}</div></section>`;
  return layout({ L, path: R.terms[L], alt: R.terms[L === 'en' ? 'pt' : 'en'], title: `${h} | Azimuth Sailing Holidays`, desc: L === 'pt' ? 'Termos e condições de reserva, pagamento e cancelamento dos charters à vela da Azimuth.' : 'Booking, payment and cancellation terms for Azimuth skippered sailing charters.', body, solid: true });
}

const LINKMAP = [[/\/sailing-tours-lagos-algarve#half-day/g, '/experiences/half-day-sailing-tour-lagos/'], [/\/sailing-tours-lagos-algarve#full-day/g, '/experiences/full-day-sailing-tour-lagos/'],
  [/https:\/\/www\.azimuthholidays\.com\/sailing-tours-lagos-algarve#quote/g, '/contact/'], [/https:\/\/www\.azimuthholidays\.com\/sailing-tours-lagos-algarve#sunset/g, '/experiences/sunset-sailing-lagos/'],
  [/https:\/\/www\.azimuthholidays\.com\/sailing-tours-lagos-algarve/g, '/#lagos'], [/"\/sailing-tours-lagos-algarve"/g, '"/#lagos"'],
  [/"\/sunset-luxury"/g, '"/experiences/sunset-sailing-lagos/"'], [/"\/full-day-sailing-tour"/g, '"/experiences/full-day-sailing-tour-lagos/"'], [/ target="_new"| target=""/g, '']];
function blogPages() {
  const L = 'en';
  for (const p of legacy.posts) {
    let html = p.html.replace(/<img[^>]*Ponta-da-Piedade[^>]*>/g, '');
    for (const [a, b] of LINKMAP) html = html.replace(a, b);
    html = html.replace(/<p>#.*?<\/p>/g, '');
    const path = `/blog/${p.slug}/`;
    const title = p.title.replace('&amp;amp;', '&').replace('&amp;', '&');
    const body = `<section style="padding-top:140px"><div class="wrap article"><span class="eyebrow">${fdate(p.date, L, { day: 'numeric', month: 'long', year: 'numeric' })}</span><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(title)}</h1>${html}
      <p style="margin-top:40px"><a class="btn" href="/#lagos">See our sailing tours →</a></p></div></section>`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, datePublished: p.date, dateModified: p.date, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: SITE.url + path, inLanguage: 'en',
      image: (html.match(/<img src="([^"]+)"/) || [])[1] || abs('aerial') }, crumbsLd([['Home', '/'], ['Journal', '/blog/'], [title, path]])];
    write(path, layout({ L, path, title: `${title} | Azimuth`, desc: p.excerpt.slice(0, 158), body, ld, solid: true }));
  }
  const body = `<section style="padding-top:140px"><div class="wrap"><span class="eyebrow">Journal</span><h1 style="font-size:2.6rem">Sailing in Lagos & the Atlantic</h1>
   <div class="cards three" style="margin-top:32px">${legacy.posts.map(p => `<a class="card" href="/blog/${p.slug}/"><div class="bd"><span class="eyebrow" style="margin:0 0 8px">${fdate(p.date, L)}</span><h3>${esc(p.title.replace('&amp;amp;', '&').replace('&amp;', '&'))}</h3><p class="meta">${esc(p.excerpt.slice(0, 180))}…</p></div></a>`).join('')}</div></div></section>`;
  write('/blog/', layout({ L, path: '/blog/', title: 'Journal — Sailing in Lagos & the Atlantic | Azimuth', desc: 'Guides and stories about sailing tours in Lagos, sunset cruises, sea activities in the Algarve and Atlantic crossings.', body, solid: true }));
}

// ------------------------------------------------------------- write
const files = [];
function write(path, html) { files.push([path.endsWith('/') ? path + 'index.html' : path, html]); }

function sitemap() {
  const rows = pages.map(p => {
    const alts = p.alt ? `\n    <xhtml:link rel="alternate" hreflang="${p.L === 'en' ? 'en' : 'pt-PT'}" href="${SITE.url + p.path}"/>\n    <xhtml:link rel="alternate" hreflang="${p.L === 'en' ? 'pt-PT' : 'en'}" href="${SITE.url + p.alt}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE.url + (p.L === 'en' ? p.path : p.alt)}"/>` : '';
    return `  <url><loc>${SITE.url + p.path}</loc><lastmod>${BUILD_DATE}</lastmod>${alts}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

function llms() {
  const line = (p, L) => {
    const pr = p.kind === 'fixed' ? p.options.map(o => `${o.label.en} €${o.price}`).join('; ') : p.price.type === 'season' ? `${p.price.from ? 'from ' : ''}€${p.price.high} high season (Jun–Sep) / €${p.price.low} low season (Oct–May), ${p.price.unit.en}` : `€${p.price.amount} ${p.price.unit.en}`;
    const dates = p.departures ? ` Dates: ${p.departures.map(d => `${d.start} to ${d.end}`).join(', ')}.` : '';
    return `- [${p.title.en}](${SITE.url}${R.prog(p, 'en')}): ${p.tagline.en} Duration: ${p.duration.en}. Max ${p.maxGuests} guests. Price: ${pr}.${dates}`;
  };
  return `# Azimuth Sailing Holidays

> Family-run sailing company based at Marina de Lagos, Algarve, Portugal (${SITE.legalName}). Private skippered sailing tours in Lagos and Atlantic sailing expeditions (sea crossings Lagos–Porto Santo–Azores and Azores island-hopping) aboard the sailing yacht Angela, a 15 m Bavaria 49 with 5 cabins, 3 bathrooms, up to 8 guests overnight and 10 on day trips. Skipper: Captain ${SITE.captain}. Languages: English and Portuguese. Website in English and European Portuguese (/pt/).

Key facts:
- Departure point for Lagos tours: Marina de Lagos, 8600-780 Lagos, Portugal.
- All Lagos tours are private (the boat is exclusive to one group).
- Booking: online request with calendar on each experience page, confirmed by email; 50% deposit, balance one month before. Cancellation ≥30 days: up to 50%; <30 days: up to 100%.
- Contact: WhatsApp https://wa.me/${SITE.whatsapp} · ${SITE.email} · Instagram ${SITE.instagram}

## Lagos sailing tours (Algarve)
${PROGRAMS.filter(p => p.group === 'lagos').map(p => line(p)).join('\n')}

## Atlantic expeditions 2027
${PROGRAMS.filter(p => p.group === 'atlantic').map(p => line(p)).join('\n')}

## Pages
- [The boat Angela](${SITE.url}/the-boat/)
- [Contact](${SITE.url}/contact/)
- [Terms & Conditions](${SITE.url}/terms/)
- [Journal](${SITE.url}/blog/)
- [Versão em português](${SITE.url}/pt/)
`;
}

// ------------------------------------------------------------- run
if (process.env.CF_PAGES || process.env.WORKERS_CI || process.env.FETCH_PHOTOS) await fetchPhotos();
for (const L of ['en', 'pt']) {
  write(R.home[L], homePage(L));
  for (const p of PROGRAMS) write(R.prog(p, L), programPage(p, L));
  write(R.boat[L], boatPage(L));
  write(R.contact[L], contactPage(L));
  write(R.terms[L], termsPage(L));
}
blogPages();
write('/404.html', layout({ L: 'en', path: '/404.html', title: 'Page not found | Azimuth', desc: 'Page not found', solid: true,
  body: `<section style="padding-top:160px;text-align:center"><div class="wrap"><span class="eyebrow">404</span><h1 style="font-size:2.6rem">Off course.</h1><p class="lead" style="margin:0 auto 24px">This page doesn’t exist. / Esta página não existe.</p><a class="btn" href="/">Home</a> <a class="btn ghost" href="/pt/">Início</a></div></section>` }));
pages.pop(); // 404 not in sitemap

for (const [p, html] of files) { const f = join(OUT, p); await mkdir(dirname(f), { recursive: true }); await writeFile(f, html); }
await writeFile(join(OUT, 'sitemap.xml'), sitemap());
await writeFile(join(OUT, 'llms.txt'), llms());
await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\n# AI assistants and search engines are welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: Applebot-Extended\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
await writeFile(join(OUT, 'site.webmanifest'), JSON.stringify({ name: SITE.name, short_name: 'Azimuth', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#0b2a3e',
  icons: [{ src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
// export program data for the API (prices, capacities, dates)
await writeFile('src/programs.json', JSON.stringify(PROGRAMS.map(p => ({ id: p.id, kind: p.kind, title: p.title, maxGuests: p.maxGuests, times: p.times, minNights: p.minNights, departures: p.departures, options: p.options, price: p.price, months: p.months, slug: p.slug })), null, 1));
console.log(`built ${files.length} pages`);
