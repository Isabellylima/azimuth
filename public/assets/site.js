(() => {
  const h = document.querySelector('.site-header');
  const onScroll = () => h && h.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const t = document.querySelector('.menu-toggle'), nav = document.querySelector('.nav');
  t && t.addEventListener('click', () => { const o = nav.classList.toggle('open'); t.setAttribute('aria-expanded', o); });

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const monthYear = (d, L) => { if (!d) return ''; try { return new Date(d.length === 7 ? d + '-15' : d).toLocaleDateString(L === 'pt' ? 'pt-PT' : 'en-GB', { month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Google reviews: carousel, "read more", live refresh from /api/reviews
  const rv = document.querySelector('[data-reviews]');
  if (rv) {
    const L = rv.dataset.lang, t = JSON.parse(rv.dataset.i18n), track = rv.querySelector('.rv-track');
    const gIco = (rv.querySelector('.g-ico') || {}).outerHTML || '';
    const clamp = () => track.querySelectorAll('.rv-card').forEach(c => {
      const p = c.querySelector('p'), b = c.querySelector('.rv-more');
      if (!c.classList.contains('open')) b.hidden = p.scrollHeight <= p.clientHeight + 2;
    });
    track.addEventListener('click', e => {
      const b = e.target.closest('.rv-more'); if (!b) return;
      b.closest('.rv-card').classList.add('open'); b.hidden = true;
    });
    rv.querySelectorAll('.rv-btn').forEach(b => b.addEventListener('click', () => {
      const card = track.querySelector('.rv-card'); const step = card ? card.offsetWidth + 20 : 320;
      track.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
    }));
    addEventListener('load', clamp); addEventListener('resize', clamp); clamp();
    const star = n => `<span class="stars" role="img" aria-label="${n}/5">${'★'.repeat(Math.round(n))}${'☆'.repeat(5 - Math.round(n))}</span>`;
    fetch('/api/reviews?lang=' + L).then(r => r.json()).then(d => {
      if (!d || d.source === 'seed' || !d.reviews) return;
      if (d.rating) rv.querySelector('[data-rating]').textContent = d.rating.toFixed(1).replace('.', L === 'pt' ? ',' : '.');
      if (d.count) rv.querySelector('[data-count]').textContent = d.count;
      const list = d.reviews.slice().sort((a, b) => (b.lang === L) - (a.lang === L));
      track.innerHTML = list.map(r => `<article class="rv-card"><header>${r.photo ? `<img src="${esc(r.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="av">${esc((r.name || '?').trim()[0].toUpperCase())}</span>`}<div><b>${esc(r.name)}</b><small>${monthYear(r.date, L)}</small></div>${gIco}</header>${star(r.rating)}<p lang="${esc(r.lang || L)}">${esc(r.text)}</p><button type="button" class="rv-more" hidden>${esc(t.more)}</button></article>`).join('');
      clamp();
    }).catch(() => {});
  }

  // ---- Instagram: live refresh from /api/instagram
  const ig = document.querySelector('[data-instagram]');
  if (ig) {
    const L = ig.dataset.lang, icon = (ig.querySelector('.ig-hover') || {}).outerHTML || '';
    fetch('/api/instagram').then(r => r.json()).then(d => {
      if (!d || d.source === 'seed' || !d.posts || !d.posts.length) return;
      ig.innerHTML = d.posts.slice(0, 8).map(p => `<a class="ig-tile" href="${esc(p.permalink)}" target="_blank" rel="noopener" aria-label="Instagram · ${monthYear(p.date, L)}"><img src="${esc(p.img)}" alt="${esc((p.caption || '@azimuthholidays').slice(0, 120))}" loading="lazy" width="640" height="640">${p.type === 'VIDEO' ? '<span class="ig-reel" aria-hidden="true">▶</span>' : ''}${icon}</a>`).join('');
    }).catch(() => {});
  }

  // ---- Hero motion: photo drifts slower than the page and gently zooms out, text lifts and fades
  const hero = document.querySelector('.hero');
  const bg = hero && hero.querySelector('img.bg');
  if (hero && bg && !reduce) {
    const fg = [...hero.querySelectorAll('.wrap, .coords')];
    hero.classList.add('motion');
    let ticking = false;
    const frame = () => {
      ticking = false;
      const h = hero.offsetHeight, y = Math.min(Math.max(scrollY, 0), h);
      const p = y / h; // 0 → 1 while the hero scrolls away
      bg.style.transform = `translate3d(0, ${(y * 0.38).toFixed(1)}px, 0) scale(${(1.12 - 0.12 * p).toFixed(4)})`;
      fg.forEach(el => {
        el.style.transform = `translate3d(0, ${(y * -0.18).toFixed(1)}px, 0)`;
        el.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); frame();
  }
})();
