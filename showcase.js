/* ReparoHub — Showcase Component Behavior (Class prefix sc-)
   Tilt reativo, semáforos animados e crossfade entre as telas do sistema. */
'use strict';

(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hasIO = 'IntersectionObserver' in window;

  function appShot(stage) {
    const shot = stage.closest('.sc-shot') || stage;
    const win = stage.querySelector('.sc-win');
    const tablist = shot.querySelector('.sc-tabs');
    const tabs = tablist ? [...tablist.querySelectorAll('.sc-tab')] : [];
    const imgs = [...stage.querySelectorAll('.sc-img')];
    if (!imgs.length) return;

    let inView = false, near = false, hovering = false, focused = false;
    let timer = 0, current = 0;
    const DURATION = 7000;
    stage.style.setProperty('--sc-dur', (DURATION / 1000) + 's');

    function show(index, manual) {
      if (index === current && imgs[index].classList.contains('on')) return;
      const prev = current;
      current = index;
      imgs.forEach((img, i) => {
        if (i === current) {
          img.classList.remove('leave');
          img.classList.add('on');
        } else if (i === prev) {
          img.classList.remove('on');
          img.classList.add('leave');
        } else {
          img.classList.remove('on', 'leave');
        }
      });

      tabs.forEach((tab, i) => {
        const on = i === current;
        tab.classList.toggle('on', on);
        tab.setAttribute('aria-selected', String(on));
        tab.setAttribute('tabindex', on ? '0' : '-1');
      });

      const view = tabs[current]?.dataset.view || 'home';
      shot.dataset.view = view;

      if (manual) {
        clearInterval(timer);
        timer = 0;
        tablist && tablist.classList.add('sc-manual');
      }
    }

    function next() {
      show((current + 1) % imgs.length, false);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(i, true));
      tab.addEventListener('keydown', (e) => {
        let target = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') target = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') target = (i - 1 + tabs.length) % tabs.length;
        if (target >= 0) {
          e.preventDefault();
          tabs[target].focus();
          show(target, true);
        }
      });
    });

    const running = () => inView && !document.hidden && !hovering && !focused && !reduce.matches;
    function sync() {
      if (!tablist) return;
      tablist.classList.toggle('sc-run', running());
      tablist.classList.toggle('sc-manual', reduce.matches);
      stage.classList.toggle('sc-off', !inView || document.hidden);
    }

    const holdOn = () => { hovering = true; sync(); };
    const holdOff = () => { hovering = false; sync(); };
    stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holdOn(); });
    stage.addEventListener('pointerleave', holdOff);

    // Loop de rotação suave de abas
    function startTimer() {
      clearInterval(timer);
      if (!reduce.matches) {
        timer = setInterval(() => {
          if (running()) next();
        }, DURATION);
      }
    }
    startTimer();

    // Tilt 3D com lerp
    let raf = 0, lift = 0, liftGoal = 0, rx = 0, ry = 0, rxGoal = 0, ryGoal = 0;
    const set = (k, v) => stage.style.setProperty(k, v);
    function measureLift() {
      if (reduce.matches || innerWidth < 720) { liftGoal = 0; return; }
      const r = stage.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (r.top - innerHeight * .1) / (innerHeight * .8)));
      liftGoal = k * 12;
    }
    function tick() {
      raf = 0;
      lift += (liftGoal - lift) * .16;
      rx += (rxGoal - rx) * .08;
      ry += (ryGoal - ry) * .08;
      const done = Math.abs(liftGoal - lift) < .01 && Math.abs(rxGoal - rx) < .005 && Math.abs(ryGoal - ry) < .005;
      if (done) { lift = liftGoal; rx = rxGoal; ry = ryGoal; }
      set('--sc-lift', lift.toFixed(3) + 'deg');
      set('--sc-rx', rx.toFixed(3) + 'deg');
      set('--sc-ry', ry.toFixed(3) + 'deg');
      if (!done) kick();
    }
    function kick() { if (!raf && !document.hidden && (near || inView)) raf = requestAnimationFrame(tick); }

    addEventListener('scroll', () => { if (near) { measureLift(); kick(); } }, { passive: true });
    addEventListener('resize', () => { measureLift(); kick(); }, { passive: true });

    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduce.matches || !finePointer.matches) return;
      const r = win.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      rxGoal = (.5 - y) * 2.4;
      ryGoal = (x - .5) * 3.2;
      set('--sc-gx', (x * 100).toFixed(1) + '%');
      set('--sc-gy', (y * 100).toFixed(1) + '%');
      stage.classList.add('sc-hover');
      kick();
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { rxGoal = 0; ryGoal = 0; stage.classList.remove('sc-hover'); kick(); });

    // Observador de visibilidade
    if (hasIO) {
      new IntersectionObserver((es) => {
        for (const e of es) { near = e.isIntersecting; if (near) { measureLift(); kick(); } }
      }, { rootMargin: '600px 0px' }).observe(stage);
      new IntersectionObserver((es) => {
        for (const e of es) { inView = e.isIntersecting; sync(); }
      }, { threshold: .25 }).observe(stage);
      new IntersectionObserver((es) => {
        for (const e of es) if (e.isIntersecting) stage.classList.add('sc-act');
      }, { threshold: .55 }).observe(win);
    } else {
      near = inView = true;
      stage.classList.add('sc-act');
    }
    measureLift();
    lift = liftGoal;
    tick();
    sync();
  }

  function init() {
    document.querySelectorAll('[data-sc-shot]').forEach(appShot);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
