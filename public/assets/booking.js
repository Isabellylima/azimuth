/* Azimuth booking widget — calendar + request form.  Data comes from
   <script type="application/json" id="az-program"> written by build.mjs */
(() => {
  const root = document.getElementById('booking');
  const dataEl = document.getElementById('az-program');
  if (!root || !dataEl) return;
  const P = JSON.parse(dataEl.textContent);
  const L = P.lang;
  const T = {
    en: { pick: 'Choose a date', when: 'Time', guests: 'Guests', option: 'Option', dep: 'Departure', next: 'Continue', back: 'Back',
      name: 'Full name', email: 'Email', phone: 'Phone / WhatsApp', country: 'Country', notes: 'Message (optional)',
      notesPh: 'Occasion, dietary needs, sailing experience…', send: 'Send booking request', sending: 'Sending…',
      total: 'Estimated total', price: 'Price', date: 'Date', dates: 'Dates', nights: 'nights', seatsLeft: 'places left', full: 'Full',
      selectStart: 'Select the first day', selectEnd: 'Now select the last day (min. {n} nights)', min: 'Minimum {n} nights', quote: 'Final quote by email',
      free: 'Available', booked: 'Unavailable', departure: 'Departure',
      consent: 'I have read the <a href="/terms/" target="_blank">Terms & Conditions</a>.',
      note: 'No payment now. We confirm availability by email within 24h; the booking is secured with a 50% deposit.',
      doneT: 'Request sent!', doneP: 'Thank you, {name}. We received your request for <b>{prog}</b> and will reply to <b>{email}</b> shortly.',
      doneWa: 'Prefer WhatsApp? Message us', err: 'We could not send your request. Please try again or contact us on WhatsApp.', req: 'Please fill in name, email and phone.',
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'], dow: ['Mo','Tu','We','Th','Fr','Sa','Su'],
      perPerson: 'per person', perBooking: 'total', from: 'from' },
    pt: { pick: 'Escolha uma data', when: 'Horário', guests: 'Convidados', option: 'Opção', dep: 'Partida', next: 'Continuar', back: 'Voltar',
      name: 'Nome completo', email: 'E-mail', phone: 'Telemóvel / WhatsApp', country: 'País', notes: 'Mensagem (opcional)',
      notesPh: 'Ocasião, restrições alimentares, experiência de vela…', send: 'Enviar pedido de reserva', sending: 'A enviar…',
      total: 'Total estimado', price: 'Preço', date: 'Data', dates: 'Datas', nights: 'noites', seatsLeft: 'lugares livres', full: 'Esgotado',
      selectStart: 'Selecione o primeiro dia', selectEnd: 'Agora selecione o último dia (mín. {n} noites)', min: 'Mínimo {n} noites', quote: 'Orçamento final por e-mail',
      free: 'Disponível', booked: 'Indisponível', departure: 'Partida',
      consent: 'Li os <a href="/pt/termos/" target="_blank">Termos e Condições</a>.',
      note: 'Sem pagamento agora. Confirmamos a disponibilidade por e-mail em 24h; a reserva fica garantida com um sinal de 50%.',
      doneT: 'Pedido enviado!', doneP: 'Obrigado, {name}. Recebemos o seu pedido para <b>{prog}</b> e vamos responder para <b>{email}</b> em breve.',
      doneWa: 'Prefere WhatsApp? Fale connosco', err: 'Não foi possível enviar o pedido. Tente novamente ou contacte-nos por WhatsApp.', req: 'Preencha o nome, e-mail e telemóvel.',
      months: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'], dow: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
      perPerson: 'por pessoa', perBooking: 'total', from: 'desde' },
  }[L];

  const eur = n => new Intl.NumberFormat(L === 'pt' ? 'pt-PT' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = s => parse(s).toLocaleDateString(L === 'pt' ? 'pt-PT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = addDays(today, 1);
  const maxDate = addDays(today, 540);
  const S = { blocked: {}, seats: {}, view: new Date(minDate.getFullYear(), minDate.getMonth(), 1),
    date: null, end: null, time: P.times ? P.times[0].id : null, dep: null, option: P.options ? P.options[0].id : null, guests: 2 };

  if (P.kind === 'day' && Array.isArray(P.months)) { // jump to first allowed month
    let v = new Date(S.view); for (let i = 0; i < 14 && !P.months.includes(v.getMonth() + 1); i++) v.setMonth(v.getMonth() + 1); S.view = v;
  }

  // ---------- availability ----------
  fetch(`/api/availability?program=${encodeURIComponent(P.id)}`).then(r => r.ok ? r.json() : {}).then(j => {
    S.blocked = j.blocked || {}; S.seats = j.seats || {}; render();
  }).catch(() => {});

  const slotsOf = t => (P.times.find(x => x.id === t) || P.times[0]).slots;
  const timeFree = (ds, t) => !slotsOf(t).some(s => (S.blocked[ds] || []).includes(s));
  const dayAllowed = d => {
    if (d < minDate || d > maxDate) return false;
    if (Array.isArray(P.months) && !P.months.includes(d.getMonth() + 1)) return false;
    const ds = iso(d);
    if (P.kind === 'day') return P.times.some(t => timeFree(ds, t.id));
    return !(S.blocked[ds] || []).length; // range: any slot taken blocks the day
  };
  const seatsLeft = start => P.maxGuests - (S.seats[start] || 0);
  const opt = () => P.options && P.options.find(o => o.id === S.option);

  function priceFor() {
    if (P.kind === 'fixed') {
      const o = opt(); if (!o) return null;
      return { total: o.per === 'person' ? o.price * S.guests : o.price, line: `${o.label[L]} — ${eur(o.price)} ${o.per === 'person' ? T.perPerson : ''}` };
    }
    const p = P.price; if (!S.date) return null;
    const m = parse(S.date).getMonth() + 1;
    const base = p.type === 'season' ? (p.highMonths.includes(m) ? p.high : p.low) : p.amount;
    if (P.kind === 'range') return { total: base, from: true };
    return { total: base };
  }

  // ---------- rendering ----------
  function calendar() {
    const y = S.view.getFullYear(), m = S.view.getMonth();
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const prevOk = new Date(y, m, 0) >= minDate, nextOk = new Date(y, m + 1, 1) <= maxDate;
    let h = `<div class="cal-head"><button type="button" data-nav="-1" ${prevOk ? '' : 'disabled'} aria-label="‹">‹</button><b>${T.months[m]} ${y}</b><button type="button" data-nav="1" ${nextOk ? '' : 'disabled'} aria-label="›">›</button></div><div class="cal">`;
    h += T.dow.map(d => `<span class="dow">${d}</span>`).join('');
    for (let i = 0; i < lead; i++) h += '<button class="blank" tabindex="-1" aria-hidden="true"></button>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), ds = iso(dt), ok = dayAllowed(dt);
      let cls = '';
      if (S.date === ds || S.end === ds) cls = 'sel';
      else if (S.date && S.end && ds > S.date && ds < S.end) cls = 'inrange';
      h += `<button type="button" data-day="${ds}" class="${cls}" ${ok ? '' : 'disabled'} aria-label="${fmt(ds)}">${d}</button>`;
    }
    h += `</div><div class="cal-legend"><span><i style="background:var(--sky-soft)"></i>${T.free}</span><span><i style="background:#e9ecef"></i>${T.booked}</span></div>`;
    return h;
  }

  function step1() {
    let h = '';
    if (P.kind === 'fixed') {
      h += `<span class="bk-label">${T.dep}</span><div class="choice">`;
      P.departures.forEach(d => {
        const left = seatsLeft(d.start), past = parse(d.start) < minDate, full = left <= 0 || past;
        h += `<label class="${full ? 'off' : ''}"><span><input type="radio" name="dep" value="${d.start}" ${S.dep === d.start ? 'checked' : ''} ${full ? 'disabled' : ''}> ${fmt(d.start)} – ${fmt(d.end)}</span><em>${full ? T.full : left + ' ' + T.seatsLeft}</em></label>`;
      });
      h += '</div>';
      if (P.options.length > 1 || true) {
        h += `<span class="bk-label">${T.option}</span><div class="choice">`;
        P.options.forEach(o => {
          const left = S.dep ? seatsLeft(S.dep) : P.maxGuests;
          const off = o.wholeBoat ? left < P.maxGuests : left < o.seats;
          h += `<label class="${off ? 'off' : ''}"><span><input type="radio" name="option" value="${o.id}" ${S.option === o.id ? 'checked' : ''} ${off ? 'disabled' : ''}> ${o.label[L]}</span><em>${eur(o.price)}</em></label>`;
        });
        h += '</div>';
      }
    } else {
      h += `<span class="bk-label">${P.kind === 'range' ? (S.date && !S.end ? T.selectEnd.replace('{n}', P.minNights) : T.selectStart) : T.pick}</span>` + calendar();
      if (P.kind === 'day' && P.times.length > 1) {
        h += `<span class="bk-label">${T.when}</span><div class="choice">`;
        P.times.forEach(t => {
          const off = S.date && !timeFree(S.date, t.id);
          h += `<label class="${off ? 'off' : ''}"><span><input type="radio" name="time" value="${t.id}" ${S.time === t.id ? 'checked' : ''} ${off ? 'disabled' : ''}> ${t.label[L]}</span></label>`;
        });
        h += '</div>';
      }
    }
    const o = opt();
    const fixedG = o && o.id === 'couple';
    const maxG = P.kind === 'fixed' ? (o && !o.wholeBoat ? Math.min(o.per === 'person' ? (S.dep ? seatsLeft(S.dep) : P.maxGuests) : o.seats, P.maxGuests) : P.maxGuests) : P.maxGuests;
    if (fixedG) S.guests = 2;
    S.guests = Math.max(1, Math.min(S.guests, maxG));
    h += `<span class="bk-label">${T.guests}</span><div class="stepper"><button type="button" data-g="-1" ${fixedG ? 'disabled' : ''}>−</button><output>${S.guests}</output><button type="button" data-g="1" ${fixedG ? 'disabled' : ''}>+</button></div>`;
    h += summary();
    const ready = P.kind === 'fixed' ? !!S.dep && !!S.option : P.kind === 'range' ? !!(S.date && S.end) : !!(S.date && S.time && timeFree(S.date, S.time));
    h += `<button type="button" class="btn block" data-next ${ready ? '' : 'disabled'}>${T.next} →</button><p class="note">${T.note}</p>`;
    return h;
  }

  function summary() {
    const pr = priceFor(); const rows = [];
    if (P.kind === 'fixed' && S.dep) { const d = P.departures.find(x => x.start === S.dep); rows.push([T.dates, `${fmt(d.start)} – ${fmt(d.end)}`]); }
    if (P.kind === 'day' && S.date) rows.push([T.date, `${fmt(S.date)} · ${P.times.find(t => t.id === S.time).label[L].split('·')[0].trim()}`]);
    if (P.kind === 'range' && S.date) rows.push([T.dates, S.end ? `${fmt(S.date)} – ${fmt(S.end)} (${nights()} ${T.nights})` : fmt(S.date)]);
    if (!rows.length) return '';
    rows.push([T.guests, S.guests]);
    let h = '<div class="summary">' + rows.map(r => `<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('');
    if (pr) h += `<div class="total"><span>${pr.from ? T.price : T.total}</span><span>${pr.from ? T.from + ' ' : ''}${eur(pr.total)}</span></div>`;
    if (pr && pr.from) h += `<div><span></span><small>${T.quote}</small></div>`;
    return h + '</div>';
  }
  const nights = () => Math.round((parse(S.end) - parse(S.date)) / 864e5);

  function step2() {
    return `<form id="bk-form" novalidate>
      ${summary()}
      <div class="field"><label for="f-name">${T.name}</label><input id="f-name" name="name" autocomplete="name" required></div>
      <div class="row2"><div class="field"><label for="f-email">${T.email}</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="f-phone">${T.phone}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div></div>
      <div class="field"><label for="f-country">${T.country}</label><input id="f-country" name="country" autocomplete="country-name"></div>
      <div class="field"><label for="f-notes">${T.notes}</label><textarea id="f-notes" name="notes" rows="3" placeholder="${T.notesPh}"></textarea></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="note" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:14px"><input type="checkbox" name="consent" required style="margin-top:4px"> <span>${T.consent}</span></label>
      <button class="btn block" type="submit">${T.send}</button>
      <button class="btn ghost block" type="button" data-back style="margin-top:8px">← ${T.back}</button>
      <div id="bk-msg"></div></form>`;
  }

  let step = 1;
  const body = root.querySelector('.body');
  function render() { body.innerHTML = step === 1 ? step1() : step2(); if (step === 2) bindForm(); }

  body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.nav) { S.view.setMonth(S.view.getMonth() + Number(b.dataset.nav)); render(); }
    else if (b.dataset.day) {
      const ds = b.dataset.day;
      if (P.kind === 'range') {
        if (!S.date || S.end || ds <= S.date) { S.date = ds; S.end = null; }
        else {
          const n = Math.round((parse(ds) - parse(S.date)) / 864e5);
          let clear = true; for (let i = 0; i <= n; i++) if ((S.blocked[iso(addDays(parse(S.date), i))] || []).length) clear = false;
          if (n >= P.minNights && clear) S.end = ds; else { S.date = ds; S.end = null; }
        }
      } else { S.date = ds; if (!timeFree(ds, S.time)) S.time = (P.times.find(t => timeFree(ds, t.id)) || P.times[0]).id; }
      render();
    }
    else if (b.dataset.g) { S.guests += Number(b.dataset.g); render(); }
    else if ('next' in b.dataset) { step = 2; render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if ('back' in b.dataset) { step = 1; render(); }
  });
  body.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'dep') S.dep = t.value;
    if (t.name === 'option') S.option = t.value;
    if (t.name === 'time') S.time = t.value;
    if (['dep', 'option', 'time'].includes(t.name)) render();
  });

  function waLink(extra = '') {
    const txt = `${L === 'pt' ? 'Olá! Gostaria de reservar' : 'Hello! I would like to book'}: ${P.title} ${extra}`;
    return `https://wa.me/${P.whatsapp}?text=${encodeURIComponent(txt)}`;
  }

  function bindForm() {
    const f = document.getElementById('bk-form'), msg = document.getElementById('bk-msg');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(f));
      if (!fd.name || !fd.email || !fd.phone || !/.+@.+\..+/.test(fd.email)) { msg.className = 'msg err'; msg.textContent = T.req; return; }
      if (!f.consent.checked) { msg.className = 'msg err'; msg.innerHTML = T.consent; return; }
      const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = T.sending;
      const pr = priceFor();
      const payload = { ...fd, consent: true, lang: L, program: P.id, guests: S.guests, date: P.kind === 'fixed' ? S.dep : S.date,
        end: P.kind === 'range' ? S.end : null, time: P.kind === 'day' ? S.time : null, option: S.option, estimate: pr ? pr.total : null, page: location.pathname };
      try {
        const r = await fetch('/api/booking', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || 'error');
        body.innerHTML = `<div class="done"><div class="tick">✓</div><h3>${T.doneT}</h3><p>${T.doneP.replace('{name}', esc(fd.name.split(' ')[0])).replace('{prog}', esc(P.title)).replace('{email}', esc(fd.email))}</p>
          <p><a class="btn ghost" href="${waLink(`(${payload.date})`)}" target="_blank" rel="noopener">${T.doneWa}</a></p></div>`;
        if (window.gtag) gtag('event', 'generate_lead', { program: P.id });
      } catch (err) {
        btn.disabled = false; btn.textContent = T.send;
        msg.className = 'msg err'; msg.innerHTML = `${T.err} <a href="${waLink(`(${payload.date || ''})`)}" target="_blank" rel="noopener">WhatsApp →</a>`;
      }
    });
  }
  render();
})();
