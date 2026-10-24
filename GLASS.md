# Goguryeo glass: style contract for Obsidian plugins

> **For Claude Code:** read this whole file before you write or change any UI
> in this plugin. Every rule here is required, not a suggestion. When this
> file and your own taste disagree, this file wins. Finish with the
> acceptance checklist at the end and report each item to the user.

**For the human:** copy this file into the plugin's repo and add this line to
that repo's `CLAUDE.md`:

```
All UI must follow GLASS.md (the Goguryeo glass style contract). Read it before any UI work.
```

---

## What the look is

The user's Obsidian theme, **Goguryeo**, is an iOS/macOS 26 "Liquid Glass"
look: frosted, see-through panels floating over the content and over an
optional wallpaper. The colors are Apple system grays. The accent (Apple
green) appears only on a few things. A plugin should look like part of the
theme, not like a separate app.

The theme publishes its glass as CSS variables (`--glass-*`) on `<body>`.
A plugin **only consumes** them. It never defines them, and it never
hard-codes colors.

## 1. Rules (all required)

1. **Use the theme's variables, always with a fallback**, so the plugin still
   looks fine under other themes (section 2). No hex, rgb() or hsl() colors
   in plugin CSS, except inside a `var()` fallback.
2. **Never define `--glass-*` yourself** (not on `body`, `:root` or your own
   elements). The nearest definition wins, so yours would override the
   user's theme settings.
3. **Flat glass.** No gradient backgrounds. No brighter top edge, no sheen,
   no `inset 0 1px 0 <light>` highlight, no top-to-bottom gradient on
   buttons. `--glass-highlight` and `--glass-sheen` exist only for old code
   (they are `transparent` and `none`); don't use them.
4. **Accent sparingly.** Use `--interactive-accent` / `--text-accent` only for
   the one primary action on screen (`button.mod-cta`), the current or "now"
   marker, and a checked state. Everything else is gray: `--text-normal`,
   `--text-muted`, `--text-faint`.
5. **Don't check the theme's name** (`app.customCss.theme`) to switch styles.
   The variables carry the look, and fallbacks cover other themes.
6. **Don't set fonts or base font sizes.** Use Obsidian's `--font-ui-*`
   sizes and inherit the font family.
7. **Over a wallpaper the panes are see-through** (section 6). Never give a
   view's root an opaque background of your own.
8. **Motion follows section 5 exactly** and respects
   `prefers-reduced-motion`.
9. **Beat Obsidian's button styles with two classes.** Obsidian styles every
   `button` (`button:not(.clickable-icon)`: background, shadow, hover). A
   single class loses to it, so a restyled button needs a two-class selector
   such as `.myplugin-track > .myplugin-segment`. Never use `!important`
   for this.

## 2. The variables

Map them once on your plugin's root class, with the fallbacks below, and use
the short names everywhere else. Replace `myplugin` with your plugin's
prefix.

```css
.myplugin {
    /* surfaces */
    --mp-glass:          var(--glass-bg, color-mix(in srgb, var(--background-primary) 85%, transparent));
    --mp-glass-strong:   var(--glass-bg-strong, var(--background-primary));
    --mp-glass-border:   var(--glass-border, var(--background-modifier-border));
    --mp-glass-shadow:   var(--glass-shadow, var(--shadow-s));
    --mp-glass-blur:     var(--glass-blur, blur(12px) saturate(160%));
    /* segmented controls and tab bars */
    --mp-track:          var(--glass-track, var(--background-modifier-hover));
    --mp-track-shadow:   var(--glass-track-shadow, inset 0 0 0 1px var(--background-modifier-border));
    --mp-thumb:          var(--glass-thumb, var(--background-primary));
    --mp-thumb-hover:    var(--glass-thumb-hover, var(--background-primary-alt));
    --mp-thumb-shadow:   var(--glass-thumb-shadow, var(--shadow-s));
    --mp-divider:        var(--g-tab-divider, var(--background-modifier-border));
    --mp-divider-soft:   var(--g-sidebar-tab-divider, var(--background-modifier-border));
    /* inputs */
    --mp-well:           var(--glass-well, var(--background-modifier-form-field));
    --mp-well-shadow:    var(--glass-well-shadow, none);
}
```

| Variable | Use it for |
|---|---|
| `--glass-bg` | panels and cards that float over content |
| `--glass-bg-strong` | menus, pop-ups, sticky headers: anything text must stay readable on |
| `--glass-border` | the 1px edge of any glass surface |
| `--glass-shadow` | drop shadow of a floating surface |
| `--glass-blur` | `backdrop-filter` of every glass surface (it is already `blur(...) saturate(180%)`) |
| `--glass-track` / `--glass-track-shadow` | the recessed bar of a segmented control or tab bar (darker than its surroundings) |
| `--glass-thumb` / `--glass-thumb-hover` / `--glass-thumb-shadow` | the light glass under the selected segment; also small raised glass buttons |
| `--glass-well` / `--glass-well-shadow` | sunken text inputs, search fields |
| `--g-tab-divider` | 2px line between segments / tabs |
| `--g-sidebar-tab-divider` | softer 1px line between small icon segments |

Standard Obsidian variables for everything else: `--text-normal`,
`--text-muted`, `--text-faint`, `--background-modifier-hover`,
`--background-modifier-border`, `--interactive-accent`, `--text-accent`,
`--font-ui-smaller`, `--font-ui-small`, `--font-ui-medium`.

## 3. Shape

| Element | Radius |
|---|---|
| big floating panel | `var(--g-radius-panel, 18px)` |
| card inside a view | `var(--g-radius-card, 14px)` |
| menu, pop-up, suggestion box | `12px` |
| modal | `16px` |
| segmented track | `10px` (padding `3px`, gap `2px`) |
| thumb, button, segment, input | `8px` (`7px` in a small icon track) |
| tooltip | `8px` |

Spacing between floating surfaces: `var(--g-gap, 10px)`. On iPad and iPhone,
tracks, thumbs and standalone buttons become pills (`border-radius: 999px`),
see section 7.

## 4. Recipes

### Glass panel or card

```css
.myplugin-card {
    background-color: var(--mp-glass);
    -webkit-backdrop-filter: var(--mp-glass-blur);
    backdrop-filter: var(--mp-glass-blur);
    border: 1px solid var(--mp-glass-border);
    border-radius: var(--g-radius-card, 14px);
    box-shadow: var(--mp-glass-shadow);
}
```

For pop-ups, menus and sticky headers, use `--mp-glass-strong` instead of
`--mp-glass`. The theme also ships ready-made classes you may put on
elements directly: `.glass-panel`, `button.glass-btn`, `.glass-track`,
`.glass-well` (they exist only while Goguryeo is active, so prefer the
recipes, which have fallbacks).

### Button

Plain buttons: leave Obsidian's own `button` styling alone. The one primary
action gets `mod-cta` (accent). Raised glass buttons, for example in a
toolbar:

```css
.myplugin .myplugin-glass-btn {
    border: none;
    border-radius: 8px;
    background: var(--mp-thumb);
    box-shadow: var(--mp-thumb-shadow);
    color: var(--text-normal);
}
@media (hover: hover) {
    .myplugin .myplugin-glass-btn:hover { background: var(--mp-thumb-hover); }
}
```

Icon-only buttons: use Obsidian's `clickable-icon` class; don't restyle them.

### Segmented control with the sliding glass (the signature piece)

A recessed track; one glass thumb slides under the selected segment with a
springy glide and a short "liquid" swell. This is how the theme's tab bars
and Day Planner Pro's GlassSegmented behave, and every segmented control,
tab strip or view switcher in a plugin must work this way.

```css
.myplugin-track {
    position: relative;
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: 10px;
    background: var(--mp-track);
    box-shadow: var(--mp-track-shadow);
}

/* Two classes: a single one loses to Obsidian's own button styles */
.myplugin-track > .myplugin-segment {
    position: relative;
    z-index: 1;
    flex: 1 1 0;
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    box-shadow: none;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    cursor: pointer;
}
.myplugin-track > .myplugin-segment:hover { background: transparent; box-shadow: none; }
.myplugin-track > .myplugin-segment.is-active { color: var(--text-normal); }
@media (hover: hover) {
    .myplugin-track > .myplugin-segment:not(.is-active):hover { color: var(--text-normal); }
}

/* Divider in the 2px gap; hidden beside the glass, a hovered segment, and after the last */
.myplugin-track > .myplugin-segment::after {
    content: "";
    position: absolute;
    top: 25%;
    right: -2px;
    width: 2px;
    height: 50%;
    border-radius: 1px;
    background-color: var(--mp-divider);
    transition: opacity 0.15s ease;
}
.myplugin-track > .myplugin-segment:is(.is-active, :has(+ .is-active), :last-child)::after { opacity: 0; }
@media (hover: hover) {
    .myplugin-track > .myplugin-segment:is(:hover, :has(+ :hover))::after { opacity: 0; }
}
/* small icon-only tracks: the soft 1px line instead */
.myplugin-track.is-icons > .myplugin-segment::after {
    right: -1.5px;
    width: 1px;
    border-radius: 0;
    background-color: var(--mp-divider-soft);
}

.myplugin-thumb {
    position: absolute;
    z-index: 0;
    top: 3px;
    left: 0;
    width: var(--x-w, 0px);
    height: calc(100% - 6px);
    border-radius: 8px;
    background: var(--mp-thumb);
    box-shadow: var(--mp-thumb-shadow);
    -webkit-backdrop-filter: blur(10px) saturate(1.8);
    backdrop-filter: blur(10px) saturate(1.8);
    transform: translateX(var(--x-left, 0px));
    pointer-events: none;
    transition: transform 0.42s cubic-bezier(0.3, 1.3, 0.4, 1),
        width 0.42s cubic-bezier(0.3, 1.3, 0.4, 1),
        scale 0.2s ease;
}
.myplugin-thumb.is-placing { transition: none; }
.myplugin-thumb.is-moving { scale: 1.06 1.12; }

@media (prefers-reduced-motion: reduce) {
    .myplugin-thumb { transition: none; }
    .myplugin-thumb.is-moving { scale: none; }
}
```

```js
// One glass thumb under the active segment. It slides with the spring
// glide and swells for SWELL_MS while it travels. First placement and
// resizes jump without animation.
const SWELL_MS = 320;

function glassSegmented(plugin, parentEl, items, initialId, onChange) {
    const track = parentEl.createDiv("myplugin-track");
    const thumb = track.createDiv("myplugin-thumb is-placing");
    const segments = new Map();
    for (const { id, label, icon } of items) {
        const button = track.createEl("button", { cls: "myplugin-segment", attr: { "aria-pressed": "false" } });
        if (icon) setIcon(button, icon); else button.setText(label);
        if (icon && label) button.setAttr("aria-label", label);
        button.addEventListener("click", () => select(id, true));
        segments.set(id, button);
    }

    let current = null;
    let swell = 0;

    function place(animate) {
        const button = segments.get(current);
        if (!button || track.offsetWidth === 0) return;
        thumb.toggleClass("is-placing", !animate);
        thumb.style.setProperty("--x-left", `${button.offsetLeft}px`);
        thumb.style.setProperty("--x-w", `${button.offsetWidth}px`);
        if (animate) {
            thumb.addClass("is-moving");
            window.clearTimeout(swell);
            swell = window.setTimeout(() => thumb.removeClass("is-moving"), SWELL_MS);
        }
    }

    function select(id, fromUser) {
        if (id === current || !segments.has(id)) return;
        const animate = current !== null;
        current = id;
        for (const [segId, button] of segments) {
            button.toggleClass("is-active", segId === id);
            button.setAttr("aria-pressed", String(segId === id));
        }
        place(animate);
        if (fromUser) onChange?.(id);
    }

    const resize = new ResizeObserver(() => place(false));
    resize.observe(track);
    plugin.register(() => resize.disconnect());
    plugin.register(() => window.clearTimeout(swell));

    select(initialId, false);
    return { el: track, select: (id) => select(id, false) };
}
```

(`setIcon` comes from `require("obsidian")`. In React, keep the same DOM,
classes and timing: measure the active button in a layout effect, set the two
variables, toggle `is-moving` for 320 ms.)

### Input well

```css
.myplugin input[type="text"],
.myplugin input[type="search"],
.myplugin textarea {
    background-color: var(--mp-well);
    box-shadow: var(--mp-well-shadow);
    border: 1px solid var(--mp-glass-border);
    border-radius: 8px;
}
```

### List row and hover

```css
.myplugin-row {
    border-radius: 8px;
    color: var(--text-normal);
}
@media (hover: hover) {
    .myplugin-row:hover { background-color: var(--background-modifier-hover); }
}
.myplugin-row.is-selected { background-color: var(--background-modifier-active-hover); }
```

Secondary text in a row: `--text-muted`. Meta and timestamps:
`--text-faint`. Not the accent.

### Sticky header inside a scrolling view

```css
.myplugin-sticky {
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--mp-glass-strong);
    -webkit-backdrop-filter: var(--mp-glass-blur);
    backdrop-filter: var(--mp-glass-blur);
    border-bottom: 1px solid var(--mp-glass-border);
}
```

## 5. Motion

| What | Value |
|---|---|
| sliding selection (thumb) | `0.42s cubic-bezier(0.3, 1.3, 0.4, 1)` on `transform` and `width` |
| swell while sliding | `scale: 1.06 1.12` for 320 ms, `scale 0.2s ease` back |
| hovers, fades, small state changes | `0.15s ease` |
| panels sliding in or out | `0.25s cubic-bezier(0.2, 0.8, 0.2, 1)` |

No bouncing anywhere else, no motion on scroll, nothing longer than 0.45s.
Everything turns off under `@media (prefers-reduced-motion: reduce)`.

## 6. Backgrounds: the panes are see-through

The user can put a color or a picture behind the whole window (body class
`goguryeo-bg-color` or `goguryeo-bg-image`). Then:

- Each note pane is a translucent card, and **inside a pane
  `--background-primary` is `transparent`**. Anything you paint with
  `var(--background-primary)` disappears and the pane's tint shows through.
  That is intended, so use `--background-primary` (never a hex) for
  "page-colored" areas.
- Don't put an opaque background on your view's root or main container.
  Leave it unset.
- Things that must stay readable over moving content (sticky headers, pop-ups,
  floating toolbars) use `--glass-bg-strong` plus `--glass-blur`, never
  `--background-primary`.
- Cards inside your view: `--glass-bg` with blur, so the wallpaper glows
  through softly.

## 7. iPhone and iPad

Body classes: `is-mobile` (both), `is-phone`, `is-tablet`.

- Touch targets: at least 36px tall in tracks; standalone buttons on iPhone
  44px and round.
- On `is-tablet` and `is-phone`: tracks, thumbs and standalone buttons are
  pills.

```css
body:is(.is-phone, .is-tablet) .myplugin :is(.myplugin-track, .myplugin-thumb, .myplugin-segment, .myplugin-glass-btn) {
    border-radius: 999px;
}
body:is(.is-phone, .is-tablet) .myplugin-track > .myplugin-segment { height: 36px; }
```

- Wrap every `:hover` rule in `@media (hover: hover)` so touch devices don't
  get stuck hover states.
- Blur is lighter on phones; the theme handles that through `--glass-blur`,
  so don't hard-code blur amounts (except the thumb's `blur(10px)`).

## 8. Accessibility

- Segments: `aria-pressed` on each segment (or `role="tab"` with
  `aria-selected` inside a `role="tablist"`), `aria-label` on icon-only ones.
- Don't rely on the accent alone to show state; the thumb or a weight change
  must show it too.
- The theme already handles "Reduce transparency" (its variables turn
  solid). Using the variables is enough.

## 9. Acceptance checklist

Report each line to the user as ✅ or ❌ with a one-line reason:

1. `grep` the plugin's CSS for `#`, `rgb(` and `hsl(`: each hit sits inside a
   `var(..., fallback)`.
2. No `linear-gradient` or `radial-gradient` used as a visible gradient (a
   flat `linear-gradient(c, c)` overlay is allowed). No `inset 0 1px 0`
   light highlights.
3. No `--glass-*` variable is defined by the plugin; all are read through the
   `--mp-*` map with fallbacks.
4. Every segmented control or tab strip uses the sliding thumb with the exact
   motion from section 5, and reduced motion turns it off.
5. The accent appears only on the primary action, the current/"now" marker,
   and checked states.
6. The view's root has no opaque background; sticky and floating parts use
   `--glass-bg-strong` + `--glass-blur`.
7. Looks right in dark **and** light mode.
8. Looks right with Goguryeo **and** with Obsidian's default theme (fallbacks).
9. Looks right with a Goguryeo background image on (Style Settings →
   Goguryeo → Background → Image).
10. On iPhone/iPad (or Obsidian's mobile emulation): pills, 36px+ targets, no
    stuck hovers.
