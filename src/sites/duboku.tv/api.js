import { VideoControllerInterface } from '@/common/video-controller';

export class DubokuTvVideoController extends VideoControllerInterface {
  constructor(player) {
    super();
    this.vjs = player;
  }

  getVideo() {
    return this.vjs.$('video');
  }

  setPlaybackRate(rate) {
    this.vjs.playbackRate(rate);
  }

  getPlaybackRate() {
    return this.vjs.playbackRate();
  }

  isFullscreen() {
    return this.vjs.isFullscreen();
  }

  requestFullscreen() {
    this.vjs.requestFullscreen();
  }

  exitFullscreen() {
    this.vjs.exitFullscreen();
  }

  requestPictureInPicture() {
    this.getVideo().requestPictureInPicture();
  }

  seek(time) {
    this.vjs.currentTime(Math.max(0, Math.min(time, this.getDuration())));
  }

  getCurrentTime() {
    return this.vjs.currentTime();
  }

  getDuration() {
    return this.vjs.duration();
  }
}
