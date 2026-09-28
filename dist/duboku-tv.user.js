// ==UserScript==
// @name         MovieButAds > Duboku
// @namespace    https://duboku.movie-but-ads.mutoo.im
// @version      0.6.1
// @description  Movie But Ads is a collection of user scripts that enhance the viewing experience on Chinese movie websites. These scripts remove ads, improve functionality, and optimize the user interface for a smoother movie-watching experience.
// @author       mutoo<gmutoo@gmail.com>
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=www.duboku.tv
// @match        https://*.duboku.tv/*
// @match        https://*.duboku.fun/*
// @match        https://*.dbku.tv/*
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
 * ensure a global object is present
 * @param {string} objectName
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
function ensureGlobalObject(objectName, maxAttempts = 600) {
  return ensureCondition(() => window[objectName], maxAttempts, `Cannot detect ${objectName} after ${maxAttempts} attempts`);
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
}const HISTORY_KEY = 'movie-but-ads-search-history';
const HISTORY_LIMIT = 20;
const STYLE = `
  :host {
    all: initial;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 20vh;
    background: rgba(0, 0, 0, 0.5);
    font: 16px/1.4 system-ui, sans-serif;
  }
  .backdrop[hidden] {
    display: none;
  }
  .panel {
    box-sizing: border-box;
    width: min(560px, calc(100vw - 32px));
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: #1f1f1f;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    padding: 12px 16px;
    border: none;
    outline: none;
    background: transparent;
    color: #fff;
    font: 18px/1.4 system-ui, sans-serif;
  }
  ul {
    margin: 0;
    padding: 4px 0;
    list-style: none;
    max-height: 50vh;
    overflow-y: auto;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  ul:empty {
    display: none;
  }
  li {
    display: flex;
    align-items: center;
  }
  button {
    border: none;
    background: transparent;
    color: #ccc;
    font: inherit;
    cursor: pointer;
  }
  .item {
    flex: 1;
    min-width: 0;
    padding: 6px 16px;
    text-align: left;
    outline: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  li:hover,
  li:focus-within {
    background: rgba(255, 255, 255, 0.1);
  }
  li:focus-within .item {
    color: #fff;
  }
  .remove {
    padding: 6px 16px;
    color: #888;
  }
  .remove:hover {
    color: #fff;
  }
`;
const SHAKE = [{
  transform: 'translateX(0)'
}, {
  transform: 'translateX(-8px)'
}, {
  transform: 'translateX(8px)'
}, {
  transform: 'translateX(-6px)'
}, {
  transform: 'translateX(6px)'
}, {
  transform: 'translateX(0)'
}];
function loadHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}
function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('movie-but-ads', 'cannot save search history', e);
  }
}
class SearchModal {
  /**
   * @param {(keyword: string) => string} buildUrl
   */
  constructor(buildUrl) {
    this.buildUrl = buildUrl;
    this.host = null;
    this.root = null;
    this.backdrop = null;
    this.input = null;
    this.list = null;
    this.history = [];
    window.addEventListener('keyup', this.handleWindowKeyUp.bind(this));
    // the page may be restored from bfcache after navigating back
    window.addEventListener('pageshow', () => this.host && this.close());
  }
  handleWindowKeyUp(e) {
    if (e.key !== 'q' || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    // composedPath()[0] is the real target, even inside a shadow root
    const target = e.composedPath()[0];
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) {
      return;
    }
    this.open();
  }
  mount() {
    this.host = document.createElement('div');
    this.root = this.host.attachShadow({
      mode: 'open'
    });
    this.root.innerHTML = `<style>${STYLE}</style><div class="backdrop" hidden><div class="panel"><input type="search" placeholder="Search" autocomplete="off" /><ul></ul></div></div>`;
    this.backdrop = this.root.querySelector('.backdrop');
    this.input = this.root.querySelector('input');
    this.list = this.root.querySelector('ul');

    // keep typing away from the site's and our own shortcut listeners
    for (const type of ['keydown', 'keypress', 'keyup']) {
      this.host.addEventListener(type, e => e.stopPropagation());
    }
    this.backdrop.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.backdrop.addEventListener('mousedown', e => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });
    this.list.addEventListener('click', e => {
      const li = e.target.closest('li');
      if (!li) {
        return;
      }
      if (e.target.closest('.remove')) {
        this.removeHistory(li);
      } else {
        this.submit(li.dataset.keyword);
      }
    });
    document.body.appendChild(this.host);
  }
  handleKeyDown(e) {
    // let the IME finish composing first
    if (e.isComposing) {
      return;
    }
    const li = e.target.closest('li');
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Tab':
        e.preventDefault();
        this.moveFocus(e.shiftKey ? -1 : 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveFocus(-1);
        break;
      case 'Enter':
        e.preventDefault();
        this.submit(li ? li.dataset.keyword : this.input.value);
        break;
      case 'Delete':
      case 'Backspace':
        // the mac delete key is Backspace, only handle it on history items
        if (li) {
          e.preventDefault();
          this.removeHistory(li);
        }
        break;
    }
  }
  getFocusables() {
    return [this.input, ...this.list.querySelectorAll('.item')];
  }
  moveFocus(step) {
    const focusables = this.getFocusables();
    const index = focusables.indexOf(this.root.activeElement);
    const next = (index + step + focusables.length) % focusables.length;
    focusables[next].focus();
  }
  renderHistory() {
    this.list.replaceChildren(...this.history.map(keyword => {
      const li = document.createElement('li');
      li.dataset.keyword = keyword;
      const item = document.createElement('button');
      item.className = 'item';
      item.textContent = keyword;
      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.tabIndex = -1;
      remove.title = 'Remove';
      remove.textContent = '\u00d7';
      li.append(item, remove);
      return li;
    }));
  }
  addHistory(keyword) {
    this.history = [keyword, ...loadHistory().filter(k => k !== keyword)].slice(0, HISTORY_LIMIT);
    saveHistory(this.history);
  }
  removeHistory(li) {
    const items = [...this.list.children];
    const index = items.indexOf(li);
    this.history = this.history.filter(k => k !== li.dataset.keyword);
    saveHistory(this.history);
    this.renderHistory();

    // keep the focus near the removed item
    const rest = this.list.querySelectorAll('.item');
    (rest[Math.min(index, rest.length - 1)] ?? this.input).focus();
  }
  open() {
    if (!this.host) {
      this.mount();
    }
    this.history = loadHistory();
    this.renderHistory();
    this.backdrop.hidden = false;
    this.input.focus();
    this.input.select();
  }
  close() {
    this.backdrop.hidden = true;
    this.root.activeElement?.blur();
  }
  submit(value) {
    const keyword = value.trim();
    if (!keyword) {
      this.input.animate(SHAKE, {
        duration: 300,
        easing: 'ease-in-out'
      });
      return;
    }
    this.addHistory(keyword);
    this.input.value = keyword;
    this.close();
    location.href = this.buildUrl(keyword);
  }
}

/**
 * enable the `q` search shortcut on this site
 * @param {(keyword: string) => string} buildUrl maps a keyword to the site's search page
 */
function registerSearch(buildUrl) {
  // only the top page navigates, not an embedded player iframe
  if (window.top !== window) {
    return null;
  }
  return new SearchModal(buildUrl);
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
}class DubokuTvVideoController extends VideoControllerInterface {
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
}router.register(/^\/static\/player\//, () => {
  ensureGlobalObject('player').then(player => {
    // autoplay
    player.autoplay(true);

    // steal focus for iframe
    window.focus();

    // add the video controller and keyboard shortcuts
    const videoController = new DubokuTvVideoController(player);
    new KeyboardShortcuts(videoController, {
      onKeyUp: e => {
        if (e.key === ' ') {
          if (player.paused()) {
            player.play();
          } else {
            player.pause();
          }
        }
      }
    });
    console.log('movie-but-ads', 'duboku.tv');
  });
});
registerSearch(keyword => `/vodsearch/-------------.html?wd=${encodeURIComponent(keyword)}`);
router.handle();})();