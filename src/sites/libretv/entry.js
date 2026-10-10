import { KeyboardShortcuts } from '@/common/shortcuts';
import { LibreTVVideoController } from './api';

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

// Install once; the controller follows replaced video elements automatically.
const marker = 'movie-but-ads-libretv-injected';
if (!window[marker]) {
  window[marker] = true;
  new LibreTVShortcuts(new LibreTVVideoController());
  console.log('movie-but-ads', 'libretv');
}
