// The iPhone's bottom bar: the capsule over Obsidian's tabs button and
// the folded name capsule (theme section 10).

import { Platform, setIcon } from "../../core/platform.js";

export const phoneBar = {
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
        this.setupPhoneSideButtons();
        this.setupPhoneTabZoom();
        this.setupStatusEdge();
    },

    // Design I (canvas "I · (◧) [‹ folder / name ⋯] (◨)"): a round glass
    // sidebar button at each end of the bar; ‹ and ⋯ sit inside the
    // capsule (theme section 10). In Obsidian's navbar, so they fade with
    // it and fold with ‹ ⋯. <button>s, so each tap ticks (setupHaptics).
    setupPhoneSideButtons() {
        const ws = this.app.workspace;
        const add = () => {
            const nav = this.app.mobileNavbar?.containerEl;
            if (!nav || nav.querySelector(":scope > .goguryeo-phone-side")) return;
            for (const side of ["left", "right"]) {
                const b = nav.createEl("button", {
                    cls: `goguryeo-phone-side mod-${side}`,
                    attr: { "aria-label": side === "left" ? "Left sidebar" : "Right sidebar" },
                });
                setIcon(b, side === "left" ? "panel-left" : "panel-right");
                b.addEventListener("click", (e) => {
                    e.preventDefault();
                    (side === "left" ? ws.leftSplit : ws.rightSplit).toggle();
                });
            }
        };
        ws.onLayoutReady(add);
        this.onLayout(["layout-change"], add);
        this.register(() => document.querySelectorAll(".goguryeo-phone-side").forEach((b) => b.remove()));
    },

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
        // theme reads --g-capsule-name-w, the name's width at its own size
        // (the fold scales it by --g-fold-text), measured ahead so the fold
        // can animate to it
        const ctx = document.createElement("canvas").getContext("2d");
        const measure = () => {
            this.app.workspace.iterateRootLeaves((leaf) => {
                const capsule = leaf.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container");
                const title = capsule?.querySelector(".view-header-title");
                if (!title) return;
                const cs = getComputedStyle(title);
                ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                capsule.style.setProperty("--g-capsule-name-w", `${Math.ceil(ctx.measureText(title.textContent).width)}px`);
            });
        };
        this.app.workspace.onLayoutReady(() => window.setTimeout(measure, 0));
        this.onLayout(["layout-change", "active-leaf-change", "file-open", "css-change", "rename"], measure);
        this.register(() => document.querySelectorAll(".view-header-title-container")
            .forEach((el) => el.style.removeProperty("--g-capsule-name-w")));
    },
};
