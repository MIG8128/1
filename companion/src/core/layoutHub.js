// One place where the layout events come in.
//
// Obsidian's layout events come in bursts: one tab switch fires
// active-leaf-change, layout-change and file-open, a window resize both
// the window's and the workspace's resize. Each part that keeps
// something in step with the layout subscribes here (onLayout) and runs
// once per frame, however many of its events came, in the order the
// parts subscribed, and an error in one doesn't stop the others. Work
// that must happen at the event itself (closing a menu) keeps its own
// listener. Events: Obsidian's layout-change, active-leaf-change,
// file-open, css-change, resize; the vault's rename; the window's
// resize as "window-resize"; the parts' own nudges ("thumbs").
//
// Every listener goes through the plugin's register* helpers, so Obsidian
// removes them on unload like any other plugin listener.

const WORKSPACE_EVENTS = ["layout-change", "active-leaf-change", "file-open", "css-change", "resize"];

const hubs = new WeakMap(); // plugin -> { subs, pending, frame }

function hubOf(plugin) {
    const hub = hubs.get(plugin);
    if (!hub) throw new Error("Goguryeo: setupLayoutHub(plugin) must run first");
    return hub;
}

function runLayoutHub(hub) {
    hub.frame = 0;
    const came = hub.pending;
    hub.pending = new Set();
    for (const { names, fn } of hub.subs) {
        if (!names.some((n) => came.has(n))) continue;
        try {
            fn(came);
        } catch (e) {
            console.error("Goguryeo:", e);
        }
    }
}

// Call first in onload: the other parts subscribe to it
export function setupLayoutHub(plugin) {
    const hub = { subs: [], pending: new Set(), frame: 0 };
    hubs.set(plugin, hub);
    const fire = (name) => nudgeLayout(plugin, name);
    for (const name of WORKSPACE_EVENTS) {
        plugin.registerEvent(plugin.app.workspace.on(name, () => fire(name)));
    }
    plugin.registerEvent(plugin.app.vault.on("rename", () => fire("rename")));
    plugin.registerDomEvent(window, "resize", () => fire("window-resize"));
    plugin.register(() => {
        window.cancelAnimationFrame(hub.frame);
        hub.frame = 0;
        hub.subs = [];
        hub.pending.clear();
        if (hubs.get(plugin) === hub) hubs.delete(plugin);
    });
}

// fn(came) runs once in the frame after any of the named events;
// came is the Set of event names that arrived since the last run
export function onLayout(plugin, names, fn) {
    hubOf(plugin).subs.push({ names, fn });
}

// An event for the hub's next frame; the parts also nudge it themselves
// (the tab glass: "thumbs", from its observers and its own changes)
export function nudgeLayout(plugin, name) {
    const hub = hubs.get(plugin);
    if (!hub) return; // unloaded: a late observer callback
    hub.pending.add(name);
    if (hub.frame) return;
    hub.frame = window.requestAnimationFrame(() => {
        if (hubs.get(plugin) === hub) runLayoutHub(hub);
    });
}
