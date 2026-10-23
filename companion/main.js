/* Goguryeo Companion — things a CSS theme cannot do on its own.

   All platforms: keeps the left sidebar button out of the hidden ribbon.
   Desktop: keeps it at the start of the main tab bar, mirroring the right one.

   Tab bars: a glass "thumb" sits under the active tab of every tab bar (main
   tabs and sidebar pills) and slides to the new tab when it changes; the
   theme styles it (.goguryeo-tab-thumb) and gives it the spring motion.

   Desktop touchscreens: swipe right from near the left edge to pull out the
   ribbon the Goguryeo theme hides. The ribbon follows the finger; let go past
   OPEN_AT to keep it open. Tap outside it, tap one of its icons, or swipe it
   left to close. The open state is the body class "goguryeo-touch-active",
   which the theme styles. */

const { Plugin, Platform } = require("obsidian");

const EDGE = 40; // px from the window's left edge where a swipe may start
const OPEN_AT = 50; // px the finger must travel to keep the ribbon open
const LOCK_AT = 10; // px of movement before deciding swipe vs. scroll
const OPEN_CLASS = "goguryeo-touch-active";
const THUMB_CLASS = "goguryeo-glass-thumbs";
const SNAP = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease";

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

        this.app.workspace.onLayoutReady(() => this.setupTabThumbs());

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
        const ribbon = this.getRibbon();
        if (ribbon) this.clearInline(ribbon);
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

    // ---- Sliding glass under the active tab ----

    setupTabThumbs() {
        this.thumbs = new WeakMap(); // tab bar → its thumb
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
    }

    updateThumbs() {
        if (this.app.customCss?.theme !== "Goguryeo") {
            this.removeThumbs();
            return;
        }
        document.body.addClass(THUMB_CLASS);
        for (const bar of document.querySelectorAll(".workspace-tab-header-container")) {
            const strip = bar.querySelector(":scope > .workspace-tab-header-container-inner");
            if (!strip) continue;
            if (!this.observed.has(strip)) {
                this.observed.add(strip);
                this.mutationObserver.observe(strip, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ["class"],
                });
                this.resizeObserver.observe(strip);
                this.registerDomEvent(strip, "scroll", () => this.scheduleThumbs(), { passive: true });
            }
            this.placeThumb(bar, strip);
        }
    }

    placeThumb(bar, strip) {
        let thumb = this.thumbs.get(bar);
        const tab = strip.querySelector(":scope > .workspace-tab-header.is-active > .workspace-tab-header-inner");
        if (!tab || bar.offsetWidth === 0) {
            thumb?.hide();
            return;
        }
        if (!thumb || !thumb.isConnected) {
            thumb = bar.createDiv("goguryeo-tab-thumb");
            this.thumbs.set(bar, thumb);
        }
        thumb.show();

        // Slide (with the liquid swell) only when the active tab changed;
        // follow scrolling and resizing instantly
        const switched = thumb.gTab !== undefined && thumb.gTab !== tab;
        thumb.toggleClass("is-placing", !switched);
        const b = bar.getBoundingClientRect();
        const t = tab.getBoundingClientRect();
        thumb.style.setProperty("--g-thumb-x", `${t.left - b.left}px`);
        thumb.style.setProperty("--g-thumb-y", `${t.top - b.top}px`);
        thumb.style.setProperty("--g-thumb-w", `${t.width}px`);
        thumb.style.setProperty("--g-thumb-h", `${t.height}px`);
        if (switched) {
            thumb.addClass("is-moving");
            window.clearTimeout(thumb.gSwell);
            thumb.gSwell = window.setTimeout(() => thumb.removeClass("is-moving"), 220);
        }
        thumb.gTab = tab;
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
