# AGENTS.md

Movie But Ads is a set of browser userscripts (Tampermonkey/Violentmonkey) that strip ads from Chinese movie streaming sites and add keyboard shortcuts to their video players. Each supported site builds into its own standalone `.user.js` file.

## Commands

```bash
yarn install        # also installs the husky pre-commit hook
yarn build          # build every site into dist/<site>.user.js
yarn lint           # eslint .
yarn lint:fix
yarn format         # prettier --write .
```

There are no automated tests. To verify a change, install the built `dist/*.user.js` in a userscript manager and load the target site. The pre-commit hook runs `lint:fix` and `format` over the whole repo.

## Build pipeline

`tools/build.js` globs `**/config.yaml`. For each directory that has one, it bundles `entry.js` with Rollup (`rollup.config.js`: IIFE, compact, Babel, `@` → `src/` alias) and prepends a `==UserScript==` banner built from that `config.yaml`.

- Output name: the directory name, lowercased, with `.` and spaces turned into `-`. For example, `src/sites/yifan.tv/` becomes `dist/yifan-tv.user.js`.
- `config.yaml` fields: `name`, `version`, `namespace`, `icon`, `match` (list), plus optional `runAt` (default `document-start`), `grant` (default `none`), `description`, `author` and `license`.
- **`dist/` is committed.** A site change is normally committed together with its rebuilt `dist/*.user.js` and a bumped `version` in that site's `config.yaml`, so userscript managers pick up the update. Prettier and ESLint ignore `dist/`.

## Architecture

```
src/common/   shared runtime (bundled into every script)
src/sites/<site>/
  config.yaml  userscript metadata and @match domains
  entry.js     per-site logic: route registration, ad removal, shortcut wiring
  api.js       site-specific VideoController adapter
```

Each site's `entry.js` follows the same pattern:

1. **Route**: `router.register(pathOrRegExp, fn)`, then `router.handle()`. `Router` (`src/common/router.js`) runs only the first matching route. A string matches the whole `location.pathname` exactly; a RegExp is tested against it. For SPA sites, call `router.handle(url)` on the site's own navigation events instead. yifan.tv subscribes to Angular's router, and keeps a `lastUrl` guard plus a `movie-but-ads-injected` class marker to avoid injecting twice.
2. **Wait for the player**: scripts run at `document-start`, before the site's globals and DOM exist. Use the helpers in `src/common/ensure.js` (`ensureGlobalObject`, `ensureElement`, `ensureKey`). They poll on `requestAnimationFrame` and reject after a set number of attempts.
3. **Neutralise ads**: usually by getting to the site's own state first rather than hiding elements with CSS. Examples: `Object.defineProperty(..., { writable: false })` to freeze ad config before the site sets it, replacing ad-trigger methods with no-ops, or capturing and stopping ad events. yifan.tv (Angular) reaches component instances through the DOM element's `__ngContext__` (see `getDeps`).
4. **Shortcuts**: wrap the site's player in a `VideoControllerInterface` subclass (`src/common/video-controller.js`) in `api.js`, then call `new KeyboardShortcuts(controller, { onKeyUp })`. The base class supplies the toggle and step logic (fullscreen/PiP toggles, rate ±0.25). Subclasses implement the primitives: `getVideo`, `setPlaybackRate`, `seek` and so on. Sites with a plain `<video>` can reuse `SimpleVideoController`. Keys that `shortcuts.js` doesn't handle, such as space for play/pause, go to the site's `onKeyUp` callback.

Shortcuts listen on `keyup` and match on `e.key`, so a shifted key needs its own case (e.g. speed-up handles both `=` and `+`). When you change shortcuts, update both `README.md` and `README.zh-CN.md`.

## Adding a site

Create `src/sites/<domain>/` with `config.yaml`, `entry.js` and `api.js`, then run `yarn build`. No registration step is needed; the build discovers the directory by its `config.yaml`. When a site moves to a new mirror domain, add it to that site's `match` list.

## Conventions

- ES modules, and `@/…` imports for `src/`. `jsconfig.json` mirrors the alias for editors.
- Prettier: single quotes, semicolons, 2 spaces, `trailingComma: es5`.
- ESLint runs with browser globals. Unused vars and args are allowed if prefixed with `_`. Page globals such as jQuery's `$` need `// eslint-disable-next-line no-undef`.
- Log `console.log('movie-but-ads', '<site>')` once injection succeeds. Use `console.warn` when an expected site internal is missing, because site updates break these hooks often.
