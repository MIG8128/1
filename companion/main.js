/* Goguryeo Companion — things a CSS theme cannot do on its own.

   All platforms: keeps the left sidebar button out of the hidden ribbon.
   Desktop: keeps it at the start of the main tab bar, mirroring the right one.
   In a narrow window, sidebars that would squeeze the note hide, and come
   out at the window edges.

   iPhone & iPad: swipe in from the left/right edge to go back/forward,
   Safari style: the page follows the finger with the other page showing
   underneath (only while both sidebars are closed); iPhone also gets a right sidebar
   button, which Obsidian has none of on phones.

   Tab bars: a glass "thumb" sits under the active tab of every tab bar (main
   tabs and sidebar pills) and slides to the new tab when it changes; the
   theme styles it (.goguryeo-tab-thumb) and gives it the spring motion.

   Desktop touchscreens: swipe right from near the left edge to pull out the
   ribbon the Goguryeo theme hides. The ribbon follows the finger; let go past
   OPEN_AT to keep it open. Tap outside it, tap one of its icons, or swipe it
   left to close. The open state is the body class "goguryeo-touch-active",
   which the theme styles.

   Background: the theme's "Background image" setting holds a vault path, an
   embed (![[wall.jpg]]) or a web link. CSS can only load the link, so this
   turns the setting into a URL the theme reads as --g-bg-url. Typing a
   path is no fun, so the plugin also offers pickers that fill the setting
   in: its settings tab, "Use as background" on an image's file menu, and
   two commands (from the vault, or from this device). */

const {
    Plugin, Platform, Menu, setIcon, normalizePath,
    FuzzySuggestModal, Notice, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf, Keymap,
} = require("obsidian");

const EDGE = 40; // px from the window's left edge where a swipe may start
const OPEN_AT = 50; // px the finger must travel to keep the ribbon open
const LOCK_AT = 10; // px of movement before deciding swipe vs. scroll
const OPEN_CLASS = "goguryeo-touch-active";
const THUMB_CLASS = "goguryeo-glass-thumbs";
const SLIDE_MS = 440; // the theme's 0.42s glide, plus a little
const SWELL_MS = 320; // how long the glass stays swollen while it travels
const SPLIT_CLASS = "goguryeo-split";
const ONE_PANE_CLASS = "goguryeo-one-pane";
const SHARED_TABS_CLASS = "goguryeo-shared-tabs"; // body: 2+ panes share one tab row
const SHARED_ACTIVE = ":scope > .goguryeo-stab.is-active"; // the split tab or the lone tab on screen, in the shared row
const SOLO_CLASS = "goguryeo-solo"; // body: a normal tab fills the screen, the split's panes fold away
const SOLO_OFF_CLASS = "goguryeo-solo-off";
const FOLDED_CLASS = "goguryeo-folded"; // body: some panes are folded away (a lone tab, or another split on screen) // a pane or split folded away for it
const MEMBERS_KEY = "goguryeo-split-members"; // the split's page in each pane, by leaf id
const GRIP_CLASS = "goguryeo-pane-grip"; // the bar on top of each split pane, to drag the pane elsewhere
const GRIP_MENU_CLASS = "goguryeo-grip-menu"; // a tap on the grip: own tab, swap, move, close (canvas: grip menu B)
const PANE_PREVIEW_CLASS = "goguryeo-pane-preview"; // while a dragged pane previews its move, the cards glide to their new boxes
const WEB_ZOOM_MAX = 5; // a trackpad pinch magnifies a web viewer page up to 5x, as in Chrome
const WEB_ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]; // Ctrl + wheel, Chrome's levels
const NEW_PANE = Object.freeze({ newPane: true }); // previewPanes: a pane not made yet (a tab dropped on an edge)
const PANE_PREVIEW_MS = 320; // that glide (the theme's transition)
const SHARED_INNER = ":scope > .goguryeo-stab-inner";
const EDGE_SWIPE_ZONE = 24; // px from the left/right edge where a back/forward swipe starts
const EDGE_SWIPE_AT = 0.35; // share of the width to pull before letting go navigates
const SWIPE_SETTLE_MS = 280; // the page gliding the rest of the way (or back)
const PILL_SWIPE_AT = 56; // px to drag the name pill before letting go acts
const NEW_TAB = "new-tab"; // the name pill's target past the last tab
const PILL_FLICK = 0.5; // px/ms: a flick of the name pill acts even when short
const SWIPE_DRAW_MS = 400; // most to wait for the new page before uncovering it
const CURRENT_PANE_CLASS = "goguryeo-current-pane";
const LAST_PANE_CLASS = "goguryeo-last-pane";
const FLOAT_LEFT_CLASS = "goguryeo-float-left";
const FLOAT_RIGHT_CLASS = "goguryeo-float-right";
const NOTE_MIN_WIDTH = 480; // px the note keeps beside docked sidebars; below it they hide
const AUTO_HIDDEN_KEY = "goguryeo-auto-hidden"; // which sidebars a narrow window hid (this device)
const ANDROID_NAV_KEY = "goguryeo-android-nav"; // "gestures" or "buttons": how this Android device navigates
const PEEK_OPTION_CLASS = "goguryeo-peek-sidebars"; // the theme's "Bring out closed sidebars" option
const PEEK_CLASS = { left: "goguryeo-peek-left", right: "goguryeo-peek-right" };
const FLOAT_CLASS = { left: FLOAT_LEFT_CLASS, right: FLOAT_RIGHT_CLASS };
const PEEK_DWELL_MS = 150; // the pointer rests at an edge this long before the sidebar comes out
const PEEK_LEAVE_MS = 400; // and stays away this long before it goes again (the ribbon's delay)
const PEEK_REACH = 16; // px past the sidebar the pointer may wander without closing it
const TOP_OPTION_CLASS = "goguryeo-fullscreen-autohide"; // the theme's "Hide the top rows in full screen" option
const TOP_HIDDEN_CLASS = "goguryeo-top-hidden"; // body: full screen, the path and tab rows slid away
const TOP_PEEK_CLASS = "goguryeo-top-peek"; // body: and brought back over the note by the pointer
const FOLDER_NOTES_CLASS = "goguryeo-folder-notes"; // body: the built-in folder notes are on
const FOLDER_NOTES_PLUGIN = "folder-notes"; // the community Folder notes plugin: while it's on, ours stays off
const PEEK_TOP = 40; // px at the top where the window edges belong to the title bar
const OMNI_CLASS = "goguryeo-omnibox"; // the quick switcher docked on the path capsule
const OMNI_MIN_WIDTH = 420; // px it takes at least (the iPhone folder pill is small)
const OMNI_MARGIN = 8; // px it keeps from the window edges
const OMNI_MS = 320; // the list unrolling below the capsule
const OMNI_EASE = "cubic-bezier(0.3, 1.15, 0.4, 1)"; // a soft spring, settling past its spot and back
const SHADOW_ROOM = 32; // px the switcher's clip reaches past its edge at the end, so its shadow shows
const OVERVIEW_CLASS = "goguryeo-tab-overview"; // the tab overview sheet (desktop and iPad)
const OVERVIEW_ICON_CLASS = "goguryeo-overview-icon"; // ⧉, which the theme shows in place of ⌄
const OVERVIEW_MS = 240; // the sheet fading in and out
const TAB_SPRING = "cubic-bezier(0.3, 1.5, 0.4, 1)"; // tabs and slots growing in, with a bounce
const CARD_HOLD_MS = 300; // a finger rests on a card this long before it lifts (a mouse drags at once)
const CARD_SLOP = 6; // px a pointer may wander before it counts as a drag (or, for a finger, a scroll)
const CARD_EASE = "cubic-bezier(0.3, 1.15, 0.4, 1)"; // the other cards making room, and the drop
const SNAP ="transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease";
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"];

const isImage = (file) => file instanceof TFile && IMAGE_EXTENSIONS.includes(file.extension.toLowerCase());

// Search the vault's images, each shown with a small preview
class BackgroundImageModal extends FuzzySuggestModal {
    constructor(app, onChoose) {
        super(app);
        this.onChoose = onChoose;
        this.setPlaceholder("Pick a background image…");
    }

    getItems() {
        return this.app.vault.getFiles().filter(isImage);
    }

    getItemText(file) {
        return file.path;
    }

    renderSuggestion(match, el) {
        el.addClass("goguryeo-image-suggestion");
        el.createEl("img", { attr: { src: this.app.vault.getResourcePath(match.item), loading: "lazy" } });
        super.renderSuggestion(match, el);
    }

    onChooseItem(file) {
        this.onChoose(file);
    }
}

// Every option of the theme, the same list Style Settings shows, read from
// the theme's @settings block as Style Settings parsed it. The values stay
// in Style Settings (the theme reads them from there), so both pages always
// show the same thing. Here the Background options only show when they
// apply, and the image gets a picker instead of a path field.
class GoguryeoSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        this.folderNotesSection();
        const manager = this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager;
        const config = manager?.config?.goguryeo;
        if (!config) {
            containerEl.createEl("p", { text: "Turn on the Style Settings plugin to change the theme's options." });
            return;
        }
        const get = (id) => manager.getSetting("goguryeo", id);
        const set = (id, value) => manager.setSetting("goguryeo", id, value);
        const type = get("goguryeo-bg") ?? "goguryeo-bg-none";
        const mode = document.body.hasClass("theme-light") ? "light" : "dark";
        // Background options that only matter with some backgrounds
        const shownWith = {
            "g-bg-color": ["goguryeo-bg-color"],
            "g-bg-image": ["goguryeo-bg-image"],
            "g-bg-blur": ["goguryeo-bg-image"],
            "g-bg-dim": ["goguryeo-bg-image"],
        };
        // Starting values the theme picks itself, unlike the fixed default:
        // Sidebar opacity follows Glass opacity until moved
        const startsAt = {
            "g-sidebar-tint": get("g-glass-tint") ?? config["g-glass-tint"]?.default,
        };

        for (const s of Object.values(config)) {
            if (shownWith[s.id] && !shownWith[s.id].includes(type)) continue;
            if (s.type === "heading") {
                new Setting(containerEl).setName(s.title).setHeading();
                continue;
            }
            if (s.type === "info-text") {
                // The one pointing to this page is for Style Settings only
                if (s.id !== "goguryeo-companion-info") {
                    new Setting(containerEl).setName(s.title).setDesc(s.description ?? "");
                }
                continue;
            }
            if (s.id === "g-bg-image") {
                this.imagePicker();
                continue;
            }
            const key = s.type === "variable-themed-color" ? `${s.id}@@${mode}` : s.id;
            const row = new Setting(containerEl).setName(s.title).setDesc(s.description ?? "");
            const value = get(key) ?? startsAt[s.id] ?? (s.type === "variable-themed-color" ? s[`default-${mode}`] : s.default);
            switch (s.type) {
                case "class-toggle":
                    row.addToggle((t) => t.setValue(!!value).onChange((v) => set(key, v)));
                    break;
                case "class-select":
                case "variable-select":
                    row.addDropdown((d) => {
                        for (const o of s.options) {
                            if (typeof o === "string") d.addOption(o, o);
                            else d.addOption(o.value, o.label);
                        }
                        // Picking a background shows the options that go with it
                        d.setValue(value ?? "").onChange((v) => {
                            set(key, v);
                            if (s.id === "goguryeo-bg") this.display();
                        });
                    });
                    break;
                case "variable-number-slider":
                    row.addSlider((sl) => sl.setLimits(s.min, s.max, s.step)
                        .setValue(value)
                        .setDynamicTooltip()
                        .onChange((v) => set(key, v)));
                    break;
                case "variable-color":
                case "variable-themed-color":
                    if (s.type === "variable-themed-color") row.setDesc(`${s.description ?? ""} For ${mode} mode.`.trim());
                    row.addColorPicker((c) => c.setValue(value ?? "").onChange((v) => set(key, v)));
                    break;
                default: // variable-text, variable-number
                    row.addText((t) => t.setValue(value == null ? "" : String(value)).onChange((v) => {
                        set(key, s.type === "variable-number" ? Number(v) : v);
                    }));
            }
            row.addExtraButton((b) => b.setIcon("reset").setTooltip("Restore default").onClick(() => {
                manager.clearSetting("goguryeo", key);
                this.display();
            }));
            if (s.id === "goguryeo-edge-swipe" && Platform.isAndroidApp) this.androidNavPicker();
        }
    }

    // The companion's own folder notes. Saved in the plugin's data, so they
    // follow the vault to every device.
    folderNotesSection() {
        const plugin = this.plugin;
        new Setting(this.containerEl).setName("Folder notes").setHeading();
        const other = plugin.otherFolderNotesOn();
        if (!plugin.folderNoteSettings) plugin.folderNoteSettings = { enabled: true };
        new Setting(this.containerEl)
            .setName("Folder notes")
            .setDesc(other
                ? "The Folder notes plugin is on. Turn it off in Community plugins to use these instead."
                : "A file named like its folder, inside it (Novel/Novel.md, .canvas, .base...), is the folder's note. Clicking the folder opens it, the note itself is hidden from the file list, and renaming the folder renames the note. Right-click a folder to make one, or a note to turn it into one.")
            .addToggle((t) => t.setValue(plugin.folderNoteSettings.enabled).setDisabled(other)
                .onChange(async (v) => {
                    plugin.folderNoteSettings.enabled = v;
                    await plugin.saveData(plugin.folderNoteSettings);
                    plugin.refreshFolderNotes();
                    this.display();
                }));
        // What it sees, to tell "not loaded" from "not found" from "not
        // matched in the file list". Counts only, no names.
        const st = plugin.folderNoteStatus();
        new Setting(this.containerEl)
            .setName("Status")
            .setDesc(`Companion ${plugin.manifest.version} · ${st.on ? "on" : "off"} · ${st.found} folder notes found · file list: ${st.folders} folder rows, ${st.hidden} notes hidden, ${st.visible} still shown${st.error ? ` · error: ${st.error}` : ""}`)
            .addExtraButton((b) => b.setIcon("refresh-cw").setTooltip("Check again").onClick(() => {
                plugin.refreshFolderNotes();
                this.display();
            }));
        new Setting(this.containerEl).setName("Theme").setHeading();
    }

    // Per device, so it stays out of Style Settings (which syncs with the vault)
    androidNavPicker() {
        new Setting(this.containerEl)
            .setName("Android navigation (this device)")
            .setDesc("With gesture navigation, Android's back gesture uses the screen edges, so the swipe stays off here unless the option above is \"On\". With the navigation buttons, the edges are free and the swipe works like on iPhone and iPad.")
            .addDropdown((d) => d
                .addOption("gestures", "Gesture navigation")
                .addOption("buttons", "Navigation buttons")
                .setValue(this.plugin.androidNav)
                .onChange((v) => this.plugin.setAndroidNav(v)));
    }

    imagePicker() {
        const current = this.plugin.getBackgroundImage();
        const image = new Setting(this.containerEl)
            .setName("Image")
            .setDesc(current || "None yet. Choose one, or right-click an image in the file list → Use as background.")
            .addButton((b) => b.setButtonText("Choose from vault").setCta()
                .onClick(() => this.plugin.chooseBackgroundImage(() => this.display())))
            .addButton((b) => b.setButtonText("From this device…")
                .onClick(() => this.plugin.importBackgroundImage(() => this.display())));
        const file = current && this.app.vault.getFileByPath(current);
        if (file) {
            image.settingEl.addClass("goguryeo-bg-setting");
            image.infoEl.prepend(createEl("img", {
                cls: "goguryeo-bg-preview",
                attr: { src: this.app.vault.getResourcePath(file) },
            }));
        }
    }
}

module.exports = class GoguryeoCompanion extends Plugin {
    onload() {
        // Obsidian puts the left sidebar button inside the ribbon whenever the
        // ribbon "is shown" (has an offsetParent). The theme's floating ribbon
        // still has one, because Obsidian gives <body> `contain: strict`, so
        // report it as hidden while it floats; Obsidian then moves the button
        // to a tab bar. Re-place the buttons once ready and on every CSS change.
        this.app.workspace.onLayoutReady(() => {
            this.patchRibbonIsShown();
            this.patchUpdateFrameless();
            this.refreshFrame();
        });
        this.registerEvent(this.app.workspace.on("css-change", () => this.refreshFrame()));

        this.app.workspace.onLayoutReady(() => this.updateBackground());
        this.registerEvent(this.app.workspace.on("css-change", () => this.updateBackground()));
        this.setupBackgroundPickers();

        this.app.workspace.onLayoutReady(() => this.setupPopouts());
        if (Platform.isDesktopApp) this.app.workspace.onLayoutReady(() => this.setupWebPinch());
        if (Platform.isDesktopApp) this.app.workspace.onLayoutReady(() => this.setupTrackpadSwipe());
        this.app.workspace.onLayoutReady(() => this.setupTabThumbs());
        this.app.workspace.onLayoutReady(() => this.patchSelectTab());
        this.app.workspace.onLayoutReady(() => this.setupFloatingSidebars());
        this.app.workspace.onLayoutReady(() => this.setupSidebarPeek());
        this.app.workspace.onLayoutReady(() => this.setupTopPeek());
        this.app.workspace.onLayoutReady(() => this.setupPhoneBar());
        this.androidNav = this.app.loadLocalStorage(ANDROID_NAV_KEY) === "buttons" ? "buttons" : "gestures";
        if (Platform.isMobile) this.setupEdgeSwipe();
        this.setupPathSwitcher(); // before the haptics, which it keeps from ticking twice
        if (Platform.isMobile) this.setupHaptics();
        if (!Platform.isPhone) this.setupTabOverview(); // after the haptics, so ⧉ ticks once
        this.setupFolderNotes(); // after the haptics: a folder click in the file list ticks there

        if (!Platform.isDesktopApp) return;

        this.swipe = null;
        const opts = { passive: true, capture: true };
        this.registerDomEvent(document, "touchstart", (e) => this.onTouchStart(e), opts);
        this.registerDomEvent(document, "touchmove", (e) => this.onTouchMove(e), opts);
        this.registerDomEvent(document, "touchend", () => this.onTouchEnd(), opts);
        this.registerDomEvent(document, "touchcancel", () => this.onTouchEnd(), opts);
        this.registerDomEvent(document, "click", (e) => this.onClick(e), { capture: true });
    }

    // ---- Web viewer: a trackpad pinch zooms the page ----

    // Zoom on a web viewer's page, as in Chrome. A trackpad pinch magnifies
    // the spot under the fingers without reflowing the page: Chromium's own
    // pinch-zoom where it gets one (Electron keeps it off in a <webview>
    // until its visual zoom may go past 1x, up to WEB_ZOOM_MAX), and on
    // Windows, where the pinch arrives as small Ctrl + wheel steps, the
    // page's listener magnifies it itself. Ctrl + mouse wheel steps the
    // page zoom through Chrome's levels (WEB_ZOOM_STEPS), text and layout
    // growing: a small listener put in each page it loads takes that wheel
    // (a notch is ~100; a pinch sends a few units at a time and is left to
    // Chromium) and tells the plugin through the page's console. A note
    // isn't touched.
    setupWebPinch() {
        const MARK = "\u2063goguryeo:";
        // In the page. A notch (~100): the plugin steps the page zoom. A
        // pinch (a few units at a time; on Windows it comes as Ctrl + wheel,
        // Chromium's own pinch-zoom never sees it): the page is magnified
        // around the pointer as one picture, not laid out anew, like
        // Chrome's pinch. While magnified, scrolling first moves about the
        // picture (both ways); at its edge the scroll goes on to the page.
        // The picture is drawn from where the page is scrolled to, and the
        // page's own scrollbars are left alone. Pinched back to 1x it's as
        // it was.
        const listen = `if (!window.__goguryeoZoom6) { window.__goguryeoZoom6 = true;
            let mag = 1, ox = 0, oy = 0, saved = null;
            const html = document.documentElement;
            const apply = () => {
                if (mag === 1) {
                    html.style.transform = ""; html.style.transformOrigin = "";
                    if (saved !== null) { html.style.overflow = saved; saved = null; }
                    return;
                }
                if (saved === null) saved = html.style.overflow;
                html.style.overflow = "hidden"; // the picture adds no scrollbars
                html.style.transformOrigin = scrollX + "px " + scrollY + "px";
                html.style.transform = "translate(" + (-ox) + "px, " + (-oy) + "px) scale(" + mag + ")";
            };
            const clamp = () => {
                ox = Math.min((mag - 1) * innerWidth, Math.max(0, ox));
                oy = Math.min((mag - 1) * innerHeight, Math.max(0, oy));
            };
            addEventListener("scroll", () => { if (mag > 1) apply(); }, true);
            addEventListener("resize", () => { if (mag > 1) { clamp(); apply(); } });
            addEventListener("wheel", (e) => {
                const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1;
                if (e.ctrlKey) {
                    // the page sees the wheel divided by its zoom: undo that
                    const raw = e.deltaY * unit * (window.__goguryeoZoomF || 1);
                    e.preventDefault();
                    if (Math.abs(raw) >= 40) { console.debug("${MARK}zoom:" + Math.sign(e.deltaY)); return; }
                    const next = Math.min(${WEB_ZOOM_MAX}, Math.max(1, mag * Math.exp(-raw / 100)));
                    if (next === mag) return;
                    const cx = (e.clientX + ox) / mag, cy = (e.clientY + oy) / mag;
                    mag = next < 1.01 ? 1 : next;
                    ox = cx * mag - e.clientX; oy = cy * mag - e.clientY;
                    if (mag === 1) { ox = 0; oy = 0; }
                    clamp(); apply();
                    return;
                }
                if (mag === 1) {
                    // sideways, and nothing here scrolls that way: a swipe for the plugin
                    const dx = e.deltaX * unit;
                    if (!dx || Math.abs(dx) < Math.abs(e.deltaY * unit) * 1.2) return;
                    for (let el = e.target; el && el.nodeType === 1; el = el.parentElement) {
                        if (el.scrollWidth <= el.clientWidth + 1) continue;
                        const o = getComputedStyle(el).overflowX;
                        if (el !== document.scrollingElement && o !== "auto" && o !== "scroll") continue;
                        if (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return;
                    }
                    e.preventDefault(); // not Chromium's own swipe back, without the slide
                    console.debug("${MARK}swipe:" + dx + ":" + e.deltaY * unit);
                    return;
                }
                const bx = ox, by = oy;
                ox += e.deltaX * unit; oy += e.deltaY * unit;
                clamp(); apply();
                if (Math.abs(ox - bx) + Math.abs(oy - by) > 0.5) { e.preventDefault(); return; }
                scrollBy(e.deltaX * unit / mag, e.deltaY * unit / mag); // at its edge: on to the page
            }, { passive: false, capture: true }); }`;
        const tell = (webview) => webview.executeJavaScript(`window.__goguryeoZoomF = ${webview.getZoomFactor()}`).catch(() => {});
        const ready = (webview) => {
            try {
                webview.setVisualZoomLevelLimits?.(1, WEB_ZOOM_MAX);
                webview.executeJavaScript(listen).catch(() => {});
                tell(webview);
            } catch (e) { /* not attached yet: dom-ready calls again */ }
        };
        const onMessage = (webview, message) => {
            if (message?.startsWith(MARK + "swipe:")) {
                const [dx, dy] = message.slice(MARK.length + 6).split(":").map(Number);
                let leaf = null;
                this.app.workspace.iterateAllLeaves((l) => { if (l.view?.webview === webview) leaf = l; });
                if (leaf) this.onSwipeWheel({ deltaX: dx, deltaY: dy, deltaMode: 0, ctrlKey: false }, leaf);
                return;
            }
            if (!message?.startsWith(MARK + "zoom:")) return;
            const dir = -Math.sign(parseFloat(message.slice(MARK.length + 5)) || 0); // wheel up: in
            if (!dir) return;
            const now = webview.getZoomFactor();
            const next = dir > 0
                ? WEB_ZOOM_STEPS.find((z) => z > now + 0.001)
                : [...WEB_ZOOM_STEPS].reverse().find((z) => z < now - 0.001);
            if (!next) return;
            webview.setZoomFactor(next);
            tell(webview);
        };
        const wired = new Set();
        const scan = () => this.app.workspace.iterateAllLeaves((leaf) => {
            const webview = leaf.view?.getViewType?.() === "webviewer" ? leaf.view.webview : null;
            if (!webview || wired.has(webview)) return;
            wired.add(webview);
            const onReady = () => ready(webview); // each page it loads
            const onConsole = (e) => onMessage(webview, e.message);
            // a picture of each page once it has loaded, for the swipe back
            // to it (taken as the page is left, it could be the next one)
            let shotTimer = 0;
            const onLoaded = () => {
                window.clearTimeout(shotTimer);
                shotTimer = window.setTimeout(() => this.keepWebShot(webview), 400);
            };
            webview.addEventListener("dom-ready", onReady);
            webview.addEventListener("console-message", onConsole);
            webview.addEventListener("did-stop-loading", onLoaded);
            webview.gGoguryeoOff = () => {
                window.clearTimeout(shotTimer);
                webview.removeEventListener("dom-ready", onReady);
                webview.removeEventListener("console-message", onConsole);
                webview.removeEventListener("did-stop-loading", onLoaded);
            };
            ready(webview);
        });
        scan();
        this.registerEvent(this.app.workspace.on("layout-change", scan));
        this.registerEvent(this.app.workspace.on("active-leaf-change", scan));
        this.register(() => {
            for (const webview of wired) {
                webview.gGoguryeoOff?.();
                try { webview.setVisualZoomLevelLimits?.(1, 1); } catch (e) { /* gone */ }
            }
        });
    }

    // The last picture of each web page, by address (a few dozen kept)
    keepWebShot(webview) {
        let url = null;
        try {
            url = webview.getURL();
            if (!url || webview.isLoading()) return;
        } catch (e) {
            return;
        }
        webview.capturePage?.().then((image) => {
            const shots = (this.webShots ??= new Map());
            shots.delete(url);
            shots.set(url, image.toDataURL());
            while (shots.size > 40) shots.delete(shots.keys().next().value);
        }).catch(() => {});
    }

    // ---- New windows (popouts) ----

    // Obsidian copies the main window's body classes and --variables onto
    // every popout window, again on each change. Those that describe the
    // main window's layout (its split, folded panes, floating sidebars,
    // hidden top rows, drags) made a popout lay itself out as the main
    // window's split: no top rows, one empty card. Each popout's body is
    // watched and loses them right after each copy, so it gets the plain
    // layout (path row, tab row, one card); the theme options stay.
    setupPopouts() {
        const classes = [
            SPLIT_CLASS, ONE_PANE_CLASS, SHARED_TABS_CLASS, SOLO_CLASS, PANE_PREVIEW_CLASS,
            FLOAT_LEFT_CLASS, FLOAT_RIGHT_CLASS, PEEK_CLASS.left, PEEK_CLASS.right,
            TOP_HIDDEN_CLASS, TOP_PEEK_CLASS, OPEN_CLASS, OVERVIEW_CLASS + "-open",
            "goguryeo-pane-dragging", "goguryeo-phone-menu-open",
        ];
        const vars = ["--g-root-top", "--g-root-left", "--g-root-right"];
        const strip = (body) => {
            for (const c of classes) if (body.classList.contains(c)) body.classList.remove(c);
            for (const v of vars) if (body.style.getPropertyValue(v)) body.style.removeProperty(v);
        };
        const watched = new Map(); // popout body → its observer
        const watch = (doc) => {
            const body = doc?.body;
            if (!body || body === document.body || watched.has(body)) return;
            strip(body);
            const observer = new doc.defaultView.MutationObserver(() => strip(body));
            observer.observe(body, { attributes: true, attributeFilter: ["class", "style"] });
            watched.set(body, observer);
            // its tab rows get the glass pill too (updateThumbs)
            this.registerDomEvent(doc.defaultView, "resize", () => this.scheduleThumbs());
            this.scheduleThumbs();
        };
        const { workspace } = this.app;
        workspace.floatingSplit?.children?.forEach((w) => watch(w.doc ?? w.containerEl?.doc));
        this.registerEvent(workspace.on("window-open", (w) => watch(w.doc ?? w.win?.document)));
        this.registerEvent(workspace.on("window-close", (w) => {
            const body = (w.doc ?? w.win?.document)?.body;
            watched.get(body)?.disconnect();
            watched.delete(body);
        }));
        this.register(() => watched.forEach((o) => o.disconnect()));
    }

    onunload() {
        document.body.removeClass(OPEN_CLASS);
        document.body.removeClass(FOLDER_NOTES_CLASS);
        this.folderNoteStyle?.remove();
        document.body.style.removeProperty("--g-bg-url");
        const ribbon = this.getRibbon();
        if (ribbon) this.clearInline(ribbon);
    }

    updateBackground() {
        const body = document.body;
        const raw = getComputedStyle(body).getPropertyValue("--g-bg-image").trim()
            .replace(/^(["'])(.*)\1$/, "$2")
            .replace(/^!?\[\[([^|\]]+).*\]\]$/, "$1")
            .trim();
        let url = "";
        if (/^[a-z][a-z0-9+.-]+:/i.test(raw)) {
            url = raw;
        } else if (raw) {
            const file = this.app.metadataCache.getFirstLinkpathDest(raw, "")
                ?? this.app.vault.getFileByPath(normalizePath(raw));
            if (file) url = this.app.vault.getResourcePath(file);
        }
        if (url) body.style.setProperty("--g-bg-url", `url("${url.replace(/"/g, "%22")}")`);
        else body.style.removeProperty("--g-bg-url");
    }

    // ---- Background image pickers ----

    setupBackgroundPickers() {
        this.addSettingTab(new GoguryeoSettingTab(this.app, this));
        this.addCommand({
            id: "choose-background-image",
            name: "Choose background image",
            callback: () => this.chooseBackgroundImage(),
        });
        this.addCommand({
            id: "import-background-image",
            name: "Background image from this device",
            callback: () => this.importBackgroundImage(),
        });
        this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
            if (!isImage(file)) return;
            menu.addItem((item) => item.setTitle("Use as background").setIcon("image")
                .onClick(() => this.setBackgroundImage(file)));
        }));
    }

    // The value lives in Style Settings, next to the theme's other options
    getStyleSettings() {
        const manager = this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager;
        if (!manager) new Notice("Goguryeo: turn on the Style Settings plugin to set a background.");
        return manager;
    }

    getBackgroundImage() {
        return this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager
            ?.getSetting("goguryeo", "g-bg-image") || "";
    }

    // A file switches the theme's Background to Image; null clears it
    setBackgroundImage(file) {
        const manager = this.getStyleSettings();
        if (!manager) return;
        if (file) {
            manager.setSetting("goguryeo", "g-bg-image", file.path);
            manager.setSetting("goguryeo", "goguryeo-bg", "goguryeo-bg-image");
        } else {
            manager.clearSetting("goguryeo", "g-bg-image");
            if (manager.getSetting("goguryeo", "goguryeo-bg") === "goguryeo-bg-image") {
                manager.setSetting("goguryeo", "goguryeo-bg", "goguryeo-bg-none");
            }
        }
    }

    chooseBackgroundImage(done) {
        new BackgroundImageModal(this.app, (file) => {
            this.setBackgroundImage(file);
            done?.();
        }).open();
    }

    // Pick a picture from the computer or the phone's photos; it is copied
    // into the attachments folder so every device gets it with the vault
    importBackgroundImage(done) {
        const input = createEl("input", { attr: { type: "file", accept: "image/*" } });
        input.addEventListener("change", async () => {
            const picked = input.files?.[0];
            if (!picked) return;
            const path = await this.app.fileManager.getAvailablePathForAttachment(picked.name);
            const file = await this.app.vault.createBinary(path, await picked.arrayBuffer());
            this.setBackgroundImage(file);
            new Notice(`Background image saved as ${file.path}`);
            done?.();
        });
        input.click();
    }

    patchRibbonIsShown() {
        const ribbon = this.app.workspace.leftRibbon?.containerEl;
        if (!ribbon) return;
        ribbon.isShown = function () {
            return getComputedStyle(this).position !== "fixed" && HTMLElement.prototype.isShown.call(this);
        };
        this.register(() => {
            delete ribbon.isShown;
            this.refreshFrame();
        });
    }

    // On Windows/Linux Obsidian keeps the right sidebar button at the right
    // end of the main tab bar, but puts the left one inside the left sidebar
    // while it is open (and the right one inside the right sidebar too, in
    // full screen and on macOS). With Goguryeo on desktop, keep both in the
    // main tab bar, the left one at its start and the right one at its end,
    // so they mirror each other and never jump. Runs right after each of
    // Obsidian's layout passes, which would move them back.
    patchUpdateFrameless() {
        const workspace = this.app.workspace;
        const original = workspace.updateFrameless;
        if (typeof original !== "function") return;
        const plugin = this;
        workspace.updateFrameless = function (...args) {
            const result = original.apply(this, args);
            plugin.placeSidebarToggles();
            plugin.placeFloatingFrameSpace();
            return result;
        };
        this.register(() => {
            delete workspace.updateFrameless;
            this.refreshFrame();
        });
    }

    placeSidebarToggles() {
        if (!Platform.isDesktopApp || this.app.customCss?.theme !== "Goguryeo") return;
        const { rootSplit, leftSidebarToggleButtonEl: left, rightSidebarToggleButtonEl: right } = this.app.workspace;
        const bars = rootSplit?.containerEl.querySelectorAll(".workspace-tabs.mod-top > .workspace-tab-header-container");
        if (!bars?.length) return;
        // Obsidian animates a copy out of the old spot when it moves a
        // button; drop those copies so only one of each ever shows
        document.querySelectorAll(".sidebar-toggle-button:is(.mod-left, .mod-right):not(.mod-left-split-toggle)").forEach((el) => {
            if (el !== left && el !== right) el.remove();
        });
        const first = bars[0];
        const last = bars[bars.length - 1];
        if (left && first.firstElementChild !== left) first.prepend(left);
        if (right && last.lastElementChild !== right) last.append(right);
    }

    refreshFrame() {
        window.requestAnimationFrame(() => this.app.workspace.updateFrameless?.());
    }

    // ---- Narrow window: sidebars hide, and float over the note when out ----

    // Docked sidebars take their width from the note. When the window can't
    // give the note NOTE_MIN_WIDTH beside both, the right one has no room
    // (the theme styles the body classes), and when even the left one alone
    // is too much, neither has. A sidebar that loses its room hides, and
    // comes back once the window is wide enough again. Meanwhile the window
    // edge brings it out over the note, and so does its button. Only the
    // window and sidebar widths decide, not which sidebars are open, so
    // opening one never makes the other jump.
    setupFloatingSidebars() {
        if (!Platform.isDesktopApp) return;
        this.registerDomEvent(window, "resize", () => this.updateFloatingSidebars());
        for (const name of ["layout-change", "resize", "css-change"]) {
            this.registerEvent(this.app.workspace.on(name, () => this.updateFloatingSidebars()));
        }
        this.registerDomEvent(document, "pointerdown", (e) => this.onFloatingDismiss(e), { capture: true });
        this.register(() => {
            document.body.removeClass(FLOAT_LEFT_CLASS, FLOAT_RIGHT_CLASS);
            this.refreshFrame();
        });
        // Kept across restarts: a wider window next time brings them back.
        // Start as if the window had no room for those, so a wide one does.
        this.autoHidden = { left: false, right: false, ...this.app.loadLocalStorage(AUTO_HIDDEN_KEY) };
        for (const side of ["left", "right"]) document.body.toggleClass(FLOAT_CLASS[side], this.autoHidden[side]);
        this.updateFloatingSidebars();
    }

    updateFloatingSidebars() {
        const { leftSplit, rightSplit } = this.app.workspace;
        const body = document.body;
        // Decided again only when the window's width changes, so dragging a
        // sidebar wider never hides it
        let left = body.hasClass(FLOAT_LEFT_CLASS), right = body.hasClass(FLOAT_RIGHT_CLASS);
        const width = this.app.customCss?.theme === "Goguryeo" && !Platform.isMobile ? window.innerWidth : 0;
        if (width !== this.windowWidth) {
            this.windowWidth = width;
            const room = width - NOTE_MIN_WIDTH;
            left = width > 0 && leftSplit.size > room;
            right = width > 0 && leftSplit.size + rightSplit.size > room;
        }
        // When both float, they work like the iPad's drawers: opening one
        // closes the other. A peeking sidebar floats too.
        const was = this.sidebarsOpen;
        const open = { left: !leftSplit.collapsed, right: !rightSplit.collapsed };
        this.sidebarsOpen = open;
        const floats = (side, byWidth) => byWidth || body.hasClass(PEEK_CLASS[side]);
        if (floats("left", left) && floats("right", right) && was && open.left && open.right) {
            if (!was.left) this.closeSidebar("right");
            else if (!was.right) this.closeSidebar("left");
        }
        // A peeking sidebar closed some other way (a command, a click in the
        // note) stops peeking once it has slid shut
        for (const side of ["left", "right"]) {
            if (!open[side] && body.hasClass(PEEK_CLASS[side])) this.endPeek(side);
        }
        const narrow = { left, right };
        const changed = ["left", "right"].filter((side) => body.hasClass(FLOAT_CLASS[side]) !== narrow[side]);
        if (!changed.length) return;
        body.toggleClass(FLOAT_LEFT_CLASS, left);
        body.toggleClass(FLOAT_RIGHT_CLASS, right);
        for (const side of changed) this.autoHide(side, narrow[side]);
        this.refreshFrame(); // the note now reaches a top corner, or no longer does
    }

    // The window lost the room for this sidebar: hide it rather than cover
    // the note with it. Room again: bring back the one it hid, docked.
    autoHide(side, narrow) {
        const split = this.split(side);
        const peeking = document.body.hasClass(PEEK_CLASS[side]);
        if (narrow) {
            if (split.collapsed || peeking) return;
            this.autoHidden[side] = true;
            split.collapse();
        } else {
            if (!this.autoHidden[side]) return;
            this.autoHidden[side] = false;
            if (peeking) { // already out: it stays, docked now
                this.stopWaitingPeek(side);
                window.cancelAnimationFrame(this.peekFrames[side]);
                document.body.removeClass(PEEK_CLASS[side]);
            }
            if (split.collapsed) split.expand();
        }
        this.app.saveLocalStorage(AUTO_HIDDEN_KEY, this.autoHidden);
    }

    isFloating(side) {
        return document.body.hasClass(FLOAT_CLASS[side]) || document.body.hasClass(PEEK_CLASS[side]);
    }

    split(side) {
        return side === "left" ? this.app.workspace.leftSplit : this.app.workspace.rightSplit;
    }

    closeSidebar(side) {
        if (document.body.hasClass(PEEK_CLASS[side])) this.endPeek(side);
        else this.split(side).collapse();
    }

    // A click in the note closes the sidebars floating over it
    onFloatingDismiss(e) {
        const { rootSplit } = this.app.workspace;
        if (!rootSplit?.containerEl.contains(e.target) || e.target.closest(".sidebar-toggle-button")) return;
        for (const side of ["left", "right"]) {
            if (this.isFloating(side) && !this.split(side).collapsed) this.closeSidebar(side);
        }
    }

    // Obsidian keeps the room for the window buttons only in the panes that
    // reach a top corner, and a docked sidebar takes the corner from the
    // note. A floating one doesn't, so the note's top pane keeps that room.
    placeFloatingFrameSpace() {
        if (!Platform.isDesktopApp) return;
        const tops = this.app.workspace.rootSplit?.containerEl.querySelectorAll(".workspace-tabs.mod-top");
        if (!tops?.length) return;
        if (this.isFloating("left")) tops[0].addClass("mod-top-left-space");
        if (this.isFloating("right")) tops[tops.length - 1].addClass("mod-top-right-space");
    }

    // ---- Closed sidebars come out at the window edges (theme option) ----

    // Like the hidden ribbon: rest the pointer on the left or right edge and
    // the closed sidebar there opens over the note (the left one with the
    // ribbon beside it); move away and it closes again. It really opens
    // (Obsidian's own expand, so its views draw as usual), marked as peeking
    // so the theme floats it.
    setupSidebarPeek() {
        if (!Platform.isDesktopApp) return;
        this.peekTimers = { left: null, right: null };
        this.peekFrames = { left: 0, right: 0 };
        this.updatePeekZone();
        this.registerEvent(this.app.workspace.on("css-change", () => this.updatePeekZone()));
        this.registerDomEvent(document, "pointermove", (e) => this.onPeekMove(e), { passive: true });
        this.registerDomEvent(document.documentElement, "pointerleave", (e) => this.onPeekMove(e, true));
        this.register(() => {
            for (const side of ["left", "right"]) {
                window.clearTimeout(this.peekTimers[side]?.id);
                window.cancelAnimationFrame(this.peekFrames[side]);
                document.body.removeClass(PEEK_CLASS[side]);
            }
        });
    }

    // The theme's "Edge reveal zone", shared with the ribbon
    updatePeekZone() {
        this.peekZone = parseFloat(getComputedStyle(document.body).getPropertyValue("--g-ribbon-hotzone")) || 12;
    }

    // With the theme's option on, or for a sidebar the window has no room for
    peekEnabled(side) {
        const body = document.body;
        return (body.hasClass(PEEK_OPTION_CLASS) || body.hasClass(FLOAT_CLASS[side])) && !Platform.isMobile
            && this.app.customCss?.theme === "Goguryeo";
    }

    // Runs `fn` after `ms`, unless the same kind of wait is already running
    waitPeek(side, kind, ms, fn) {
        if (this.peekTimers[side]?.kind === kind) return;
        window.clearTimeout(this.peekTimers[side]?.id);
        const id = window.setTimeout(() => {
            this.peekTimers[side] = null;
            fn();
        }, ms);
        this.peekTimers[side] = { kind, id };
    }

    stopWaitingPeek(side) {
        window.clearTimeout(this.peekTimers[side]?.id);
        this.peekTimers[side] = null;
    }

    onPeekMove(e, left) {
        if (e.pointerType === "touch") return;
        const busy = document.querySelector(".modal-container, .menu");
        for (const side of ["left", "right"]) {
            const split = this.split(side);
            if (document.body.hasClass(PEEK_CLASS[side])) {
                if (split.collapsed) continue; // already closing
                // A menu opened from it (a file's right-click menu) keeps it out too
                if ((!left && this.nearPeek(side, e)) || busy || this.holdsPeek(split)) this.stopWaitingPeek(side);
                else this.waitPeek(side, "leave", PEEK_LEAVE_MS, () => this.endPeek(side));
            } else if (!left && !busy && e.buttons === 0 && split.collapsed && this.peekEnabled(side) && this.atEdge(side, e)) {
                this.waitPeek(side, "open", PEEK_DWELL_MS, () => this.startPeek(side));
            } else {
                this.stopWaitingPeek(side);
            }
        }
    }

    atEdge(side, e) {
        if (e.clientY < PEEK_TOP) return false;
        return side === "left" ? e.clientX <= this.peekZone : e.clientX >= window.innerWidth - this.peekZone;
    }

    // Over the sidebar, the ribbon beside it, or the edge strip
    nearPeek(side, e) {
        const r = this.split(side).containerEl.getBoundingClientRect();
        return side === "left"
            ? e.clientX <= Math.max(r.right, this.peekZone) + PEEK_REACH
            : e.clientX >= Math.min(r.left, window.innerWidth - this.peekZone) - PEEK_REACH;
    }

    // Typing in the sidebar (its search, a rename) keeps it out until a
    // click elsewhere
    holdsPeek(split) {
        const active = document.activeElement;
        return split.containerEl.contains(active) && active.matches("input, textarea, [contenteditable='true']");
    }

    startPeek(side) {
        const split = this.split(side);
        if (!split.collapsed || !this.peekEnabled(side)) return;
        window.cancelAnimationFrame(this.peekFrames[side]);
        document.body.addClass(PEEK_CLASS[side]);
        split.expand();
    }

    // Closes it, and stops floating it only once it has slid shut, or the
    // note would jump while it closes
    endPeek(side) {
        const split = this.split(side);
        this.stopWaitingPeek(side);
        if (!split.collapsed) split.collapse();
        window.cancelAnimationFrame(this.peekFrames[side]);
        const started = performance.now();
        const settle = () => {
            const shut = split.containerEl.style.display === "none";
            // Opened again with ◧ meanwhile: it's a normal sidebar now
            if (shut || !split.collapsed || performance.now() - started > 1000) {
                document.body.removeClass(PEEK_CLASS[side]);
                this.refreshFrame();
            } else {
                this.peekFrames[side] = window.requestAnimationFrame(settle);
            }
        };
        this.peekFrames[side] = window.requestAnimationFrame(settle);
    }

    // ---- Full screen: the top rows hide, the top edge brings them back ----

    // In full screen (F11; Obsidian puts is-fullscreen on body) with the
    // theme's option on, the path row and the tab row slide up out of
    // sight (goguryeo-top-hidden). Rest the pointer on the top edge over
    // the note area and they slide back over the note (goguryeo-top-peek),
    // like a closed sidebar; move below them and they go again. A menu or
    // modal opened from them keeps them out.
    setupTopPeek() {
        if (!Platform.isDesktopApp) return;
        this.topTimer = null;
        const observer = new MutationObserver(() => this.updateTopHidden());
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        this.register(() => {
            observer.disconnect();
            this.waitTop(null);
            document.body.removeClass(TOP_HIDDEN_CLASS, TOP_PEEK_CLASS);
        });
        this.registerDomEvent(document, "pointermove", (e) => this.onTopMove(e), { passive: true });
        this.registerDomEvent(document.documentElement, "pointerleave", (e) => this.onTopMove(e, true));
        this.updateTopHidden();
    }

    updateTopHidden() {
        const body = document.body;
        const on = body.hasClass("is-fullscreen") && body.hasClass(TOP_OPTION_CLASS) && !body.hasClass("goguryeo-no-cards")
            && !Platform.isMobile && this.app.customCss?.theme === "Goguryeo";
        if (body.hasClass(TOP_HIDDEN_CLASS) === on) return;
        body.toggleClass(TOP_HIDDEN_CLASS, on);
        if (!on) {
            this.waitTop(null);
            body.removeClass(TOP_PEEK_CLASS);
        }
        this.scheduleThumbs?.();
    }

    // Runs `fn` after `ms` unless the same kind of wait is running; null stops it
    waitTop(kind, ms, fn) {
        if (kind && this.topTimer?.kind === kind) return;
        window.clearTimeout(this.topTimer?.id);
        this.topTimer = null;
        if (!kind) return;
        const id = window.setTimeout(() => {
            this.topTimer = null;
            fn();
        }, ms);
        this.topTimer = { kind, id };
    }

    onTopMove(e, left) {
        const body = document.body;
        if (!body.hasClass(TOP_HIDDEN_CLASS) || e.pointerType === "touch") return;
        const busy = document.querySelector(".modal-container, .menu");
        if (body.hasClass(TOP_PEEK_CLASS)) {
            if ((!left && e.clientY <= this.topRowsBottom() + PEEK_REACH) || busy || this.holdsTop()) this.waitTop(null);
            else this.waitTop("leave", PEEK_LEAVE_MS, () => body.removeClass(TOP_PEEK_CLASS));
        } else if (!left && !busy && e.buttons === 0 && e.clientY <= (this.peekZone || 12) && this.overNoteArea(e.clientX)) {
            this.waitTop("open", PEEK_DWELL_MS, () => {
                if (body.hasClass(TOP_HIDDEN_CLASS)) body.addClass(TOP_PEEK_CLASS);
            });
        } else {
            this.waitTop(null);
        }
    }

    // The lowest edge of the rows on screen (at least the row height's worth)
    topRowsBottom() {
        let bottom = 90;
        const rows = document.querySelectorAll(
            ".mod-root .workspace-leaf-content > .view-header, .goguryeo-shared-tabs-bar, .mod-root .workspace-tabs > .workspace-tab-header-container",
        );
        for (const el of rows) {
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.bottom > 0 && r.bottom < window.innerHeight / 2) bottom = Math.max(bottom, r.bottom);
        }
        return bottom;
    }

    // Over the note area, not a sidebar
    overNoteArea(x) {
        const r = this.app.workspace.rootSplit?.containerEl.getBoundingClientRect();
        return !r || (x >= r.left && x <= r.right);
    }

    // Typing in the rows (a rename in the path) keeps them out
    holdsTop() {
        const active = document.activeElement;
        return !!active?.closest?.(".mod-root .view-header, .goguryeo-shared-tabs-bar")
            && active.matches("input, textarea, [contenteditable='true']");
    }

    // ---- iPhone: a right sidebar button (Obsidian has none on phones) ----

    // ---- iPhone: one bar at the bottom ----

    // ( ‹ ) ( folder › name ) ( ⋯ ): the theme hides the top row and draws
    // the capsule over Obsidian's tabs button; the plugin gives the capsule
    // its gestures and turns Obsidian's ≡ into ⋯, one menu holding what the
    // top row had.
    setupPhoneBar() {
        if (!Platform.isPhone) return;
        this.setupNameCapsule();
        this.setupNameGestures();
        this.setupPhoneMenu();
    }

    setupPhoneMenu() {
        const iconEl = () => document.querySelector(".mobile-navbar-action-menu > .clickable-icon");
        const paint = () => {
            const el = iconEl();
            if (el && !el.querySelector(".lucide-more-horizontal")) setIcon(el, "more-horizontal");
        };
        paint();
        this.phoneMenu = null;
        this.registerEvent(this.app.workspace.on("layout-change", paint));
        this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
            paint();
            this.closePhoneMenu();
        }));
        this.register(() => {
            const el = iconEl();
            if (el) setIcon(el, "menu");
            this.closePhoneMenu(true);
        });
        // A long press still opens Obsidian's own menu (its contextmenu)
        this.registerDomEvent(document, "click", (e) => {
            const action = e.target.closest?.(".mobile-navbar-action-menu");
            if (!action) return;
            // stopPropagation, not stopImmediatePropagation: Obsidian's own
            // handler (on the button) never runs, the haptics one (also on
            // document) still does, whichever was registered first
            e.preventDefault();
            e.stopPropagation();
            if (this.phoneMenu) this.closePhoneMenu();
            else this.openPhoneMenu();
        }, { capture: true });
        this.registerDomEvent(document, "keydown", (e) => {
            if (e.key === "Escape" && this.phoneMenu) this.closePhoneMenu();
        }, { capture: true });
    }

    // Design G's ⋯ panel (canvas: "G · ⋯ open" / "scrolled down"): a glass
    // panel the width of the bar, above it (the page dims a little behind).
    // On top five tiles, ◧ ⧉ ⌕ 📖 ◨ (left sidebar, all tabs, find in note, reading
    // view / edit, right sidebar). Below, in two columns and scrolling:
    // Obsidian's own ≡ menu unfolded (the ribbon's items), then the note's
    // options unfolded (the hidden top row's plugin actions, then the menu
    // Obsidian's own ⋯ would open, built but never shown). Every control is
    // a <button>, so each tap ticks (setupHaptics).
    openPhoneMenu() {
        const ws = this.app.workspace;
        const leaf = ws.getMostRecentLeaf(ws.rootSplit);
        const view = leaf?.view;
        const bg = document.body.createDiv("goguryeo-phone-menu-bg");
        const panel = document.body.createDiv({ cls: "goguryeo-phone-menu", attr: { role: "menu", "aria-label": "More" } });
        this.phoneMenu = { bg, panel };
        document.body.addClass("goguryeo-phone-menu-open");
        bg.addEventListener("click", () => this.closePhoneMenu());
        // Close first; the action runs once the panel is gone (another menu
        // or sheet may open from it). The tap already ticked, so a hidden
        // top-row button clicked for it doesn't tick again.
        const run = (fn) => () => {
            this.closePhoneMenu();
            window.setTimeout(() => {
                const before = this.suppressClickUntil;
                this.suppressClickUntil = Date.now() + 1000;
                try {
                    fn();
                } finally {
                    this.suppressClickUntil = before;
                }
            }, 0);
        };
        const click = () => new MouseEvent("click");

        const row = panel.createDiv("goguryeo-phone-menu-row");
        const tile = (icon, label, fn) => {
            const b = row.createEl("button", { cls: "goguryeo-phone-menu-tile", attr: { "aria-label": label } });
            setIcon(b, icon);
            b.addEventListener("click", run(fn));
        };
        tile("panel-left", "Left sidebar", () => ws.leftSplit.toggle());
        tile("copy", "All tabs", () => this.app.mobileTabSwitcher?.show());
        // Find in this note (the capsule already opens the quick switcher)
        tile("text-search", "Find", () => this.app.commands.executeCommandById("editor:open-search"));
        const mode = view?.modeButtonEl;
        if (mode) {
            const reading = view.getMode?.() === "preview";
            tile(reading ? "pencil" : "book-open", reading ? "Edit" : "Reading view", () => mode.click());
        }
        tile("panel-right", "Right sidebar", () => ws.rightSplit.toggle());

        const section = (title) => {
            panel.createDiv({ cls: "goguryeo-phone-menu-section", text: title });
            return panel.createDiv("goguryeo-phone-menu-grid");
        };
        // icon: an icon id, or a menu item's icon element (copied)
        const item = (grid, icon, label, fn, { warning = false, disabled = false, checked = false } = {}) => {
            const b = grid.createEl("button", { cls: "goguryeo-phone-menu-item", attr: { role: "menuitem" } });
            b.toggleClass("is-warning", warning);
            b.toggleClass("is-checked", checked);
            const i = b.createSpan("goguryeo-phone-menu-icon");
            if (typeof icon === "string") setIcon(i, icon);
            else if (icon) i.append(...[...icon.childNodes].map((n) => n.cloneNode(true)));
            b.createSpan({ cls: "goguryeo-phone-menu-label", text: label });
            if (disabled) b.disabled = true;
            else b.addEventListener("click", run(fn));
        };

        const ribbon = (ws.leftRibbon?.items ?? []).filter((r) => !r.hidden && typeof r.callback === "function");
        if (ribbon.length) {
            const grid = section("Obsidian");
            for (const r of ribbon) item(grid, r.icon, r.title, () => r.callback(click()));
        }

        if (view) {
            const grid = section(view.getDisplayText?.() || "Note");
            const seen = new Set();
            const actions = view.containerEl.querySelectorAll(":scope > .view-header .view-actions > .view-action");
            for (const button of actions) {
                if (button === mode || button === view.moreOptionsButtonEl) continue;
                const label = (button.getAttribute("aria-label") ?? "").split("\n")[0];
                const icon = [...(button.querySelector("svg")?.classList ?? [])].find((c) => c.startsWith("lucide-"));
                seen.add(label);
                item(grid, icon, label, () => button.click());
            }
            for (const entry of this.noteMenuItems(view)) {
                if (seen.has(entry.title)) continue;
                seen.add(entry.title);
                item(grid, entry.iconEl, entry.title, () => entry.run(click()), entry);
            }
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        panel.animate(
            [{ opacity: 0, transform: "translateY(16px) scale(0.96)" }, { opacity: 1, transform: "none" }],
            { duration: 280, easing: "cubic-bezier(0.3, 1.3, 0.4, 1)" },
        );
        bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    }

    // The items of the menu Obsidian's own ⋯ (more options) opens, built the
    // same way (its sections, onPaneMenu, onMoreOptionsMenu, then "leaf-menu"
    // for plugins) but never shown: each as { title, iconEl, warning,
    // disabled, checked, run }, in section order, submenus laid flat
    noteMenuItems(view) {
        const order = ["close", "pane", "open", "action", "find", "info", "info.copy", "view", "view.linked", "system", "", "danger"];
        const menu = new Menu();
        try {
            menu.addSections?.(order);
            view.onPaneMenu?.(menu, "more-options");
            view.onMoreOptionsMenu?.(menu);
            this.app.workspace.trigger("leaf-menu", menu, view.leaf);
        } catch (e) {
            console.error("Goguryeo: couldn't build the note menu", e);
        }
        const rank = (s) => {
            const i = order.indexOf(s ?? "");
            return i < 0 ? order.indexOf("") : i;
        };
        const flat = [];
        const walk = (items, section) => {
            for (const it of items ?? []) {
                if (!it?.dom || it.dom.hasClass?.("is-label")) continue;
                if (it.submenu?.items?.length) {
                    walk(it.submenu.items, it.section ?? section);
                    continue;
                }
                flat.push({ it, section: it.section || section });
            }
        };
        walk(menu.items, "");
        // Obsidian shows these two sections as submenus; laid flat, their
        // short titles ("as Obsidian URL") get the submenu's name in front,
        // in Obsidian's own language
        const tr = (key, fallback) => {
            const text = window.i18next?.t?.(key);
            return text && text !== key ? text : fallback;
        };
        const prefix = {
            "info.copy": tr("interface.menu.copy-path", "Copy path"),
            "view.linked": tr("interface.menu.open-linked-view", "Open linked view"),
        };
        return flat
            .map((e, i) => ({ ...e, i }))
            .sort((a, b) => rank(a.section) - rank(b.section) || a.i - b.i)
            .map(({ it, section }) => ({
                title: [prefix[section], it.titleEl?.textContent?.trim() || it.dom.textContent.trim()].filter(Boolean).join(" · "),
                iconEl: it.iconEl,
                warning: it.dom.hasClass("is-warning") || section === "danger",
                disabled: !!it.disabled || it.dom.hasClass("is-disabled"),
                checked: !!it.checked,
                run: (evt) => (it.callback ? it.callback(evt) : it.handleEvent?.(evt)),
            }))
            .filter((e) => e.title);
    }

    closePhoneMenu(now = false) {
        const menu = this.phoneMenu;
        if (!menu) return;
        this.phoneMenu = null;
        document.body.removeClass("goguryeo-phone-menu-open");
        const remove = () => {
            menu.bg.remove();
            menu.panel.remove();
        };
        if (now || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            remove();
            return;
        }
        menu.bg.style.pointerEvents = menu.panel.style.pointerEvents = "none";
        menu.bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: "ease-in", fill: "forwards" });
        menu.panel.animate(
            [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.92)" }],
            { duration: 150, easing: "ease-in", fill: "forwards" },
        ).finished.then(remove, remove);
    }

    // ---- Folder notes ----

    // A note named like its folder and kept inside it (Novel/Novel.md) is the
    // folder's note, the same files the Folder notes plugin uses, so existing
    // ones keep working. In the file list a click on the folder's name opens
    // its note (Ctrl/Cmd + click: in a new tab) and opens the folder too; the
    // arrow still folds it. The note's own row is hidden, and while it's open
    // the folder row shows as the current one. In the path a folder with a
    // note is a link to it (has-folder-note, which the iPhone capsule reads).
    // Renaming a folder renames its note. Right click: a folder makes or opens
    // its note, a note turns into a folder note (a folder of its name made
    // around it). It all stays off while the Folder notes plugin is on.
    setupFolderNotes() {
        this.folderNoteSettings = { enabled: true };
        this.folderNotePaths = new Set(); // paths of every folder note
        this.folderNoteStyle = document.head.createEl("style", { attr: { id: "goguryeo-folder-notes" } });
        this.app.workspace.onLayoutReady(async () => {
            this.folderNoteSettings = { enabled: true, ...(await this.loadData()) };
            this.refreshFolderNotes();
            const later = () => this.scheduleFolderNotes();
            this.registerEvent(this.app.vault.on("create", later));
            this.registerEvent(this.app.vault.on("delete", later));
            this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
                this.followFolderRename(file, oldPath);
                later();
            }));
            for (const name of ["file-open", "layout-change", "active-leaf-change"]) {
                this.registerEvent(this.app.workspace.on(name, () => this.scheduleCrumbs()));
            }
            // Turning the Folder notes plugin on or off
            for (const name of ["enablePlugin", "disablePlugin"]) {
                const plugins = this.app.plugins;
                const original = plugins[name];
                if (typeof original !== "function") continue;
                plugins[name] = function (...args) {
                    const result = original.apply(this, args);
                    Promise.resolve(result).then(later, later);
                    return result;
                };
                this.register(() => { if (plugins[name] !== original) plugins[name] = original; });
            }
        });

        this.registerDomEvent(document, "click", (e) => this.onFolderClick(e), { capture: true });

        this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
            if (!this.folderNotesOn()) return;
            if (file instanceof TFolder && !file.isRoot()) {
                const note = this.folderNoteOf(file.path);
                if (note) {
                    menu.addItem((item) => item.setTitle("Open folder note").setIcon("file-text")
                        .setSection("open").onClick(() => this.openFolderNote(note)));
                } else {
                    menu.addItem((item) => item.setTitle("Create folder note").setIcon("file-plus")
                        .setSection("action").onClick(() => this.createFolderNote(file)));
                }
            } else if (file instanceof TFile && !this.isFolderNote(file)) {
                menu.addItem((item) => item.setTitle("Turn into folder note").setIcon("folder-input")
                    .setSection("action").onClick(() => this.turnIntoFolderNote(file)));
            }
        }));
    }

    otherFolderNotesOn() {
        return !!this.app.plugins.enabledPlugins?.has(FOLDER_NOTES_PLUGIN);
    }

    folderNotesOn() {
        return !!this.folderNoteSettings?.enabled && !this.otherFolderNotesOn();
    }

    folderNotePath(folder) {
        return normalizePath(`${folder.path}/${folder.name}.md`);
    }

    // A file's name without its extensions: Novel.md, Novel.canvas,
    // Novel.base and Novel.excalidraw.md are all "Novel"
    folderNoteName(file) {
        return file.basename.replace(/\.excalidraw$/i, "");
    }

    // The note of a folder (or of the folder at this path), if it has one: a
    // file inside it named like it, any extension (the Folder notes plugin
    // allows md, canvas, base, excalidraw...). If several, a plain .md first,
    // then canvas, then base, then the rest.
    folderNoteOf(folder) {
        if (typeof folder === "string") folder = this.app.vault.getAbstractFileByPath(folder);
        if (!(folder instanceof TFolder) || folder.isRoot()) return null;
        const rank = (f) => {
            const i = ["md", "canvas", "base"].indexOf(f.extension.toLowerCase());
            return (i < 0 ? 3 : i) + (f.basename === folder.name ? 0 : 0.5);
        };
        let best = null;
        for (const f of folder.children) {
            if (!(f instanceof TFile) || this.folderNoteName(f) !== folder.name) continue;
            if (!best || rank(f) < rank(best)) best = f;
        }
        return best;
    }

    isFolderNote(file) {
        return file instanceof TFile && !!file.parent && this.folderNoteOf(file.parent) === file;
    }

    folderNoteStatus() {
        const rows = [...document.querySelectorAll(".nav-files-container .nav-file-title")]
            .filter((r) => this.folderNotePaths?.has(r.dataset.path));
        const hidden = rows.filter((r) => !r.offsetParent || r.getBoundingClientRect().height === 0).length;
        return {
            on: this.folderNotesOn(),
            found: this.folderNotePaths?.size ?? 0,
            folders: document.querySelectorAll(".nav-files-container .nav-folder-title").length,
            hidden,
            visible: rows.length - hidden,
            error: this.folderNoteError ?? "",
        };
    }

    scheduleFolderNotes() {
        clearTimeout(this.folderNoteTimer);
        this.folderNoteTimer = window.setTimeout(() => this.refreshFolderNotes(), 50);
    }

    // The file list is redrawn often, so the marks are CSS rules by path,
    // not classes on its rows
    refreshFolderNotes() {
        try {
            this.folderNoteError = "";
            this.drawFolderNotes();
        } catch (err) {
            this.folderNoteError = String(err?.message ?? err);
            console.error("Goguryeo folder notes", err);
        }
    }

    drawFolderNotes() {
        const on = this.folderNotesOn();
        document.body.toggleClass(FOLDER_NOTES_CLASS, on);
        this.folderNotePaths = new Set();
        if (on) {
            for (const f of this.app.vault.getAllLoadedFiles()) {
                const note = f instanceof TFolder && this.folderNoteOf(f);
                if (note) this.folderNotePaths.add(note.path);
            }
        }
        const q = (p) => `[data-path="${CSS.escape(p)}"]`;
        const notes = [...this.folderNotePaths];
        const list = ".nav-files-container";
        this.folderNoteStyle.textContent = notes.length ? [
            notes.map((p) => `${list} .tree-item.nav-file:has(> .nav-file-title${q(p)})`).join(",\n") + " { display: none; }",
            // the folder's name: a link to its note
            notes.map((p) => `${list} .nav-folder-title${q(p.slice(0, p.lastIndexOf("/")))} .nav-folder-title-content`).join(",\n")
                + " { text-decoration: underline; text-decoration-color: var(--text-faint); text-underline-offset: 3px; cursor: pointer; }",
            // and the current row while its note is open
            notes.map((p) => `${list} .nav-folder:has(> .nav-folder-children .nav-file-title.is-active${q(p)}) > .nav-folder-title`).join(",\n")
                + " { background-color: var(--nav-item-background-active); color: var(--nav-item-color-active); font-weight: var(--nav-item-weight-active); }",
        ].join("\n") : "";
        this.markCrumbs();
    }

    scheduleCrumbs() {
        clearTimeout(this.crumbTimer);
        this.crumbTimer = window.setTimeout(() => this.markCrumbs(), 0);
    }

    // The path above a note (its folders, one breadcrumb each, outermost
    // first): a folder with a note is a link, and a folder note's own title
    // says so. The same classes as the Folder notes plugin's, which the theme
    // already styles.
    markCrumbs() {
        if (this.otherFolderNotesOn()) return; // its own marks
        const on = this.folderNotesOn();
        this.app.workspace.iterateAllLeaves((leaf) => {
            const view = leaf.view;
            const header = view?.containerEl?.querySelector(":scope > .view-header");
            if (!header) return;
            const crumbs = [...header.querySelectorAll(".view-header-title-parent > .view-header-breadcrumb")];
            const file = view.file;
            const folders = [];
            for (let f = file?.parent; f && !f.isRoot(); f = f.parent) folders.unshift(f);
            const match = on && crumbs.length === folders.length;
            crumbs.forEach((crumb, i) => {
                const folder = match ? folders[i] : null;
                const has = !!folder && !!this.folderNoteOf(folder);
                crumb.toggleClass("has-folder-note", has);
                if (has) crumb.dataset.goguryeoFolder = folder.path;
                else delete crumb.dataset.goguryeoFolder;
            });
            header.querySelector(".view-header-title")
                ?.toggleClass("path-is-folder-note", on && !!file && this.folderNotePaths.has(file.path));
        });
    }

    // A click on a folder's name in the file list opens its note
    onFolderClick(e) {
        if (e.button !== 0 || e.shiftKey || e.altKey || !this.folderNotesOn()) return;
        const title = e.target.closest?.(".nav-files-container .nav-folder-title");
        if (!title || e.target.closest(".collapse-icon, [contenteditable=true], input")) return;
        if (title.closest(".is-being-renamed")) return;
        const note = this.folderNoteOf(title.dataset.path);
        if (!note) return;
        // stopPropagation, not stopImmediatePropagation: the haptics
        // listener on the document still ticks
        e.preventDefault();
        e.stopPropagation();
        this.openFolderNote(note, e);
        // Opens the folder too, never folds it
        const item = this.app.workspace.getLeavesOfType("file-explorer")[0]?.view?.fileItems?.[title.dataset.path];
        if (item?.collapsed && typeof item.setCollapsed === "function") item.setCollapsed(false, true);
        else if (title.parentElement?.hasClass("is-collapsed")) title.querySelector(".collapse-icon")?.click();
    }

    openFolderNote(note, e = null) {
        const leaf = this.app.workspace.getLeaf(e ? Keymap.isModEvent(e) : false);
        leaf.openFile(note);
        if (Platform.isPhone && e?.target?.closest?.(".workspace-drawer")) this.app.workspace.leftSplit?.collapse?.();
    }

    async createFolderNote(folder) {
        const path = this.folderNotePath(folder);
        const note = this.app.vault.getFileByPath(path) ?? await this.app.vault.create(path, "");
        this.openFolderNote(note);
    }

    // Folder/Note.md → Folder/Note/Note.md, links kept (fileManager)
    async turnIntoFolderNote(file) {
        const parent = file.parent?.isRoot() ? "" : `${file.parent.path}/`;
        const folderPath = normalizePath(`${parent}${this.folderNoteName(file)}`);
        const target = normalizePath(`${folderPath}/${file.name}`);
        if (this.app.vault.getAbstractFileByPath(target)) {
            new Notice(`"${target}" already exists.`);
            return;
        }
        const existing = this.app.vault.getAbstractFileByPath(folderPath);
        if (existing && !(existing instanceof TFolder)) {
            new Notice(`"${folderPath}" already exists.`);
            return;
        }
        if (!existing) await this.app.vault.createFolder(folderPath);
        await this.app.fileManager.renameFile(file, target);
    }

    // A renamed folder takes its note's name along (links kept)
    followFolderRename(file, oldPath) {
        if (!this.folderNotesOn() || !(file instanceof TFolder)) return;
        const oldName = oldPath.slice(oldPath.lastIndexOf("/") + 1);
        if (oldName === file.name) return; // only moved
        // the note under its old name, any extension; it keeps its extension
        const note = file.children.find((f) => f instanceof TFile && this.folderNoteName(f) === oldName);
        if (!note) return;
        const target = normalizePath(`${file.path}/${note.name.replace(oldName, file.name)}`);
        if (this.app.vault.getAbstractFileByPath(target)) return;
        // after Obsidian has finished moving the folder's files
        window.setTimeout(() => {
            if (note.parent === file && !this.app.vault.getAbstractFileByPath(target)) {
                this.app.fileManager.renameFile(note, target);
            }
        }, 0);
    }

    // ---- The path capsule opens the quick switcher ----

    // Like a browser's address bar: tapping the path (row 1 on desktop and
    // iPad, the folder in the bottom capsule on iPhone) opens Ctrl+O instead of
    // renaming the note or revealing a folder; only a folder that has a
    // folder note opens that note. On a phone a tap on the note's name
    // in the capsule opens it too, with the path filled in. However it opens
    // (the tap, Ctrl+O, the command palette), on desktop and iPad the search
    // field opens in the capsule and the list drops down right below it; on
    // iPhone it stays Obsidian's own sheet, its field already at the bottom.
    setupPathSwitcher() {
        const path = Platform.isPhone
            ? ".mod-root .view-header-title-parent"
            : ".mod-root .view-header-title-container";
        this.registerDomEvent(document, "click", (e) => {
            if (!e.target.closest?.(path)) return;
            // The web viewer turns the capsule into its own address field:
            // a click there edits the web address
            if (e.target.closest(".webviewer-address-container")) return;
            // A folder with a folder note is a link: it opens the note (ours,
            // or the Folder notes plugin's, which marks it and opens it itself)
            const crumb = e.target.closest(".view-header-breadcrumb.has-folder-note");
            if (crumb) {
                this.haptic();
                const note = this.folderNotesOn() && this.folderNoteOf(crumb.dataset.goguryeoFolder);
                if (note) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.openFolderNote(note, e);
                }
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            this.haptic();
            this.app.commands.executeCommandById("switcher:open");
        }, { capture: true });

        // Phone: the capsule sits over Obsidian's tabs button (the bar is a
        // layer above the note), so a tap on it would open all tabs. Like on
        // desktop, it opens the quick switcher holding the note's path, all
        // selected; a folder with a folder note still opens that note. A drag
        // on the pill still swallows its click (and drag up = all tabs).
        if (Platform.isPhone) this.registerDomEvent(document, "click", (e) => {
            if (Date.now() <= (this.suppressClickUntil ?? 0)) return;
            if (!e.target.closest?.(".mobile-navbar-action-tabs")) return;
            if (!this.capsuleAt(e.clientX, e.clientY)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            const folder = this.capsuleFolderAt(e.clientX, e.clientY);
            if (folder?.matches(".has-folder-note")) {
                folder.click(); // ticks in the handler above
                return;
            }
            this.haptic();
            this.app.commands.executeCommandById("switcher:open");
        }, { capture: true });

        this.app.workspace.onLayoutReady(() => {
            const command = this.app.commands.commands["switcher:open"];
            const callback = command?.callback;
            if (!callback) return;
            command.callback = (...args) => {
                const from = this.pathCapsule();
                const file = this.app.workspace.getActiveFile();
                const result = callback.apply(command, args);
                if (from) this.dockSwitcher(from);
                if (from || Platform.isPhone) this.prefillSwitcher(file);
                return result;
            };
            this.register(() => { command.callback = callback; });
        });
    }

    // Phone: the bottom capsule, if (x, y) is over it
    capsuleAt(x, y) {
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const el = leaf?.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container");
        const r = el?.getBoundingClientRect();
        return r && r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? el : null;
    }

    // iPhone: the folder shown in the capsule, if (x, y) is over it
    capsuleFolderAt(x, y) {
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const header = leaf?.view?.containerEl.querySelector(":scope > .view-header");
        const capsule = header?.querySelector(".view-header-title-container")?.getBoundingClientRect();
        if (!capsule || y < capsule.top || y > capsule.bottom) return null;
        const crumb = [...header.querySelectorAll(".view-header-title-parent > .view-header-breadcrumb")]
            .find((c) => c.offsetWidth > 0);
        const r = crumb?.getBoundingClientRect();
        return r && x >= r.left - 4 && x <= r.right + 4 ? crumb : null;
    }

    // Like a browser's address bar, the field opens holding the note's path,
    // all selected: typing replaces it, an arrow key keeps it to edit
    prefillSwitcher(file) {
        const input = [...document.querySelectorAll(".modal-container .prompt-input")].pop();
        if (!file || !input) return;
        input.value = file.extension === "md" ? file.path.slice(0, -3) : file.path;
        input.dispatchEvent(new Event("input"));
        input.setSelectionRange(0, input.value.length);
    }

    // The current note's path capsule, while it's on screen
    pathCapsule() {
        if (Platform.isPhone) return null;
        const header = this.app.workspace.getMostRecentLeaf()?.view?.containerEl.querySelector(":scope > .view-header");
        const el = header?.querySelector(".view-header-title-container");
        // A web page's capsule is its address field, not a path
        if (el?.matches(".webviewer-address-container")) return null;
        const rect = el?.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0) return null;
        // A pill's 999px would make the dropped-down list an oval
        const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, rect.height / 2);
        return { rect, radius: `${radius}px` };
    }

    // Moves the switcher onto the capsule: the theme places it from
    // --g-omni-* (.goguryeo-omnibox), at least OMNI_MIN_WIDTH wide so the
    // list has room. The list then unrolls from the capsule's outline while
    // the dimming fades in.
    dockSwitcher({ rect: c, radius }) {
        const prompt = [...document.querySelectorAll(".modal-container .prompt")].pop();
        const container = prompt?.parentElement;
        if (!container) return;
        const box = container.getBoundingClientRect();
        const room = box.width - OMNI_MARGIN * 2;
        const width = Math.min(Math.max(c.width, OMNI_MIN_WIDTH), room);
        const left = Math.min(Math.max(c.left - box.left, OMNI_MARGIN), box.width - OMNI_MARGIN - width);
        container.addClass(OMNI_CLASS);
        container.style.setProperty("--g-omni-top", `${c.top - box.top}px`);
        container.style.setProperty("--g-omni-left", `${left}px`);
        container.style.setProperty("--g-omni-width", `${width}px`);
        container.style.setProperty("--g-omni-height", `${c.height}px`);
        container.style.setProperty("--g-omni-radius", radius);

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const p = prompt.getBoundingClientRect();
        const start = `inset(0 ${Math.max(0, p.right - c.right)}px ${Math.max(0, p.height - c.height)}px ${Math.max(0, c.left - p.left)}px round ${radius})`;
        const end = parseFloat(getComputedStyle(prompt).borderTopLeftRadius) + SHADOW_ROOM;
        prompt.animate(
            [{ clipPath: start }, { clipPath: `inset(-${SHADOW_ROOM}px round ${end}px)` }],
            { duration: OMNI_MS, easing: OMNI_EASE },
        );
        const dim = container.querySelector(".modal-bg");
        if (dim) dim.animate([{ opacity: 0 }, { opacity: getComputedStyle(dim).opacity }], { duration: OMNI_MS, easing: "ease-out" });
    }

    // ---- Desktop and iPad: the tab overview, Safari style ----

    // ⌄ at the end of the toolbar becomes ⧉ (the theme swaps the icons):
    // a click lays every open tab out as a card holding a still copy of its
    // page, the current one ringed. A card goes to its tab, its × closes it
    // and ＋ opens a new one; Done, Esc, the empty space or ⧉ again closes
    // the sheet. A right click on ⧉ keeps Obsidian's menu (stack, close all).
    setupTabOverview() {
        this.overview = null;
        const button = ".mod-root .workspace-tab-header-tab-list > .clickable-icon";
        const addIcons = () => {
            document.querySelectorAll(button).forEach((el) => {
                if (!el.querySelector(`.${OVERVIEW_ICON_CLASS}`)) setIcon(el.createSpan(OVERVIEW_ICON_CLASS), "copy");
            });
        };
        this.app.workspace.onLayoutReady(addIcons);
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            addIcons();
            if (this.overview) this.renderOverview();
        }));
        this.register(() => {
            this.closeOverview(true);
            document.querySelectorAll(`.${OVERVIEW_ICON_CLASS}`).forEach((el) => el.remove());
        });
        this.registerDomEvent(document, "click", (e) => {
            const icon = e.target.closest?.(button)?.querySelector(`.${OVERVIEW_ICON_CLASS}`);
            if (!icon || getComputedStyle(icon).display === "none") return; // the theme kept ⌄ here
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this.overview) this.closeOverview();
            else this.openOverview();
        }, { capture: true });
        this.registerDomEvent(window, "keydown", (e) => {
            if (!this.overview || e.key !== "Escape") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.closeOverview();
        }, { capture: true });
        this.registerDomEvent(window, "resize", () => this.overview && this.renderOverview());
        this.registerDomEvent(window, "pointermove", (e) => this.onCardMove(e));
        this.registerDomEvent(window, "pointerup", (e) => this.onCardUp(e));
        this.registerDomEvent(window, "pointercancel", (e) => this.onCardUp(e, true));
        // A lifted card keeps the finger: the grid must not scroll under it
        this.registerDomEvent(window, "touchmove", (e) => {
            if (this.overview?.drag?.live) e.preventDefault();
        }, { passive: false });
    }

    openOverview() {
        const sheet = document.body.createDiv(OVERVIEW_CLASS);
        const bar = sheet.createDiv("goguryeo-tab-overview-bar");
        const add = bar.createDiv({ cls: "clickable-icon", attr: { "aria-label": "New tab" } });
        setIcon(add, "lucide-plus");
        add.addEventListener("click", () => {
            const leaf = this.app.workspace.getLeaf("tab");
            this.app.workspace.setActiveLeaf(leaf, { focus: true });
            this.closeOverview();
        });
        bar.createEl("button", { cls: "goguryeo-tab-overview-done", text: "Done" })
            .addEventListener("click", () => this.closeOverview());
        const box = sheet.createDiv("goguryeo-tab-overview-panes");
        sheet.addEventListener("click", (e) => {
            if (e.target === sheet || e.target === box || e.target.classList?.contains("goguryeo-tab-overview-grid")) this.closeOverview();
        });
        this.overview = { sheet, box };
        document.body.addClass(OVERVIEW_CLASS + "-open");
        this.renderOverview();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OVERVIEW_MS, easing: "ease-out" });
        box.animate([{ transform: "scale(1.04)" }, { transform: "none" }], { duration: OVERVIEW_MS * 1.5, easing: OMNI_EASE });
    }

    // The sheet covers the panes from the tab row down, so row 1 (and ⧉ in
    // it) stays. One grid holds the tab row's entries in its order: in split
    // screen the split is one wide card with its pages side by side, and
    // what's on screen is ringed. Each page is drawn at the note's size,
    // then shrunk onto its card, like Safari's previews.
    renderOverview() {
        const o = this.overview;
        const { sheet, box } = o;
        const { workspace } = this.app;
        const rootEl = workspace.rootSplit.containerEl;
        let root = rootEl.getBoundingClientRect();
        const panes = [...rootEl.querySelectorAll(".workspace-tabs")].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0);
        if (panes.length) {
            const left = Math.min(...panes.map((r) => r.left));
            const right = Math.max(...panes.map((r) => r.right));
            const bottom = Math.max(...panes.map((r) => r.bottom));
            root = { left, right, bottom, top: root.top, width: right - left, height: bottom - root.top };
        }
        const row = this.sharedBar?.isConnected ? this.sharedBar : rootEl.querySelector(".workspace-tabs > .workspace-tab-header-container");
        const top = row?.getBoundingClientRect().top ?? root.top;
        sheet.style.left = `${root.left}px`;
        sheet.style.top = `${top}px`;
        sheet.style.width = `${root.width}px`;
        sheet.style.height = `${root.bottom - top}px`;

        const current = workspace.getMostRecentLeaf(workspace.rootSplit);
        const size = current?.view?.containerEl.getBoundingClientRect();
        const pageW = Math.max(320, Math.round(size?.width || root.width));
        const pageH = Math.max(240, Math.round(size?.height || root.height));
        const cardH = Math.min(Math.max(pageH, pageW * 0.55), pageW * 0.85);
        sheet.style.setProperty("--g-page-w", `${pageW}px`);
        sheet.style.setProperty("--g-page-h", `${pageH}px`);
        sheet.style.setProperty("--g-card-ratio", `${pageW} / ${Math.round(cardH)}`);

        const leaves = [];
        workspace.iterateRootLeaves((leaf) => { leaves.push(leaf); }); // a truthy return would stop it
        // Chrome-style split screen: each split's pages make one card, where
        // the first of them stands, as in the tab row
        const bySplit = new Map(); // split → its pages, in layout order
        const entries = [];
        for (const leaf of leaves) {
            const id = this.sharedBar?.isConnected ? this.splitIdOf(leaf) : null;
            if (id == null) {
                entries.push(leaf);
                continue;
            }
            if (!bySplit.has(id)) {
                const list = [];
                list.gSplit = id;
                bySplit.set(id, list);
                entries.push(list);
            }
            bySplit.get(id).push(leaf);
        }
        this.endCardDrag();
        box.empty();
        const grid = o.grid = box.createDiv("goguryeo-tab-overview-grid");
        o.leafOf = new WeakMap(); // card → its leaf (none for the split's card)
        o.shotOf = new WeakMap(); // card → its page copy
        const pages = [];
        const addPage = (thumb, leaf) => {
            let snapshot = null;
            // A split page off screen (its pane folded, or hidden behind the
            // lone tab in its own pane): the copy taken as the split folded,
            // since a hidden page can't tell its scroll position
            const folded = leaf.parent?.containerEl.closest(`.${SOLO_OFF_CLASS}`) || leaf.parent?.children[leaf.parent.currentTab] !== leaf;
            try {
                snapshot = (folded && this.splitShots?.get(leaf)) || this.snapshotPage(leaf, true);
            } catch (e) {
                console.error("Goguryeo: tab preview failed", e);
            }
            const page = this.makeSwipePage(snapshot, { icon: leaf.getIcon?.(), title: leaf.getDisplayText() });
            page.inert = true;
            thumb.appendChild(page);
            pages.push([page, snapshot]);
            return snapshot;
        };
        const go = (leaf) => {
            if (this.overview?.dropped) return; // the click that ends a drag
            this.haptic();
            workspace.setActiveLeaf(leaf, { focus: true });
            this.closeOverview();
        };
        const splitCards = [];
        for (const entry of entries) {
            if (Array.isArray(entry)) {
                // The split: one wide card, a small map of the panes as they
                // are laid out, each page in its pane's place; a page goes
                // to that page, the name row to the focused (or first) one
                const card = grid.createDiv("goguryeo-tab-card is-split");
                splitCards.push(card);
                const onScreen = this.shownSplit === entry.gSplit && !document.body.hasClass(SOLO_CLASS);
                card.toggleClass("is-current", onScreen);
                const thumb = card.createDiv("goguryeo-tab-card-thumb");
                const places = this.splitPlaces(entry.gSplit);
                for (const leaf of entry) {
                    const part = thumb.createDiv("goguryeo-tab-card-part");
                    const [x, y, w, h] = places.get(leaf) ?? [entry.indexOf(leaf) / entry.length, 0, 1 / entry.length, 1];
                    part.gPlace = [x, y, w, h];
                    part.style.left = `${x * 100}%`;
                    part.style.top = `${y * 100}%`;
                    part.style.width = `${w * 100}%`;
                    part.style.height = `${h * 100}%`;
                    part.toggleClass("is-focused", onScreen && leaf === current);
                    addPage(part, leaf);
                    part.addEventListener("click", (e) => {
                        e.stopPropagation();
                        go(leaf);
                    });
                }
                const label = card.createDiv("goguryeo-tab-card-label");
                setIcon(label.createDiv("goguryeo-tab-card-icon"), "lucide-columns-2");
                label.createDiv({ cls: "goguryeo-tab-card-title", text: entry.map((leaf) => leaf.getDisplayText()).join("  ·  ") });
                card.addEventListener("click", () => go(entry.includes(current) ? current : entry[0]));
                continue;
            }
            const leaf = entry;
            const card = grid.createDiv("goguryeo-tab-card");
            o.leafOf.set(card, leaf);
            card.toggleClass("is-current", leaf === current);
            const thumb = card.createDiv("goguryeo-tab-card-thumb");
            o.shotOf.set(card, addPage(thumb, leaf));

            const label = card.createDiv("goguryeo-tab-card-label");
            const close = label.createDiv({ cls: "clickable-icon goguryeo-tab-card-close", attr: { "aria-label": "Close tab" } });
            setIcon(close, "lucide-x");
            setIcon(label.createDiv("goguryeo-tab-card-icon"), leaf.getIcon?.() ?? "lucide-file");
            label.createDiv({ cls: "goguryeo-tab-card-title", text: leaf.getDisplayText() });
            close.addEventListener("click", (e) => {
                e.stopPropagation();
                leaf.detach(); // the layout change redraws the cards
            });
            card.addEventListener("pointerdown", (e) => this.onCardDown(e, card, leaf));
            card.addEventListener("click", () => go(leaf));
        }
        // Card size from the grid's column. The split's card spans two
        // columns and has the panes' area's shape; each page is drawn at its
        // pane's real size and shrunk by the card's own zoom.
        const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean);
        const colW = parseFloat(columns[0]) || 0;
        const scale = colW / pageW;
        sheet.style.setProperty("--g-card-scale", `${scale}`);
        for (const splitCard of splitCards) {
            splitCard.style.gridColumn = `span ${Math.min(2, columns.length)}`;
            const thumb = splitCard.querySelector(".goguryeo-tab-card-thumb");
            // The panes' area: the root, from the top of the cards down
            const shownPane = current?.parent?.containerEl.getBoundingClientRect();
            const rootR = rootEl.getBoundingClientRect();
            const areaW = Math.max(320, rootR.width);
            const areaTop = shownPane && shownPane.height > 0 ? shownPane.top : rootR.top;
            const areaH = Math.max(240, rootR.bottom - areaTop);
            const mapW = thumb.clientWidth;
            const mapScale = mapW / areaW;
            thumb.style.height = `${Math.round(areaH * mapScale)}px`;
            splitCard.style.setProperty("--g-card-scale", `${mapScale}`);
            thumb.querySelectorAll(".goguryeo-tab-card-part").forEach((part) => {
                const [, , w, h] = part.gPlace;
                part.style.setProperty("--g-page-w", `${Math.round(w * areaW)}px`);
                part.style.setProperty("--g-page-h", `${Math.round(h * areaH)}px`);
            });
        }
        for (const [page, snapshot] of pages) this.restoreScrolls(page, snapshot);
    }

    // Drag a card to move its tab: along its pane's run of cards, or among
    // another pane's cards to move it into that pane. A mouse drags as soon as it moves; a finger holds the card
    // first (CARD_HOLD_MS), so a quick swipe still scrolls the group. A
    // copy of the card follows the pointer over the whole sheet, while the
    // card itself stays behind as an empty slot that moves to where it would
    // land; the other cards slide out of its way. The tab moves on the drop.
    onCardDown(e, card, leaf) {
        const o = this.overview;
        if (!o || o.drag || e.button !== 0 || e.target.closest(".goguryeo-tab-card-close")) return;
        const drag = { card, leaf, pane: leaf.parent, id: e.pointerId, x: e.clientX, y: e.clientY, live: false, timer: 0, ghost: null };
        o.drag = drag;
        if (e.pointerType === "touch") drag.timer = window.setTimeout(() => this.liftCard(drag), CARD_HOLD_MS);
    }

    liftCard(drag) {
        const o = this.overview;
        if (o?.drag !== drag) return;
        const r = drag.card.getBoundingClientRect();
        const s = o.sheet.getBoundingClientRect();
        const ghost = drag.card.cloneNode(true);
        ghost.addClass("goguryeo-tab-card-ghost");
        ghost.style.width = `${r.width}px`;
        o.sheet.appendChild(ghost);
        const page = ghost.querySelector(".goguryeo-swipe-page");
        if (page) this.restoreScrolls(page, o.shotOf.get(drag.card));
        drag.live = true;
        drag.ghost = ghost;
        drag.grabX = drag.x - r.left + s.left;
        drag.grabY = drag.y - r.top + s.top;
        this.placeGhost(drag);
        requestAnimationFrame(() => ghost.addClass("is-lifted"));
        drag.card.addClass("is-placeholder");
        this.measureSlots(drag);
        this.haptic();
    }

    placeGhost(drag) {
        drag.ghost.style.left = `${drag.x - drag.grabX}px`;
        drag.ghost.style.top = `${drag.y - drag.grabY}px`;
    }

    onCardMove(e) {
        const drag = this.overview?.drag;
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.live) {
            if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < CARD_SLOP) return;
            if (e.pointerType === "touch") return this.endCardDrag(); // moved before the hold: a scroll
            this.liftCard(drag);
        }
        e.preventDefault();
        drag.x = e.clientX;
        drag.y = e.clientY;
        this.placeGhost(drag);
        const x = e.clientX;
        const y = e.clientY + this.overview.grid.scrollTop - drag.scroll;
        const target = [...drag.slots].find(([, r]) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)?.[0];
        if (!target) return;
        // Among its own pane's cards the card swaps past the one it meets;
        // over another pane's card it joins that pane, before or after the
        // card by the pointer's side
        const pane = this.overview.leafOf.get(target)?.parent;
        if (!pane) return;
        const r = drag.slots.get(target);
        const after = pane === drag.pane
            ? drag.card.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING
            : x > r.left + r.width / 2;
        drag.pane = pane;
        this.moveCard(drag, after ? target.nextSibling : target);
    }

    // Put the dragged card's slot before `before` in `grid`, and slide every
    // card that moved from its old spot to its new one (FLIP)
    moveCard(drag, before) {
        const { grid } = this.overview;
        if (drag.card === before || drag.card.nextSibling === before) return;
        const cards = [...grid.children].filter((el) => el !== drag.card);
        const old = new Map(cards.map((el) => [el, el.getBoundingClientRect()]));
        cards.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
        grid.insertBefore(drag.card, before);
        this.measureSlots(drag);
        for (const [el, was] of old) {
            const now = drag.slots.get(el);
            const dx = was.left - now.left;
            const dy = was.top - now.top;
            if (dx || dy) el.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 260, easing: CARD_EASE });
        }
    }

    // Where the other cards sit once they've landed: hit tests use these, not
    // the cards' sliding positions
    measureSlots(drag) {
        const { grid } = this.overview;
        drag.scroll = grid.scrollTop;
        drag.slots = new Map([...grid.children].filter((el) => el !== drag.card).map((el) => [el, el.getBoundingClientRect()]));
    }

    onCardUp(e, cancelled = false) {
        const drag = this.overview?.drag;
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.live) return this.endCardDrag();
        const o = this.overview;
        o.dropped = true; // swallow the click that follows
        window.setTimeout(() => { if (this.overview === o) o.dropped = false; });
        const { card, leaf, ghost } = drag;
        drag.ghost = null; // it's ours now, to land
        drag.card = null;
        this.endCardDrag();
        // Its spot among the cards of the pane it now stands with
        const pane = drag.pane;
        const index = [...o.grid.children].filter((el) => el === card || o.leafOf.get(el)?.parent === pane).indexOf(card);
        // The copy flies into the slot, then the card takes its place
        const from = ghost.getBoundingClientRect();
        const to = card.getBoundingClientRect();
        ghost.removeClass("is-lifted");
        const land = ghost.animate([
            { translate: "0 0", scale: "1" },
            { translate: `${to.left - from.left}px ${to.top - from.top}px`, scale: `${to.width / (from.width || 1)}` },
        ], { duration: 260, easing: CARD_EASE, fill: "forwards" });
        land.finished.catch(() => {}).finally(() => {
            ghost.remove();
            card.removeClass("is-placeholder");
            if (cancelled || !pane || !leaf.parent || this.overview !== o) return; // closed meanwhile
            const home = leaf.parent;
            if (pane === home && index === home.children.indexOf(leaf)) return;
            // The layout change then redraws the cards in their new order
            const { workspace } = this.app;
            const active = workspace.activeLeaf;
            const shown = pane === home ? home.children[home.currentTab] : pane.children[pane.currentTab];
            home.removeChild(leaf); // a pane left empty closes itself
            pane.insertChild(index, leaf);
            // The current tab stays shown wherever it lands; any other keeps
            // its new pane showing what it showed
            const show = leaf === active ? leaf : shown;
            if (show) pane.selectTab(show);
            if (active) workspace.setActiveLeaf(active, { focus: false });
            workspace.requestSaveLayout?.();
        });
    }

    endCardDrag() {
        const o = this.overview;
        if (!o?.drag) return;
        window.clearTimeout(o.drag.timer);
        o.drag.ghost?.remove();
        o.drag.card?.removeClass("is-placeholder");
        o.drag = null;
    }

    closeOverview(now = false) {
        const o = this.overview;
        if (!o) return;
        this.overview = null;
        document.body.removeClass(OVERVIEW_CLASS + "-open");
        if (now || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            o.sheet.remove();
            return;
        }
        o.sheet.style.pointerEvents = "none";
        o.sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OVERVIEW_MS, easing: "ease-in", fill: "forwards" })
            .finished.finally(() => o.sheet.remove());
    }

    // ---- iPhone: haptics ----

    // A light tap from the Taptic Engine. Obsidian's iOS app carries
    // Capacitor's Haptics plugin; elsewhere (iPad without one, Android
    // without it, the desktop preview) this quietly does nothing, or falls
    // back to a short vibration where there is one.
    haptic(style = "LIGHT") {
        try {
            const haptics = window.Capacitor?.Plugins?.Haptics;
            if (haptics?.impact) haptics.impact({ style }).catch(() => {});
            else navigator.vibrate?.(8);
        } catch (e) {
            // no haptics here
        }
    }

    // Every tap on a control gives a tap back, like iOS: buttons and icons,
    // the bars, the path, menus, the tab overview and the file list. Taps
    // in the note itself don't.
    setupHaptics() {
        const controls = [
            "button", ".clickable-icon", ".mobile-navbar-action", ".view-header-breadcrumb",
            ".mobile-tab", ".menu-item", ".tree-item-self", ".workspace-drawer-tab-option-item",
            ".suggestion-item", ".checkbox-container", ".dropdown",
        ].join(", ");
        this.registerDomEvent(document, "click", (e) => {
            if (Date.now() <= (this.suppressClickUntil ?? 0)) return; // a drag on the name pill
            if (e.target.closest?.(controls)) this.haptic();
        }, { capture: true });
    }

    // ---- iPhone: the name pill's gestures ----

    // Like Safari's address bar: drag the name pill up to see all tabs, or
    // sideways to go to the tab beside it (to the left → the next tab, to
    // the right → the previous one; to the left on the last tab → a new tab). The pill follows the finger and ticks
    // once it's far enough that letting go acts; a flick acts too. A plain
    // tap opens the quick switcher (setupPathSwitcher).
    setupNameGestures() {
        this.pillDrag = null;
        this.suppressClickUntil = 0;
        this.registerDomEvent(document, "touchstart", (e) => this.onPillStart(e), { passive: true, capture: true });
        this.registerDomEvent(document, "touchmove", (e) => this.onPillMove(e), { passive: false, capture: true });
        this.registerDomEvent(document, "touchend", () => this.onPillEnd(true), { passive: true, capture: true });
        this.registerDomEvent(document, "touchcancel", () => this.onPillEnd(false), { passive: true, capture: true });
        // A drag still ends in a click on the button under the pill
        this.registerDomEvent(document, "click", (e) => {
            if (Date.now() > this.suppressClickUntil) return;
            if (!e.target.closest?.(".mobile-navbar-action-tabs")) return;
            e.preventDefault();
            e.stopPropagation();
        }, { capture: true });
    }

    onPillStart(e) {
        if (this.pillDrag?.axis) return; // a second finger
        this.pillDrag = null;
        if (e.touches.length !== 1 || document.body.hasClass("is-hidden-nav")) return;
        if (!e.target.closest?.(".mobile-navbar-action-tabs")) return;
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const pill = leaf?.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container");
        if (!pill) return;
        const tabs = leaf.parent?.children ?? [];
        const i = tabs.indexOf(leaf);
        const t = e.touches[0];
        this.pillDrag = {
            pill, axis: null, armed: false,
            prev: i > 0 ? tabs[i - 1] : null,
            next: i >= 0 && i < tabs.length - 1 ? tabs[i + 1] : null,
            x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t: e.timeStamp, vx: 0, vy: 0,
        };
    }

    onPillMove(e) {
        const d = this.pillDrag;
        if (!d) return;
        const t = e.touches[0];
        const dx = t.clientX - d.x0;
        const dy = t.clientY - d.y0;
        if (!d.axis) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK_AT) return;
            d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : dy < 0 ? "y" : null;
            if (!d.axis) {
                this.pillDrag = null; // pulled down: not ours
                return;
            }
            d.pill.style.transition = "none";
        }
        e.preventDefault();
        const dt = e.timeStamp - d.t;
        if (dt > 0) {
            d.vx = 0.8 * ((t.clientX - d.x) / dt) + 0.2 * d.vx;
            d.vy = 0.8 * ((t.clientY - d.y) / dt) + 0.2 * d.vy;
        }
        d.x = t.clientX;
        d.y = t.clientY;
        d.t = e.timeStamp;
        let armed;
        if (d.axis === "x") {
            // Past the last tab, like Safari, a new tab
            d.target = dx < 0 ? d.next ?? NEW_TAB : d.prev;
            const shift = d.target ? dx : dx / 3; // before the first tab: it only gives a little
            d.pill.style.translate = `${shift}px 0`;
            d.pill.style.opacity = String(1 - Math.min(Math.abs(shift) / d.pill.offsetWidth, 1) * 0.7);
            armed = !!d.target && Math.abs(dx) >= PILL_SWIPE_AT;
        } else {
            const up = Math.max(0, -dy);
            d.pill.style.translate = `0 ${-up * 0.6}px`;
            d.pill.style.scale = String(1 - Math.min(up / 150, 1) * 0.08);
            armed = up >= PILL_SWIPE_AT;
        }
        if (armed !== d.armed) this.haptic();
        d.armed = armed;
    }

    onPillEnd(finished) {
        const d = this.pillDrag;
        this.pillDrag = null;
        if (!d?.axis) return;
        this.suppressClickUntil = Date.now() + 500;
        // A flick acts even when short (and ticks, as it never got to)
        let act = finished && d.armed;
        if (finished && !act) {
            const flick = d.axis === "x"
                ? d.target && Math.abs(d.vx) > PILL_FLICK && Math.sign(d.vx) === (d.target === d.prev ? 1 : -1)
                : d.vy < -PILL_FLICK;
            if (flick) {
                act = true;
                this.haptic();
            }
        }
        if (act && d.axis === "x") this.switchTabFromPill(d);
        else this.settlePill(d.pill);
        if (act && d.axis === "y") this.app.mobileTabSwitcher?.show();
    }

    settlePill(pill) {
        pill.style.transition = "translate 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), scale 0.3s ease, opacity 0.3s ease";
        pill.style.translate = "";
        pill.style.scale = "";
        pill.style.opacity = "";
        window.setTimeout(() => {
            if (pill.style.translate === "" && pill.style.scale === "") pill.style.transition = "";
        }, 320);
    }

    // The pill slides out the way it was pushed; the next tab's pill and
    // page (or a new tab's) come in from the other side
    switchTabFromPill(d) {
        const toward = d.target === d.prev ? 1 : -1; // the way the finger went
        const { pill } = d;
        pill.style.transition = "translate 0.14s ease-in, opacity 0.14s ease-in";
        pill.style.translate = `${toward * pill.offsetWidth * 0.6}px 0`;
        pill.style.opacity = "0";
        window.setTimeout(() => {
            pill.style.transition = pill.style.translate = pill.style.opacity = "";
            const target = d.target === NEW_TAB ? this.app.workspace.getLeaf("tab") : d.target;
            this.app.workspace.setActiveLeaf(target, { focus: true });
            const easing = "cubic-bezier(0.25, 0.8, 0.25, 1)";
            const from = -toward;
            target.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container")?.animate(
                [{ translate: `${from * 40}px 0`, opacity: 0 }, { translate: "0 0", opacity: 1 }],
                { duration: 260, easing },
            );
            target.view?.contentEl?.animate(
                [{ transform: `translateX(${from * 48}px)`, opacity: 0.4 }, { transform: "none", opacity: 1 }],
                { duration: 260, easing },
            );
        }, 140);
    }

    // ---- iPhone: the name capsule brings the bars back ----

    // Scrolling down folds the bottom bar into a small capsule with just the
    // note's name (the theme, on body.is-hidden-nav). The name is Obsidian's
    // title, which renames the note when tapped; while folded, a tap brings
    // the bars back instead, like Safari.
    setupNameCapsule() {
        const onTap = (e) => {
            if (!document.body.hasClass("is-hidden-nav")) return;
            if (!e.target.closest?.(".mod-root .view-header-title-container")) return;
            e.preventDefault();
            e.stopPropagation();
            this.app.mobileNavbar?.restoreNavigation();
            this.haptic();
        };
        const opts = { passive: false, capture: true };
        this.registerDomEvent(document, "touchstart", onTap, opts);
        this.registerDomEvent(document, "mousedown", onTap, opts);

        // Folded, the capsule holds only the name and is as wide as it: the
        // theme reads --g-capsule-name-w, the name's width in the folded
        // font, measured ahead so the fold can animate to it
        const ctx = document.createElement("canvas").getContext("2d");
        const measure = () => {
            this.app.workspace.iterateRootLeaves((leaf) => {
                const capsule = leaf.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container");
                const title = capsule?.querySelector(".view-header-title");
                if (!title) return;
                const cs = getComputedStyle(title);
                const size = getComputedStyle(document.body).getPropertyValue("--font-ui-smaller").trim() || "12px";
                ctx.font = `${cs.fontWeight} ${size} ${cs.fontFamily}`;
                capsule.style.setProperty("--g-capsule-name-w", `${Math.ceil(ctx.measureText(title.textContent).width)}px`);
            });
        };
        const later = () => window.setTimeout(measure, 0);
        this.app.workspace.onLayoutReady(later);
        this.registerEvent(this.app.workspace.on("layout-change", later));
        this.registerEvent(this.app.workspace.on("active-leaf-change", later));
        this.registerEvent(this.app.workspace.on("file-open", later));
        this.registerEvent(this.app.workspace.on("css-change", later));
        this.registerEvent(this.app.vault.on("rename", later));
        this.register(() => document.querySelectorAll(".view-header-title-container")
            .forEach((el) => el.style.removeProperty("--g-capsule-name-w")));
    }

    // ---- iPhone & iPad: swipe in from an edge to go back / forward ----

    // Like Safari: start within EDGE_SWIPE_ZONE of the left edge and drag
    // right to go back, or from the right edge leftwards to go forward. The
    // page follows the finger and the one it goes to shows from underneath;
    // letting go past EDGE_SWIPE_AT of the width (or with a flick) goes
    // there, earlier springs back. Only while both sidebars are closed,
    // nothing covers the note and there is somewhere to go.
    //
    // The page underneath is a copy of how it looked when it was left:
    // Obsidian asks a leaf for its history state just before it leaves a
    // page, so that is when the copy is taken. It is kept with that state,
    // which is the very object that goes into the back/forward lists.
    setupEdgeSwipe() {
        this.patchSnapshots();
        this.registerDomEvent(document, "touchstart", (e) => this.onEdgeStart(e), { passive: true, capture: true });
        this.registerDomEvent(document, "touchmove", (e) => this.onEdgeMove(e), { passive: false, capture: true });
        this.registerDomEvent(document, "touchend", (e) => this.onEdgeEnd(e, true), { passive: true, capture: true });
        this.registerDomEvent(document, "touchcancel", (e) => this.onEdgeEnd(e, false), { passive: true, capture: true });
    }

    // The copies of the pages left behind, for the swipes
    patchSnapshots() {
        if (this.snapshots) return;
        this.snapshots = new WeakMap();
        this.edgeSwipe = null;
        const proto = WorkspaceLeaf.prototype;
        const own = Object.prototype.hasOwnProperty.call(proto, "getHistoryState");
        const original = proto.getHistoryState;
        const plugin = this;
        const patched = function (...args) {
            const state = original.apply(this, args);
            try {
                const snapshot = plugin.snapshotPage(this);
                if (snapshot && state && typeof state === "object") plugin.snapshots.set(state, snapshot);
            } catch (e) {
                console.error("Goguryeo: page snapshot failed", e);
            }
            return state;
        };
        proto.getHistoryState = patched;
        this.register(() => {
            if (proto.getHistoryState !== patched) return;
            if (own) proto.getHistoryState = original;
            else delete proto.getHistoryState;
        });
        this.register(() => this.endPageSwipe());
    }

    // ---- Desktop: two fingers sideways on a trackpad go back / forward ----

    // As on the iPad's edge swipe, Safari style: two fingers moving right
    // pull the page right to go back, moving left bring the next page in
    // to go forward; the page follows the fingers over a copy of the one
    // it goes to. A trackpad's two-finger scroll comes as wheel events, so
    // a sideways one that nothing under the pointer can scroll that way
    // (a wide table, a code block) starts it, when the pane has somewhere
    // to go. It ends when the wheel stops (a fling carries it on): past
    // EDGE_SWIPE_AT of the width it goes there, else it springs back. In a
    // web viewer the page's listener passes its sideways wheel on.
    setupTrackpadSwipe() {
        this.patchSnapshots();
        this.registerDomEvent(document, "wheel", (e) => this.onSwipeWheel(e), { passive: false, capture: true });
        this.register(() => window.clearTimeout(this.edgeSwipe?.idle));
    }

    // Can the element at (or above) `el` scroll sideways in `dx`'s direction?
    scrollsSideways(el, dx) {
        for (; el && el !== document.body; el = el.parentElement) {
            if (el.scrollWidth <= el.clientWidth + 1) continue;
            const o = getComputedStyle(el).overflowX;
            if (o !== "auto" && o !== "scroll") continue;
            if (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
        }
        return false;
    }

    // e: a wheel event, or one passed on by a web viewer's page (leaf set)
    onSwipeWheel(e, fromLeaf = null) {
        if (e.ctrlKey) return;
        const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1;
        const dx = e.deltaX * unit;
        const dy = e.deltaY * unit;
        const now = performance.now();
        let s = this.edgeSwipe;
        if (s && !s.wheel) return; // a finger's swipe
        if (s?.settling || now < (this.swipeQuietUntil ?? 0)) {
            // the fling of a swipe that's done: not a new one
            if (Math.abs(dx) > Math.abs(dy)) e.preventDefault?.();
            this.swipeQuietUntil = now + 160;
            return;
        }
        if (!s) {
            if (!dx || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            if (now < (this.wheelScrollUntil ?? 0)) { // a sideways scroll going on
                this.wheelScrollUntil = now + 160;
                return;
            }
            let leaf = fromLeaf;
            if (!leaf) {
                const el = e.target?.closest?.(".mod-root .workspace-leaf");
                if (!el) return;
                this.app.workspace.iterateRootLeaves((l) => { if (l.containerEl === el) leaf = l; });
                if (!leaf || this.scrollsSideways(e.target, dx)) {
                    this.wheelScrollUntil = now + 160;
                    return;
                }
            }
            const type = leaf?.view?.getViewType?.();
            if (!leaf?.view?.contentEl || ["canvas", "graph", "localgraph", "excalidraw"].includes(type)) return;
            if (document.querySelector(".modal-container, .menu")) return;
            const dir = dx < 0 ? -1 : 1; // fingers right: back
            const steps = dir < 0 ? leaf.history?.backHistory : leaf.history?.forwardHistory;
            if (!steps?.length) return;
            s = this.edgeSwipe = { wheel: true, dir, leaf, entry: steps[steps.length - 1], locked: false, sum: 0, v: 0, t: now };
        }
        s.sum = Math.max(0, s.sum + dx * s.dir);
        const dt = now - s.t;
        if (dt > 0) s.v = 0.7 * ((dx * s.dir) / dt) + 0.3 * s.v;
        s.t = now;
        if (!s.locked && s.sum > LOCK_AT) {
            s.locked = true;
            this.startPageSwipe(s);
        }
        if (s.locked) {
            e.preventDefault?.();
            this.setPageSwipe(s, Math.min(s.width, s.sum));
        }
        window.clearTimeout(s.idle);
        s.idle = window.setTimeout(() => this.endWheelSwipe(s), 120);
    }

    endWheelSwipe(s) {
        if (this.edgeSwipe !== s || s.settling) return;
        if (!s.locked) {
            this.edgeSwipe = null;
            return;
        }
        this.swipeQuietUntil = performance.now() + 400;
        this.settlePageSwipe(s, s.pulled >= s.width * EDGE_SWIPE_AT);
    }

    // A still copy of a leaf's page: its content inside a bare copy of the
    // content's frame (so the theme's rules for it still apply), plus where
    // each scrolled part was scrolled to.
    // anyView: also views that aren't pages you navigate (calendars,
    // plugin views), for the tab overview; the edge swipe wants notes only
    snapshotPage(leaf, anyView = false) {
        const content = leaf.view?.contentEl;
        if (!content || (!anyView && !leaf.view.navigation) || !content.isConnected) return null;
        const webview = leaf.view.getViewType?.() === "webviewer" ? leaf.view.webview : null;
        if (webview || content.querySelector("webview")) {
            // A web page can't be cloned (a copy of a <webview> loads the
            // page anew): a picture of it, which comes a moment later
            const frame = leaf.view.containerEl.cloneNode(false);
            frame.classList.remove("goguryeo-swiping");
            frame.appendChild(content.cloneNode(false)).createEl("img", { cls: "goguryeo-swipe-shot" });
            let ready = null;
            try {
                ready = webview?.capturePage?.().then((image) => image.toDataURL()).catch(() => null) ?? null;
            } catch (e) { /* not attached */ }
            ready?.then((src) => { if (src) frame.querySelector(".goguryeo-swipe-shot").src = src; });
            return { frame, scrolls: [], ready };
        }
        const scrolls = [];
        const walk = (el, path) => {
            if (el.scrollTop || el.scrollLeft) scrolls.push([path, el.scrollTop, el.scrollLeft]);
            const kids = el.children;
            for (let i = 0; i < kids.length; i++) walk(kids[i], path.concat(i));
        };
        walk(content, []);
        const frame = leaf.view.containerEl.cloneNode(false);
        frame.classList.remove("goguryeo-swiping");
        frame.appendChild(content.cloneNode(true));
        return { frame, scrolls };
    }

    // A page for the swipe stage: the snapshot, or failing that a plain page
    // with the entry's name
    makeSwipePage(snapshot, entry) {
        const page = createDiv("goguryeo-swipe-page");
        if (snapshot) {
            page.appendChild(snapshot.frame.cloneNode(true));
            // a web page's picture, if it wasn't there yet
            snapshot.ready?.then((src) => {
                const img = page.querySelector(".goguryeo-swipe-shot");
                if (src && img && !img.src) img.src = src;
            });
        } else if (this.webShots?.get(entry?.state?.state?.url)) {
            const img = page.createEl("img", { cls: "goguryeo-swipe-shot" });
            img.src = this.webShots.get(entry.state.state.url);
        } else {
            const blank = page.createDiv("goguryeo-swipe-blank");
            if (entry?.icon) setIcon(blank.createDiv("goguryeo-swipe-blank-icon"), entry.icon);
            blank.createDiv({ cls: "goguryeo-swipe-blank-title", text: entry?.title ?? "" });
        }
        return page;
    }

    restoreScrolls(page, snapshot) {
        const content = page.querySelector(".view-content");
        if (!content || !snapshot) return;
        for (const [path, top, left] of snapshot.scrolls) {
            let el = content;
            for (const i of path) el = el?.children[i];
            if (!el) continue;
            el.scrollTop = top;
            el.scrollLeft = left;
        }
    }

    canEdgeSwipe() {
        const { leftSplit, rightSplit } = this.app.workspace;
        if (!this.edgeSwipeEnabled()) return false;
        if (!leftSplit?.collapsed || !rightSplit?.collapsed) return false;
        return !document.querySelector(".modal-container, .menu, .mobile-tab-switcher, .prompt");
    }

    // The theme's option. Android's own back gesture uses the edges too, so
    // unless it's set to "On" the swipe leaves Android alone (also without
    // Style Settings, which sets no class then), except on a device set to
    // navigation buttons, whose edges are free
    edgeSwipeEnabled() {
        const body = document.body;
        if (body.hasClass("goguryeo-edge-swipe-off")) return false;
        if (!Platform.isAndroidApp || body.hasClass("goguryeo-edge-swipe-on")) return true;
        return this.androidNav === "buttons";
    }

    setAndroidNav(value) {
        this.androidNav = value;
        this.app.saveLocalStorage(ANDROID_NAV_KEY, value);
    }

    onEdgeStart(e) {
        // A second finger, or a touch while the page settles, leaves it be
        if (this.edgeSwipe?.locked) return;
        this.edgeSwipe = null;
        if (e.touches.length !== 1 || !this.canEdgeSwipe()) return;
        const t = e.touches[0];
        const dir = t.clientX <= EDGE_SWIPE_ZONE ? -1 : t.clientX >= window.innerWidth - EDGE_SWIPE_ZONE ? 1 : 0;
        if (!dir) return;
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const history = leaf?.history;
        const steps = dir < 0 ? history?.backHistory : history?.forwardHistory;
        if (!steps?.length || !leaf.view?.contentEl) return;
        this.edgeSwipe = {
            dir, leaf, entry: steps[steps.length - 1],
            x0: t.clientX, y0: t.clientY, locked: false, x: t.clientX, t: e.timeStamp, v: 0,
        };
    }

    onEdgeMove(e) {
        const s = this.edgeSwipe;
        if (!s || s.settling) return;
        const t = e.touches[0];
        const dx = (t.clientX - s.x0) * -s.dir; // distance pulled inwards
        const dy = t.clientY - s.y0;
        if (!s.locked) {
            if (Math.abs(dy) > LOCK_AT && Math.abs(dy) > Math.abs(dx)) {
                this.edgeSwipe = null; // a scroll, not a swipe
                return;
            }
            if (dx < LOCK_AT) return;
            s.locked = true;
            this.startPageSwipe(s);
        }
        e.preventDefault();
        const dt = e.timeStamp - s.t;
        if (dt > 0) s.v = 0.8 * ((t.clientX - s.x) / dt) + 0.2 * s.v;
        s.x = t.clientX;
        s.t = e.timeStamp;
        this.setPageSwipe(s, Math.max(0, Math.min(s.width, dx)));
        // A tick each time the swipe crosses the point where letting go goes
        const armed = s.pulled >= s.width * EDGE_SWIPE_AT;
        if (armed !== !!s.armed) this.haptic();
        s.armed = armed;
    }

    onEdgeEnd(e, finished) {
        const s = this.edgeSwipe;
        if (!s || s.settling) return;
        if (!s.locked) {
            this.edgeSwipe = null;
            return;
        }
        // A flick inwards goes even when short; a flick back cancels
        const v = s.v * -s.dir; // px/ms, inwards
        const go = finished && (v > 0.35 || (s.pulled >= s.width * EDGE_SWIPE_AT && v > -0.2));
        this.settlePageSwipe(s, go);
    }

    // The stage covers the leaf's page: the page underneath (clipped to the
    // part the top page has uncovered, and drifting in from a third of the
    // way off) and the page on top (sliding with the finger, casting a
    // shadow). Going back, the current page is on top; going forward, the
    // next one slides in on top of it.
    startPageSwipe(s) {
        const { leaf, entry, dir } = s;
        const frame = leaf.view.containerEl;
        const current = this.snapshotPage(leaf);
        const web = leaf.view?.getViewType?.() === "webviewer" && this.webShots?.get(entry?.state?.state?.url);
        const target = web ? null : this.snapshots.get(entry);
        const currentPage = this.makeSwipePage(current, null);
        const targetPage = this.makeSwipePage(target, entry);
        const stage = createDiv("goguryeo-swipe-stage");
        stage.setAttr("inert", "");
        s.under = dir < 0 ? targetPage : currentPage;
        s.over = dir < 0 ? currentPage : targetPage;
        s.under.addClass("is-under");
        s.over.addClass("is-over");
        stage.append(s.under, s.over);
        frame.appendChild(stage);
        frame.addClass("goguryeo-swiping");
        this.restoreScrolls(currentPage, current);
        this.restoreScrolls(targetPage, target);
        s.stage = stage;
        s.frame = frame;
        s.width = stage.clientWidth || window.innerWidth;
        this.setPageSwipe(s, 0);
    }

    // pulled: how far the finger has come in, 0…width
    setPageSwipe(s, pulled) {
        s.pulled = pulled;
        const w = s.width;
        const edge = s.dir < 0 ? pulled : w - pulled; // left edge of the top page
        const underX = -(w - edge) / 3;
        s.over.style.transform = `translateX(${edge}px)`;
        s.under.style.transform = `translateX(${underX}px)`;
        s.under.style.clipPath = `inset(0 ${w - edge + underX}px 0 ${-underX}px)`;
        s.under.style.setProperty("--g-swipe-dim", String(0.18 * (1 - edge / w)));
    }

    settlePageSwipe(s, go) {
        s.settling = true;
        s.stage.addClass("is-settling");
        this.setPageSwipe(s, go ? s.width : 0);
        window.setTimeout(async () => {
            if (go) {
                // Let the new page draw before the copy lifts off it, but
                // don't hold the screen if Obsidian takes its time
                const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));
                const nav = Promise.resolve(s.leaf.history.go(s.dir)).catch((e) => {
                    console.error("Goguryeo: swipe navigation failed", e);
                });
                await Promise.race([nav.then(() => sleep(80)), sleep(SWIPE_DRAW_MS)]);
            }
            if (this.edgeSwipe === s) this.endPageSwipe();
        }, SWIPE_SETTLE_MS);
    }

    endPageSwipe() {
        const s = this.edgeSwipe;
        this.edgeSwipe = null;
        if (!s?.stage) return;
        s.stage.remove();
        s.frame.removeClass("goguryeo-swiping");
    }

    // ---- Sliding glass under the active tab ----

    setupTabThumbs() {
        this.thumbs = new WeakMap(); // tab bar → its thumb
        this.thumbSpots = new WeakMap(); // tab bar → last active tab and where it was
        this.observed = new WeakSet(); // tab strips already watched
        this.mutationObserver = new MutationObserver((mutations) => {
            const relevant = mutations.some(
                (m) => m.type === "childList" || m.target.classList?.contains("workspace-tab-header")
            );
            if (relevant) this.scheduleThumbs();
        });
        this.resizeObserver = new ResizeObserver(() => this.scheduleThumbs());
        this.register(() => {
            this.mutationObserver.disconnect();
            this.resizeObserver.disconnect();
            window.cancelAnimationFrame(this.thumbFrame);
            this.removeThumbs();
        });
        for (const name of ["layout-change", "active-leaf-change", "css-change"]) {
            this.registerEvent(this.app.workspace.on(name, () => this.scheduleThumbs()));
        }
        this.registerDomEvent(window, "resize", () => this.scheduleThumbs());
        if (this.app.workspace.rootSplit) this.resizeObserver.observe(this.app.workspace.rootSplit.containerEl);
        this.scheduleThumbs();
    }

    scheduleThumbs() {
        if (this.thumbFrame) return;
        this.thumbFrame = window.requestAnimationFrame(() => {
            this.thumbFrame = 0;
            this.updateThumbs();
        });
    }

    removeThumbs() {
        document.body.removeClass(THUMB_CLASS);
        document.querySelectorAll(".goguryeo-tab-thumb").forEach((el) => el.remove());
        this.clearSplit();
    }

    // ---- Split screen: one shared toolbar over all panes ----

    // With 2+ panes (or 1 over a background) the theme shows only the
    // current pane's note header, as a toolbar across the whole note area. It needs to know that the screen
    // is split, where the note area is, which pane is current (the one whose
    // path shows, even while a sidebar has focus) and which pane is the
    // top-right one (it holds + and the tab list).
    updateSplit() {
        const { rootSplit } = this.app.workspace;
        // Count panes from Obsidian's layout, not the page: a split animation
        // briefly leaves an extra copy of a pane in the page
        const groups = [];
        const collect = (node) => node?.children?.forEach((child) => {
            if (child.type === "tabs") groups.push(child);
            else if (child.type === "split") collect(child);
        });
        collect(rootSplit);
        const panes = groups.map((g) => g.containerEl);
        const body = document.body;
        // Over a background, a lone pane is a card too
        const hasBackground = body.hasClass("goguryeo-bg-color") || body.hasClass("goguryeo-bg-image");
        if (!(Platform.isDesktopApp || Platform.isTablet) || panes.length < (hasBackground ? 1 : 2)) {
            this.clearSplit();
            return;
        }
        // 2+ panes: Chrome's split view. A normal tab in focus fills the
        // screen alone; a page of the split brings every pane back
        const shown = groups.length > 1 && !body.hasClass("goguryeo-no-cards")
            ? this.syncSplitPages(groups) : { solo: null, split: null };
        const solo = shown.solo;
        this.applyFold(groups, shown);
        if (groups.length < 2) this.splitPages = null;
        const r = rootSplit.containerEl.getBoundingClientRect();
        body.addClass(SPLIT_CLASS);
        body.toggleClass(ONE_PANE_CLASS, panes.length === 1 || !!solo);
        // iPad pads the note area's top for the status bar; start below it
        const padTop = parseFloat(getComputedStyle(rootSplit.containerEl).paddingTop) || 0;
        body.style.setProperty("--g-root-top", `${r.top + padTop}px`);
        body.style.setProperty("--g-root-left", `${r.left}px`);
        body.style.setProperty("--g-root-right", `${window.innerWidth - r.right}px`);

        const currentEl = this.app.workspace.getMostRecentLeaf(rootSplit)?.parent?.containerEl;
        const topPanes = panes.filter((el) => el.hasClass("mod-top"));
        const lastTop = topPanes[topPanes.length - 1];
        for (const el of panes) {
            el.toggleClass(CURRENT_PANE_CLASS, el === currentEl);
            el.toggleClass(LAST_PANE_CLASS, el === lastTop);
        }
        if (groups.length > 1) this.renderSharedTabs(groups, shown);
        else this.removeSharedTabs();
        this.renderGrips(groups.length > 1 ? groups : []);
        this.flipCards(groups);
    }

    // ---- Split screen: the cards glide when the layout changes ----

    // A pane closing, opening or moving, or the screen switching between a
    // split and a lone tab: each card glides from where it stood to its
    // new place instead of jumping (pinned with position: fixed and slid,
    // as in the drag preview, so the pinned toolbar stays put); a card
    // coming on screen fades in. Only when the layout itself changed (its
    // panes, their order, what's folded), not on a resize.
    flipCards(groups) {
        const els = groups.map((g) => g.containerEl);
        const shape = (node) => (node.type === "tabs"
            ? (node.containerEl.hasClass(SOLO_OFF_CLASS) ? "o" : "s")
            : (node.direction === "vertical" ? "v(" : "h(") + (node.children ?? []).map(shape).join(",") + ")");
        const sig = shape(this.app.workspace.rootSplit) + "|" + els.length;
        // mid-glide and nothing new: let it finish (the pinned boxes
        // would read as the cards' places)
        if (this.flipping && sig === this.cardSig && !this.flipForce) return;
        this.endFlip();
        const rects = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
        // and by the page each card shows: after a swap or a move a page
        // glides from the card it was in
        const shownIn = (g) => g.children[g.currentTab];
        const pageRects = new Map(groups.map((g) => [shownIn(g), rects.get(g.containerEl)]));
        const old = this.cardRects;
        const oldPages = this.pageRects ?? new Map();
        const changed = old && (sig !== this.cardSig || this.flipForce);
        this.flipForce = false;
        this.cardRects = rects;
        this.pageRects = pageRects;
        this.cardSig = sig;
        if (!changed || this.flipSkip || this.panePreview || this.paneDrag || this.reducedMotion()
            || !document.body.hasClass(SPLIT_CLASS)) {
            this.flipSkip = false;
            return;
        }
        const moves = [];
        for (const g of groups) {
            const el = g.containerEl;
            const before = oldPages.get(shownIn(g));
            const a = before?.width && before.height ? before : old.get(el);
            const b = rects.get(el);
            if (!b.width || !b.height) continue; // folded away
            if (!a || !a.width || !a.height) {
                el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
                continue;
            }
            const d = Math.abs(a.left - b.left) + Math.abs(a.top - b.top) + Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
            if (d > 2) moves.push([el, a, b]);
        }
        if (!moves.length) return;
        const pin = (el, r) => Object.assign(el.style, {
            position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
            margin: "0", boxSizing: "border-box",
        });
        for (const [el, a] of moves) pin(el, a);
        void document.body.offsetWidth;
        document.body.addClass(PANE_PREVIEW_CLASS);
        for (const [el, , b] of moves) pin(el, b);
        this.flipping = moves.map(([el]) => el);
        this.flipTimer = window.setTimeout(() => this.endFlip(), PANE_PREVIEW_MS + 40);
    }

    endFlip() {
        window.clearTimeout(this.flipTimer);
        const els = this.flipping;
        if (!els) return;
        this.flipping = null;
        for (const el of els) {
            for (const key of ["position", "left", "top", "width", "height", "margin", "box-sizing"]) el.style.removeProperty(key);
        }
        if (!this.panePreview) document.body.removeClass(PANE_PREVIEW_CLASS);
    }

    // ---- Split screen: move a pane by the bar on its top (iPad Safari style) ----

    // Each pane of the split gets a small bar at the top middle. Drag it
    // (mouse or finger) over another pane: its left, right, top or bottom
    // edge puts the pane on that side, its middle swaps the two. A glass
    // box shows where it will go. Pointer events, so it works with touch
    // on the iPad, where HTML drag and drop doesn't.
    renderGrips(groups) {
        this.grips ??= new WeakMap();
        this.splitGroups = groups;
        const els = new Set();
        for (const pane of groups) {
            let grip = this.grips.get(pane);
            if (!grip) {
                grip = createDiv({ cls: GRIP_CLASS, attr: { "aria-label": "Move this pane" } });
                grip.createDiv("goguryeo-pane-grip-bar");
                grip.addEventListener("pointerdown", (e) => this.onGripDown(e, pane));
                this.grips.set(pane, grip);
            }
            if (grip.parentElement !== pane.containerEl) pane.containerEl.appendChild(grip);
            els.add(grip);
        }
        document.querySelectorAll(`.${GRIP_CLASS}`).forEach((el) => {
            if (!els.has(el)) el.remove();
        });
    }

    onGripDown(e, pane) {
        if (e.button > 0 || this.paneDrag) return;
        e.preventDefault();
        e.stopPropagation();
        const grip = e.currentTarget;
        try { grip.setPointerCapture(e.pointerId); } catch (err) { /* moves still reach the window */ }
        const d = this.paneDrag = { pane, grip, id: e.pointerId, x: e.clientX, y: e.clientY, moving: false, target: null };
        grip.addClass("is-held");
        this.haptic();
        const move = (ev) => this.onGripMove(ev);
        const up = (ev) => this.endPaneDrag(ev, false);
        const cancel = (ev) => this.endPaneDrag(ev, true);
        const key = (ev) => {
            if (ev.key !== "Escape") return;
            ev.preventDefault();
            ev.stopPropagation();
            this.endPaneDrag(null, true);
        };
        window.addEventListener("pointermove", move, true);
        window.addEventListener("pointerup", up, true);
        window.addEventListener("pointercancel", cancel, true);
        window.addEventListener("keydown", key, true);
        d.off = () => {
            window.removeEventListener("pointermove", move, true);
            window.removeEventListener("pointerup", up, true);
            window.removeEventListener("pointercancel", cancel, true);
            window.removeEventListener("keydown", key, true);
        };
    }

    onGripMove(ev) {
        const d = this.paneDrag;
        if (!d || ev.pointerId !== d.id) return;
        ev.preventDefault();
        if (!d.moving) {
            if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 5) return;
            d.moving = true;
            d.pane.containerEl.addClass("goguryeo-pane-lifted");
            document.body.addClass("goguryeo-pane-dragging");
            d.drop = document.body.createDiv("goguryeo-pane-drop");
        }
        // Over the top tab bar: the pane's page leaves the split there, as a
        // tab of its own (a slot opens where it will stand)
        const index = this.barDropAt(ev.clientX, ev.clientY);
        if (index != null) {
            d.drop.removeClass("is-shown");
            if (d.target?.bar && d.target.index === index) return;
            if (d.target && !d.target.bar) this.clearPanePreview();
            d.target = { bar: true, index };
            this.showBarSlot(index);
            this.haptic();
            return;
        }
        this.hideBarSlot();
        const t = this.paneDropAt(ev.clientX, ev.clientY, d.pane);
        if (t && t.pane === d.target?.pane && t.side === d.target?.side) return;
        if (!t && d.target && !d.target.bar) this.clearPanePreview();
        d.target = t;
        d.drop.toggleClass("is-shown", !!t);
        if (!t) return;
        this.haptic(); // crossed into a new place
        // The other panes make room: every card glides to where the move
        // would put it, and the drop box sits where the pane will land
        const rects = this.previewPanes(d.pane, t);
        const r = rects?.get(d.pane) ?? t.pane.containerEl.getBoundingClientRect();
        const { left, top, width, height } = r;
        const pad = 6;
        Object.assign(d.drop.style, {
            left: `${left + pad}px`,
            top: `${top + pad}px`,
            width: `${Math.max(0, width - pad * 2)}px`,
            height: `${Math.max(0, height - pad * 2)}px`,
        });
        d.drop.toggleClass("is-swap", t.side === "center");
    }

    // The pane under the pointer and the part of it: the edge it is nearest
    // to within its outer quarter, or its middle
    paneDropAt(x, y, from) {
        for (const pane of this.splitGroups ?? []) {
            if (pane === from || pane.containerEl.hasClass(SOLO_OFF_CLASS)) continue;
            // Where the cards stood before the preview moved them
            const r = this.panePreview?.home.get(pane) ?? pane.containerEl.getBoundingClientRect();
            if (x < r.left || x > r.right || y < r.top || y > r.bottom || !r.width || !r.height) continue;
            const fx = (x - r.left) / r.width;
            const fy = (y - r.top) / r.height;
            const edges = [["left", fx], ["right", 1 - fx], ["top", fy], ["bottom", 1 - fy]];
            edges.sort((a, b) => a[1] - b[1]);
            return { pane, side: edges[0][1] < 0.25 ? edges[0][0] : "center" };
        }
        return null;
    }

    endPaneDrag(ev, cancelled) {
        const d = this.paneDrag;
        if (!d || (ev && ev.pointerId !== d.id)) return;
        this.paneDrag = null;
        d.off();
        try { d.grip.releasePointerCapture(d.id); } catch (err) { /* already gone */ }
        d.grip.removeClass("is-held");
        d.pane.containerEl.removeClass("goguryeo-pane-lifted");
        document.body.removeClass("goguryeo-pane-dragging");
        d.drop?.remove();
        const toBar = !cancelled && d.moving && d.target?.bar;
        this.hideBarSlot(toBar);
        const toPane = !cancelled && d.moving && d.target && !d.target.bar;
        if (toPane) this.flipSkip = true;
        // Dropped: the real layout takes over where the preview left the
        // cards; otherwise they glide back
        this.clearPanePreview(toPane);
        // A tap, not a drag: the pane's menu
        if (!cancelled && !d.moving) return this.openGripMenu(d.pane, d.grip);
        if (cancelled || !d.moving || !d.target) return;
        try {
            if (toBar) this.unsplitPage(this.splitPages?.get(d.pane), d.target.index);
            else this.movePane(d.pane, d.target.pane, d.target.side);
            this.haptic();
        } catch (err) {
            console.error("Goguryeo: couldn't move the pane", err);
        }
    }

    // ---- Split screen: the panes make room while one is dragged ----

    // Lays the cards out as moving `src` to `t` would, from a model of
    // Obsidian's splits (each split's direction and its children's sizes,
    // as in splitPlaces), and glides every card there. A card is pinned
    // with position: fixed at its new box, so the page inside reflows like
    // the real thing; no transform, which would take the pinned toolbar
    // along. Returns the new boxes.
    previewPanes(src, t) {
        const panes = (this.splitGroups ?? []).filter((pane) => !pane.containerEl.hasClass(SOLO_OFF_CLASS));
        let p = this.panePreview;
        if (p) window.clearTimeout(p.timer); // gliding home: turn around
        else p = this.panePreview = {
            panes,
            home: new Map(panes.map((pane) => [pane, pane.containerEl.getBoundingClientRect()])),
        };

        // The model: { pane } or { dir, kids: [{ node, size }] }
        const build = (node) => {
            if (node.type === "tabs") return panes.includes(node) ? { pane: node } : null;
            const kids = [];
            for (const k of node.children ?? []) {
                const m = build(k);
                // Obsidian's own size, or null: an equal share
                if (m) kids.push({ node: m, size: k.dimension > 0 ? k.dimension : null });
            }
            // A split with one child stays (Obsidian keeps it, and it has no
            // margins of its own, unlike a card)
            return kids.length ? { dir: node.direction, kids } : null;
        };
        const tree = build(this.app.workspace.rootSplit);
        const find = (node, pane, parent = null) => {
            if (node.pane === pane) return { node, parent };
            for (const k of node.kids ?? []) {
                const f = find(k.node, pane, node);
                if (f) return f;
            }
            return null;
        };
        const fresh = src === NEW_PANE; // a tab about to become a pane
        const s = tree && !fresh && find(tree, src);
        if ((!fresh && !s?.parent) || !tree || !find(tree, t.pane)) return null;
        if (t.side === "center") {
            find(tree, t.pane).node.pane = src;
            s.node.pane = t.pane;
        } else {
            // Out of its place: its siblings share its room
            if (!fresh) s.parent.kids = s.parent.kids.filter((k) => k.node !== s.node);
            // In beside the target, which gives it half its room
            const d = find(tree, t.pane);
            const dir = t.side === "left" || t.side === "right" ? "vertical" : "horizontal";
            const before = t.side === "left" || t.side === "top";
            const entry = d.parent?.kids.find((k) => k.node === d.node);
            if (entry && d.parent.dir === dir) {
                if (entry.size !== null) entry.size /= 2; // as Obsidian's splitLeaf
                const i = d.parent.kids.indexOf(entry);
                d.parent.kids.splice(before ? i : i + 1, 0, { node: { pane: src }, size: entry.size });
            } else {
                const pair = [{ node: { pane: src }, size: null }, { node: { pane: t.pane }, size: null }];
                if (!before) pair.reverse();
                delete d.node.pane;
                Object.assign(d.node, { dir, kids: pair });
            }
            // Then Obsidian folds a split left with one child into that
            // child (not the root)
            const fold = (node) => {
                for (const k of node.kids ?? []) {
                    fold(k.node);
                    while (k.node.kids?.length === 1) k.node = k.node.kids[0].node;
                }
            };
            fold(tree);
        }

        // Boxes as the browser would lay them out: each split shares its
        // room by size after its cards' margins (only the cards have
        // margins; the theme gives the top row's cards a tall top margin,
        // room for the toolbar rows)
        p.margins ??= new Map(panes.map((pane) => {
            const s = getComputedStyle(pane.containerEl);
            return [pane, [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].map(parseFloat)];
        }));
        if (!p.area) {
            const root = this.app.workspace.rootSplit.containerEl;
            const r = root.getBoundingClientRect();
            const s = getComputedStyle(root);
            p.area = {
                x: r.left + parseFloat(s.paddingLeft), y: r.top + parseFloat(s.paddingTop),
                w: r.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
                h: r.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom),
            };
        }
        const homeTop = Math.min(...panes.map((pane) => p.home.get(pane).top - p.margins.get(pane)[0]));
        const topPane = panes.find((pane) => p.home.get(pane).top - p.margins.get(pane)[0] <= homeTop + 1);
        const lowPane = panes.find((pane) => pane !== topPane && p.home.get(pane).top - p.margins.get(pane)[0] > homeTop + 1);
        const topMargin = topPane ? p.margins.get(topPane)[0] : 0;
        const lowMargin = lowPane ? p.margins.get(lowPane)[0] : 0;
        const [, mr, mb, ml] = p.margins.get(panes[0]);
        const rects = new Map();
        const walk = (node, x, y, w, h, atTop) => {
            if (node.pane) {
                const mt = atTop ? topMargin : lowMargin;
                return void rects.set(node.pane, new DOMRect(x + ml, y + mt, w - ml - mr, h - mt - mb));
            }
            const across = node.dir === "vertical"; // side by side
            const margin = (k, i) => (!k.node.pane ? 0 : across ? ml + mr : (atTop && i === 0 ? topMargin : lowMargin) + mb);
            const known = node.kids.filter((k) => k.size !== null);
            const even = known.length ? known.reduce((a, k) => a + k.size, 0) / known.length : 1;
            const size = (k) => k.size ?? even;
            const total = node.kids.reduce((a, k) => a + size(k), 0) || 1;
            const free = (across ? w : h) - node.kids.reduce((a, k, i) => a + margin(k, i), 0);
            let at = 0;
            node.kids.forEach((k, i) => {
                const len = free * size(k) / total + margin(k, i);
                if (across) walk(k.node, x + at, y, len, h, atTop);
                else walk(k.node, x, y + at, w, len, atTop && i === 0);
                at += len;
            });
        };
        walk(tree, p.area.x, p.area.y, p.area.w, p.area.h, true);

        if (!p.live) {
            // Pinned where they stand first, so the move below glides
            p.live = true;
            for (const pane of panes) this.pinPane(pane, p.home.get(pane));
            void document.body.offsetWidth;
            document.body.addClass(PANE_PREVIEW_CLASS);
        }
        for (const [pane, r] of rects) if (pane !== NEW_PANE) this.pinPane(pane, r);
        return rects;
    }

    pinPane(pane, r) {
        Object.assign(pane.containerEl.style, {
            position: "fixed",
            left: `${r.left}px`,
            top: `${r.top}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
            margin: "0",
            boxSizing: "border-box",
        });
    }

    // The cards glide home and are let go; `instant` lets go at once (a
    // drop: the real layout takes over from where the preview left them)
    clearPanePreview(instant) {
        const p = this.panePreview;
        if (!p) return;
        window.clearTimeout(p.timer);
        const done = () => {
            if (this.panePreview !== p) return;
            this.panePreview = null;
            document.body.removeClass(PANE_PREVIEW_CLASS);
            for (const pane of p.panes) {
                for (const key of ["position", "left", "top", "width", "height", "margin", "box-sizing"]) {
                    pane.containerEl.style.removeProperty(key);
                }
            }
        };
        if (instant || !p.live) return done();
        for (const pane of p.panes) this.pinPane(pane, p.home.get(pane));
        p.timer = window.setTimeout(done, PANE_PREVIEW_MS + 40);
    }

    // ---- Split screen: a page leaves the split, into the top tab bar ----

    // Where in the top tab bar (x, y) would drop something: the index among
    // its tabs (the joined split tab counts as one), or null when it's not
    // over the bar. `skip`: an element of the bar that doesn't take drops.
    barDropAt(x, y, skip) {
        const bar = this.sharedBar;
        if (!bar?.isConnected) return null;
        const r = bar.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top - 24 || y > r.bottom + 16) return null;
        if (skip) {
            const k = skip.getBoundingClientRect();
            if (x >= k.left && x <= k.right) return null;
        }
        let index = 0;
        for (const el of bar.children) {
            if (!el.hasClass("goguryeo-stab") || el.hasClass("is-leaving")) continue;
            const t = el.getBoundingClientRect();
            if (x > t.left + t.width / 2) index++;
        }
        return index;
    }

    // An empty glass slot in the bar where the page will stand; it grows in,
    // pushing the tabs aside, and moves by shrinking away and growing anew
    showBarSlot(index) {
        const bar = this.sharedBar;
        if (!bar) return;
        if (this.barSlot?.isConnected && this.barSlot.gIndex === index) return;
        this.hideBarSlot();
        const slot = this.barSlot = createDiv("goguryeo-stab-slot");
        slot.gIndex = index;
        this.placeBarSlot();
        slot.animate([{ flexGrow: 0, opacity: 0 }, { flexGrow: 1, opacity: 1 }], { duration: 380, easing: TAB_SPRING });
        this.followBar(420);
    }

    // The tabs are changing width (a slot or a tab growing or shrinking):
    // the glass pill follows them frame by frame for `ms`
    followBar(ms) {
        this.followUntil = Math.max(this.followUntil ?? 0, performance.now() + ms);
        if (this.followFrame) return;
        const step = () => {
            const bar = this.sharedBar;
            if (!bar?.isConnected || performance.now() > this.followUntil) {
                this.followFrame = 0;
                this.scheduleThumbs();
                return;
            }
            this.placeThumb(bar, bar, SHARED_ACTIVE, SHARED_INNER);
            this.followFrame = window.requestAnimationFrame(step);
        };
        this.followFrame = window.requestAnimationFrame(step);
    }

    // Puts the slot at its index (the bar redraws by appending its tabs anew)
    placeBarSlot() {
        const bar = this.sharedBar;
        const slot = this.barSlot;
        if (!bar || !slot) return;
        const tabs = [...bar.children].filter((el) => el.hasClass("goguryeo-stab") && !el.hasClass("is-leaving"));
        const before = tabs[slot.gIndex] ?? tabs[tabs.length - 1]?.nextSibling ?? null;
        if (slot.parentElement === bar && slot.nextSibling === before) return;
        bar.insertBefore(slot, before);
    }

    hideBarSlot(now = false) {
        const slot = this.barSlot;
        this.barSlot = null;
        if (!slot) return;
        if (now) return slot.remove();
        slot.animate([{ flexGrow: 1, opacity: 1 }, { flexGrow: 0, opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" })
            .finished.catch(() => {}).finally(() => slot.remove());
        this.followBar(240);
    }

    // A split page becomes a tab of its own, at `index` in the bar. Its pane
    // leaves the split: its tabs join the pane beside the drop (a pane left
    // empty closes itself), and the page stands where it was dropped. It
    // then shows alone, as a normal tab does.
    unsplitPage(leaf, index) {
        const { workspace } = this.app;
        const src = leaf?.parent;
        const pages = this.splitPages;
        const groups = (this.splitGroups ?? []).filter((p) => p.parent);
        if (!src || !pages || groups.length < 2) return;
        const tabs = [...(this.sharedBar?.children ?? [])].filter((el) => el.hasClass("goguryeo-stab") && !el.hasClass("is-leaving"));
        const leafOf = (el) => (el && !el.hasClass("goguryeo-stab-split") && el.gLeaf?.parent ? el.gLeaf : null);
        let anchor = leafOf(tabs[index]);
        let after = false;
        if (!anchor) {
            anchor = leafOf(tabs[index - 1]);
            after = !!anchor;
        }
        const mates = this.splitPanes(this.splitOf?.get(src)).filter((p) => p !== src);
        const home = anchor && anchor.parent !== src ? anchor.parent : mates[0] ?? groups.find((p) => p !== src);
        if (!home) return;
        if (!anchor) {
            // Only the joined tab beside the drop: next to the split's page
            anchor = pages.get(home);
            after = !tabs[index]?.hasClass("goguryeo-stab-split");
        }
        for (const l of [...src.children]) {
            src.removeChild(l); // src closes once empty
            home.insertChild(home.children.length, l);
        }
        pages.delete(src);
        this.splitOf?.delete(src);
        if (anchor && anchor !== leaf) {
            home.removeChild(leaf);
            let at = home.children.indexOf(anchor);
            at = at < 0 ? home.children.length : at + (after ? 1 : 0);
            home.insertChild(at, leaf);
        }
        home.selectTab(leaf); // on screen, or Obsidian keeps showing the old tab
        this.dropInTab = leaf; // its new tab pops in
        workspace.setActiveLeaf(leaf, { focus: true });
        workspace.requestSaveLayout?.();
        this.scheduleThumbs();
    }

    // A page of the joined tab dragged out of it, along the bar: it becomes
    // a tab of its own where it's dropped. A mouse drags as soon as it
    // moves; a finger holds first (CARD_HOLD_MS), so a quick swipe still
    // scrolls the bar.
    onPartDown(e, part, leaf, tab = false) {
        if (e.button > 0 || this.partDrag || this.paneDrag || e.target.closest(".goguryeo-stab-close")) return;
        e.stopPropagation(); // a part's drag is not the joined tab's
        const d = this.partDrag = { part, leaf, tab, id: e.pointerId, x: e.clientX, y: e.clientY, live: false, touch: e.pointerType === "touch", target: null };
        if (d.touch) d.timer = window.setTimeout(() => this.liftPart(d), CARD_HOLD_MS);
        const move = (ev) => this.onPartMove(ev);
        const up = (ev) => this.endPartDrag(ev, false);
        const cancel = (ev) => this.endPartDrag(ev, true);
        const touch = (ev) => { if (d.live) ev.preventDefault(); }; // the bar must not scroll under it
        const key = (ev) => {
            if (ev.key !== "Escape" || !d.live) return;
            ev.preventDefault();
            ev.stopPropagation();
            this.endPartDrag(null, true);
        };
        window.addEventListener("pointermove", move, true);
        window.addEventListener("pointerup", up, true);
        window.addEventListener("pointercancel", cancel, true);
        window.addEventListener("touchmove", touch, { capture: true, passive: false });
        window.addEventListener("keydown", key, true);
        d.off = () => {
            window.clearTimeout(d.timer);
            window.removeEventListener("pointermove", move, true);
            window.removeEventListener("pointerup", up, true);
            window.removeEventListener("pointercancel", cancel, true);
            window.removeEventListener("touchmove", touch, { capture: true });
            window.removeEventListener("keydown", key, true);
        };
    }

    liftPart(d) {
        if (this.partDrag !== d || d.live) return;
        d.live = true;
        const r = d.part.getBoundingClientRect();
        const ghost = d.ghost = d.part.cloneNode(true);
        ghost.addClass("goguryeo-stab-ghost");
        ghost.style.minWidth = r.width + "px";
        ghost.style.height = r.height + "px";
        document.body.appendChild(ghost);
        d.gx = d.x - r.left;
        d.gy = d.y - r.top;
        this.placePartGhost(d);
        window.requestAnimationFrame(() => ghost.addClass("is-lifted"));
        d.part.addClass("is-placeholder");
        if (d.tab) this.followBar(400); // its place closes up
        document.body.addClass("goguryeo-pane-dragging");
        this.haptic();
    }

    placePartGhost(d) {
        d.ghost.style.left = (d.x - d.gx) + "px";
        d.ghost.style.top = (d.y - d.gy) + "px";
    }

    onPartMove(e) {
        const d = this.partDrag;
        if (!d || e.pointerId !== d.id) return;
        if (!d.live) {
            if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
            if (d.touch) return this.endPartDrag(null, true); // moved before the hold: a scroll
            this.liftPart(d);
        }
        e.preventDefault();
        d.x = e.clientX;
        d.y = e.clientY;
        this.placePartGhost(d);
        // Back over the joined tab: it stays in the split. A normal tab over
        // itself, or right beside it, stays where it is.
        let index = this.barDropAt(d.x, d.y, d.tab ? d.part : d.part.closest(".goguryeo-stab-split"));
        if (d.tab && index != null) {
            const own = this.barTabs().indexOf(d.part);
            if (index === own || index === own + 1) index = null;
        }
        // A normal tab carried down onto the edge of a pane on screen: it
        // becomes a pane of the split there, and the panes make room
        if (d.tab && this.tabToEdge(d, index)) return;
        if (index === d.target) return;
        d.target = index;
        if (index == null) this.hideBarSlot();
        else {
            this.showBarSlot(index);
            this.haptic();
        }
    }

    // Over the panes (not the bar, the split on screen): the edge a tab
    // would split, previewed. Returns whether the tab is over an edge.
    tabToEdge(d, index) {
        const bar = this.sharedBar?.getBoundingClientRect();
        const offBar = !bar || d.y > bar.bottom + 16;
        const lone = document.body.hasClass(SOLO_CLASS);
        const t = index == null && offBar ? this.paneDropAt(d.x, d.y, null) : null;
        // not onto the dragged tab itself, shown alone
        const edge = t && t.side !== "center" && !(lone && t.pane.children[t.pane.currentTab] === d.leaf) ? t : null;
        if (!edge) {
            if (d.edge) {
                d.edge = null;
                d.drop?.removeClass("is-shown");
                this.clearPanePreview();
            }
            return false;
        }
        if (d.target != null) {
            d.target = null;
            this.hideBarSlot();
        }
        if (edge.pane === d.edge?.pane && edge.side === d.edge?.side) return true;
        d.edge = edge;
        d.drop ??= document.body.createDiv("goguryeo-pane-drop");
        d.lone = lone;
        const r = (lone ? this.previewHalves(edge) : this.previewPanes(NEW_PANE, edge))?.get(NEW_PANE);
        if (r) {
            const pad = 6;
            Object.assign(d.drop.style, {
                left: `${r.left + pad}px`, top: `${r.top + pad}px`,
                width: `${Math.max(0, r.width - pad * 2)}px`, height: `${Math.max(0, r.height - pad * 2)}px`,
            });
        }
        d.drop.addClass("is-shown");
        this.haptic();
        return true;
    }

    // The tab leaves its pane and becomes a pane of the split beside
    // `t.pane`, at its edge (Obsidian's splitLeaf, as a dropped tab does)
    splitTabInto(leaf, t) {
        const { workspace } = this.app;
        const src = leaf?.parent;
        const anchor = t.pane.children[t.pane.currentTab] ?? t.pane.children[0];
        if (!src || !anchor || anchor === leaf) return;
        const shown = src.children[src.currentTab];
        src.removeChild(leaf);
        if (shown && shown !== leaf && shown.parent === src) src.selectTab(shown);
        const dir = t.side === "left" || t.side === "right" ? "vertical" : "horizontal";
        workspace.splitLeaf(anchor, leaf, dir, t.side === "left" || t.side === "top");
        if (leaf.parent) {
            (this.splitPages ??= new Map()).set(leaf.parent, leaf);
            const id = this.splitOf?.get(t.pane) ?? this.shownSplit;
            if (id != null) (this.splitOf ??= new Map()).set(leaf.parent, id);
        }
        workspace.setActiveLeaf(leaf, { focus: true });
        workspace.requestSaveLayout?.();
        this.scheduleThumbs();
    }

    // A lone tab on screen and a tab dropped on its edge: the lone tab's
    // card halves, the new one in the half by that edge
    previewHalves(t) {
        const pane = t.pane;
        let p = this.panePreview;
        if (p) window.clearTimeout(p.timer);
        else p = this.panePreview = { panes: [pane], home: new Map([[pane, pane.containerEl.getBoundingClientRect()]]) };
        const r = p.home.get(pane);
        const gap = 10;
        const across = t.side === "left" || t.side === "right";
        const first = t.side === "left" || t.side === "top";
        const half = across ? (r.width - gap) / 2 : (r.height - gap) / 2;
        const a = across ? new DOMRect(r.left, r.top, half, r.height) : new DOMRect(r.left, r.top, r.width, half);
        const b = across ? new DOMRect(r.left + half + gap, r.top, half, r.height) : new DOMRect(r.left, r.top + half + gap, r.width, half);
        const rects = new Map([[NEW_PANE, first ? a : b], [pane, first ? b : a]]);
        if (!p.live) {
            p.live = true;
            this.pinPane(pane, r);
            void document.body.offsetWidth;
            document.body.addClass(PANE_PREVIEW_CLASS);
        }
        this.pinPane(pane, rects.get(pane));
        return rects;
    }

    // A new split of two tabs, `lone` (on screen alone) and `leaf`
    // (dropped on its edge, at `side`): each gets a pane of its own (the
    // lone tab's pane, if it holds nothing else and is in no split), side
    // by side, and the two panes make a split of their own, apart from
    // any other. It comes on screen; the rest folds away.
    makeSplit(lone, leaf, side) {
        const { workspace } = this.app;
        const home = lone?.parent;
        if (!home || !leaf?.parent || leaf === lone) return;
        const pages = (this.splitPages ??= new Map());
        const of = (this.splitOf ??= new Map());
        this.loosePanes ??= new WeakSet();
        this.splitSeq ??= 1;
        const dir = side === "left" || side === "right" ? "vertical" : "horizontal";
        const before = side === "left" || side === "top";
        const src = leaf.parent;
        const srcShown = src.children[src.currentTab];
        src.removeChild(leaf);
        if (srcShown && srcShown !== leaf && srcShown.parent === src) src.selectTab(srcShown);
        let paneA = home;
        if (home.children.length > 1 || of.has(home)) {
            // its pane holds more: the lone tab moves to a pane of its own
            home.removeChild(lone);
            const back = pages.get(home);
            if (back?.parent === home) home.selectTab(back);
            const anchor = home.children[home.currentTab] ?? home.children[0];
            workspace.splitLeaf(anchor, lone, dir, false);
            paneA = lone.parent;
        }
        workspace.splitLeaf(lone, leaf, dir, before);
        const paneB = leaf.parent;
        if (!paneA || !paneB) return;
        const id = this.splitSeq++;
        for (const [pane, page] of [[paneA, lone], [paneB, leaf]]) {
            pages.set(pane, page);
            of.set(pane, id);
            this.loosePanes.delete(pane);
        }
        this.shownSplit = id;
        workspace.setActiveLeaf(leaf, { focus: true });
        workspace.requestSaveLayout?.();
        this.scheduleThumbs();
    }

    endPartDrag(e, cancelled) {
        const d = this.partDrag;
        if (!d || (e && e.pointerId !== d.id)) return;
        this.partDrag = null;
        d.off();
        d.ghost?.remove();
        d.drop?.remove();
        const toEdge = !cancelled && d.live && d.edge;
        if (toEdge) this.flipSkip = true;
        this.clearPanePreview(!!toEdge);
        if (toEdge) {
            this.hideBarSlot(true);
            d.part.removeClass("is-placeholder");
            document.body.removeClass("goguryeo-pane-dragging");
            this.swallowPartClick = true;
            window.setTimeout(() => { this.swallowPartClick = false; }, 400);
            try {
                if (d.lone) this.makeSplit(d.edge.pane.children[d.edge.pane.currentTab], d.leaf, d.edge.side);
                else this.splitTabInto(d.leaf, d.edge);
                this.haptic();
            } catch (err) {
                console.error("Goguryeo: couldn't split the tab in", err);
            }
            return;
        }
        d.part.removeClass("is-placeholder");
        if (d.tab) this.followBar(400);
        document.body.removeClass("goguryeo-pane-dragging");
        if (d.live) {
            // the click that ends a drag isn't a tap on the page
            this.swallowPartClick = true;
            window.setTimeout(() => { this.swallowPartClick = false; }, 400);
        }
        const drop = !cancelled && d.live && d.target != null;
        this.hideBarSlot(drop);
        if (!drop) return;
        try {
            if (d.tab) this.moveTab(d.leaf, d.target);
            else this.unsplitPage(d.leaf, d.target);
            this.haptic();
        } catch (err) {
            console.error("Goguryeo: couldn't move the tab", err);
        }
    }

    // The bar's tabs, in order (the joined tab counts as one)
    barTabs() {
        return [...(this.sharedBar?.children ?? [])].filter((el) => el.hasClass("goguryeo-stab") && !el.hasClass("is-leaving"));
    }

    // A normal tab moves to `index` in the bar. The bar shows the panes' tabs
    // in order (the joined tab where its first page is), so the tab's leaf
    // moves beside its new neighbour's leaf, into that pane if need be.
    // What each pane shows stays as it was.
    moveTab(leaf, index) {
        const { workspace } = this.app;
        const src = leaf?.parent;
        if (!src) return;
        const tabs = this.barTabs();
        const pages = this.splitPages ?? new Map();
        const leafAt = (el) => {
            if (!el) return null;
            if (!el.hasClass("goguryeo-stab-split")) return el.gLeaf?.parent ? el.gLeaf : null;
            // a joined tab stands where its split's first page is
            const pane = this.splitPanes(el.gSplit)[0];
            return pane ? pages.get(pane) ?? null : null;
        };
        let anchor = leafAt(tabs[index]);
        let after = false;
        if (!anchor) {
            anchor = leafAt(tabs[index - 1]);
            after = true;
        }
        if (!anchor || anchor === leaf || !anchor.parent) return;
        const dst = anchor.parent;
        const solo = workspace.getMostRecentLeaf(workspace.rootSplit) === leaf;
        const shown = new Map([src, dst].map((p) => [p, p.children[p.currentTab]]));
        src.removeChild(leaf);
        const at = dst.children.indexOf(anchor) + (after ? 1 : 0);
        dst.insertChild(at, leaf);
        if (solo) {
            dst.selectTab(leaf);
            workspace.setActiveLeaf(leaf, { focus: true });
        } else {
            for (const [pane, l] of shown) if (l && l !== leaf && l.parent === pane) pane.selectTab(l);
            if (shown.get(src) === leaf && pages.get(src)) src.selectTab(pages.get(src));
        }
        workspace.requestSaveLayout?.();
        this.scheduleThumbs();
    }

    // Move a whole pane (all its tabs) beside another, or swap the two.
    // A pane left empty closes itself, so each side keeps a stand-in tab
    // until the real ones have arrived.
    movePane(src, dst, side) {
        const { workspace } = this.app;
        if (!src?.parent || !dst?.parent || src === dst) return;
        const active = workspace.getMostRecentLeaf(workspace.rootSplit);
        const pages = (this.splitPages ??= new Map());
        const srcPage = pages.get(src);
        const dstPage = pages.get(dst);
        const srcShown = src.children[src.currentTab];
        const dstShown = dst.children[dst.currentTab];
        const moveAll = (from, to, leaves) => {
            for (const leaf of leaves) {
                from.removeChild(leaf);
                to.insertChild(to.children.length, leaf);
            }
        };
        if (side === "center") {
            const a = [...src.children];
            const b = [...dst.children];
            const keepA = workspace.createLeafInParent(src, src.children.length);
            const keepB = workspace.createLeafInParent(dst, dst.children.length);
            moveAll(src, dst, a);
            moveAll(dst, src, b);
            keepA.detach();
            keepB.detach();
            const of = (this.splitOf ??= new Map());
            const srcId = of.get(src);
            const dstId = of.get(dst);
            if (dstPage) pages.set(src, dstPage);
            if (srcPage) pages.set(dst, srcPage);
            if (dstId != null) of.set(src, dstId);
            if (srcId != null) of.set(dst, srcId);
            if (dstShown) src.selectTab(dstShown);
            if (srcShown) dst.selectTab(srcShown);
        } else {
            const anchor = dstShown ?? dst.children[0];
            const sideways = side === "left" || side === "right";
            const keep = workspace.createLeafBySplit(anchor, sideways ? "vertical" : "horizontal", side === "left" || side === "top");
            const target = keep.parent;
            moveAll(src, target, [...src.children]); // src closes once empty
            keep.detach();
            const of = (this.splitOf ??= new Map());
            const srcId = of.get(src);
            pages.delete(src);
            of.delete(src);
            if (srcPage) pages.set(target, srcPage);
            if (srcId != null) of.set(target, srcId);
            if (srcShown) target.selectTab(srcShown);
        }
        if (active?.parent) workspace.setActiveLeaf(active, { focus: false });
        if (!this.flipSkip) this.flipForce = true; // the pages glide to their new cards
        workspace.requestSaveLayout?.();
        this.scheduleThumbs();
    }

    // ---- Split screen, Chrome style: one tab row, the split as one tab ----

    // Like Chrome's split view, with any number of splits. A split is a set
    // of panes, each with one page of it (`splitPages`: pane → leaf,
    // `splitOf`: pane → the split's id); a pane is in one split at most,
    // and every tab that isn't a page is a normal tab. What shows follows
    // the focused leaf: a page of a split → that split's panes, each on its
    // page, everything else folded away (applyFold); a normal tab → it
    // alone. A new pane joins the split on screen (with a lone tab on
    // screen, the split of its pane; a pane in none makes a new split with
    // it). A split left with one pane ends. The splits are remembered
    // across restarts as lists of their pages' leaf ids. Returns
    // { solo: the lone tab, split: the split on screen }.
    syncSplitPages(groups) {
        const { workspace } = this.app;
        if (!this.splitPages) {
            this.splitPages = new Map();
            this.splitOf = new Map();
            this.loosePanes = new WeakSet(); // panes in no split, known
            this.lastSplitPages ??= new Map(); // split → its page focused last
            this.splitSeq ??= 1;
            let saved = [];
            try {
                saved = JSON.parse(this.app.loadLocalStorage(MEMBERS_KEY) || "[]");
            } catch (e) { /* none yet */ }
            if (!Array.isArray(saved)) saved = [];
            if (saved.length && !Array.isArray(saved[0])) saved = [saved]; // the old format: one split
            this.savedSplits = saved.filter(Array.isArray);
        }
        const pages = this.splitPages;
        const of = this.splitOf;
        for (const pane of [...pages.keys()]) {
            if (!groups.includes(pane)) {
                pages.delete(pane);
                of.delete(pane);
            }
        }
        const focused = workspace.getMostRecentLeaf(workspace.rootSplit);
        if (this.savedSplits) {
            // Back from a restart: each split finds its panes by its pages
            for (const ids of this.savedSplits) {
                const id = this.splitSeq++;
                for (const pane of groups) {
                    const leaf = !of.has(pane) && pane.children.find((l) => ids.includes(l.id));
                    if (!leaf) continue;
                    pages.set(pane, leaf);
                    of.set(pane, id);
                }
            }
            // a split found with one pane only is no split
            const found = new Map();
            for (const id of of.values()) found.set(id, (found.get(id) ?? 0) + 1);
            for (const [pane, id] of [...of]) {
                if (found.get(id) > 1) continue;
                of.delete(pane);
                pages.delete(pane);
            }
            if (!of.size) {
                // nothing saved (or nothing found): every pane in one split
                const id = this.splitSeq++;
                for (const pane of groups) {
                    pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
                    of.set(pane, id);
                }
            }
            for (const pane of groups) if (!of.has(pane)) this.loosePanes.add(pane);
            this.savedSplits = null;
        }
        const live = () => new Set(of.values());
        for (const pane of groups) {
            if (of.has(pane)) {
                const page = pages.get(pane);
                if (page?.parent === pane) continue;
                if (page) {
                    // Its page was closed (or moved away): the pane leaves the
                    // split, its other tabs stay normal tabs. A tab beside it
                    // must not take the page's place in the split.
                    of.delete(pane);
                    pages.delete(pane);
                    this.loosePanes.add(pane);
                    continue;
                }
                pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
                continue;
            }
            if (this.loosePanes.has(pane)) continue;
            // A new pane: it joins the split on screen
            let id = live().has(this.shownSplit) ? this.shownSplit : null;
            const host = focused?.parent && focused.parent !== pane && groups.includes(focused.parent) ? focused.parent : null;
            if (id == null && host) {
                id = of.get(host);
                if (id == null) {
                    // the lone tab's pane is in no split: the two make one
                    id = this.splitSeq++;
                    pages.set(host, focused);
                    of.set(host, id);
                    this.loosePanes.delete(host);
                }
            }
            if (id == null) id = this.splitSeq++;
            pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
            of.set(pane, id);
        }
        // A split with one pane left ends: its page is a normal tab now
        const count = new Map();
        for (const id of of.values()) count.set(id, (count.get(id) ?? 0) + 1);
        for (const [pane, id] of [...of]) {
            if (count.get(id) > 1) continue;
            of.delete(pane);
            pages.delete(pane);
            this.loosePanes.add(pane);
        }
        const splits = new Map();
        for (const pane of groups) {
            const id = of.get(pane);
            if (id == null) continue;
            if (!splits.has(id)) splits.set(id, []);
            splits.get(id).push(pages.get(pane)?.id);
        }
        const ids = JSON.stringify([...splits.values()].map((list) => list.filter(Boolean)));
        if (ids !== this.savedIds) {
            this.savedIds = ids;
            this.app.saveLocalStorage(MEMBERS_KEY, ids);
        }
        if (!focused || !groups.includes(focused.parent)) {
            return { solo: null, split: live().has(this.shownSplit) ? this.shownSplit : null };
        }
        const id = pages.get(focused.parent) === focused ? of.get(focused.parent) : null;
        if (id != null) {
            this.shownSplit = id;
            this.lastSplitPages.set(id, focused); // where a click on its joined tab returns
            // The split on screen: each of its panes back on its page
            for (const pane of groups) {
                if (of.get(pane) !== id) continue;
                const page = pages.get(pane);
                if (page && pane.children[pane.currentTab] !== page) pane.selectTab(page);
            }
            return { solo: null, split: id };
        }
        this.shownSplit = null;
        return { solo: focused, split: null };
    }

    // The split a leaf is a page of, or null
    splitIdOf(leaf) {
        const pane = leaf?.parent;
        return pane && this.splitPages?.get(pane) === leaf ? this.splitOf?.get(pane) ?? null : null;
    }

    // A split's panes, in layout order
    splitPanes(id) {
        return (this.splitGroups ?? []).filter((pane) => this.splitOf?.get(pane) === id);
    }

    // Where each page of split `id` sits in its panes' area, as fractions
    // [x, y, w, h], from Obsidian's layout (each split's direction and its
    // children's sizes) with the other splits' panes left out, so it holds
    // while the split is folded away too
    splitPlaces(id) {
        const places = new Map();
        const pages = this.splitPages;
        if (!pages) return places;
        const member = (node) => (node.type === "tabs"
            ? this.splitOf?.get(node) === id
            : (node.children ?? []).some(member));
        const walk = (node, x, y, w, h) => {
            if (node.type === "tabs") {
                const leaf = pages.get(node);
                if (leaf) places.set(leaf, [x, y, w, h]);
                return;
            }
            const kids = (node.children ?? []).filter(member);
            const sizes = kids.map((k) => (k.dimension > 0 ? k.dimension : parseFloat(k.containerEl?.style.flexGrow) || 1));
            const total = sizes.reduce((a, b) => a + b, 0) || 1;
            let at = 0;
            kids.forEach((k, i) => {
                const f = sizes[i] / total;
                if (node.direction === "vertical") walk(k, x + w * at, y, w * f, h); // side by side
                else walk(k, x, y + h * at, w, h * f); // stacked
                at += f;
            });
        };
        walk(this.app.workspace.rootSplit, 0, 0, 1, 1);
        return places;
    }

    // A pane about to leave its split page for another tab (the lone tab
    // opening in the same pane): keep a copy of the page first, while it is
    // still on screen, for the tab overview. Obsidian switches tabs through
    // WorkspaceTabs.selectTabIndex, so that is wrapped.
    patchSelectTab() {
        let tabs = null;
        const find = (node) => node?.children?.forEach((child) => {
            if (!tabs && child.type === "tabs") tabs = child;
            else if (!tabs) find(child);
        });
        find(this.app.workspace.rootSplit);
        const proto = tabs && Object.getPrototypeOf(tabs);
        if (!proto || typeof proto.selectTabIndex !== "function") return;
        const plugin = this;
        const own = Object.prototype.hasOwnProperty.call(proto, "selectTabIndex");
        const original = proto.selectTabIndex;
        const patched = function (index, ...rest) {
            try {
                plugin.keepSplitPage(this, this.children?.[index]);
            } catch (e) { /* never block a tab switch */ }
            return original.call(this, index, ...rest);
        };
        proto.selectTabIndex = patched;
        this.register(() => {
            if (proto.selectTabIndex !== patched) return;
            if (own) proto.selectTabIndex = original;
            else delete proto.selectTabIndex;
        });
    }

    keepSplitPage(pane, next) {
        const page = this.splitPages?.get(pane);
        if (!page || !next || next === page || document.body.hasClass(SOLO_CLASS)) return;
        if (pane.children[pane.currentTab] !== page) return;
        const shot = this.snapshotPage(page, true);
        if (shot) (this.splitShots ??= new WeakMap()).set(page, shot);
    }

    // Fold away every pane but those on screen (the lone tab's, or the
    // split's): every part of the layout holding none of them. They keep
    // their place in Obsidian's layout, so they come back as they were.
    applyFold(groups, shown) {
        const body = document.body;
        const solo = shown?.solo ?? null;
        const onScreen = new Set(solo ? [solo.parent]
            : shown?.split != null ? groups.filter((pane) => this.splitOf?.get(pane) === shown.split)
            : groups);
        // A pane about to fold away while on its page: keep a copy of the
        // page for the tab overview, which can't copy a folded pane
        this.splitShots ??= new WeakMap();
        for (const pane of groups) {
            const page = this.splitPages?.get(pane);
            if (onScreen.has(pane) || !page || pane.containerEl.hasClass(SOLO_OFF_CLASS)) continue;
            if (pane.children[pane.currentTab] !== page) continue; // kept as it left
            try {
                const shot = this.snapshotPage(page, true);
                if (shot) this.splitShots.set(page, shot);
            } catch (e) { /* keep the old copy */ }
        }
        const off = new Set();
        const walk = (node) => {
            if (node.type === "tabs") return onScreen.has(node);
            const kids = node.children ?? [];
            const has = kids.map(walk);
            if (has.some(Boolean)) kids.forEach((k, i) => { if (!has[i]) off.add(k.containerEl); });
            return has.some(Boolean);
        };
        if (groups.length) walk(this.app.workspace.rootSplit);
        document.querySelectorAll(`.${SOLO_OFF_CLASS}`).forEach((el) => {
            if (!off.has(el)) el.removeClass(SOLO_OFF_CLASS);
        });
        off.forEach((el) => el.addClass(SOLO_OFF_CLASS));
        body.toggleClass(SOLO_CLASS, !!solo);
        body.toggleClass(FOLDED_CLASS, off.size > 0);
    }

    // The row, in pane order: the split as one joined tab ("A │ B │ C",
    // standing where its first page is), the normal tabs around it. One
    // glass pill sits on what's on screen (the joined tab or the lone tab)
    // and slides between them; the focused page's name is green. Tabs are
    // kept from one update to the next so the pill can slide.
    renderSharedTabs(groups, shown) {
        const solo = shown?.solo ?? null;
        const { workspace } = this.app;
        document.body.addClass(SHARED_TABS_CLASS);
        let bar = this.sharedBar;
        const first = !bar?.isConnected; // a new bar: its tabs don't pop in
        if (first) {
            // Inside the app's box, not on body: the background option
            // isolates .app-container, and a bar on body would then paint
            // over everything in it, a sidebar floating over the note too
            const host = document.body.querySelector(":scope > .app-container") ?? document.body;
            bar = this.sharedBar = host.createDiv("goguryeo-shared-tabs-bar");
            this.sharedTabs = new WeakMap(); // leaf → its tab (or its part of the joined tab)
            this.splitTabs = new Map(); // split → its joined tab
        }
        this.sharedSeen ??= new WeakSet(); // leaves that had a tab in the bar
        this.sharedFirst = first;
        // Where each tab stood, so a closing one shrinks away in its place
        // (the tabs that stay are appended anew below)
        const prevOf = new Map();
        for (const el of bar.children) prevOf.set(el, el.previousElementSibling);
        // where each tab stood, so a tab that changes place slides there
        const was = new Map();
        if (!first) for (const el of bar.children) if (el.hasClass("goguryeo-stab")) was.set(el, el.getBoundingClientRect().left);
        const focused = workspace.getMostRecentLeaf(workspace.rootSplit);
        this.splitTabs ??= new Map();
        const keep = new Set();
        for (const pane of groups) {
            for (const leaf of pane.children) {
                const id = this.splitIdOf(leaf);
                if (id != null) {
                    // each split once, where its first page is
                    if (keep.has(this.splitTabs.get(id))) continue;
                    const tab = this.renderSplitTab(id, groups, shown, focused);
                    keep.add(tab);
                    bar.appendChild(tab);
                    continue;
                }
                let tab = this.sharedTabs.get(leaf);
                if (!tab || tab.hasClass("goguryeo-stab-part")) {
                    tab = this.makeSharedTab(leaf);
                    if (!first && (!this.sharedSeen.has(leaf) || leaf === this.dropInTab)) this.popTab(tab);
                }
                this.sharedSeen.add(leaf);
                keep.add(tab);
                bar.appendChild(tab);
                tab.toggleClass("is-active", leaf === solo);
                tab.toggleClass("is-focused", leaf === solo);
                this.fillTab(tab, leaf);
            }
        }
        for (const el of [...bar.children]) {
            if (!el.hasClass("goguryeo-stab") || keep.has(el)) continue;
            if (!el.hasClass("is-leaving")) {
                el.gPrev = prevOf.get(el);
                this.leaveTab(el);
            }
            const prev = el.gPrev;
            if (prev?.parentElement === bar && prev.nextSibling !== el) prev.after(el);
        }
        for (const [id, tab] of [...this.splitTabs]) if (!keep.has(tab)) this.splitTabs.delete(id);
        if (was.size && !this.reducedMotion()) {
            let slid = false;
            for (const el of keep) {
                const from = was.get(el);
                if (from == null || el.getAnimations().length) continue;
                const dx = from - el.getBoundingClientRect().left;
                if (Math.abs(dx) < 2) continue;
                el.animate([{ translate: `${dx}px 0` }, { translate: "0 0" }], { duration: 340, easing: TAB_SPRING });
                slid = true;
            }
            if (slid) this.followBar(380);
        }
        this.dropInTab = null;
        this.placeBarSlot();
        this.placeThumb(bar, bar, SHARED_ACTIVE, SHARED_INNER);
    }

    renderSplitTab(id, groups, shown, focused) {
        const pages = this.splitPages ?? new Map();
        let tab = this.splitTabs.get(id);
        if (!tab) {
            tab = createDiv({ cls: "goguryeo-stab goguryeo-stab-split" });
            tab.gSplit = id;
            this.splitTabs.set(id, tab);
            tab.createDiv("goguryeo-stab-inner");
            if (!this.sharedFirst) this.popTab(tab);
            // The names fill only the middle of the joined tab; a click
            // anywhere else on it brings the split back too, on the page
            // that was focused last (a click on a name goes to that page)
            tab.addEventListener("click", () => {
                const own = this.splitPanes(id).map((pane) => this.splitPages?.get(pane)).filter(Boolean);
                const last = this.lastSplitPages?.get(id);
                const leaf = own.includes(last) ? last : own[0];
                if (!leaf) return;
                this.haptic();
                this.app.workspace.setActiveLeaf(leaf, { focus: true });
            });
        }
        const solo = shown?.split !== id;
        const inner = tab.querySelector(".goguryeo-stab-inner");
        const prevParts = new Map();
        for (const el of inner.children) prevParts.set(el, el.previousElementSibling);
        tab.toggleClass("is-active", !solo);
        const parts = new Set();
        for (const pane of groups) {
            if (this.splitOf?.get(pane) !== id) continue;
            const leaf = pages.get(pane);
            if (!leaf) continue;
            let part = this.sharedTabs.get(leaf);
            if (!part || !part.hasClass("goguryeo-stab-part")) {
                part = this.makeSharedTab(leaf, true);
                if (!this.sharedFirst && !this.sharedSeen.has(leaf)) this.popPart(part);
            }
            this.sharedSeen.add(leaf);
            parts.add(part);
            inner.appendChild(part);
            part.toggleClass("is-focused", !solo && leaf === focused);
            this.fillTab(part, leaf);
        }
        for (const el of [...inner.children]) {
            if (parts.has(el)) continue;
            if (!el.hasClass("is-leaving")) {
                el.gPrev = prevParts.get(el);
                this.leavePart(el);
            }
            const prev = el.gPrev;
            if (prev?.parentElement === inner && prev.nextSibling !== el) prev.after(el);
        }
        return tab;
    }

    // ---- Tabs coming and going (exaggerated on purpose: the user's ask) ----

    reducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // A new tab in the shared bar: it springs up from nothing, overshoots
    // and settles, pushing the others aside
    popTab(tab) {
        if (this.reducedMotion()) return;
        tab.style.minWidth = "0px";
        tab.animate([
            { flexGrow: 0, opacity: 0, scale: "0.3", translate: "0 -10px" },
            { flexGrow: 1.2, opacity: 1, scale: "1.14", translate: "0 0", offset: 0.6 },
            { flexGrow: 1, opacity: 1, scale: "1", translate: "0 0" },
        ], { duration: 560, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" })
            .finished.catch(() => {}).finally(() => tab.style.removeProperty("min-width"));
        this.followBar(600);
    }

    // A closed tab: it swells for a beat, then shrinks to nothing in its place
    leaveTab(tab) {
        tab.addClass("is-leaving");
        tab.removeClass("is-active", "is-focused");
        if (this.reducedMotion()) return tab.remove();
        tab.style.minWidth = "0px";
        tab.style.pointerEvents = "none";
        tab.animate([
            { flexGrow: 1, opacity: 1, scale: "1" },
            { flexGrow: 1, opacity: 1, scale: "1.1", offset: 0.22 },
            { flexGrow: 0, opacity: 0, scale: "0.3" },
        ], { duration: 360, easing: "ease-in", fill: "forwards" })
            .finished.catch(() => {}).finally(() => tab.remove());
        this.followBar(400);
    }

    // The same for a page's name inside the joined split tab
    popPart(part) {
        if (this.reducedMotion()) return;
        part.animate([
            { opacity: 0, scale: "0.3" },
            { opacity: 1, scale: "1.18", offset: 0.6 },
            { opacity: 1, scale: "1" },
        ], { duration: 520, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" });
        this.followBar(560);
    }

    leavePart(part) {
        part.addClass("is-leaving");
        if (this.reducedMotion()) return part.remove();
        const w = part.offsetWidth;
        part.style.overflow = "hidden";
        part.style.pointerEvents = "none";
        part.animate([
            { maxWidth: w + "px", opacity: 1, scale: "1", paddingLeft: "9px", paddingRight: "9px" },
            { maxWidth: w + "px", opacity: 1, scale: "1.12", paddingLeft: "9px", paddingRight: "9px", offset: 0.22 },
            { maxWidth: "0px", opacity: 0, scale: "0.3", paddingLeft: "0px", paddingRight: "0px" },
        ], { duration: 340, easing: "ease-in", fill: "forwards" })
            .finished.catch(() => {}).finally(() => part.remove());
        this.followBar(380);
    }

    // Obsidian's own tab rows (one pane, or each card): Obsidian grows a new
    // tab's width; the plugin adds the springy pop on its contents. A closed
    // tab Obsidian simply drops, so a copy of it takes its place and shrinks
    // away. A tab only moved (re-appended, or dragged to another pane) does
    // neither.
    watchTabAnimations(strip) {
        if (!strip.closest(".mod-root")) return;
        this.tabSeen ??= new WeakSet();
        for (const el of strip.children) this.tabSeen.add(el);
        if (!this.tabAnimObserver) {
            this.tabAnimObserver = new MutationObserver((list) => this.onTabMutations(list));
            this.register(() => {
                this.tabAnimObserver.disconnect();
                document.querySelectorAll(".goguryeo-tab-leaving").forEach((el) => el.remove());
            });
        }
        this.tabAnimObserver.observe(strip, { childList: true });
    }

    onTabMutations(list) {
        if (this.app.customCss?.theme !== "Goguryeo" || this.reducedMotion()) return;
        // Headers of tabs that still exist: those were only moved or re-added
        let live = null;
        const isLive = (el) => {
            if (!live) {
                live = new Set();
                this.app.workspace.iterateAllLeaves((leaf) => { if (leaf.tabHeaderEl) live.add(leaf.tabHeaderEl); });
            }
            return live.has(el);
        };
        const isTab = (el) => el.nodeType === 1 && el.hasClass("workspace-tab-header") && !el.hasClass("goguryeo-tab-leaving");
        for (const m of list) {
            for (const el of m.addedNodes) {
                if (!isTab(el) || this.tabSeen.has(el)) continue;
                this.tabSeen.add(el);
                el.querySelector(".workspace-tab-header-inner")?.animate([
                    { opacity: 0, scale: "0.3", translate: "0 -10px" },
                    { opacity: 1, scale: "1.14", translate: "0 0", offset: 0.6 },
                    { opacity: 1, scale: "1", translate: "0 0" },
                ], { duration: 560, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" });
            }
            const strip = m.target;
            for (const el of m.removedNodes) {
                if (!isTab(el) || el.isConnected || !strip.isConnected || isLive(el)) continue;
                const ghost = el.cloneNode(true);
                ghost.removeClass("is-active", "mod-active", "is-focused");
                ghost.addClass("goguryeo-tab-leaving");
                const next = m.nextSibling?.parentNode === strip ? m.nextSibling : null;
                strip.insertBefore(ghost, next);
                const w = ghost.getBoundingClientRect().width;
                ghost.animate([
                    { width: w + "px", opacity: 1, scale: "1" },
                    { width: w + "px", opacity: 1, scale: "1.1", offset: 0.22 },
                    { width: "0px", opacity: 0, scale: "0.3" },
                ], { duration: 360, easing: "ease-in", fill: "forwards" })
                    .finished.catch(() => {}).finally(() => ghost.remove());
            }
        }
    }

    // Icon and name; the icon shows while the tab is on screen, as on
    // Obsidian's own tabs
    fillTab(tab, leaf) {
        const title = leaf.getDisplayText();
        const icon = leaf.getIcon?.() ?? "";
        if (tab.gIcon !== icon) {
            tab.gIcon = icon;
            const iconEl = tab.querySelector(".goguryeo-stab-icon");
            iconEl.empty();
            if (icon) setIcon(iconEl, icon);
        }
        const titleEl = tab.querySelector(".goguryeo-stab-title");
        if (titleEl.textContent !== title) {
            titleEl.setText(title);
            tab.setAttr("aria-label", title);
        }
    }

    // A normal tab, or (part) one page of the joined split tab. Either acts
    // like Obsidian's tab: click focuses it, × or a middle click closes it,
    // right click opens its menu; a normal tab also drags like one (to
    // split, or into another pane).
    makeSharedTab(leaf, part = false) {
        const { workspace } = this.app;
        const tab = createDiv(part ? "goguryeo-stab-part" : "goguryeo-stab");
        const inner = part ? tab : tab.createDiv("goguryeo-stab-inner");
        const close = inner.createDiv({ cls: "clickable-icon goguryeo-stab-close", attr: { "aria-label": "Close" } });
        setIcon(close, "lucide-x");
        inner.createDiv("goguryeo-stab-icon");
        inner.createDiv("goguryeo-stab-title");
        close.addEventListener("click", (e) => {
            e.stopPropagation();
            this.haptic();
            leaf.detach();
        });
        tab.gLeaf = leaf;
        // Dragged along the bar: a page leaves the split, a normal tab moves
        tab.addEventListener("pointerdown", (e) => this.onPartDown(e, tab, leaf, !part));
        tab.addEventListener("click", (e) => {
            e.stopPropagation(); // a part's click is not the joined tab's
            if (this.swallowPartClick) {
                this.swallowPartClick = false;
                return;
            }
            this.haptic();
            workspace.setActiveLeaf(leaf, { focus: true });
        });
        tab.addEventListener("mousedown", (e) => {
            if (e.button === 1) e.preventDefault(); // no autoscroll
        });
        tab.addEventListener("auxclick", (e) => {
            if (e.button === 1) leaf.detach();
        });
        tab.addEventListener("contextmenu", (e) => {
            e.stopPropagation();
            leaf.onOpenTabHeaderMenu?.(e, tab);
        });
        this.sharedTabs.set(leaf, tab);
        return tab;
    }

    removeSharedTabs() {
        document.body.removeClass(SHARED_TABS_CLASS);
        this.sharedBar?.remove();
        this.sharedBar = null;
        this.splitTabs = new Map();
        this.applyFold([], null);
    }

    // ---- Split screen: the grip's menu (a tap on the bar on top of a pane) ----

    // A glass panel under the grip, design B on the canvas: four tiles,
    // Own tab (the page leaves the split as a normal tab), Swap (with the
    // other pane; with 3+ panes, pick which from their names), Move (left,
    // right, top or bottom of the split; where it is now is green) and
    // Close (the page). Esc, a tap outside or a done action closes it.
    openGripMenu(pane, grip) {
        this.closeGripMenu(true);
        const page = this.splitPages?.get(pane);
        if (!page || !grip?.isConnected) return;
        const id = this.splitOf?.get(pane);
        const mates = this.splitPanes(id).filter((p) => p !== pane && !p.containerEl.hasClass(SOLO_OFF_CLASS));
        const menu = document.body.createDiv(GRIP_MENU_CLASS);
        grip.addClass("is-open");
        const tiles = menu.createDiv("goguryeo-grip-menu-tiles");
        const extra = menu.createDiv("goguryeo-grip-menu-extra");
        const tile = (icon, label, cls, run) => {
            const b = tiles.createEl("button", { cls: "goguryeo-grip-tile" + (cls ? " " + cls : ""), attr: { "aria-label": label } });
            setIcon(b.createDiv("goguryeo-grip-tile-icon"), icon);
            b.createDiv({ cls: "goguryeo-grip-tile-label", text: label });
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                this.haptic();
                run(b);
            });
            return b;
        };
        const done = (action) => {
            this.closeGripMenu();
            try {
                action();
            } catch (err) {
                console.error("Goguryeo: grip menu", err);
            }
        };
        const show = (b, fill) => {
            const open = !b.hasClass("is-on");
            tiles.querySelectorAll(".is-on").forEach((el) => el.removeClass("is-on"));
            extra.empty();
            if (open) {
                b.addClass("is-on");
                fill();
            }
            this.placeGripMenu();
        };
        tile("lucide-square-arrow-out-up-right", "Own tab", "", () => done(() => {
            const tabs = this.barTabs();
            const at = tabs.indexOf(this.splitTabs?.get(id));
            this.unsplitPage(page, at < 0 ? tabs.length : at + 1);
        }));
        tile("lucide-arrow-left-right", "Swap", mates.length ? "" : "is-disabled", (b) => {
            if (!mates.length) return;
            if (mates.length === 1) return done(() => this.movePane(pane, mates[0], "center"));
            show(b, () => {
                extra.createDiv({ cls: "goguryeo-grip-menu-hint", text: "Swap with" });
                const row = extra.createDiv("goguryeo-grip-menu-chips");
                for (const mate of mates) {
                    const other = this.splitPages.get(mate);
                    const chip = row.createEl("button", { cls: "goguryeo-grip-chip", text: other?.getDisplayText() ?? "" });
                    chip.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.haptic();
                        done(() => this.movePane(pane, mate, "center"));
                    });
                }
            });
        });
        tile("lucide-move", "Move", mates.length ? "" : "is-disabled", (b) => {
            if (!mates.length) return;
            show(b, () => {
                extra.createDiv({ cls: "goguryeo-grip-menu-hint", text: "Move to" });
                const row = extra.createDiv("goguryeo-grip-menu-places");
                const r = pane.containerEl.getBoundingClientRect();
                const boxes = mates.map((m) => [m, m.containerEl.getBoundingClientRect()]);
                const edge = {
                    left: (q) => q.left, right: (q) => -q.right, top: (q) => q.top, bottom: (q) => -q.bottom,
                };
                // where it is now: no other pane further that way
                const now = (side) => boxes.every(([, q]) => edge[side](r) <= edge[side](q) + 2);
                for (const [side, icon, label] of [
                    ["left", "lucide-panel-left", "Left"], ["right", "lucide-panel-right", "Right"],
                    ["top", "lucide-panel-top", "Top"], ["bottom", "lucide-panel-bottom", "Bottom"],
                ]) {
                    const here = now(side) && boxes.some(([, q]) => (side === "left" || side === "right"
                        ? q.top < r.bottom && q.bottom > r.top : q.left < r.right && q.right > r.left));
                    const b2 = row.createEl("button", { cls: "goguryeo-grip-place" + (here ? " is-here" : ""), attr: { "aria-label": label } });
                    setIcon(b2, icon);
                    b2.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.haptic();
                        if (here) return this.closeGripMenu();
                        // beside the pane furthest that way
                        const [target] = boxes.slice().sort((a, c) => edge[side](a[1]) - edge[side](c[1]))[0];
                        done(() => this.movePane(pane, target, side));
                    });
                }
            });
        });
        tile("lucide-x", "Close", "mod-danger", () => done(() => page.detach()));

        const off = (e) => {
            if (e.type === "keydown") {
                if (e.key !== "Escape") return;
                e.preventDefault();
                e.stopPropagation();
            } else if (menu.contains(e.target) || grip.contains(e.target)) return;
            this.closeGripMenu();
        };
        window.addEventListener("pointerdown", off, true);
        window.addEventListener("keydown", off, true);
        this.gripMenu = {
            menu, grip, pane,
            off: () => {
                window.removeEventListener("pointerdown", off, true);
                window.removeEventListener("keydown", off, true);
            },
        };
        this.placeGripMenu();
        if (!this.reducedMotion()) {
            menu.animate([{ opacity: 0, scale: "0.9", translate: "0 -6px" }, { opacity: 1, scale: "1", translate: "0 0" }],
                { duration: 260, easing: "cubic-bezier(0.3, 1.3, 0.4, 1)" });
        }
    }

    // Under the grip, centred on it, inside the window
    placeGripMenu() {
        const m = this.gripMenu;
        if (!m) return;
        const g = m.grip.getBoundingClientRect();
        const w = m.menu.offsetWidth;
        const left = Math.min(Math.max(8, g.left + g.width / 2 - w / 2), window.innerWidth - w - 8);
        m.menu.style.left = left + "px";
        m.menu.style.top = (g.bottom + 10) + "px";
    }

    closeGripMenu(now = false) {
        const m = this.gripMenu;
        if (!m) return;
        this.gripMenu = null;
        m.off();
        m.grip.removeClass("is-open");
        if (now || this.reducedMotion()) return m.menu.remove();
        m.menu.style.pointerEvents = "none";
        m.menu.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.94" }], { duration: 150, easing: "ease-in", fill: "forwards" })
            .finished.catch(() => {}).finally(() => m.menu.remove());
    }

    clearSplit() {
        this.closeGripMenu(true);
        this.endFlip();
        this.cardRects = null;
        const body = document.body;
        if (this.paneDrag) this.endPaneDrag(null, true);
        this.clearPanePreview(true);
        if (this.partDrag) this.endPartDrag(null, true);
        this.renderGrips([]);
        body.removeClass(SPLIT_CLASS, ONE_PANE_CLASS);
        this.removeSharedTabs();
        body.style.removeProperty("--g-root-top");
        body.style.removeProperty("--g-root-left");
        body.style.removeProperty("--g-root-right");
        document.querySelectorAll(`.${CURRENT_PANE_CLASS}, .${LAST_PANE_CLASS}`).forEach((el) => {
            el.removeClass(CURRENT_PANE_CLASS, LAST_PANE_CLASS);
        });
    }

    updateThumbs() {
        if (this.app.customCss?.theme !== "Goguryeo") {
            this.removeThumbs();
            return;
        }
        document.body.addClass(THUMB_CLASS);
        this.updateSplit();
        // every window's tab rows: the main one and each popout
        const docs = [document, ...(this.app.workspace.floatingSplit?.children ?? []).map((w) => w.doc).filter(Boolean)];
        for (const bar of docs.flatMap((doc) => [...doc.querySelectorAll(".workspace-tab-header-container")])) {
            const strip = bar.querySelector(":scope > .workspace-tab-header-container-inner");
            if (!strip) continue;
            if (!this.observed.has(strip)) {
                this.observed.add(strip);
                this.mutationObserver.observe(strip, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    // style: a new tab grows in from an inline width, then
                    // drops it and snaps to its real size
                    attributeFilter: ["class", "style"],
                });
                this.resizeObserver.observe(strip);
                this.watchTabAnimations(strip);
                this.registerDomEvent(strip, "scroll", () => this.scheduleThumbs(), { passive: true });
            }
            this.placeThumb(bar, strip);
        }
    }

    placeThumb(bar, strip, active = ":scope > .workspace-tab-header.is-active", innerSel = ":scope > .workspace-tab-header-inner") {
        let thumb = this.thumbs.get(bar);
        const tab = strip.querySelector(active);
        const inner = tab?.querySelector(innerSel);
        if (!inner || bar.offsetWidth === 0) {
            thumb?.hide();
            return;
        }
        // Obsidian rebuilds a tab bar's children when tabs change, which
        // drops the thumb; a new one starts from the last known spot
        const fresh = !thumb || !thumb.isConnected;
        if (fresh) {
            thumb = bar.createDiv("goguryeo-tab-thumb");
            this.thumbs.set(bar, thumb);
        }
        thumb.show();

        const b = bar.getBoundingClientRect();
        const t = inner.getBoundingClientRect();
        const next = { tab, x: t.left - b.left, y: t.top - b.top, w: t.width, h: t.height };
        const prev = this.thumbSpots.get(bar);

        // A new active tab → slide there with the liquid swell. Otherwise
        // (scrolling, resizing, tabs added or removed): nothing moved → leave
        // it be; mid-slide → keep sliding toward the new spot; else jump.
        const switched = !!prev && prev.tab !== tab;
        const moved = !prev || ["x", "y", "w", "h"].some((k) => Math.abs(prev[k] - next[k]) > 0.5);
        const sliding = Date.now() < (thumb.gSlideUntil ?? 0);
        if (switched && fresh) {
            thumb.addClass("is-placing");
            this.setThumbSpot(thumb, prev);
            void thumb.offsetWidth; // commit the start spot before sliding
        }
        if (switched) {
            thumb.removeClass("is-placing");
            thumb.gSlideUntil = Date.now() + SLIDE_MS;
            thumb.addClass("is-moving");
            window.clearTimeout(thumb.gSwell);
            thumb.gSwell = window.setTimeout(() => thumb.removeClass("is-moving"), SWELL_MS);
        } else if (fresh || (moved && !sliding)) {
            thumb.addClass("is-placing");
        }
        if (fresh || moved || switched) this.setThumbSpot(thumb, next);
        this.thumbSpots.set(bar, next);
    }

    setThumbSpot(thumb, spot) {
        thumb.style.setProperty("--g-thumb-x", `${spot.x}px`);
        thumb.style.setProperty("--g-thumb-y", `${spot.y}px`);
        thumb.style.setProperty("--g-thumb-w", `${spot.w}px`);
        thumb.style.setProperty("--g-thumb-h", `${spot.h}px`);
    }

    // The ribbon, but only while the theme is auto-hiding it (it floats then)
    getRibbon() {
        const el = document.querySelector(".workspace-ribbon.mod-primary");
        return el && getComputedStyle(el).position === "fixed" ? el : null;
    }

    isOpen() {
        return document.body.hasClass(OPEN_CLASS);
    }

    onTouchStart(e) {
        if (e.touches.length !== 1) return;
        const ribbon = this.getRibbon();
        if (!ribbon) return;

        const t = e.touches[0];
        const insideRibbon = ribbon.contains(e.target);

        if (this.isOpen() && !insideRibbon) {
            this.close(ribbon);
            return;
        }

        const opening = !this.isOpen() && t.clientX <= EDGE;
        const closing = this.isOpen() && insideRibbon;
        if (!opening && !closing) return;

        this.swipe = { ribbon, opening, x0: t.clientX, y0: t.clientY, dx: 0, locked: false };
    }

    onTouchMove(e) {
        const s = this.swipe;
        if (!s) return;

        const t = e.touches[0];
        s.dx = t.clientX - s.x0;
        const dy = t.clientY - s.y0;

        if (!s.locked) {
            // Mostly vertical: it's a scroll, not a swipe
            if (Math.abs(dy) > LOCK_AT && Math.abs(dy) > Math.abs(s.dx)) {
                this.swipe = null;
                return;
            }
            if (Math.abs(s.dx) < LOCK_AT) return;
            s.locked = true;
            s.ribbon.style.transition = "none";
            s.ribbon.style.opacity = "1";
        }

        // Ribbon fully hidden sits at -(width + 12px); follow the finger from there
        const hidden = -(s.ribbon.offsetWidth + 12);
        const offset = s.opening ? Math.min(0, hidden + s.dx) : Math.max(hidden, Math.min(0, s.dx));
        s.ribbon.style.transform = `translateX(${offset}px)`;
    }

    onTouchEnd() {
        const s = this.swipe;
        if (!s) return;
        this.swipe = null;
        if (!s.locked) return;

        if (s.opening) {
            if (s.dx >= OPEN_AT) this.open(s.ribbon);
            else this.close(s.ribbon);
        } else {
            if (s.dx <= -OPEN_AT) this.close(s.ribbon);
            else this.open(s.ribbon);
        }
    }

    // Close after a ribbon icon is used
    onClick(e) {
        if (!this.isOpen()) return;
        const ribbon = this.getRibbon();
        if (ribbon && e.target.closest(".side-dock-ribbon-action")) {
            window.setTimeout(() => this.close(ribbon), 0);
        }
    }

    open(ribbon) {
        document.body.addClass(OPEN_CLASS);
        this.snapTo(ribbon);
    }

    close(ribbon) {
        document.body.removeClass(OPEN_CLASS);
        this.snapTo(ribbon);
    }

    // Hand the position back to the theme's CSS with a short animation
    snapTo(ribbon) {
        ribbon.style.transition = SNAP;
        ribbon.style.removeProperty("transform");
        ribbon.style.removeProperty("opacity");
        window.clearTimeout(this.snapTimer);
        this.snapTimer = window.setTimeout(() => this.clearInline(ribbon), 250);
    }

    clearInline(ribbon) {
        ribbon.style.removeProperty("transition");
        ribbon.style.removeProperty("transform");
        ribbon.style.removeProperty("opacity");
    }
};
