import { router } from '@/common/router';
import { ensureGlobalObject } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { AiyingshiTvVideoController } from './api';

router.register('/', () => {
  window.addEventListener('DOMContentLoaded', function () {
    window.modal?.destroy();
  });
});

router.register(/^\/play/, () => {
  ensureGlobalObject('YZM').then((YZM) => {
    // freeze the ads fields so that the ads can't be added
    Object.defineProperty(YZM, 'ads', {
      value: {
        state: 'off',
        set: {
          state: 'off',
          group: 'null',
        },
        pause: {
          state: 'off',
        },
      },
      writable: false,
    });

    // remove the ads elements
    window.addEventListener('load', () => {
      // eslint-disable-next-line no-undef
      $('#ADplayer').remove();
      // eslint-disable-next-line no-undef
      $('#ADtip').remove();
      // eslint-disable-next-line no-undef
      $('#ADmask').remove();
      // eslint-disable-next-line no-undef
      $('#videotips').remove();
    });

    // add the video controller and keyboard shortcuts
    const videoController = new AiyingshiTvVideoController(YZM);
    new KeyboardShortcuts(videoController);
    console.log('movie-but-ads', 'aiyingshi.tv');
  });
});

router.handle();
