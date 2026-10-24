# Goguryeo — Obsidian theme + companion plugin

A glass ("Liquid Glass", iOS/macOS 26–27 style) theme for Obsidian on Windows desktop, iPad and iPhone. The user's colors are Apple system grays, with the accent (green) used only on a few things.

## Files

- `theme.css`: the whole theme. A Style Settings block sits at the top, followed by numbered sections:
  1. Palette
  2. Glass tokens
  3. Text
  4. Tasks
  5. Floating surfaces
  6. Floating panel layout (desktop + iPad: path row, tab row, split screen)
  7. Tabs (sidebar pills, sliding glass thumb)
  8. Auto-hide ribbon
  9. Mobile shared (drawers, edge-swipe arrow)
  10. iPhone
  11. iPad
  12. Background (Plain / Color / Image behind everything; the note area turns see-through)
  13. Motion
- `manifest.json`: theme manifest. Author is "MIG&Claude (opus5.5)".
- `companion/`: the **Goguryeo Companion** plugin (`main.js` in plain CommonJS with no build step, and `manifest.json`). It does what CSS can't. It mostly sets body classes or CSS variables, which the theme then styles:
  - keeps the left sidebar button out of the hidden ribbon (patches `leftRibbon.containerEl.isShown`)
  - keeps the left sidebar button at the start of the main tab bar on desktop (wraps `workspace.updateFrameless`)
  - desktop touch: swipe from the left edge to open the ribbon (`goguryeo-touch-active`)
  - sliding glass under the active tab of every tab bar (`.goguryeo-tab-thumb`, `goguryeo-glass-thumbs`). Its motion copies the user's Day Planner Pro "GlassSegmented" component: 0.42s `cubic-bezier(0.3,1.3,0.4,1)`, plus a separate `scale: 1.06 1.12` swell held for 320ms.
  - split screen: `goguryeo-split`, `--g-root-top/left/right`, and `.goguryeo-current-pane` / `.goguryeo-last-pane` on the panes
  - iPhone: a right-sidebar button (`.goguryeo-right-toggle`), and tapping the folded name capsule brings the bars back (`app.mobileNavbar.restoreNavigation()`)
  - background image: turns the Style Settings value `--g-bg-image` (vault path, `![[embed]]` or web link) into `--g-bg-url` on every `css-change`
  - iPhone and iPad: swipe in from the left or right edge to go back or forward, Safari style, only while both sidebars are closed. The page slides with the finger over a still copy of the other page (`.goguryeo-swipe-stage`). The copies are taken in a wrapper around `WorkspaceLeaf.prototype.getHistoryState`, which Obsidian calls just before leaving a page, and kept in a WeakMap keyed by that history entry. Right after a restart there are no copies yet, so the page underneath shows only the note's name and icon.
- `GLASS.md`: the style contract for the user's other plugins (glass variables with fallbacks, recipes, motion, checklist). Keep it in sync when the glass tokens in section 2 change.
- `deploy.ps1`: copies the theme and the plugin into the vault.
- `tools/cdp.mjs`: a small DevTools client for inspecting the live Obsidian (see below).
- `gemin-theme.css`: the user's old snippet, already merged into sections 3–4. Kept for reference only.

## Workflow (the user wants this)

- **One fix at a time.** Make one change, verify it, commit it, then report briefly. The user tests on their own devices too.
- **Mock up visual changes in the design tool before building.** That's the Design canvas artifact "Goguryeo glass directions": https://claude.ai/artifact/GaRE4WK9qs73cGQMrUqxsP. It holds directions A–D, split-screen E/F, and the iPhone and iPad artboards.
- **Edit in this repo, never in the vault.** Then run `powershell -ExecutionPolicy Bypass -File deploy.ps1`. The vault is `C:\Users\MIG\Documents\obsidian\mig8128\.obsidian\` (theme in `themes/Goguryeo`, plugin in `plugins/goguryeo-companion`). The user reloads Obsidian with Ctrl+R.
- **Git:** one commit per verified step, on branch `main`, ending with the Co-Authored-By line. The git history describes every decision in detail.

## Verifying in the live Obsidian (instead of guessing)

1. Ask the user before restarting Obsidian.
2. Close it gracefully with `CloseMainWindow`, then relaunch it:
   `C:\Users\MIG\AppData\Local\Programs\Obsidian\Obsidian.exe --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1`
3. Use `node tools/cdp.mjs eval "<js>"` (or `evalfile <file>`) and `node tools/cdp.mjs shot <out.png> [scale]`.
4. Reload the theme with `app.customCss.requestLoadTheme()`.
5. Reload the plugin with `app.plugins.disablePlugin/enablePlugin("goguryeo-companion")`.
6. **Phone and iPad preview:**
   - Use `electronWindow.setBounds({width:430,height:932})` for iPhone or `1180x820` for iPad, then `app.emulateMobile(true)`, which reloads Obsidian.
   - Phone mode means a window narrower than 600px.
   - Afterwards, always restore: `app.emulateMobile(false)`, `electronWindow.maximize()`, `setAlwaysOnTop(false)`.
7. **Screenshots in the background:** while the window is covered or hidden, Windows pauses requestAnimationFrame and CSS transitions. Either use `electronWindow.setAlwaysOnTop(true)`, or inject `*{transition:none!important}` to measure end states, and remove it afterwards. A hidden window can also return a stale frame after a theme reload; check computed styles, or retake the shot, before trusting it.
8. **Simulated touches:** `new Touch(...)` with `new TouchEvent(...)` dispatched on `document` works for testing gestures.
9. **The debug port closes** whenever the user restarts Obsidian normally.

## Obsidian 1.14.5 gotchas (all verified)

- The left ribbon only has the class `mod-primary`, never `mod-left`. Sidebars and the sidebar buttons have both classes.
- `body` has `contain: strict`, so `position: fixed` elements still have an offsetParent, and `isShown()` is true for them.
- `.workspace-leaf` has `contain: strict !important`. A fixed element inside a pane is positioned relative to that pane. Split mode relaxes this to `contain: size style !important`.
- Obsidian gives sidebar `.workspace-tabs` `width: 100%`. Use `width: auto` when adding margins.
- The tab close button has `inset-inline-end: 0`. Cancel it if you set `left`, or the button covers the whole tab.
- Obsidian rebuilds a tab bar's children and drops foreign elements, so the plugin remembers each bar's last thumb position.
- When Obsidian moves the sidebar toggle, it leaves an animating clone. Compare against `app.workspace.leftSidebarToggleButtonEl`.
- iPhone: Obsidian hides the bars on scroll with a transform on `.view-header`. The theme slides it with `top` instead, because a transform would drag the fixed note-name pill along with it.
- iPhone: there's no right-sidebar button in Obsidian (the plugin adds one). The title container uses `display: contents`, so only the note's folder stays on top (for a folder note, the folder around it) and the note name moves to the bottom bar.
- iPad: the note area has `padding-top` for the status bar. The plugin adds it to `--g-root-top`.
- Settings opens in its own window (a separate DevTools target titled "Settings - …", url about:blank), so `cdp.mjs shot` of the main window doesn't show it; capture that target instead.
- You can extract Obsidian's own CSS and JS from `%APPDATA%\obsidian\obsidian-1.14.5.asar` (it's a plain asar file) to look up class names.

## User preferences and decisions

- Write in English. The user writes in short sentences and likes seeing screenshots and checks.
- **No gradient backgrounds.** The glass comes from light, blur and content scrolling underneath, or the user's own background (section 12).
- **Flat glass:** no brighter top edge, no top sheen, no top-to-bottom gradients on controls.
- **Windows window buttons (— ▢ ✕) stay native** in the top-right corner, and the right sidebar starts below them. The user rejected moving or restyling them twice.
- Desktop: the ribbon auto-hides. The tab row stretches across the full width under a path row (iPad Safari style). The sidebar tab pills span the full sidebar width. Split screen uses one shared toolbar with panes as cards and a green edge on the current pane.
- iPhone: round glass buttons. The top row is `(◧) (folder path) (📖 ⋯) (◨)` and the bottom bar is `( ‹ › ) ( note name ) (≡)`. Tapping the name opens the tab overview, which holds Search and ＋. Scrolling down folds the bottom bar into a small capsule with just the name (Safari style).
- The user's other plugins are Day Planner Pro (their own plugin, which has the glass tokens), Style Settings, Typewriter Scrolling, Dayloom and others. Minimal Theme Settings is turned off.

## Open items

- Not yet checked on a real iPhone or iPad: notch and home-bar spacing, tab previews, the feel of the animations.
- Light mode hasn't been reviewed.
- Small leftovers: one link shows green while the others are gray. The Style Settings entries `goguryeo-no-top-toggles` and `g-ipad-toggle-offset` aren't used anymore and should be removed.
- macOS hasn't been tested (traffic-light spacing).
