import { router } from '@/common/router';
import { ensureElement, ensureGlobalObject, ensureKey } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { AiyingshiTvVideoController } from './api';

router.register('/', () => {
  window.addEventListener('DOMContentLoaded', function () {
    window.modal?.destroy();
  });
});

router.register(/^\/play/, () => {
  Promise.race([ensureGlobalObject('YZM'), ensureElement('#videobox')]).then(
    (result) => {
      if (result instanceof HTMLElement) {
        mobile(result);
      } else {
        desktop(result);
      }
    },
    () => {
      console.error('YZM/videobox not found');
    }
  );

  function mobile(_) {
    // bypass the ads
    Object.defineProperty(window, 'defaultTime', {
      value: -1,
      writable: false,
    });
    // start the video
    ensureKey(window, 'playFrame').then(
      (playFrame) => {
        // eslint-disable-next-line no-undef
        $('#videobox').attr('src', playFrame);
        // eslint-disable-next-line no-undef
        $('#videobox').show();
      },
      () => {
        console.error('playFrame not found');
      }
    );
  }

  function desktop(YZM) {
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
  }
});

router.handle();
