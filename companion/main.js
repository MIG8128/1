/* Goguryeo Companion — things a CSS theme cannot do on its own.

   All platforms: keeps the left sidebar button out of the hidden ribbon.
   Desktop: keeps it at the start of the main tab bar, mirroring the right one.

   iPhone & iPad: swipe in from the left/right edge to go back/forward
   (only while both sidebars are closed); iPhone also gets a right sidebar
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
    Plugin, Platform, setIcon, normalizePath,
    FuzzySuggestModal, Notice, PluginSettingTab, Setting, TFile,
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
const PHONE_RIGHT_CLASS = "goguryeo-phone-right";
const EDGE_SWIPE_ZONE = 24; // px from the left/right edge where a back/forward swipe starts
const EDGE_SWIPE_AT = 80; // px to pull before letting go navigates
const CURRENT_PANE_CLASS = "goguryeo-current-pane";
const LAST_PANE_CLASS = "goguryeo-last-pane";
const SNAP = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease";
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

// The theme's Background options in one place, with an image picker. The
// values stay in Style Settings (the theme reads them from there), so both
// pages always show the same thing.
class GoguryeoSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
        const manager = this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager;
        if (!manager) {
            containerEl.createEl("p", { text: "Turn on the Style Settings plugin to set a background." });
            return;
        }
        const get = (id, fallback) => manager.getSetting("goguryeo", id) ?? fallback;
        const set = (id, value) => manager.setSetting("goguryeo", id, value);
        const slider = (name, desc, id, fallback) => new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addSlider((sl) => sl.setLimits(0, id === "g-bg-blur" ? 60 : 100, 1)
                .setValue(get(id, fallback))
                .setDynamicTooltip()
                .onChange((value) => set(id, value)));

        containerEl.createEl("h3", { text: "Background" });
        const type = get("goguryeo-bg", "goguryeo-bg-none");
        new Setting(containerEl)
            .setName("Background")
            .setDesc("What shows behind the glass. With a color or an image, the note area turns see-through too.")
            .addDropdown((d) => d
                .addOptions({
                    "goguryeo-bg-none": "Plain (theme gray)",
                    "goguryeo-bg-color": "Color",
                    "goguryeo-bg-image": "Image",
                })
                .setValue(type)
                .onChange((value) => {
                    set("goguryeo-bg", value);
                    this.display();
                }));

        if (type === "goguryeo-bg-color") {
            const mode = document.body.hasClass("theme-light") ? "light" : "dark";
            const fallback = getComputedStyle(document.body).getPropertyValue("--g-bg-color").trim();
            new Setting(containerEl)
                .setName("Color")
                .setDesc(`For ${mode} mode.`)
                .addColorPicker((c) => c.setValue(get(`g-bg-color@@${mode}`, fallback))
                    .onChange((value) => set(`g-bg-color@@${mode}`, value)));
        }

        if (type === "goguryeo-bg-image") {
            const current = this.plugin.getBackgroundImage();
            const image = new Setting(containerEl)
                .setName("Image")
                .setDesc(current || "None yet. Choose one.")
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
            slider("Blur the image", "In px.", "g-bg-blur", 0);
            slider("Dim the image", "Darkens it in dark mode, lightens it in light mode. 100 hides it.", "g-bg-dim", 40);
        }

        if (type !== "goguryeo-bg-none") {
            slider("Main area opacity", "How solid the note panes are. Lower = more background shows through.",
                "g-note-opacity", type === "goguryeo-bg-color" ? 40 : 72);
        }
        slider("Sidebar opacity", "How solid the sidebars are.", "g-sidebar-tint", get("g-glass-tint", 62));

        containerEl.createEl("p", {
            cls: "setting-item-description",
            text: "Tip: right-click any image in the file list → Use as background.",
        });
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

        this.app.workspace.onLayoutReady(() => this.setupTabThumbs());
        this.app.workspace.onLayoutReady(() => this.setupPhoneRightToggle());
        if (Platform.isMobile) this.setupEdgeSwipe();

        if (!Platform.isDesktopApp) return;

        this.swipe = null;
        const opts = { passive: true, capture: true };
        this.registerDomEvent(document, "touchstart", (e) => this.onTouchStart(e), opts);
        this.registerDomEvent(document, "touchmove", (e) => this.onTouchMove(e), opts);
        this.registerDomEvent(document, "touchend", () => this.onTouchEnd(), opts);
        this.registerDomEvent(document, "touchcancel", () => this.onTouchEnd(), opts);
        this.registerDomEvent(document, "click", (e) => this.onClick(e), { capture: true });
    }

    onunload() {
        document.body.removeClass(OPEN_CLASS);
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
    // while it is open. With Goguryeo on desktop, keep the left one at the
    // start of the main tab bar too, so the two mirror each other. Runs right
    // after each of Obsidian's layout passes, which would move it back.
    patchUpdateFrameless() {
        const workspace = this.app.workspace;
        const original = workspace.updateFrameless;
        if (typeof original !== "function") return;
        const plugin = this;
        workspace.updateFrameless = function (...args) {
            const result = original.apply(this, args);
            plugin.placeLeftToggle();
            return result;
        };
        this.register(() => {
            delete workspace.updateFrameless;
            this.refreshFrame();
        });
    }

    placeLeftToggle() {
        if (!Platform.isDesktopApp || this.app.customCss?.theme !== "Goguryeo") return;
        const { rootSplit, leftSidebarToggleButtonEl: button } = this.app.workspace;
        const target = rootSplit?.containerEl.querySelector(".workspace-tabs.mod-top > .workspace-tab-header-container");
        if (!button || !target) return;
        // Obsidian animates a copy out of the old spot when it moves the
        // button; drop those copies so only one button ever shows
        document.querySelectorAll(".sidebar-toggle-button.mod-left:not(.mod-left-split-toggle)").forEach((el) => {
            if (el !== button) el.remove();
        });
        if (target.firstElementChild !== button) target.prepend(button);
    }

    refreshFrame() {
        window.requestAnimationFrame(() => this.app.workspace.updateFrameless?.());
    }

    // ---- iPhone: a right sidebar button (Obsidian has none on phones) ----

    setupPhoneRightToggle() {
        if (!Platform.isPhone) return;
        const button = document.body.createEl("button", {
            cls: "goguryeo-right-toggle clickable-icon",
            attr: { "aria-label": "Open right sidebar" },
        });
        setIcon(button, "lucide-panel-right");
        button.addEventListener("click", () => this.app.workspace.rightSplit.toggle());
        document.body.addClass(PHONE_RIGHT_CLASS);
        this.register(() => {
            button.remove();
            document.body.removeClass(PHONE_RIGHT_CLASS);
        });
        this.setupNameCapsule();
    }

    // ---- iPhone: the name capsule brings the bars back ----

    // Scrolling down folds the bottom bar into a small capsule with just the
    // note's name (the theme, on body.is-hidden-nav). The name is Obsidian's
    // title, which renames the note when tapped; while folded, a tap brings
    // the bars back instead, like Safari.
    setupNameCapsule() {
        const onTap = (e) => {
            if (!document.body.hasClass("is-hidden-nav")) return;
            if (!e.target.closest?.(".mod-root .view-header-title")) return;
            e.preventDefault();
            e.stopPropagation();
            this.app.mobileNavbar?.restoreNavigation();
        };
        const opts = { passive: false, capture: true };
        this.registerDomEvent(document, "touchstart", onTap, opts);
        this.registerDomEvent(document, "mousedown", onTap, opts);
    }

    // ---- iPhone & iPad: swipe in from an edge to go back / forward ----

    // Like Safari: start within EDGE_SWIPE_ZONE of the left edge and drag
    // right to go back, or from the right edge leftwards to go forward. A
    // round glass arrow follows the finger and fills in once the swipe has
    // gone EDGE_SWIPE_AT; letting go then navigates, earlier cancels. Only
    // while both sidebars are closed, nothing covers the note and there is
    // somewhere to go.
    setupEdgeSwipe() {
        this.edgeArrow = document.body.createDiv("goguryeo-edge-arrow");
        this.edgeSwipe = null;
        this.register(() => this.edgeArrow.remove());
        const opts = { passive: true, capture: true };
        this.registerDomEvent(document, "touchstart", (e) => this.onEdgeStart(e), opts);
        this.registerDomEvent(document, "touchmove", (e) => this.onEdgeMove(e), opts);
        this.registerDomEvent(document, "touchend", () => this.onEdgeEnd(true), opts);
        this.registerDomEvent(document, "touchcancel", () => this.onEdgeEnd(false), opts);
    }

    canEdgeSwipe() {
        const { leftSplit, rightSplit } = this.app.workspace;
        if (!leftSplit?.collapsed || !rightSplit?.collapsed) return false;
        return !document.querySelector(".modal-container, .menu, .mobile-tab-switcher, .prompt");
    }

    onEdgeStart(e) {
        this.edgeSwipe = null;
        if (e.touches.length !== 1 || !this.canEdgeSwipe()) return;
        const t = e.touches[0];
        const dir = t.clientX <= EDGE_SWIPE_ZONE ? -1 : t.clientX >= window.innerWidth - EDGE_SWIPE_ZONE ? 1 : 0;
        if (!dir) return;
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const history = leaf?.history;
        const steps = dir < 0 ? history?.backHistory : history?.forwardHistory;
        if (!steps?.length) return;
        this.edgeSwipe = { dir, leaf, x0: t.clientX, y0: t.clientY, locked: false, armed: false };
    }

    onEdgeMove(e) {
        const s = this.edgeSwipe;
        if (!s) return;
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
            this.edgeArrow.toggleClass("is-back", s.dir < 0);
            this.edgeArrow.toggleClass("is-forward", s.dir > 0);
            setIcon(this.edgeArrow, s.dir < 0 ? "lucide-chevron-left" : "lucide-chevron-right");
            this.edgeArrow.addClass("is-visible");
        }
        const pull = Math.min(dx, EDGE_SWIPE_AT * 1.25);
        s.armed = dx >= EDGE_SWIPE_AT;
        this.edgeArrow.toggleClass("is-armed", s.armed);
        this.edgeArrow.style.top = `${t.clientY}px`;
        this.edgeArrow.style.setProperty("--g-edge-pull", `${pull * 0.6}px`);
    }

    onEdgeEnd(finished) {
        const s = this.edgeSwipe;
        this.edgeSwipe = null;
        this.edgeArrow?.removeClass("is-visible", "is-armed");
        if (s?.locked && s.armed && finished) s.leaf.history.go(s.dir);
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
        const panes = [];
        const collect = (node) => node?.children?.forEach((child) => {
            if (child.type === "tabs") panes.push(child.containerEl);
            else if (child.type === "split") collect(child);
        });
        collect(rootSplit);
        const body = document.body;
        // Over a background, a lone pane is a card too
        const hasBackground = body.hasClass("goguryeo-bg-color") || body.hasClass("goguryeo-bg-image");
        if (!(Platform.isDesktopApp || Platform.isTablet) || panes.length < (hasBackground ? 1 : 2)) {
            this.clearSplit();
            return;
        }
        const r = rootSplit.containerEl.getBoundingClientRect();
        body.addClass(SPLIT_CLASS);
        body.toggleClass(ONE_PANE_CLASS, panes.length === 1);
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
    }

    clearSplit() {
        const body = document.body;
        body.removeClass(SPLIT_CLASS, ONE_PANE_CLASS);
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
        for (const bar of document.querySelectorAll(".workspace-tab-header-container")) {
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
                this.registerDomEvent(strip, "scroll", () => this.scheduleThumbs(), { passive: true });
            }
            this.placeThumb(bar, strip);
        }
    }

    placeThumb(bar, strip) {
        let thumb = this.thumbs.get(bar);
        const tab = strip.querySelector(":scope > .workspace-tab-header.is-active");
        const inner = tab?.querySelector(":scope > .workspace-tab-header-inner");
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
