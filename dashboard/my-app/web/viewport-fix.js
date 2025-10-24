// Fix mobile 100vh issue by syncing --vh with innerHeight
(function() {
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
  // Prevent pull-to-refresh overscroll on some browsers
  document.addEventListener('touchmove', function(e){
    if (document.scrollingElement && document.scrollingElement.scrollTop === 0) {
      // allow
    }
  }, {passive: true});
})();
