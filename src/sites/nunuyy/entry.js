import { router } from '@/common/router';
import { ensureElement } from '@/common/ensure';
import { KeyboardShortcuts } from '@/common/shortcuts';
import { SimpleVideoController } from './api';

router.register(/^\/vod\//, () => {
  ensureElement('#video').then((video) => {
    document.addEventListener('keydown', function (event) {
      // prevent the spacebar from scrolling the page
      if (event.key === ' ' && !event.target.matches('input, textarea')) {
        event.preventDefault();
      }
    });

    // add the video controller and keyboard shortcuts
    const videoController = new SimpleVideoController(video);
    new KeyboardShortcuts(videoController, {
      onKeyUp: (e) => {
        if (e.key === ' ') {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      },
    });

    console.log('movie-but-ads', 'nunuyy');
  });
});

router.handle();
