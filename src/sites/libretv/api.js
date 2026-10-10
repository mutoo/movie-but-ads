import { SimpleVideoController } from '@/common/video-controller';

export class LibreTVVideoController extends SimpleVideoController {
  constructor() {
    super(null);
  }

  getVideo() {
    // Resolve the current player on every keypress, including SPA navigation.
    const videos = [...document.querySelectorAll('.artplayer-app video')];
    return videos.find((video) => video.getClientRects().length > 0) ?? null;
  }

  setPlaybackRate(rate) {
    const video = this.getVideo();
    if (video) video.playbackRate = Math.max(0.25, Math.min(rate, 10));
  }

  getPlaybackRate() {
    return this.getVideo()?.playbackRate ?? 1;
  }

  requestPictureInPicture() {
    const video = this.getVideo();
    if (video) {
      video.requestPictureInPicture().catch((error) => {
        console.warn('movie-but-ads', 'libretv', error);
      });
    }
  }

  seek(time) {
    const video = this.getVideo();
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration));
  }

  getCurrentTime() {
    return this.getVideo()?.currentTime ?? 0;
  }

  getDuration() {
    return this.getVideo()?.duration ?? 0;
  }
}
