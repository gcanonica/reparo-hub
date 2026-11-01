/* ReparoHub — Core Script (Living sky, scroll reveals, spotlight & waitlist form) */
'use strict';
document.documentElement.classList.add('js');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ================= the living sky (aurora azul/teal) ================= */
  const cv = $('#sky');
  const ctx = cv && cv.getContext('2d', { alpha: false });
  if (ctx) {
    let W = 0, H = 0, raf = 0, last = 0, pending = false, t0 = performance.now();
    let scrollP = 0, depth = 0, px = .5, py = .3, tpx = .5, tpy = .3;

    // Matizes dos blobs sintonizados com ReparoHub:
    // 217 = Azul Real, 175 = Teal, 192 = Cyan, 150 = Esmeralda, 235 = Índigo
    const blobs = [
      { h: 217, x: .18, y: .12, r: .55, sx: .11, sy: .07, ph: 0 },
      { h: 175, x: .55, y: .05, r: .60, sx: .07, sy: .05, ph: 1.7 },
      { h: 192, x: .86, y: .18, r: .50, sx: .09, sy: .08, ph: 3.1 },
      { h: 150, x: .30, y: .95, r: .48, sx: .08, sy: .05, ph: 4.4 },
      { h: 235, x: .78, y: .90, r: .45, sx: .10, sy: .06, ph: 5.2 },
    ];
    const curtains = [
      { h: 215, base: .10, amp: .07, len: .42, f: .021, sp: .16, a: .50 },
      { h: 175, base: .18, amp: .06, len: .36, f: .028, sp: -.12, a: .45 },
      { h: 195, base: .05, amp: .05, len: .30, f: .017, sp: .09, a: .35 },
    ];

    const resize = () => {
      const vw = innerWidth, vh = innerHeight;
      W = vw < 700 ? 120 : 200;
      H = Math.max(60, Math.round(W * vh / vw));
      cv.width = W; cv.height = H;
      draw(performance.now());
    };

    function draw(now) {
      const t = (now - t0) / 1000;
      const dim = Math.max(1 - depth * .58, Math.min(1, Math.max(0, (scrollP - .86) / .14)) * .85);
      const hueShift = scrollP * 80 + Math.sin(t * .05) * 15;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#040406';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // Blobs de cor
      for (const b of blobs) {
        const x = (b.x + Math.sin(t * b.sx + b.ph) * .16) * W;
        const y = (b.y + Math.cos(t * b.sy + b.ph) * .10) * H;
        const r = b.r * Math.max(W, H) * (1 + Math.sin(t * .2 + b.ph) * .08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const h = b.h + hueShift;
        g.addColorStop(0, `hsla(${h}, 90%, 55%, ${.22 * dim})`);
        g.addColorStop(.5, `hsla(${h + 15}, 85%, 48%, ${.08 * dim})`);
        g.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // Cortinas de aurora
      const step = W < 150 ? 2 : 3;
      for (const c of curtains) {
        for (let x = 0; x <= W; x += step) {
          const k = x / W;
          const edge = (c.base + .02 * scrollP + Math.sin(x * c.f + t * c.sp * 3) * c.amp + Math.sin(x * c.f * 2.7 - t * .21) * c.amp * .5) * H;
          const len = c.len * H * (.75 + .25 * Math.sin(x * .05 + t * .4));
          const ray = .55 + .45 * Math.sin(x * .11 + t * 1.1) * Math.sin(x * .045 - t * .6);
          const a = c.a * .62 * ray * dim * (.4 + .6 * Math.sin(Math.PI * Math.min(1, Math.max(0, k))));
          if (a <= .01) continue;
          const h = c.h + hueShift + k * 50 + Math.sin(t * .3 + k * 4) * 15;
          const top = edge, bot = edge + len;
          const g = ctx.createLinearGradient(0, top - len * .4, 0, bot);
          g.addColorStop(0, `hsla(${h},95%,55%,0)`);
          g.addColorStop(.7, `hsla(${h},95%,58%,${a * .35})`);
          g.addColorStop(.92, `hsla(${h + 20},95%,64%,${a})`);
          g.addColorStop(1, `hsla(${h + 20},95%,55%,0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x - step / 2, top - len * .4, step * 2, len * 1.4);
        }
      }

      // Luz sutil sob o cursor
      px += (tpx - px) * .04; py += (tpy - py) * .04;
      const g = ctx.createRadialGradient(px * W, py * H, 0, px * W, py * H, W * .30);
      g.addColorStop(0, `hsla(${200 + hueShift}, 95%, 60%, .14)`);
      g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 32) return;
      last = now;
      draw(now);
    };
    const start = () => { if (!raf && !reduceMotion.matches && !document.hidden) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    addEventListener('resize', resize, { passive: true });
    addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollP = max > 0 ? scrollY / max : 0;
      depth = Math.min(1, scrollY / (innerHeight * .9));
      if (reduceMotion.matches && !pending) { pending = true; requestAnimationFrame((n) => { pending = false; draw(n); }); }
    }, { passive: true });
    addEventListener('pointermove', (e) => { tpx = e.clientX / innerWidth; tpy = e.clientY / innerHeight; }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reduceMotion.addEventListener('change', () => { stop(); start(); draw(performance.now()); });
    resize();
    requestAnimationFrame(() => cv.classList.add('ready'));
    start();
  }

  /* ================= nav & reveals ================= */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const reveals = $$('.reveal');
  const groups = new Map();
  for (const el of reveals) {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 6) * .07}s`);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  // Spotlight do mouse nos cards do bento
  for (const card of $$('.sx-card, .step, .waitlist-wrap')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ================= links de privacidade ================= */
  const appUrl = $('meta[name="reparohub-app-url"]')?.content || 'https://app.reparohub.com';
  const privacyPolicyUrl = new URL('/privacidade', appUrl).href;
  $$('[data-reparohub-privacy-link]').forEach(link => { link.href = privacyPolicyUrl; });

  /* ================= waitlist form submission ================= */
  const waitlistForm = $('#waitlist-form');
  if (waitlistForm) {
    const endpointMeta = $('meta[name="reparohub-waitlist-endpoint"]');
    const endpoint = endpointMeta ? endpointMeta.content : 'http://localhost:3000/api/waitlist';
    const status = $('#waitlist-status');
    const submit = waitlistForm.querySelector('button[type="submit"]');
    const utmFields = [['utm_source', 'source'], ['utm_medium', 'medium'], ['utm_campaign', 'campaign'], ['utm_term', 'term'], ['utm_content', 'content']];

    waitlistForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!waitlistForm.reportValidity()) return;
      status.textContent = '';
      status.className = 'form-status';
      submit.disabled = true;
      const originalText = submit.innerHTML;
      submit.textContent = 'Enviando…';

      const values = new FormData(waitlistForm);
      const search = new URLSearchParams(location.search);
      const utm = Object.fromEntries(utmFields
        .map(([parameter, field]) => [field, search.get(parameter)?.trim()])
        .filter(([, value]) => value));
      const payload = {
        name: values.get('name'),
        workshop: values.get('workshop'),
        city: values.get('city'),
        state: values.get('state'),
        whatsapp: values.get('whatsapp'),
        email: values.get('email'),
        monthlyServiceOrderVolume: values.get('monthlyServiceOrderVolume'),
        source: 'landing-aurora',
        ...(Object.keys(utm).length ? { utm } : {}),
        privacyConsent: values.get('privacyConsent') === 'on',
        website: values.get('website'),
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Falha no envio.');
        waitlistForm.reset();
        status.className = 'form-status is-success';
        status.textContent = '✓ Dados recebidos com sucesso. Em breve entraremos em contato!';
      } catch (err) {
        status.className = 'form-status is-error';
        status.textContent = 'Não foi possível conectar ao servidor local agora. Tente novamente em instantes.';
      } finally {
        submit.disabled = false;
        submit.innerHTML = originalText;
      }
    });
  }
});
