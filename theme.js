// A preferência é aplicada antes do CSS para evitar um clarão ao recarregar.
try {
  const preference = localStorage.getItem('reparohub-theme');
  if (preference === 'light' || preference === 'dark') document.documentElement.dataset.theme = preference;
} catch { /* O tema automático continua funcionando sem armazenamento. */ }
