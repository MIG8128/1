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
  9. Mobile shared (drawers, the edge-swipe page stage)
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
  - iPhone: a right-sidebar button (`.goguryeo-right-toggle`, a mirrored copy of Obsidian's own sidebar icon so it matches ◧); Safari gestures on the bottom name pill (`onPill*`: drag up opens `app.mobileTabSwitcher.show()`, drag sideways calls `workspace.setActiveLeaf` on the neighbouring tab, and the click after a drag is swallowed); and tapping the folded name capsule brings the bars back (`app.mobileNavbar.restoreNavigation()`)
  - path capsule as an address bar: tapping the path (desktop and iPad: `.view-header-title-container`; iPhone: the folder pill `.view-header-title-parent`) runs `switcher:open` instead of renaming. The `switcher:open` command's callback is wrapped, so Ctrl+O and the palette dock it too: `.goguryeo-omnibox` + `--g-omni-*` on the modal put the search field on the capsule with the list below (theme section 5, which also undoes the iPhone bottom-sheet layout). Never remove a modal's DOM by hand while testing: the switcher then refuses to open again until a reload.
  - background image: turns the Style Settings value `--g-bg-image` (vault path, `![[embed]]` or web link) into `--g-bg-url` on every `css-change`
  - iPhone and iPad: swipe in from the left or right edge to go back or forward, Safari style, only while both sidebars are closed. The page slides with the finger over a still copy of the other page (`.goguryeo-swipe-stage`). The copies are taken in a wrapper around `WorkspaceLeaf.prototype.getHistoryState`, which Obsidian calls just before leaving a page, and kept in a WeakMap keyed by that history entry. Right after a restart there are no copies yet, so the page underneath shows only the note's name and icon.
  - iPhone haptics: `haptic()` calls `Capacitor.Plugins.Haptics.impact({style: "LIGHT"})`, which Obsidian's iOS app registers. It fires on every tap on a control (buttons, icons, bars, path, menus, tab overview, file list; not the note text), on the name capsule, and each time an edge swipe crosses its go point. **Every new phone interaction must call it.**
- `GLASS.md`: the style contract for the user's other plugins (glass variables with fallbacks, recipes, motion, checklist). Keep it in sync when the glass tokens in section 2 change.
- `deploy.ps1`: copies the theme and the plugin into the vault.
- `tools/cdp.mjs`: a small DevTools client for the live Obsidian. **Not to be used anymore** (see "No access to Obsidian").
- `gemin-theme.css`: the user's old snippet, already merged into sections 3–4. Kept for reference only.

## Workflow (the user wants this)

- **One fix at a time.** Make one change, commit it, then report briefly. The user tests it on their own devices (Claude can't use Obsidian anymore).
- **Mock up visual changes in the design tool before building.** That's the Design canvas artifact "Goguryeo glass directions": https://claude.ai/artifact/GaRE4WK9qs73cGQMrUqxsP. It holds directions A–D, split-screen E/F, and the iPhone and iPad artboards.
- **Edit in this repo, never in the vault.** Then run `powershell -ExecutionPolicy Bypass -File deploy.ps1`. The vault is `C:\Users\MIG\Documents\obsidian\mig8128\.obsidian\` (theme in `themes/Goguryeo`, plugin in `plugins/goguryeo-companion`). The user reloads Obsidian with Ctrl+R.
- **Git:** one commit per verified step, on branch `main`, ending with the Co-Authored-By line. The git history describes every decision in detail.

## No access to Obsidian (the user revoked it on 2026-10-24)

**Claude has no permission to use Obsidian.** The earlier permission ("restart it your own") is withdrawn. The user said: "you don't have a permission to use obsidian from now on", after a test opened their notes one by one.

- Don't start, close, restart or control Obsidian. Don't connect to it (no `tools/cdp.mjs`, no debug port, no screenshots, no phone or iPad preview).
- **Never open, read, list or search the user's notes or vault files**, not even file names. This includes the Obsidian `app` API (`app.vault`, opening leaves) and reading files under `C:\Users\MIG\Documents\obsidian\mig8128\` directly. Reading another plugin's code under `.obsidian/plugins/` counts too, so ask first.
- Work from the code in this repo and Obsidian's own CSS/JS (the asar file, see the gotchas). For class names you can't find there, ask the user.
- The user tests every change on their own devices. Say clearly what you couldn't check, and what they should look at.

## Obsidian 1.14.5 gotchas (all verified)

- The left ribbon only has the class `mod-primary`, never `mod-left`. Sidebars and the sidebar buttons have both classes.
- `body` has `contain: strict`, so `position: fixed` elements still have an offsetParent, and `isShown()` is true for them.
- `.workspace-leaf` has `contain: strict !important`. A fixed element inside a pane is positioned relative to that pane. Split mode relaxes this to `contain: size !important`. Use plain `size`: a value Safari rejects would bring back Obsidian's strict.
- Obsidian gives sidebar `.workspace-tabs` `width: 100%`. Use `width: auto` when adding margins.
- The tab close button has `inset-inline-end: 0`. Cancel it if you set `left`, or the button covers the whole tab.
- Obsidian rebuilds a tab bar's children and drops foreign elements, so the plugin remembers each bar's last thumb position.
- When Obsidian moves the sidebar toggle, it leaves an animating clone. Compare against `app.workspace.leftSidebarToggleButtonEl`.
- iPhone: Obsidian hides the bars on scroll with a transform on `.view-header`. The theme slides it with `top` instead, because a transform would drag the fixed note-name pill along with it.
- iPhone: there's no right-sidebar button in Obsidian (the plugin adds one). The title container uses `display: contents`, so only the note's folder stays on top (for a folder note, the folder around it) and the note name moves to the bottom bar.
- **The preview is Chromium, and the real iPhone and iPad run Safari (WebKit).** Safari clips `position: fixed` children with any ancestor's `overflow: hidden`, especially a rounded one. Chrome doesn't, so the preview can't show this. That's why the iPad toolbar vanished in card mode: in split mode, `.workspace-tabs`, `.workspace-tab-container`, `.workspace-leaf` and `.workspace-leaf-content` are now `overflow: visible`, and `.view-content` clips itself with `clip-path`. Never put a clipping box around fixed UI.
- On iPhone and iPad, plugin (`main.js`) changes only load after Obsidian is fully closed and reopened; the theme CSS applies as soon as it syncs. Tell the user this whenever a change is in the plugin.
- iPhone: Obsidian brings the bars back by itself when the note is scrolled to the top. To test the folded capsule, scroll the note down first (set `scrollTop` and dispatch `scroll` events), don't just call `hideNavigation()`.
- iPhone: the ◧ button carries Obsidian's `.mod-raised` gradient; the theme removes it.
- Obsidian's mobile API: `app.mobileNavbar` (`hideNavigation`, `restoreNavigation`, `tabButtonEl`), `app.mobileTabSwitcher` (`show`, `hide`, `isVisible`), `leaf.history` (`backHistory`, `forwardHistory`, `go(n)`). `WorkspaceLeaf.prototype.getHistoryState` runs just before a leaf leaves a page.
- iPhone sidebars: the drawers are `position: fixed` and slide in with inline transforms (200ms). Obsidian's own **"Sliding sidebars"** option (Settings → Appearance, iPhone only; config `slidingSidebar`, on by default and on in this vault) also slides `rootSplit.containerEl` and `mobileNavbar.containerEl` by the drawer width (84vw), which pushes the whole tab aside. Body-level fixed elements such as ◨ don't move, so the theme fades them while `.workspace` has `is-left-sidedock-open` / `is-right-sidedock-open`.
- Obsidian paints `.workspace-drawer-inner` and `.workspace-drawer-active-tab-container` solid, and fades lists into that color with `::after` gradients; the theme clears both so the drawer glass (`--glass-sidebar`, the Sidebar opacity setting) shows.
- Mobile keyboard: `body.is-mobile .app-container` gets `max-height: calc(100vh - var(--keyboard-height))`; the body stays full height. `.app-container` is not positioned, so its absolute pseudo-elements are placed against the body.
- iPad: the note area has `padding-top` for the status bar. The plugin adds it to `--g-root-top`.
- Settings opens in its own window (a separate DevTools target titled "Settings - …", url about:blank), so `cdp.mjs shot` of the main window doesn't show it; capture that target instead.
- You can extract Obsidian's own CSS and JS from `%APPDATA%\obsidian\obsidian-1.14.5.asar` (it's a plain asar file) to look up class names.

## User preferences and decisions

- Write in English. The user writes in short sentences and likes seeing screenshots and checks.
- **iPhone UI needs haptics.** Every touch control or gesture the companion adds must call `this.haptic()`: on a tap, and when a gesture crosses its go point. The user insisted ("remember!").
- iPhone and iPad gestures follow iOS Safari: edge swipe with the other page underneath, a name pill that folds into a capsule on scroll, and drag the pill up or sideways.
- When the user describes a change exactly, building it directly is fine without a design-canvas mockup first; check it with screenshots.
- **No gradient backgrounds.** The glass comes from light, blur and content scrolling underneath, or the user's own background (section 12).
- **Flat glass:** no brighter top edge, no top sheen, no top-to-bottom gradients on controls.
- **Windows window buttons (— ▢ ✕) stay native** in the top-right corner, and the right sidebar starts below them. The user rejected moving or restyling them twice.
- Desktop: the ribbon auto-hides. The tab row stretches across the full width under a path row (iPad Safari style). The sidebar tab pills span the full sidebar width. Split screen uses one shared toolbar with panes as cards and a green edge on the current pane.
- iPhone: round glass buttons. The top row is `(◧) (folder path) (📖 ⋯) (◨)` and the bottom bar is `( ‹ › ) ( note name ) (≡)`. Tapping the name opens the tab overview, which holds Search and ＋. Scrolling down folds the bottom bar into a small capsule with just the name (Safari style). Like Safari's address bar, the name pill also takes gestures (companion): drag up to open the tab overview (`app.mobileTabSwitcher.show()`), or sideways to go to the tab beside it (left goes to the next tab, right to the previous). On the last tab, dragging left opens a new tab, like Safari.
- The user's other plugins are Day Planner Pro (their own plugin, which has the glass tokens), Style Settings, Typewriter Scrolling, Dayloom and others. Minimal Theme Settings is turned off.

## Open items

- **Waiting on the user's real iPhone:** the folded name capsule, the edge-swipe page stage, the name-pill gestures, and how strong the haptics feel. On iPad, the edge swipe. All were tested only in the preview with simulated touches and a stand-in Haptics plugin.
- Not yet checked on a real iPhone or iPad: notch and home-bar spacing, tab previews.
- The iPad toolbar fix (`8a1fb45`, `1eb0bf1`): the user confirmed the buttons came back after the first commit. The path row after the second commit hasn't been confirmed yet.
- An edge swipe occasionally takes 2–3 seconds to finish, when Obsidian itself is slow to open the note. The copy now lifts after 400ms at most, but a stall inside Obsidian still delays the start.
- Maybe later (not asked for yet): the iPhone capsule and the short folder name on iPad too.
- Light mode hasn't been reviewed.
- Small leftovers: one link shows green while the others are gray. The Style Settings entries `goguryeo-no-top-toggles` and `g-ipad-toggle-offset` aren't used anymore and should be removed.
- macOS hasn't been tested (traffic-light spacing).
