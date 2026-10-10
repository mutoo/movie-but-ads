// ==UserScript==
// @name         MovieButAds > LibreTV
// @namespace    https://libretv.movie-but-ads.mutoo.im
// @version      0.1.1
// @description  Playback speed and seek shortcuts for your LibreTV instance.
// @author       mutoo<gmutoo@gmail.com>
// @license      MIT
// @icon         
// @match        https://libretv.example.invalid/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
  
(function(){'use strict';class Router {
  constructor() {
    this.routes = new Map();
  }
  register(path, callback) {
    this.routes.set(path, callback);
  }
  handle(pathname = location.pathname) {
    for (const [path, callback] of this.routes) {
      if (typeof path === 'string' && pathname === path) {
        callback();
        return;
      }
      if (path instanceof RegExp && path.test(pathname)) {
        callback();
        return;
      }
    }
    console.warn(`No route found for ${pathname}`);
  }
}
const router = new Router();/**
 * ensure a condition is met
 * @param {() => boolean} condition
 * @param {number} maxAttempts
 * @param {string} failureMessage
 * @returns {Promise<boolean>}
 */
function ensureCondition(condition, maxAttempts = 600, failureMessage) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function detect() {
      const result = condition();
      if (result) {
        resolve(result);
      } else if (attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(detect);
      } else {
        reject(new Error(failureMessage));
      }
    }
    requestAnimationFrame(detect);
  });
}

/**
 * ensure an element is present
 * @param {string} selector
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
function ensureElement(selector, maxAttempts = 600) {
  return ensureCondition(() => document.querySelector(selector), maxAttempts, `Cannot detect ${selector} after ${maxAttempts} attempts`);
}class KeyboardShortcuts {
  constructor(videoController, options) {
    this.videoController = videoController;
    this.skip = 10;
    this.audioContext = null;
    this.delayNode = null;
    this.delayNodeConnected = false;
    this.keyUpDelegate = options?.onKeyUp ?? function () {};
    this.bindEvents();
  }
  bindEvents() {
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.delayNode = this.audioContext.createDelay(5);
    }
  }
  handleKeyUp(e) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    const {
      videoController: vc
    } = this;
    switch (e.key) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        vc.setPlaybackRate(parseInt(e.key));
        break;
      case '-':
      case '_':
        vc.decreasePlaybackRate();
        break;
      case '=':
      case '+':
        vc.increasePlaybackRate();
        break;
      case 'f':
        vc.toggleFullscreen();
        break;
      case 'p':
        vc.togglePictureInPicture();
        break;
      case ',':
        vc.seek(vc.getCurrentTime() - this.skip);
        break;
      case '.':
        vc.seek(vc.getCurrentTime() + this.skip);
        break;
      case '<':
        vc.seek(vc.getCurrentTime() - this.skip * 2);
        break;
      case '>':
        vc.seek(vc.getCurrentTime() + this.skip * 2);
        break;
      case 'c':
        this.connectAudio();
        break;
      case '[':
        this.decreaseAudioDelay();
        break;
      case ']':
        this.increaseAudioDelay();
        break;
      default:
        this.keyUpDelegate(e);
        break;
    }
  }
  connectAudio() {
    const video = this.videoController.getVideo();
    if (video && !this.delayNodeConnected) {
      this.initAudioContext();
      const source = this.audioContext.createMediaElementSource(video);
      source.connect(this.delayNode).connect(this.audioContext.destination);
      this.delayNodeConnected = true;
      console.log('Audio connected');
    }
  }
  decreaseAudioDelay() {
    if (this.delayNodeConnected) {
      this.delayNode.delayTime.value = Math.max(0, this.delayNode.delayTime.value - 0.1);
      console.log('DelayTime:', this.delayNode.delayTime.value);
    }
  }
  increaseAudioDelay() {
    if (this.delayNodeConnected) {
      this.delayNode.delayTime.value += 0.1;
      console.log('DelayTime:', this.delayNode.delayTime.value);
    }
  }
}class VideoControllerInterface {
  /** get the video element */
  getVideo() {
    throw new Error('Not implemented');
  }

  /** set the playback rate */
  setPlaybackRate(_rate) {
    throw new Error('Not implemented');
  }

  /** get the playback rate */
  getPlaybackRate() {
    throw new Error('Not implemented');
  }

  /** decrease the playback rate */
  decreasePlaybackRate() {
    const rate = this.getPlaybackRate();
    this.setPlaybackRate(Math.max(0, rate - 0.25));
  }

  /** increase the playback rate */
  increasePlaybackRate() {
    const rate = this.getPlaybackRate();
    this.setPlaybackRate(Math.min(rate + 0.25, 10));
  }

  /** check if the video is fullscreen */
  isFullscreen() {
    throw new Error('Not implemented');
  }

  /** request fullscreen */
  requestFullscreen() {
    throw new Error('Not implemented');
  }

  /** exit fullscreen */
  exitFullscreen() {
    throw new Error('Not implemented');
  }

  /** toggle fullscreen */
  toggleFullscreen() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
      this.requestFullscreen();
    }
  }

  /** request picture in picture */
  requestPictureInPicture() {
    throw new Error('Not implemented');
  }

  /** toggle picture in picture */
  togglePictureInPicture() {
    if (!('pictureInPictureEnabled' in document)) {
      console.warn('Picture-in-picture is not supported in this browser.');
      return;
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      if (this.isFullscreen()) {
        this.exitFullscreen();
      }
      this.requestPictureInPicture();
    }
  }

  /** seek to a specific time */
  seek(_time) {
    throw new Error('Not implemented');
  }

  /** get the current time */
  getCurrentTime() {
    throw new Error('Not implemented');
  }

  /** get the duration */
  getDuration() {
    throw new Error('Not implemented');
  }
}
class SimpleVideoController extends VideoControllerInterface {
  constructor(video) {
    super();
    this.video = video;
  }
  getVideo() {
    return this.video;
  }
  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
  }
  getPlaybackRate() {
    return this.video.playbackRate;
  }
  isFullscreen() {
    return !!document.fullscreenElement;
  }
  requestFullscreen() {
    this.video.requestFullscreen();
  }
  exitFullscreen() {
    document.exitFullscreen();
  }
  requestPictureInPicture() {
    this.video.requestPictureInPicture();
  }
  seek(time) {
    this.video.currentTime = Math.max(0, Math.min(time, this.getDuration()));
  }
  getCurrentTime() {
    return this.video.currentTime;
  }
  getDuration() {
    return this.video.duration;
  }
}const VIDEO_SELECTOR = '.art-video-player video.art-video';
class LibreTVVideoController extends SimpleVideoController {
  constructor() {
    super(null);
  }
  getVideo() {
    // Resolve the current player on every keypress, including SPA navigation.
    const videos = [...document.querySelectorAll(VIDEO_SELECTOR)];
    return videos.find(video => video.getClientRects().length > 0) ?? null;
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
      video.requestPictureInPicture().catch(error => {
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
}const keys = new Set(['1', '2', '3', '4', '5', '-', '_', '=', '+', ',', '.', '<', '>', 'p']);
class LibreTVShortcuts extends KeyboardShortcuts {
  bindEvents() {
    this.keyUpHandler = this.handleKeyUp.bind(this);
    window.addEventListener('keyup', this.keyUpHandler);
  }
  destroy() {
    window.removeEventListener('keyup', this.keyUpHandler);
  }
  handleKeyUp(event) {
    // Leave LibreTV's keydown shortcuts and browser combinations intact.
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !keys.has(event.key) || !this.videoController.getVideo()) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && (target.isContentEditable || target.closest('input, textarea, select, button, [role="textbox"], [role="slider"]'))) {
      return;
    }
    super.handleKeyUp(event);
  }
}
const playbackRoute = /^\/watch\/?$/;
let shortcuts = null;
let routeGeneration = 0;
router.register(playbackRoute, () => {
  const generation = routeGeneration;
  ensureElement(VIDEO_SELECTOR).then(() => {
    // Ignore a pending player lookup if navigation already left this route.
    if (generation !== routeGeneration || !playbackRoute.test(location.pathname)) return;
    shortcuts = new LibreTVShortcuts(new LibreTVVideoController());
    console.log('movie-but-ads', 'libretv');
  }).catch(error => {
    if (generation === routeGeneration) console.warn('movie-but-ads', 'libretv', error);
  });
});

// Next.js uses history navigation; register routes just like the other sites.
const marker = 'movie-but-ads-libretv-injected';
if (!window[marker]?.routeAware) {
  window[marker] = {
    routeAware: true
  };
  let lastPathname;
  const handleRoute = () => {
    const pathname = location.pathname;
    if (pathname === lastPathname) return;
    lastPathname = pathname;
    routeGeneration++;
    shortcuts?.destroy();
    shortcuts = null;
    if (playbackRoute.test(pathname)) router.handle(pathname);
  };
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      handleRoute();
      return result;
    };
  }
  window.addEventListener('popstate', handleRoute);
  window.addEventListener('pageshow', handleRoute);
  handleRoute();
}})();