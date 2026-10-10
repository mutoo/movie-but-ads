import { router } from '@/common/router';
import { ensureElement } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { LibreTVVideoController, VIDEO_SELECTOR } from './api';

const keys = new Set([
  '1',
  '2',
  '3',
  '4',
  '5',
  '-',
  '_',
  '=',
  '+',
  ',',
  '.',
  '<',
  '>',
  'p',
]);

class LibreTVShortcuts extends KeyboardShortcuts {
  bindEvents() {
    this.keyUpHandler = this.handleKeyUp.bind(this);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  destroy() {
    window.removeEventListener('keyup', this.keyUpHandler);
  }

  handleKeyUp(event) {
    // Leave LibreTV's keydown shortcuts and browser combinations intact.
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      !keys.has(event.key) ||
      !this.videoController.getVideo()
    ) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      (target.isContentEditable ||
        target.closest(
          'input, textarea, select, button, [role="textbox"], [role="slider"]'
        ))
    ) {
      return;
    }

    super.handleKeyUp(event);
  }
}

const playbackRoute = /^\/watch\/?$/;
let shortcuts = null;
let routeGeneration = 0;

router.register(playbackRoute, () => {
  const generation = routeGeneration;
  ensureElement(VIDEO_SELECTOR)
    .then(() => {
      // Ignore a pending player lookup if navigation already left this route.
      if (
        generation !== routeGeneration ||
        !playbackRoute.test(location.pathname)
      )
        return;
      shortcuts = new LibreTVShortcuts(new LibreTVVideoController());
      console.log('movie-but-ads', 'libretv');
    })
    .catch((error) => {
      if (generation === routeGeneration)
        console.warn('movie-but-ads', 'libretv', error);
    });
});

// Next.js uses history navigation; register routes just like the other sites.
const marker = 'movie-but-ads-libretv-injected';
if (!window[marker]?.routeAware) {
  window[marker] = { routeAware: true };
  let lastPathname;
  const handleRoute = () => {
    const pathname = location.pathname;
    if (pathname === lastPathname) return;
    lastPathname = pathname;
    routeGeneration++;
    shortcuts?.destroy();
    shortcuts = null;
    if (playbackRoute.test(pathname)) router.handle(pathname);
  };

  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      handleRoute();
      return result;
    };
  }
  window.addEventListener('popstate', handleRoute);
  window.addEventListener('pageshow', handleRoute);
  handleRoute();
}
