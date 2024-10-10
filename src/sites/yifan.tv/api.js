import { VideoControllerInterface } from '@/common/video-controller';

export class YfanTvVideoController extends VideoControllerInterface {
  constructor(vgAPI) {
    super();
    this.api = vgAPI;
  }

  getVideo() {
    return null;
  }

  setPlaybackRate(rate) {
    this.api.playbackRate = rate;
  }

  getPlaybackRate() {
    return this.api.playbackRate;
  }

  isFullscreen() {
    return this.api.fsAPI.isFullscreen;
  }

  requestFullscreen() {
    this.api.fsAPI.request();
  }

  exitFullscreen() {
    this.api.fsAPI.exit();
  }

  requestPictureInPicture() {
    // no-op
  }

  seek(time) {
    this.api.currentTime = time;
  }

  getCurrentTime() {
    return this.api.currentTime;
  }

  getDuration() {
    return this.api.duration;
  }
}
