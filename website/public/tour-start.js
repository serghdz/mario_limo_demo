// Run before the page renders: every fresh document opens on the City chapter.
// React/Three.js loading must never reset a tour the visitor has already started.
(() => {
  history.scrollRestoration = 'manual';
  if (location.hash) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  const startAtCity = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  startAtCity();

  let interacted = false;
  const markInteraction = () => { interacted = true; };
  const inputs = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
  inputs.forEach(type => window.addEventListener(type, markInteraction, { passive: true }));
  window.addEventListener('pageshow', () => {
    // Catch late browser restoration, but never interrupt intentional navigation.
    if (!interacted) startAtCity();
    inputs.forEach(type => window.removeEventListener(type, markInteraction));
  }, { once: true });
})();
