// Azimuth — Cloudflare Worker: static site + booking API
//
// Bindings (wrangler.jsonc):
//   ASSETS   static files in ./public
//   BOOKINGS KV namespace: requests + calendar availability
//   EMAIL    (optional) Cloudflare Email Service send binding
// Variables / secrets:
//   BOOKING_TO   e-mail that receives booking requests (comma separated allowed)
//   FROM_EMAIL   sender on a domain onboarded to Cloudflare Email Service
//   ADMIN_KEY    secret used to sign confirm/decline links and open /api/admin
//   RESEND_API_KEY (optional) fallback e-mail provider
import PROGRAMS from './programs.json';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const eur = n => n == null ? '—' : '€' + Number(n).toLocaleString('en-GB');

async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ---------------------------------------------------------- availability
// One boat: Lagos day programs share the slot calendar ('m','a','e');
// fixed departures track seats taken, and also block the Lagos calendar.
async function getAvail(env) {
  const raw = env.BOOKINGS ? await env.BOOKINGS.get('availability', 'json') : null;
  const a = raw || { blocked: {}, seats: {} };
  // the boat is away during every published expedition
  for (const p of PROGRAMS) if (p.kind === 'fixed') for (const d of p.departures) {
    for (let x = d.start; x <= d.end; x = addDays(x, 1)) a.blocked[x] = ['m', 'a', 'e'];
  }
  return a;
}
async function applyConfirmation(env, req) {
  const a = (await env.BOOKINGS.get('availability', 'json')) || { blocked: {}, seats: {} };
  const p = PROGRAMS.find(x => x.id === req.program);
  if (p.kind === 'day') {
    const slots = p.times.find(t => t.id === req.time)?.slots || ['m', 'a', 'e'];
    a.blocked[req.date] = [...new Set([...(a.blocked[req.date] || []), ...slots])];
  } else if (p.kind === 'range') {
    for (let x = req.date; x <= req.end; x = addDays(x, 1)) a.blocked[x] = ['m', 'a', 'e'];
  } else {
    const o = p.options.find(o => o.id === req.option);
    const key = `${p.id}:${req.date}`;
    a.seats[key] = Math.min(p.maxGuests, (a.seats[key] || 0) + (o?.wholeBoat ? p.maxGuests : Number(req.guests) || 1));
  }
  await env.BOOKINGS.put('availability', JSON.stringify(a));
}

// ---------------------------------------------------------- e-mail
async function sendMail(env, { to, subject, html, text, replyTo }) {
  const from = env.FROM_EMAIL || 'reservas@azimuthholidays.com';
  if (env.EMAIL) {
    try {
      await env.EMAIL.send({ to, from: { email: from, name: 'Azimuth Sailing Holidays' }, subject, html, text, ...(replyTo ? { replyTo } : {}) });
      return true;
    } catch (e) { console.error('EMAIL binding failed', e.code || e.message); }
  }
  if (env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: `Azimuth Sailing Holidays <${from}>`, to: Array.isArray(to) ? to : [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }) });
    if (r.ok) return true;
    console.error('Resend failed', r.status, await r.text());
  }
  return false;
}

function describe(req, p) {
  if (!p) return { when: '—', what: 'General enquiry' };
  if (p.kind === 'fixed') {
    const d = p.departures.find(d => d.start === req.date);
    const o = p.options.find(o => o.id === req.option);
    return { when: d ? `${d.start} → ${d.end}` : req.date, what: `${p.title.en} — ${o ? o.label.en : ''}` };
  }
  if (p.kind === 'range') return { when: `${req.date} → ${req.end}`, what: p.title.en };
  return { when: `${req.date} · ${p.times.find(t => t.id === req.time)?.label.en || ''}`, what: p.title.en };
}

function staffEmail(req, p, links) {
  const { when, what } = describe(req, p);
  const rows = [['Program', what], ['Date', when], ['Guests', req.guests], ['Estimate', eur(req.estimate)], ['Name', req.name], ['Email', req.email],
    ['Phone / WhatsApp', req.phone], ['Country', req.country], ['Language', req.lang === 'pt' ? 'Português' : 'English'], ['Interest', req.interest], ['When', req.when], ['Message', req.notes], ['Page', req.page]]
    .filter(r => r[1] != null && r[1] !== '');
  const wa = String(req.phone || '').replace(/\D/g, '');
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#16222c">
    <h2 style="color:#15425f;margin:0 0 6px">${p ? 'New booking request' : 'New enquiry'} — ${esc(what)}</h2>
    <p style="margin:0 0 16px;color:#5d6b77">Received ${new Date().toUTCString()} · ref ${esc(req.id)}</p>
    <table style="border-collapse:collapse;width:100%">${rows.map(r => `<tr><td style="padding:8px;border-bottom:1px solid #e3e7ea;color:#5d6b77;width:160px">${esc(r[0])}</td><td style="padding:8px;border-bottom:1px solid #e3e7ea"><b>${esc(r[1])}</b></td></tr>`).join('')}</table>
    ${links ? `<p style="margin:22px 0 8px">Once agreed with the client, click to update the website calendar:</p>
    <p><a href="${links.confirm}" style="background:#1d7a52;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;margin-right:8px">✓ Confirm &amp; block date</a>
       <a href="${links.decline}" style="background:#fff;color:#b3261e;border:1px solid #b3261e;padding:11px 18px;border-radius:999px;text-decoration:none">Decline</a></p>` : ''}
    <p style="margin-top:22px">Reply to this e-mail to answer the client${wa ? `, or <a href="https://wa.me/${wa}">open WhatsApp</a>` : ''}.</p></div>`;
  const text = rows.map(r => `${r[0]}: ${r[1]}`).join('\n') + (links ? `\n\nConfirm: ${links.confirm}\nDecline: ${links.decline}` : '');
  return { subject: `${p ? 'Booking request' : 'Enquiry'}: ${what} — ${when} — ${req.name}`, html, text };
}

function guestEmail(req, p) {
  const pt = req.lang === 'pt';
  const { when, what } = describe(req, p);
  const title = p ? (pt ? p.title.pt : p.title.en) : what;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;color:#16222c">
    <h2 style="color:#15425f">${pt ? 'Recebemos o seu pedido' : 'We received your request'} ⛵</h2>
    <p>${pt ? 'Olá' : 'Hello'} ${esc(String(req.name).split(' ')[0])},</p>
    <p>${pt ? `Obrigado pelo seu pedido para <b>${esc(title)}</b>${p ? ` (${esc(when)})` : ''}. Vamos confirmar a disponibilidade e responder-lhe pessoalmente em breve, com os próximos passos para garantir a reserva.`
      : `Thank you for your request for <b>${esc(title)}</b>${p ? ` (${esc(when)})` : ''}. We will check availability and reply personally shortly with the next steps to secure your booking.`}</p>
    <p>${pt ? 'Nada foi cobrado. A reserva só fica confirmada depois da nossa resposta e do pagamento do sinal de 50%.' : 'Nothing has been charged. Your booking is only confirmed after our reply and the 50% deposit.'}</p>
    <p style="color:#5d6b77">${pt ? 'Até breve no mar,' : 'See you at sea,'}<br>Azimuth Sailing Holidays · Marina de Lagos</p></div>`;
  return { subject: pt ? `O seu pedido Azimuth — ${title}` : `Your Azimuth request — ${title}`, html, text: html.replace(/<[^>]+>/g, '') };
}

// ---------------------------------------------------------- handlers
async function booking(request, env, ctx) {
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (b.website) return json({ ok: true }); // honeypot: silently ignore bots
  const clean = v => String(v ?? '').slice(0, 1500).trim();
  const req = { id: crypto.randomUUID().slice(0, 8), created: new Date().toISOString(), status: 'pending',
    program: clean(b.program), lang: b.lang === 'pt' ? 'pt' : 'en', name: clean(b.name), email: clean(b.email), phone: clean(b.phone),
    country: clean(b.country), notes: clean(b.notes), interest: clean(b.interest), when: clean(b.when), page: clean(b.page),
    date: clean(b.date), end: clean(b.end) || null, time: clean(b.time) || null, option: clean(b.option) || null,
    guests: Math.max(1, Math.min(12, parseInt(b.guests, 10) || 1)), estimate: Number(b.estimate) || null };
  if (!req.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(req.email) || !req.phone) return json({ ok: false, error: 'missing_fields' }, 400);

  const p = PROGRAMS.find(x => x.id === req.program);
  if (req.program !== 'enquiry') {
    if (!p) return json({ ok: false, error: 'unknown_program' }, 400);
    if (!ISO.test(req.date)) return json({ ok: false, error: 'bad_date' }, 400);
    const a = await getAvail(env);
    if (p.kind === 'day') {
      const slots = p.times.find(t => t.id === req.time)?.slots;
      if (!slots) return json({ ok: false, error: 'bad_time' }, 400);
      if (slots.some(s => (a.blocked[req.date] || []).includes(s))) return json({ ok: false, error: 'unavailable' }, 409);
    } else if (p.kind === 'range') {
      if (!ISO.test(req.end || '') || req.end <= req.date) return json({ ok: false, error: 'bad_range' }, 400);
      for (let x = req.date; x <= req.end; x = addDays(x, 1)) if ((a.blocked[x] || []).length) return json({ ok: false, error: 'unavailable' }, 409);
    } else {
      if (!p.departures.some(d => d.start === req.date)) return json({ ok: false, error: 'bad_departure' }, 400);
      const left = p.maxGuests - (a.seats[`${p.id}:${req.date}`] || 0);
      const o = p.options.find(o => o.id === req.option);
      if (!o) return json({ ok: false, error: 'bad_option' }, 400);
      if ((o.wholeBoat && left < p.maxGuests) || req.guests > left) return json({ ok: false, error: 'unavailable' }, 409);
    }
  }

  if (env.BOOKINGS) await env.BOOKINGS.put(`req:${req.created}:${req.id}`, JSON.stringify(req), { expirationTtl: 60 * 60 * 24 * 730 });

  const origin = new URL(request.url).origin;
  let links = null;
  if (p && env.ADMIN_KEY && env.BOOKINGS) {
    const sig = await hmac(env.ADMIN_KEY, `${req.created}:${req.id}`);
    const base = `${origin}/api/decide?k=${encodeURIComponent(`req:${req.created}:${req.id}`)}&s=${sig}`;
    links = { confirm: `${base}&a=confirm`, decline: `${base}&a=decline` };
  }
  const to = String(env.BOOKING_TO || 'azimuthboatrent@gmail.com').split(',').map(s => s.trim()).filter(Boolean);
  const notified = await sendMail(env, { to, replyTo: { email: req.email, name: req.name }, ...staffEmail(req, p, links) });
  if (notified) ctx.waitUntil(sendMail(env, { to: req.email, ...guestEmail(req, p) }).catch(() => {}));
  return json({ ok: notified, id: req.id, error: notified ? undefined : 'email_not_configured' }, notified ? 200 : 503);
}

async function decide(url, env) {
  const k = url.searchParams.get('k'), s = url.searchParams.get('s'), action = url.searchParams.get('a');
  const page = (msg, ok = true) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Azimuth</title>
    <body style="font-family:Arial,sans-serif;display:grid;place-items:center;min-height:90vh;background:#f4efe6"><div style="background:#fff;padding:32px;border-radius:16px;max-width:460px;text-align:center">
    <h2 style="color:${ok ? '#15425f' : '#b3261e'}">${msg}</h2><p><a href="/api/admin?key=${encodeURIComponent(url.searchParams.get('key') || '')}">Bookings list</a> · <a href="/">Website</a></p></div></body>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  if (!env.ADMIN_KEY || !env.BOOKINGS || !k || !s || s !== await hmac(env.ADMIN_KEY, k.replace(/^req:/, ''))) return page('Invalid link', false);
  const req = await env.BOOKINGS.get(k, 'json');
  if (!req) return page('Request not found', false);
  if (req.status !== 'pending') return page(`Already ${req.status}`);
  if (action === 'confirm') await applyConfirmation(env, req);
  req.status = action === 'confirm' ? 'confirmed' : 'declined';
  req.decided = new Date().toISOString();
  await env.BOOKINGS.put(k, JSON.stringify(req));
  return page(action === 'confirm' ? `✓ Confirmed — ${req.date} is now blocked on the website calendar` : 'Request declined');
}

async function admin(url, env) {
  if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) return new Response('Not found', { status: 404 });
  const list = await env.BOOKINGS.list({ prefix: 'req:', limit: 1000 });
  const rows = (await Promise.all(list.keys.slice(-300).reverse().map(k => env.BOOKINGS.get(k.name, 'json')))).filter(Boolean);
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Azimuth bookings</title>
  <body style="font-family:Arial,sans-serif;padding:20px;color:#16222c"><h1 style="color:#15425f">Booking requests</h1>
  <table style="border-collapse:collapse;font-size:14px;width:100%"><tr style="text-align:left;background:#f4efe6">${['Received', 'Status', 'Program', 'Date', 'Guests', 'Name', 'Email', 'Phone', 'Estimate', 'Notes'].map(h => `<th style="padding:8px">${h}</th>`).join('')}</tr>
  ${rows.map(r => `<tr style="border-bottom:1px solid #e3e7ea"><td style="padding:8px">${esc(r.created.slice(0, 16).replace('T', ' '))}</td><td><b style="color:${r.status === 'confirmed' ? '#1d7a52' : r.status === 'declined' ? '#b3261e' : '#b5651d'}">${r.status}</b></td><td>${esc(r.program)} ${esc(r.option || r.time || '')}</td><td>${esc(r.date)}${r.end ? ' → ' + esc(r.end) : ''}</td><td>${r.guests}</td><td>${esc(r.name)}</td><td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td><a href="https://wa.me/${esc(String(r.phone).replace(/\D/g, ''))}">${esc(r.phone)}</a></td><td>${eur(r.estimate)}</td><td>${esc(r.notes || r.interest || '')}</td></tr>`).join('')}</table></body>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // canonical host: azimuthholidays.com -> www
    if (url.hostname === 'azimuthholidays.com') { url.hostname = 'www.azimuthholidays.com'; return Response.redirect(url.toString(), 301); }
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/availability' && request.method === 'GET') {
          const a = await getAvail(env);
          const id = url.searchParams.get('program');
          const seats = {};
          for (const [k, v] of Object.entries(a.seats)) if (k.startsWith(id + ':')) seats[k.slice(id.length + 1)] = v;
          return json({ blocked: a.blocked, seats });
        }
        if (url.pathname === '/api/booking' && request.method === 'POST') return booking(request, env, ctx);
        if (url.pathname === '/api/decide') return decide(url, env);
        if (url.pathname === '/api/admin') return admin(url, env);
      } catch (e) { console.error(e); return json({ ok: false, error: 'server_error' }, 500); }
      return json({ ok: false, error: 'not_found' }, 404);
    }
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404) {
      const nf = await env.ASSETS.fetch(new Request(new URL('/404.html', url), request));
      return new Response(nf.body, { status: 404, headers: nf.headers });
    }
    return res;
  },
};
