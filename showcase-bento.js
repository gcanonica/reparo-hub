/* ReparoHub — Bento Grid Interativo (Class prefix sx-)
   Micro-cenas de bancada, alternância de switches e tilt reativo. */
'use strict';

(function () {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');

  function init() {
    const cards = [...document.querySelectorAll('.sx-card')];
    if (!cards.length) return;

    cards.forEach((card) => {
      const sw = card.querySelector('.sx-sw');
      const stage = card.querySelector('.sx-stage');
      const tilt = card.querySelector('.sx-tilt');
      let on = true;

      if (sw) {
        sw.addEventListener('click', (e) => {
          e.stopPropagation();
          on = !on;
          sw.setAttribute('aria-pressed', String(on));
          card.classList.toggle('sx-off', !on);
        });
      }

      // Tilt suave nos cards
      if (FINE.matches && stage && tilt) {
        stage.addEventListener('pointermove', (e) => {
          if (RM.matches || !on) return;
          const r = stage.getBoundingClientRect();
          const rx = -((e.clientY - r.top) / r.height - 0.5) * 4;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
          tilt.style.setProperty('--rx', rx.toFixed(2) + 'deg');
          tilt.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        });
        stage.addEventListener('pointerleave', () => {
          tilt.style.setProperty('--rx', '0deg');
          tilt.style.setProperty('--ry', '0deg');
        });
      }
    });

    // Clicar nos pontos de checklist (Cena 2)
    document.querySelectorAll('.chk-point').forEach((point) => {
      point.addEventListener('click', () => {
        point.classList.toggle('ok');
        const st = point.classList.contains('ok') ? '✓ Conferido' : 'Pendente';
        const lbl = point.querySelector('text');
        if (lbl) lbl.textContent = st;
      });
    });

    // Aprovação interativa do orçamento (Cena 3)
    const btnApprove = document.querySelector('#sx-btn-approve');
    const badgeApproved = document.querySelector('#sx-approved-badge');
    if (btnApprove && badgeApproved) {
      btnApprove.addEventListener('click', () => {
        btnApprove.style.display = 'none';
        badgeApproved.style.display = 'block';
      });
    }

    // Marca o bento como pronto
    const bentoSec = document.querySelector('.sx');
    if (bentoSec) bentoSec.classList.add('sx-ready');

    // Acende os cards ao entrar no viewport
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('sx-live');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.35 });
      cards.forEach((c) => io.observe(c));
    } else {
      cards.forEach((c) => c.classList.add('sx-live'));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
