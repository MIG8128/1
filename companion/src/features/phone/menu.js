// The iPhone's ⋯ panel: Obsidian's ≡ turned into ⋯, opening the
// companion's own glass panel (theme section 10).

import { setIcon } from "../../core/platform.js";

export const phoneMenu = {
    setupPhoneMenu() {
        const iconEl = () => document.querySelector(".mobile-navbar-action-menu > .clickable-icon");
        const paint = () => {
            const el = iconEl();
            if (el && !el.querySelector(".lucide-more-horizontal")) setIcon(el, "more-horizontal");
        };
        paint();
        this.phoneMenu = null;
        this.onLayout(["layout-change", "active-leaf-change"], paint);
        this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.closePhoneMenu()));
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
    },

    // Design G's ⋯ panel (canvas: "G · ⋯ open" / "scrolled down"): a glass
    // panel the width of the bar, above it (the page dims a little behind).
    // On top three tiles, ⧉ ⌕ 📖 (all tabs, find in note, reading view /
    // edit; ◧ and ◨ are on the bar since design I). Below, in two columns and scrolling:
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
        // ◧ and ◨ are on the bar (design I)
        tile("copy", "All tabs", () => this.app.mobileTabSwitcher?.show());
        // Find in this note (the capsule already opens the quick switcher)
        tile("text-search", "Find", () => this.app.commands.executeCommandById("editor:open-search"));
        const mode = view?.modeButtonEl;
        if (mode) {
            const reading = view.getMode?.() === "preview";
            tile(reading ? "pencil" : "book-open", reading ? "Edit" : "Reading view", () => mode.click());
        }

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

        this.enter(panel, { scale: 0.96, y: 16 });
        this.fadeIn(bg);
    },

    closePhoneMenu(now = false) {
        const menu = this.phoneMenu;
        if (!menu) return;
        this.phoneMenu = null;
        document.body.removeClass("goguryeo-phone-menu-open");
        if (now) {
            menu.bg.remove();
            menu.panel.remove();
            return;
        }
        this.fadeOut(menu.bg);
        this.leave(menu.panel, { scale: 0.92 });
    },
};
