const HISTORY_KEY = 'movie-but-ads-search-history';
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

const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(0)' },
];

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
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    ) {
      return;
    }
    this.open();
  }

  mount() {
    this.host = document.createElement('div');
    this.root = this.host.attachShadow({ mode: 'open' });
    this.root.innerHTML = `<style>${STYLE}</style><div class="backdrop" hidden><div class="panel"><input type="search" placeholder="Search" autocomplete="off" /><ul></ul></div></div>`;
    this.backdrop = this.root.querySelector('.backdrop');
    this.input = this.root.querySelector('input');
    this.list = this.root.querySelector('ul');

    // keep typing away from the site's and our own shortcut listeners
    for (const type of ['keydown', 'keypress', 'keyup']) {
      this.host.addEventListener(type, (e) => e.stopPropagation());
    }
    this.backdrop.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.backdrop.addEventListener('mousedown', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });
    this.list.addEventListener('click', (e) => {
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
    this.list.replaceChildren(
      ...this.history.map((keyword) => {
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
      })
    );
  }

  addHistory(keyword) {
    this.history = [
      keyword,
      ...loadHistory().filter((k) => k !== keyword),
    ].slice(0, HISTORY_LIMIT);
    saveHistory(this.history);
  }

  removeHistory(li) {
    const items = [...this.list.children];
    const index = items.indexOf(li);
    this.history = this.history.filter((k) => k !== li.dataset.keyword);
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
      this.input.animate(SHAKE, { duration: 300, easing: 'ease-in-out' });
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
export function registerSearch(buildUrl) {
  // only the top page navigates, not an embedded player iframe
  if (window.top !== window) {
    return null;
  }
  return new SearchModal(buildUrl);
}
