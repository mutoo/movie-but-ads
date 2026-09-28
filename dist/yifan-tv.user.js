// ==UserScript==
// @name         MovieButAds > Yifan
// @namespace    https://yifan.movie-but-ads.mutoo.im
// @version      0.2.0
// @description  Movie But Ads is a collection of user scripts that enhance the viewing experience on Chinese movie websites. These scripts remove ads, improve functionality, and optimize the user interface for a smoother movie-watching experience.
// @author       mutoo<gmutoo@gmail.com>
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=www.yifan.tv
// @match        https://www.yifan.tv/*
// @match        https://www.yfsp.tv/*
// @match        https://www.yfsp.me/*
// @match        https://www.ayf.tv/*
// @match        https://www.aiyifan.tv/*
// @match        https://www.wyav.tv/*
// @match        https://www.flyv.tv/*
// @match        https://www.jssp.tv/*
// @match        https://www.iyf.tv/*
// @match        https://www.lgsp.tv/*
// @match        https://www.hlive.io/*
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
}class YfanTvVideoController extends VideoControllerInterface {
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
}function getDeps(element, target) {
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
  Promise.all([ensureElement('#video_player'), ensureElement('aa-videoplayer'), ensureElement('vg-player')]).then(([videoElement, aaVideoPlayerElement, vgPlayerElement]) => {
    // disable the ads on pause
    window.addEventListener('invokePauseAds', e => {
      console.log('invokePauseAds');
      e.stopImmediatePropagation();
    }, {
      capture: true
    });
    const [danmuFacade] = getDeps(aaVideoPlayerElement, 'danmuFacade');
    if (danmuFacade) {
      danmuFacade.isPaused = true;
      danmuFacade.danmuListLoaded = d => {
        console.log('danmuListLoaded', d);
      };
    } else {
      console.warn('danmuFacade not found');
    }
    const [ads] = getDeps(aaVideoPlayerElement, 'api');
    if (ads) {
      // disable the ads
      ads.triggerPlayAds = t => {
        console.log('triggerPlayAds', t);
      };
    } else {
      console.warn('ads api not found');
    }
    const [pgmp] = getDeps(aaVideoPlayerElement, 'pgmp');
    if (pgmp) {
      pgmp.dataList.length = 0;
      Object.defineProperty(pgmp, 'pointToshow', {
        value: [],
        writable: false
      });
    } else {
      console.warn('pgmp not found');
    }
    const [_, target] = getDeps(videoElement, 'onShowPauseAds');
    if (target) {
      // remove pause ads
      target.list.length = 0;
      target.onShowPauseAds = {
        next: t => {
          console.log('onShowPauseAds', t);
          // the pause list will be reload when jump to next episode
          // here we automatically clear it again
          target.list.length = 0;
          target.pauseImage = null;
        }
      };
    } else {
      console.warn('onShowPauseAds not found');
    }
    const [vsAPI] = getDeps(vgPlayerElement, 'API');
    if (vsAPI) {
      const injected = vgPlayerElement.classList.contains('movie-but-ads-injected');
      if (injected) {
        console.warn('Already injected');
        return;
      }
      const videoController = new YfanTvVideoController(vsAPI);
      new KeyboardShortcuts(videoController);
      // mark player elemen as injected
      vgPlayerElement.classList.add('movie-but-ads-injected');
      console.log('movie-but-ads', 'yfan.tv');
    } else {
      console.warn('vsAPI not found');
    }
  });
});
registerSearch(keyword => `/search/${encodeURIComponent(keyword)}`);
ensureElement('router-outlet').then(el => {
  const [ngRouter] = getDeps(el, 'router');
  if (!ngRouter) {
    console.error('router not found');
    return;
  } else {
    let lastUrl = '';
    ngRouter.events.subscribe(e => {
      if (!e.urlAfterRedirects) {
        // not a navigation event
        return;
      }
      if (e.urlAfterRedirects === lastUrl) {
        // ignore the repeated event
        return;
      }
      console.log('router changed', e);
      lastUrl = e.urlAfterRedirects;
      router.handle(lastUrl);
    });
  }
});})();