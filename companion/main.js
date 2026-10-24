/* Goguryeo Companion — things a CSS theme cannot do on its own.

   All platforms: keeps the left sidebar button out of the hidden ribbon.
   Desktop: keeps it at the start of the main tab bar, mirroring the right one.
   In a narrow window, sidebars that would squeeze the note float over it.

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
    Plugin, Platform, setIcon, normalizePath,
    FuzzySuggestModal, Notice, PluginSettingTab, Setting, TFile, WorkspaceLeaf,
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
const NOTE_MIN_WIDTH = 480; // px the note keeps beside docked sidebars; below it they float over it
const OMNI_CLASS = "goguryeo-omnibox"; // the quick switcher docked on the path capsule
const OMNI_MIN_WIDTH = 420; // px it takes at least (the iPhone folder pill is small)
const OMNI_MARGIN = 8; // px it keeps from the window edges
const OMNI_MS = 320; // the list unrolling below the capsule
const OMNI_EASE = "cubic-bezier(0.3, 1.15, 0.4, 1)"; // a soft spring, settling past its spot and back
const SHADOW_ROOM = 32; // px the switcher's clip reaches past its edge at the end, so its shadow shows
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
        this.app.workspace.onLayoutReady(() => this.setupFloatingSidebars());
        this.app.workspace.onLayoutReady(() => this.setupPhoneRightToggle());
        if (Platform.isMobile) this.setupEdgeSwipe();
        this.setupPathSwitcher(); // before the haptics, which it keeps from ticking twice
        if (Platform.isMobile) this.setupHaptics();

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
            plugin.placeFloatingFrameSpace();
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

    // ---- Narrow window: sidebars float over the note ----

    // Docked sidebars take their width from the note. When the window can't
    // give the note NOTE_MIN_WIDTH beside both, the right one floats over the
    // note (the theme styles the body classes), and when even the left one
    // alone is too much, both do. Only the window and sidebar widths decide,
    // not which sidebars are open, so opening one never makes the other jump.
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
        this.updateFloatingSidebars();
    }

    updateFloatingSidebars() {
        const { leftSplit, rightSplit } = this.app.workspace;
        let left = false, right = false;
        if (this.app.customCss?.theme === "Goguryeo" && !Platform.isMobile) {
            const room = window.innerWidth - NOTE_MIN_WIDTH;
            left = leftSplit.size > room;
            right = leftSplit.size + rightSplit.size > room;
        }
        // When both float, they work like the iPad's drawers: opening one
        // closes the other
        const was = this.sidebarsOpen;
        const open = { left: !leftSplit.collapsed, right: !rightSplit.collapsed };
        this.sidebarsOpen = open;
        if (left && right && was && open.left && open.right) {
            if (!was.left) rightSplit.collapse();
            else if (!was.right) leftSplit.collapse();
        }
        const body = document.body;
        if (body.hasClass(FLOAT_LEFT_CLASS) === left && body.hasClass(FLOAT_RIGHT_CLASS) === right) return;
        body.toggleClass(FLOAT_LEFT_CLASS, left);
        body.toggleClass(FLOAT_RIGHT_CLASS, right);
        this.refreshFrame(); // the note now reaches a top corner, or no longer does
    }

    // A click in the note closes the sidebars floating over it
    onFloatingDismiss(e) {
        const { rootSplit, leftSplit, rightSplit } = this.app.workspace;
        if (!rootSplit?.containerEl.contains(e.target) || e.target.closest(".sidebar-toggle-button")) return;
        const body = document.body;
        if (body.hasClass(FLOAT_LEFT_CLASS) && !leftSplit.collapsed) leftSplit.collapse();
        if (body.hasClass(FLOAT_RIGHT_CLASS) && !rightSplit.collapsed) rightSplit.collapse();
    }

    // Obsidian keeps the room for the window buttons only in the panes that
    // reach a top corner, and a docked sidebar takes the corner from the
    // note. A floating one doesn't, so the note's top pane keeps that room.
    placeFloatingFrameSpace() {
        if (!Platform.isDesktopApp) return;
        const body = document.body;
        const tops = this.app.workspace.rootSplit?.containerEl.querySelectorAll(".workspace-tabs.mod-top");
        if (!tops?.length) return;
        if (body.hasClass(FLOAT_LEFT_CLASS)) tops[0].addClass("mod-top-left-space");
        if (body.hasClass(FLOAT_RIGHT_CLASS)) tops[tops.length - 1].addClass("mod-top-right-space");
    }

    // ---- iPhone: a right sidebar button (Obsidian has none on phones) ----

    setupPhoneRightToggle() {
        if (!Platform.isPhone) return;
        const button = document.body.createEl("button", {
            cls: "goguryeo-right-toggle clickable-icon",
            attr: { "aria-label": "Open right sidebar" },
        });
        // Obsidian's own sidebar icon, as on the ◧ button (the theme mirrors it)
        const icon = (this.app.workspace.rightSidebarToggleButtonEl ?? this.app.workspace.leftSidebarToggleButtonEl)
            ?.querySelector("svg.sidebar-toggle-button-icon");
        if (icon) button.appendChild(icon.cloneNode(true));
        else setIcon(button, "lucide-panel-right");
        button.addEventListener("click", () => this.app.workspace.rightSplit.toggle());
        document.body.addClass(PHONE_RIGHT_CLASS);
        this.register(() => {
            button.remove();
            document.body.removeClass(PHONE_RIGHT_CLASS);
        });
        this.setupNameCapsule();
        this.setupNameGestures();
    }

    // ---- The path capsule opens the quick switcher ----

    // Like a browser's address bar: tapping the path (row 1 on desktop and
    // iPad, the folder pill on top on iPhone) opens Ctrl+O instead of
    // renaming the note or revealing a folder; only a folder that has a
    // folder note opens that note. On iPhone the note's name sits
    // in the bottom bar and keeps opening the tab overview. However it opens
    // (the tap, Ctrl+O, the command palette), the search field opens in the
    // capsule and the list drops down right below it.
    setupPathSwitcher() {
        const path = Platform.isPhone
            ? ".mod-root .view-header-title-parent"
            : ".mod-root .view-header-title-container";
        this.registerDomEvent(document, "click", (e) => {
            if (!e.target.closest?.(path)) return;
            // A folder with a folder note is a link: the Folder notes plugin
            // marks it and opens the note
            if (e.target.closest(".view-header-breadcrumb.has-folder-note")) {
                this.haptic();
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
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
                if (from) {
                    this.dockSwitcher(from);
                    this.prefillSwitcher(file);
                }
                return result;
            };
            this.register(() => { command.callback = callback; });
        });
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
        const header = this.app.workspace.getMostRecentLeaf()?.view?.containerEl.querySelector(":scope > .view-header");
        const el = header?.querySelector(Platform.isPhone ? ".view-header-title-parent" : ".view-header-title-container");
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
    // tap still opens the tab overview (Obsidian's button under the pill).
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
        const pill = leaf?.view?.containerEl.querySelector(".view-header-title");
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
            target.view?.containerEl.querySelector(".view-header-title")?.animate(
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
            if (!e.target.closest?.(".mod-root .view-header-title")) return;
            e.preventDefault();
            e.stopPropagation();
            this.app.mobileNavbar?.restoreNavigation();
            this.haptic();
        };
        const opts = { passive: false, capture: true };
        this.registerDomEvent(document, "touchstart", onTap, opts);
        this.registerDomEvent(document, "mousedown", onTap, opts);
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
        this.registerDomEvent(document, "touchstart", (e) => this.onEdgeStart(e), { passive: true, capture: true });
        this.registerDomEvent(document, "touchmove", (e) => this.onEdgeMove(e), { passive: false, capture: true });
        this.registerDomEvent(document, "touchend", (e) => this.onEdgeEnd(e, true), { passive: true, capture: true });
        this.registerDomEvent(document, "touchcancel", (e) => this.onEdgeEnd(e, false), { passive: true, capture: true });
    }

    // A still copy of a leaf's page: its content inside a bare copy of the
    // content's frame (so the theme's rules for it still apply), plus where
    // each scrolled part was scrolled to.
    snapshotPage(leaf) {
        const content = leaf.view?.contentEl;
        if (!content || !leaf.view.navigation || !content.isConnected) return null;
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
        if (!leftSplit?.collapsed || !rightSplit?.collapsed) return false;
        return !document.querySelector(".modal-container, .menu, .mobile-tab-switcher, .prompt");
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
        const target = this.snapshots.get(entry);
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
