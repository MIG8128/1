// The path capsule as an address bar: a tap on the path opens the quick
// switcher holding the note's path.

import { Platform } from "../../core/platform.js";

export const pathSwitcher = {
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
        this.registerDomEvent(document, "click", (e) => {
            const tap = this.pathTapAt(e);
            if (!tap) return;
            // Through the iPhone bar onto a folder with a note: the click on
            // the folder itself ticks and opens it (below)
            if (tap.viaBar && tap.crumb) {
                e.preventDefault();
                e.stopImmediatePropagation();
                tap.crumb.click();
                return;
            }
            // A folder with a folder note is a link to it: ours opens here;
            // the Folder notes plugin's opens from its own listener, and the
            // haptics listener ticks for it
            if (tap.crumb) {
                const note = this.folderNotesOn() && this.folderNoteOf(tap.crumb.dataset.goguryeoFolder);
                if (!note) return;
                e.preventDefault();
                e.stopImmediatePropagation();
                this.haptic();
                this.openFolderNote(note, e);
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
                if (from) this.dockSwitcher(from);
                if (from || Platform.isPhone) this.prefillSwitcher(file);
                return result;
            };
            this.register(() => { command.callback = callback; });
        });
    },

    // What a click means for the path, on every platform alike: null (not
    // the path), else { crumb } (a folder with a folder note, or null: the
    // rest of the path, which opens the quick switcher) and viaBar.
    // Desktop and iPad: the path capsule. iPhone: its folder pill, and the
    // capsule itself, which sits over Obsidian's tabs button (the bar is a
    // layer above the note), so the click lands on the button and is matched
    // by position; a drag on the pill swallows its click.
    pathTapAt(e) {
        const path = Platform.isPhone ? ".mod-root .view-header-title-parent" : ".mod-root .view-header-title-container";
        if (e.target.closest?.(path)) {
            // the web viewer's capsule is its own address field
            if (e.target.closest(".webviewer-address-container")) return null;
            return { crumb: e.target.closest(".view-header-breadcrumb.has-folder-note"), viaBar: false };
        }
        if (!Platform.isPhone || Date.now() <= (this.suppressClickUntil ?? 0)) return null;
        if (!e.target.closest?.(".mobile-navbar-action-tabs") || !this.capsuleAt(e.clientX, e.clientY)) return null;
        const folder = this.capsuleFolderAt(e.clientX, e.clientY);
        return { crumb: folder?.matches(".has-folder-note") ? folder : null, viaBar: true };
    },

    // Phone: the bottom capsule, if (x, y) is over it
    capsuleAt(x, y) {
        const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const el = leaf?.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container");
        const r = el?.getBoundingClientRect();
        return r && r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? el : null;
    },

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
    },

    // Like a browser's address bar, the field opens holding the note's path,
    // all selected: typing replaces it, an arrow key keeps it to edit
    prefillSwitcher(file) {
        const input = [...document.querySelectorAll(".modal-container .prompt-input")].pop();
        if (!file || !input) return;
        input.value = file.extension === "md" ? file.path.slice(0, -3) : file.path;
        input.dispatchEvent(new Event("input"));
        input.setSelectionRange(0, input.value.length);
    },

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
    },
};
