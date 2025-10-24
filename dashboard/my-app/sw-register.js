// Register a minimal service worker to enable PWA standalone mode
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('./service-worker.js', window.location.href);
    navigator.serviceWorker.register(swUrl.pathname).catch(console.warn);
  });
}
