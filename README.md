# Movie But Ads

Movie But Ads is a collection of user scripts that enhance the viewing experience on Chinese movie websites. These scripts remove ads, improve functionality, and optimize the user interface for a smoother movie-watching experience.

Key features:

- Remove ads on popular Chinese movie streaming sites
- Enhanced video player controls with shortcuts

Designed for users seeking a cleaner, more streamlined movie-watching experience.

## Usage

### LibreTV

The LibreTV adapter builds to `dist/libretv.user.js`. Replace the placeholder
`match` in `src/sites/libretv/config.yaml` with your own URL, for example
`https://your-domain:8443/*` or `http://localhost:18080/*`, run `yarn build`, and
install the result in Tampermonkey / Violentmonkey. The placeholder does not match
a real site. Install it separately in each browser, including the TV browser.

This adapter supports speed keys `1`–`5`, `-` / `_`, `=` / `+`, seek keys
`,` / `.` / `<` / `>`, and picture-in-picture with `P` (without Shift). The minimum
speed is 0.25. Space, arrow keys, and `F` remain handled by LibreTV to avoid double
actions. Inputs, editable regions, buttons, sliders, and Ctrl / Command / Alt
combinations are excluded. Shared audio delay and quick search are not enabled
for this adapter.

The adapter uses the standard `<video>` API inside an ArtPlayer container and
resolves the current video on every keypress, so episode changes, source changes,
and SPA navigation do not need reinjection. Routine LibreTV updates do not
require rebuilding or reinstalling the script. Verify the adapter if upstream
changes its player container or keyboard bindings. For userscript updates,
rebuild and reinstall while retaining your `match` in `config.yaml`; installing
the repository's default build restores the placeholder.

## Shortcuts

Here's a list of implemented shortcuts:

- `1` to `5`: Set certain playback speed
- `-` / `_`: Decrease playback speed by 0.25, minimum at 0
- `=` / `+`: Increase playback speed by 0.25, maximum at 10
- `F`: Toggle fullscreen
- `P`: Toggle picture-in-picture mode
- `,`: Rewind by 10s
- `.`: Fastforward by 10s
- `<`: Rewind by 20s
- `>`: Fastforward by 20s
- `C`: Enable Audio delay
- `[`: Decrease audio delay by 0.1s
- `]`: Increase audio delay by 0.1s
- `Q`: Open a quick search box with search history
  - `Tab` / `Shift+Tab` (or `↓` / `↑`): Move between the input and history items
  - `Enter`: Search the input, or the selected history item
  - `Delete` / `Backspace`: Remove the selected history item
  - `Esc`: Close

These shortcuts help you control video playback more conveniently, enhancing your viewing experience.
