// The items Obsidian's own ⋯ (more options) menu would hold, laid flat
// for the iPhone's ⋯ panel.

import { Menu } from "../../core/platform.js";

export const noteMenu = {
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
    },
};
