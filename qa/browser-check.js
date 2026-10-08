async (page) => {
  const results = [];
  const errors = [];
  const failedRequests = [];
  const assert = (condition, name) => {
    if (!condition) throw new Error(name);
    results.push(name);
  };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedRequests.push(response.url());
  });
  await page.goto('http://127.0.0.1:4387/');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Tema automático', exact: true }).click();
  assert(await page.evaluate(() => localStorage.getItem('reparohub-theme') === null), 'Automático remove preferência fixa');
  assert(await page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(248, 250, 252)'), 'Automático acompanha sistema claro');
  await page.emulateMedia({ colorScheme: 'dark' });
  assert(await page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(16, 24, 39)'), 'Automático acompanha mudança do sistema para escuro');
  await page.getByRole('button', { name: 'Tema claro', exact: true }).click();
  assert(await page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(248, 250, 252)'), 'Escolha clara sobrepõe sistema escuro');
  await page.reload();
  assert(await page.locator('html').getAttribute('data-theme') === 'light', 'Tema claro persiste após reload');
  assert(await page.getByRole('button', { name: 'Tema claro', exact: true }).getAttribute('aria-pressed') === 'true', 'Controle anuncia escolha restaurada');
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await page.reload();
  assert(await page.locator('html').getAttribute('data-theme') === 'dark', 'Tema escuro persiste após reload');

  for (const theme of ['claro', 'escuro']) {
    await page.getByRole('button', { name: `Tema ${theme}`, exact: true }).click();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sem overflow horizontal: ${theme}, ${width}px`);
    }
    const contrasts = await page.evaluate(() => {
      const luminance = rgb => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
      const parse = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return ['.hero-description', '.phase-note', '.hero-actions .button', '.brand-hub', '.badge-info', '.product-story>p', '.resource-notes p', '.video-heading>p', '.diodo-principle', '.development-badge', '.diodo-real-shot figcaption', '.stage-caption'].map(selector => {
        const el = document.querySelector(selector);
        let ancestor = el;
        while (ancestor && getComputedStyle(ancestor).backgroundColor === 'rgba(0, 0, 0, 0)') ancestor = ancestor.parentElement;
        const fg = luminance(parse(getComputedStyle(el).color));
        const bg = luminance(parse(getComputedStyle(ancestor || document.body).backgroundColor));
        return { selector, ratio: (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05) };
      });
    });
    assert(contrasts.every(item => item.ratio >= 4.5), `Contraste dos 12 pares amostrados (${theme}): ${JSON.stringify(contrasts.filter(item => item.ratio < 4.5))}`);
    assert(await page.locator('#panel-os .shot-' + (theme === 'claro' ? 'light' : 'dark')).isVisible(), `Captura da OS acompanha tema ${theme}`);
  }

  await page.getByRole('tab', { name: 'Agenda e visitas', exact: true }).click();
  assert(await page.locator('#panel-agenda').isVisible() && !(await page.locator('#panel-os').isVisible()), 'Aba Agenda revela somente seu painel');
  await page.getByRole('tab', { name: 'Agenda e visitas', exact: true }).press('ArrowRight');
  assert(await page.locator('#panel-cliente').isVisible(), 'Seta direita seleciona Acompanhamento');
  assert(await page.evaluate(() => document.activeElement.id === 'tab-cliente'), 'Foco acompanha seleção por teclado');
  await page.getByRole('tab', { name: 'Acompanhamento', exact: true }).press('Home');
  assert(await page.locator('#panel-os').isVisible(), 'Home retorna à primeira aba');
  await page.getByRole('tab', { name: 'Ordens de serviço', exact: true }).press('ArrowLeft');
  assert(await page.locator('#panel-cliente').isVisible(), 'Seta esquerda circula para última aba');
  await page.getByRole('tab', { name: 'Acompanhamento', exact: true }).press('End');
  assert(await page.locator('#tab-cliente').getAttribute('aria-selected') === 'true', 'End seleciona última aba');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  assert(await page.locator('#mobile-nav').isVisible(), 'Menu móvel abre');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#mobile-nav').isVisible()), 'Escape fecha menu');
  assert(await page.evaluate(() => document.activeElement.classList.contains('menu-toggle')), 'Escape devolve foco ao botão');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegação móvel', exact: true }).getByRole('link', { name: 'Recursos', exact: true }).click();
  assert(!(await page.locator('#mobile-nav').isVisible()), 'Navegação fecha menu móvel');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => document.querySelector('#mobile-nav').hidden);
  assert(!(await page.locator('#mobile-nav').isVisible()), 'Menu fecha ao passar para desktop');
  const question = page.locator('summary').filter({ hasText: 'O Diodo Desk já faz parte do sistema?' });
  await question.click();
  assert(await question.locator('..').getAttribute('open') !== null, 'FAQ abre resposta');
  await question.press('Enter');
  assert(await question.locator('..').getAttribute('open') === null, 'FAQ fecha por teclado');

  assert(await page.locator('h1').count() === 1, 'Um título H1');
  assert(await page.locator('video[controls][playsinline]').count() === 3, 'Três vídeos acessíveis por controles nativos');
  assert(await page.evaluate(() => [...document.querySelectorAll('video')].every(video => video.preload === 'none' && video.poster && video.querySelector('source[type="video/mp4"]'))), 'Vídeos não carregam antes da reprodução e têm pôster');
  assert(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].every(a => document.getElementById(a.hash.slice(1)))), 'Todas as âncoras têm destino');
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(async () => (await Promise.all([...document.images].map(img => fetch(img.getAttribute('src'), { method: 'HEAD' }).then(response => response.ok)))).every(Boolean)), 'Arquivos das imagens locais acessíveis');
  assert(await page.evaluate(() => document.fonts.check('500 16px Manrope')), 'Manrope local carregada');
  assert(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-visual')).animationName === 'none'), 'Movimento reduzido desativa animação');
  assert(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === 'auto'), 'Movimento reduzido desativa rolagem animada');
  assert(await page.evaluate(() => !performance.getEntriesByType('resource').some(r => new URL(r.name).origin !== location.origin)), 'Página sem requisições a terceiros');
  assert(errors.length === 0, `Sem erros JavaScript: ${errors.join(', ')}`);
  assert(failedRequests.length === 0, `Sem recursos HTTP com erro: ${failedRequests.join(', ')}`);

  const isolated = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  await isolated.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  const blocked = await isolated.newPage();
  await blocked.goto('http://127.0.0.1:4387/');
  await blocked.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  assert(await blocked.locator('html').getAttribute('data-theme') === 'dark', 'Tema funciona mesmo com armazenamento bloqueado');
  await isolated.close();

  await page.getByRole('tab', { name: 'Ordens de serviço', exact: true }).click();
  for (const theme of ['claro', 'escuro']) {
    await page.getByRole('button', { name: `Tema ${theme}`, exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `output/playwright/desktop-${theme}.png` });
    await page.screenshot({ path: `output/playwright/full-${theme}.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `output/playwright/mobile-${theme}.png` });
    await page.screenshot({ path: `output/playwright/mobile-full-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Tema automático', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.evaluate(() => window.scrollTo(0, 0));
  return { passed: results.length, results, errors, failedRequests };
}
