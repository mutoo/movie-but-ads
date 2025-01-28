import { router } from '@/common/router';
import { ensureGlobalObject } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { DubokuTvVideoController } from './api';

router.register(/^\/static\/player\//, () => {
  ensureGlobalObject('player').then((player) => {
    // autoplay
    player.autoplay(true);

    // steal focus for iframe
    window.focus();

    // add the video controller and keyboard shortcuts
    const videoController = new DubokuTvVideoController(player);
    new KeyboardShortcuts(videoController, {
      onKeyUp: (e) => {
        if (e.key === ' ') {
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
        }
      },
    });

    console.log('movie-but-ads', 'duboku.tv');
  });
});

router.handle();
