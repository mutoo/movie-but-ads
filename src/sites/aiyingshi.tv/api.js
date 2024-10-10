import { VideoControllerInterface } from '@/common/video-controller';

export class AiyingshiTvVideoController extends VideoControllerInterface {
  constructor(YZM) {
    super();
    this.YZM = YZM;
  }

  getVideo() {
    return this.YZM.dp.video;
  }

  setPlaybackRate(rate) {
    this.YZM.dp.speed(rate);
  }

  getPlaybackRate() {
    return this.YZM.dp.video.playbackRate;
  }

  isFullscreen() {
    return this.YZM.dp.fullScreen.isFullScreen();
  }

  requestFullscreen() {
    this.YZM.dp.fullScreen.request();
  }

  exitFullscreen() {
    this.YZM.dp.fullScreen.cancel();
  }

  requestPictureInPicture() {
    this.YZM.dp.video.requestPictureInPicture();
  }

  seek(time) {
    this.YZM.dp.seek(Math.max(0, Math.min(time, this.getDuration())));
  }

  getCurrentTime() {
    return this.YZM.dp.video.currentTime;
  }

  getDuration() {
    return this.YZM.dp.video.duration;
  }
}
