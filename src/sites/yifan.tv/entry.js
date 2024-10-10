import { router } from '@/common/router';
import { ensureElement } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { YfanTvVideoController } from './api';

function getDeps(element, target) {
  for (const key in element) {
    if (key.startsWith('__ngContext__')) {
      const context = element[key];
      for (const item of context) {
        if (item && typeof item === 'object' && item[target]) {
          return [item[target], item];
        }
      }
    }
  }
  return null;
}

router.register(/^\/play/, () => {
  Promise.all([
    ensureElement('#video_player'),
    ensureElement('aa-videoplayer'),
    ensureElement('vg-player'),
  ]).then(([videoElement, aaVideoPlayerElement, vgPlayerElement]) => {
    // disable the ads on pause
    window.addEventListener(
      'invokePauseAds',
      (e) => {
        console.log('invokePauseAds');
        e.stopImmediatePropagation();
      },
      { capture: true }
    );

    const [danmuFacade] = getDeps(aaVideoPlayerElement, 'danmuFacade');
    if (danmuFacade) {
      danmuFacade.isPaused = true;
      danmuFacade.danmuListLoaded = (d) => {
        console.log('danmuListLoaded', d);
      };
    } else {
      console.warn('danmuFacade not found');
    }

    const [ads] = getDeps(aaVideoPlayerElement, 'api');
    if (ads) {
      // disable the ads
      ads.triggerPlayAds = (t) => {
        console.log('triggerPlayAds', t);
      };
    } else {
      console.warn('ads api not found');
    }

    const [pgmp] = getDeps(aaVideoPlayerElement, 'pgmp');
    if (pgmp) {
      pgmp.dataList.length = 0;
    } else {
      console.warn('pgmp not found');
    }

    const [_, target] = getDeps(videoElement, 'onShowPauseAds');
    if (target) {
      // remove pause ads
      target.list.length = 0;
      target.onShowPauseAds = {
        next: (t) => {
          console.log('onShowPauseAds', t);
        },
      };
    } else {
      console.warn('onShowPauseAds not found');
    }

    const [vsAPI] = getDeps(vgPlayerElement, 'API');
    if (vsAPI) {
      const videoController = new YfanTvVideoController(vsAPI);
      new KeyboardShortcuts(videoController);
      console.log('movie-but-ads', 'yfan.tv');
    } else {
      console.warn('vsAPI not found');
    }
  });
});

router.handle();
