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

  // Load the Elfsight widgets (Google reviews + Instagram) only when they get close to the screen
  const widgets = document.querySelectorAll('[data-elfsight]');
  if (widgets.length) {
    let loaded = false;
    const load = () => { if (loaded) return; loaded = true; const s = document.createElement('script'); s.src = 'https://elfsightcdn.com/platform.js'; s.async = true; document.body.appendChild(s); };
    const wio = 'IntersectionObserver' in window ? new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { load(); wio.disconnect(); } }, { rootMargin: '600px' }) : null;
    widgets.forEach(w => wio ? wio.observe(w) : load());
  }
})();
