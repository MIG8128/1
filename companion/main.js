var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/motion.js
var motion_exports = {};
__export(motion_exports, {
  DUR: () => DUR,
  EASE: () => EASE,
  enter: () => enter,
  fadeIn: () => fadeIn,
  fadeOut: () => fadeOut,
  glide: () => glide,
  leave: () => leave,
  play: () => play,
  reducedMotion: () => reducedMotion,
  springIn: () => springIn,
  springOut: () => springOut
});
function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function play(el, keyframes, options) {
  if (!el || reducedMotion()) return Promise.resolve();
  try {
    return el.animate(keyframes, options).finished.then(() => {
    }, () => {
    });
  } catch (e) {
    return Promise.resolve();
  }
}
function enter(el, { scale = 0.94, x = 0, y = 0, opacity = 0, duration = DUR.in, easing = EASE.spring } = {}) {
  return play(el, [
    { opacity, scale: String(scale), translate: `${x}px ${y}px` },
    { opacity: 1, scale: "1", translate: "0 0" }
  ], { duration, easing });
}
function leave(el, { scale = 0.94, x = 0, y = 0, duration = DUR.out, remove = true } = {}) {
  if (!el) return Promise.resolve();
  el.style.pointerEvents = "none";
  return play(el, [
    { opacity: 1, scale: "1", translate: "0 0" },
    { opacity: 0, scale: String(scale), translate: `${x}px ${y}px` }
  ], { duration, easing: EASE.in, fill: "forwards" }).then(() => {
    if (remove) el.remove();
  });
}
function fadeIn(el, { duration = DUR.fade } = {}) {
  if (!el) return Promise.resolve();
  return play(el, [{ opacity: 0 }, { opacity: getComputedStyle(el).opacity }], { duration, easing: EASE.out });
}
function fadeOut(el, { duration = DUR.out, remove = true } = {}) {
  if (!el) return Promise.resolve();
  el.style.pointerEvents = "none";
  return play(el, [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration, easing: EASE.in, fill: "forwards" }).then(() => {
    if (remove) el.remove();
  });
}
function glide(el, dx, dy = 0, { duration = DUR.glide, easing = EASE.soft } = {}) {
  if (!dx && !dy) return Promise.resolve();
  return play(el, [{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration, easing });
}
function springIn(el, style, { grow = null, swell = 1.14, y = -10 } = {}) {
  if (style === "off") return Promise.resolve();
  const room = (v) => grow ? { [grow]: v } : {};
  if (style === "subtle") {
    return play(el, [
      { opacity: 0, scale: "0.94", ...room(0) },
      { opacity: 1, scale: "1", ...room(1) }
    ], { duration: DUR.in, easing: EASE.out });
  }
  const at = (opacity, scale, dy, r) => ({ opacity, scale: String(scale), translate: `0 ${dy}px`, ...room(r) });
  return play(el, [
    at(0, 0.3, y, 0),
    { ...at(1, swell, 0, 1.2), offset: 0.6 },
    at(1, 1, 0, 1)
  ], { duration: DUR.pop, easing: EASE.pop });
}
function springOut(el, style, { room = [{}, {}], swell = 1.1 } = {}) {
  el.style.pointerEvents = "none";
  if (style === "off") {
    el.remove();
    return Promise.resolve();
  }
  const frames = style === "subtle" ? [
    { ...room[0], opacity: 1, scale: "1" },
    { ...room[0], opacity: 0, scale: "0.96", offset: 0.4 },
    { ...room[1], opacity: 0, scale: "0.96" }
  ] : [
    { ...room[0], opacity: 1, scale: "1" },
    { ...room[0], opacity: 1, scale: String(swell), offset: 0.22 },
    { ...room[1], opacity: 0, scale: "0.3" }
  ];
  return play(el, frames, { duration: style === "subtle" ? DUR.glide : DUR.leave, easing: style === "subtle" ? EASE.out : EASE.in, fill: "forwards" }).then(() => el.remove());
}
var EASE, DUR;
var init_motion = __esm({
  "src/core/motion.js"() {
    EASE = {
      out: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      // settling: slides and fades in (--g-ease)
      in: "cubic-bezier(0.4, 0, 1, 1)",
      // going away
      spring: "cubic-bezier(0.3, 1.3, 0.4, 1)",
      // menus and panels opening, the tab glass (--g-spring)
      soft: "cubic-bezier(0.3, 1.15, 0.4, 1)",
      // gliding to a new place, making room (--g-spring-soft)
      bounce: "cubic-bezier(0.3, 1.5, 0.4, 1)",
      // tabs and slots growing in (--g-spring-bounce)
      pop: "cubic-bezier(0.2, 0.8, 0.3, 1)"
      // keyframed pops: their overshoot is in the keyframes
    };
    DUR = { in: 240, out: 150, fade: 200, glide: 280, pop: 540, leave: 350 };
  }
});

// src/core/layoutHub.js
var layoutHub_exports = {};
__export(layoutHub_exports, {
  nudgeLayout: () => nudgeLayout,
  onLayout: () => onLayout,
  setupLayoutHub: () => setupLayoutHub
});
function hubOf(plugin) {
  const hub = hubs.get(plugin);
  if (!hub) throw new Error("Goguryeo: setupLayoutHub(plugin) must run first");
  return hub;
}
function runLayoutHub(hub) {
  hub.frame = 0;
  const came = hub.pending;
  hub.pending = /* @__PURE__ */ new Set();
  for (const { names, fn } of hub.subs) {
    if (!names.some((n) => came.has(n))) continue;
    try {
      fn(came);
    } catch (e) {
      console.error("Goguryeo:", e);
    }
  }
}
function setupLayoutHub(plugin) {
  const hub = { subs: [], pending: /* @__PURE__ */ new Set(), frame: 0 };
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
function onLayout(plugin, names, fn) {
  hubOf(plugin).subs.push({ names, fn });
}
function nudgeLayout(plugin, name) {
  const hub = hubs.get(plugin);
  if (!hub) return;
  hub.pending.add(name);
  if (hub.frame) return;
  hub.frame = window.requestAnimationFrame(() => {
    if (hubs.get(plugin) === hub) runLayoutHub(hub);
  });
}
var WORKSPACE_EVENTS, hubs;
var init_layoutHub = __esm({
  "src/core/layoutHub.js"() {
    WORKSPACE_EVENTS = ["layout-change", "active-leaf-change", "file-open", "css-change", "resize"];
    hubs = /* @__PURE__ */ new WeakMap();
  }
});

// src/core/constants.js
var constants_exports = {};
__export(constants_exports, {
  BAKED_CLASS: () => BAKED_CLASS,
  BG_IMAGE_CLASS: () => BG_IMAGE_CLASS
});
var BAKED_CLASS, BG_IMAGE_CLASS;
var init_constants = __esm({
  "src/core/constants.js"() {
    BAKED_CLASS = "goguryeo-glass-baked";
    BG_IMAGE_CLASS = "goguryeo-bg-image";
  }
});

// src/core/platform.js
var import_obsidian;
var init_platform = __esm({
  "src/core/platform.js"() {
    import_obsidian = require("obsidian");
  }
});

// src/features/bakedGlass.js
var bakedGlass_exports = {};
__export(bakedGlass_exports, {
  setupBakedGlass: () => setupBakedGlass
});
function setupBakedGlass(plugin) {
  if (!import_obsidian.Platform.isDesktopApp) return { schedule() {
  }, bake: async () => {
  } };
  const body = document.body;
  let timer = 0;
  let key;
  let url = "";
  const drop = () => {
    body.removeClass(BAKED_CLASS);
    body.style.removeProperty("--g-bg-glass");
  };
  const bake = async () => {
    const source = plugin.bgSource;
    const opts = readGlassOptions();
    const k = source && body.hasClass(BG_IMAGE_CLASS) ? JSON.stringify([plugin.bgValue, opts]) : "";
    if (k === key) return;
    key = k;
    if (!k) return drop();
    try {
      const bitmap = await readBackground(plugin.app.vault, source);
      if (k !== key) return;
      const blob = await renderBakedGlass(bitmap, opts);
      bitmap.close?.();
      if (k !== key) return;
      const old = url;
      url = URL.createObjectURL(blob);
      body.style.setProperty("--g-bg-glass", `url("${url}")`);
      body.addClass(BAKED_CLASS);
      if (old) window.setTimeout(() => URL.revokeObjectURL(old), 1e3);
    } catch (e) {
      if (k === key) drop();
    }
  };
  const schedule = (ms = 60) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(bake, ms);
  };
  plugin.registerDomEvent(window, "resize", () => schedule(250));
  plugin.register(() => {
    window.clearTimeout(timer);
    key = "";
    drop();
    if (url) URL.revokeObjectURL(url);
  });
  return { schedule, bake };
}
function readGlassOptions() {
  const cs = getComputedStyle(document.body);
  const px = (v) => parseFloat(v) || 0;
  const gm = cs.getPropertyValue("--glass-blur").match(/blur\(([\d.]+)px\)(?:\s*saturate\(([\d.]+)(%?)\))?/);
  return {
    w: window.innerWidth,
    h: window.innerHeight,
    bgBlur: px(cs.getPropertyValue("--g-bg-blur")),
    blur: gm ? Number(gm[1]) : 0,
    sat: gm?.[2] ? Number(gm[2]) / (gm[3] ? 100 : 1) : 1,
    dim: px(cs.getPropertyValue("--g-bg-dim")) / 100,
    veil: cs.getPropertyValue("--g-bg-veil").trim() || "#000"
  };
}
async function readBackground(vault, { file, url }) {
  const data = file ? new Blob([await vault.readBinary(file)]) : await (await fetch(url, { mode: "cors" })).blob();
  return createImageBitmap(data);
}
async function renderBakedGlass(img, { w: W, h: H, bgBlur, blur, sat, dim, veil }) {
  const S = blur >= 8 ? 0.25 : blur >= 4 ? 0.5 : 1;
  const w = Math.max(1, Math.ceil(W * S));
  const h = Math.max(1, Math.ceil(H * S));
  const bg = new OffscreenCanvas(w, h);
  const b = bg.getContext("2d");
  const boxW = (W + 4 * bgBlur) * S;
  const boxH = (H + 4 * bgBlur) * S;
  const k = Math.max(boxW / img.width, boxH / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  b.filter = bgBlur ? `blur(${bgBlur * S}px)` : "none";
  b.drawImage(img, -2 * bgBlur * S + (boxW - dw) / 2, -2 * bgBlur * S + (boxH - dh) / 2, dw, dh);
  b.filter = "none";
  b.globalAlpha = dim;
  b.fillStyle = veil;
  b.fillRect(0, 0, w, h);
  b.globalAlpha = 1;
  const m = Math.ceil(blur * S * 3);
  const pad = new OffscreenCanvas(w + 2 * m, h + 2 * m);
  const p = pad.getContext("2d");
  for (let sx = -1; sx <= 1; sx++) {
    for (let sy = -1; sy <= 1; sy++) {
      p.save();
      p.translate(m + w / 2 + sx * w, m + h / 2 + sy * h);
      p.scale(sx ? -1 : 1, sy ? -1 : 1);
      p.drawImage(bg, -w / 2, -h / 2);
      p.restore();
    }
  }
  const out = new OffscreenCanvas(w, h);
  const o = out.getContext("2d");
  o.filter = `blur(${blur * S}px) saturate(${sat})`;
  o.drawImage(pad, -m, -m);
  return out.convertToBlob({ type: "image/png" });
}
var init_bakedGlass = __esm({
  "src/features/bakedGlass.js"() {
    init_platform();
    init_constants();
  }
});

// src/main.js
var {
  Plugin,
  Platform: Platform2,
  Menu,
  setIcon,
  normalizePath,
  FuzzySuggestModal,
  Notice,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  WorkspaceLeaf,
  Keymap
} = require("obsidian");
var motion = (init_motion(), __toCommonJS(motion_exports));
var { EASE: EASE2, DUR: DUR2 } = motion;
var { setupLayoutHub: setupLayoutHub2, onLayout: onLayout2, nudgeLayout: nudgeLayout2 } = (init_layoutHub(), __toCommonJS(layoutHub_exports));
var { BAKED_CLASS: BAKED_CLASS2 } = (init_constants(), __toCommonJS(constants_exports));
var { setupBakedGlass: setupBakedGlass2 } = (init_bakedGlass(), __toCommonJS(bakedGlass_exports));
var EDGE = 40;
var OPEN_AT = 50;
var LOCK_AT = 10;
var OPEN_CLASS = "goguryeo-touch-active";
var THUMB_CLASS = "goguryeo-glass-thumbs";
var SLIDE_MS = 440;
var SWELL_MS = 320;
var SPLIT_CLASS = "goguryeo-split";
var ONE_PANE_CLASS = "goguryeo-one-pane";
var SHARED_TABS_CLASS = "goguryeo-shared-tabs";
var SHARED_ACTIVE = ":scope > .goguryeo-stab.is-active";
var SOLO_CLASS = "goguryeo-solo";
var SOLO_OFF_CLASS = "goguryeo-solo-off";
var FOLDED_CLASS = "goguryeo-folded";
var MEMBERS_KEY = "goguryeo-split-members";
var GRIP_CLASS = "goguryeo-pane-grip";
var GRIP_MENU_CLASS = "goguryeo-grip-menu";
var PANE_PREVIEW_CLASS = "goguryeo-pane-preview";
var WEB_ZOOM_MAX = 5;
var WEB_ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
var WEB_SHOT_WIDTH = 1280;
var SWIPE_STYLE_KEY = "goguryeo-swipe-style";
var WHEEL_GLIDE_STEPS = 4;
var ARROW_PULL = 400;
var WEB_LOAD_MAX_MS = 4e3;
var WEB_SETTLE_MS = 250;
var WEB_SHOT_GAP_MS = 3e3;
var NEW_PANE = Object.freeze({ newPane: true });
var PANE_PREVIEW_MS = 320;
var SHARED_INNER = ":scope > .goguryeo-stab-inner";
var EDGE_SWIPE_ZONE = 24;
var EDGE_SWIPE_AT = 0.35;
var SWIPE_SETTLE_MS = 280;
var PILL_SWIPE_AT = 56;
var NEW_TAB = "new-tab";
var PILL_FLICK = 0.5;
var PILL_PULL_FULL = 260;
var SWIPE_DRAW_MS = 400;
var CURRENT_PANE_CLASS = "goguryeo-current-pane";
var LAST_PANE_CLASS = "goguryeo-last-pane";
var FLOAT_LEFT_CLASS = "goguryeo-float-left";
var FLOAT_RIGHT_CLASS = "goguryeo-float-right";
var NOTE_MIN_WIDTH = 480;
var AUTO_HIDDEN_KEY = "goguryeo-auto-hidden";
var ANDROID_NAV_KEY = "goguryeo-android-nav";
var PEEK_OPTION_CLASS = "goguryeo-peek-sidebars";
var PEEK_CLASS = { left: "goguryeo-peek-left", right: "goguryeo-peek-right" };
var FLOAT_CLASS = { left: FLOAT_LEFT_CLASS, right: FLOAT_RIGHT_CLASS };
var PEEK_DWELL_MS = 150;
var PEEK_LEAVE_MS = 400;
var PEEK_REACH = 16;
var TOP_OPTION_CLASS = "goguryeo-fullscreen-autohide";
var TOP_HIDDEN_CLASS = "goguryeo-top-hidden";
var TOP_PEEK_CLASS = "goguryeo-top-peek";
var READY_CLASS = "goguryeo-ready";
var BG_SHOWN_CLASS = "goguryeo-bg-shown";
var REVEAL_MS = 320;
var FOLDER_NOTES_CLASS = "goguryeo-folder-notes";
var FOLDER_NOTES_PLUGIN = "folder-notes";
var PEEK_TOP = 40;
var OMNI_CLASS = "goguryeo-omnibox";
var OMNI_MIN_WIDTH = 420;
var OMNI_MARGIN = 8;
var OMNI_MS = 320;
var OMNI_EASE = EASE2.soft;
var SHADOW_ROOM = 32;
var OVERVIEW_CLASS = "goguryeo-tab-overview";
var OVERVIEW_ICON_CLASS = "goguryeo-overview-icon";
var ZOOM_MS = 400;
var ZOOM_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
var TAB_SLIDE_MS = 380;
var TAB_SPRING = EASE2.bounce;
var CARD_HOLD_MS = 300;
var CARD_SLOP = 6;
var CARD_EASE = EASE2.soft;
var SNAP = "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease";
var IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "svg"];
var isImage = (file) => file instanceof TFile && IMAGE_EXTENSIONS.includes(file.extension.toLowerCase());
var BackgroundImageModal = class extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder("Pick a background image\u2026");
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
};
var GoguryeoSettingTab = class extends PluginSettingTab {
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
    const shownWith = {
      "g-bg-color": ["goguryeo-bg-color"],
      "g-bg-image": ["goguryeo-bg-image"],
      "g-bg-blur": ["goguryeo-bg-image"],
      "g-bg-dim": ["goguryeo-bg-image"]
    };
    const startsAt = {
      "g-sidebar-tint": get("g-glass-tint") ?? config["g-glass-tint"]?.default
    };
    for (const s of Object.values(config)) {
      if (shownWith[s.id] && !shownWith[s.id].includes(type)) continue;
      if (s.type === "heading") {
        new Setting(containerEl).setName(s.title).setHeading();
        continue;
      }
      if (s.type === "info-text") {
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
            d.setValue(value ?? "").onChange((v) => {
              set(key, v);
              if (s.id === "goguryeo-bg") this.display();
            });
          });
          break;
        case "variable-number-slider":
          row.addSlider((sl) => sl.setLimits(s.min, s.max, s.step).setValue(value).setDynamicTooltip().onChange((v) => set(key, v)));
          break;
        case "variable-color":
        case "variable-themed-color":
          if (s.type === "variable-themed-color") row.setDesc(`${s.description ?? ""} For ${mode} mode.`.trim());
          row.addColorPicker((c) => c.setValue(value ?? "").onChange((v) => set(key, v)));
          break;
        default:
          row.addText((t) => t.setValue(value == null ? "" : String(value)).onChange((v) => {
            set(key, s.type === "variable-number" ? Number(v) : v);
          }));
      }
      row.addExtraButton((b) => b.setIcon("reset").setTooltip("Restore default").onClick(() => {
        manager.clearSetting("goguryeo", key);
        this.display();
      }));
      if (s.id === "goguryeo-edge-swipe" && Platform2.isAndroidApp) this.androidNavPicker();
    }
  }
  // The companion's own folder notes. Saved in the plugin's data, so they
  // follow the vault to every device.
  folderNotesSection() {
    const plugin = this.plugin;
    new Setting(this.containerEl).setName("Folder notes").setHeading();
    const other = plugin.otherFolderNotesOn();
    if (!plugin.folderNoteSettings) plugin.folderNoteSettings = { enabled: true };
    new Setting(this.containerEl).setName("Folder notes").setDesc(other ? "The Folder notes plugin is on. Turn it off in Community plugins to use these instead." : "A file named like its folder, inside it (Novel/Novel.md, .canvas, .base...), is the folder's note. Clicking the folder opens it, the note itself is hidden from the file list, and renaming the folder renames the note. Right-click a folder to make one, or a note to turn it into one.").addToggle((t) => t.setValue(plugin.folderNoteSettings.enabled).setDisabled(other).onChange(async (v) => {
      plugin.folderNoteSettings.enabled = v;
      await plugin.saveData(plugin.folderNoteSettings);
      plugin.refreshFolderNotes();
      this.display();
    }));
    new Setting(this.containerEl).setName("Underline folders that have a note").setDesc("A faint line under the folder's name in the file list.").addToggle((t) => t.setValue(!!plugin.folderNoteSettings.underline).setDisabled(other).onChange(async (v) => {
      plugin.folderNoteSettings.underline = v;
      await plugin.saveData(plugin.folderNoteSettings);
      plugin.refreshFolderNotes();
    }));
    const st = plugin.folderNoteStatus();
    new Setting(this.containerEl).setName("Status").setDesc(`Companion ${plugin.manifest.version} \xB7 ${st.on ? "on" : "off"} \xB7 ${st.found} folder notes found \xB7 file list: ${st.folders} folder rows, ${st.hidden} notes hidden, ${st.visible} still shown${st.error ? ` \xB7 error: ${st.error}` : ""}`).addExtraButton((b) => b.setIcon("refresh-cw").setTooltip("Check again").onClick(() => {
      plugin.refreshFolderNotes();
      this.display();
    }));
    new Setting(this.containerEl).setName("Tabs").setHeading();
    new Setting(this.containerEl).setName("Opening and closing tabs").setDesc("How a tab comes and goes. Subtle: it fades in or out while its room opens or closes. Lively: it springs in past its size and swells before shrinking away. Off: at once.").addDropdown((d) => d.addOption("subtle", "Subtle").addOption("lively", "Lively").addOption("off", "Off").setValue(plugin.tabMotion()).onChange(async (v) => {
      plugin.folderNoteSettings.tabMotion = v;
      await plugin.saveData(plugin.folderNoteSettings);
    }));
    if (Platform2.isDesktopApp) {
      new Setting(this.containerEl).setName("Back and forward").setHeading();
      new Setting(this.containerEl).setName("Trackpad swipe style (this device)").setDesc("Two fingers sideways go back or forward. Smooth: the page slides with your fingers over the one it goes to. Chrome: an arrow comes in from the side and the page changes at once; lighter, for a slower computer.").addDropdown((d) => d.addOption("smooth", "Smooth (sliding page)").addOption("chrome", "Chrome (arrow)").setValue(plugin.swipeStyle).onChange((v) => plugin.setSwipeStyle(v)));
    }
    new Setting(this.containerEl).setName("Theme").setHeading();
  }
  // Per device, so it stays out of Style Settings (which syncs with the vault)
  androidNavPicker() {
    new Setting(this.containerEl).setName("Android navigation (this device)").setDesc(`With gesture navigation, Android's back gesture uses the screen edges, so the swipe stays off here unless the option above is "On". With the navigation buttons, the edges are free and the swipe works like on iPhone and iPad.`).addDropdown((d) => d.addOption("gestures", "Gesture navigation").addOption("buttons", "Navigation buttons").setValue(this.plugin.androidNav).onChange((v) => this.plugin.setAndroidNav(v)));
  }
  imagePicker() {
    const current = this.plugin.getBackgroundImage();
    const image = new Setting(this.containerEl).setName("Image").setDesc(current || "None yet. Choose one, or right-click an image in the file list \u2192 Use as background.").addButton((b) => b.setButtonText("Choose from vault").setCta().onClick(() => this.plugin.chooseBackgroundImage(() => this.display()))).addButton((b) => b.setButtonText("From this device\u2026").onClick(() => this.plugin.importBackgroundImage(() => this.display())));
    const file = current && this.app.vault.getFileByPath(current);
    if (file) {
      image.settingEl.addClass("goguryeo-bg-setting");
      image.infoEl.prepend(createEl("img", {
        cls: "goguryeo-bg-preview",
        attr: { src: this.app.vault.getResourcePath(file) }
      }));
    }
  }
};
module.exports = class GoguryeoCompanion extends Plugin {
  onload() {
    this.setupLayoutHub();
    this.app.workspace.onLayoutReady(() => {
      this.patchRibbonIsShown();
      this.patchUpdateFrameless();
      this.refreshFrame();
    });
    this.onLayout(["css-change"], () => this.refreshFrame());
    this.setupBakedGlass();
    this.app.workspace.onLayoutReady(() => this.updateBackground());
    this.onLayout(["css-change"], () => this.updateBackground());
    this.setupBackgroundPickers();
    this.app.workspace.onLayoutReady(() => this.setupPopouts());
    if (Platform2.isDesktopApp) this.app.workspace.onLayoutReady(() => this.setupWebPinch());
    if (Platform2.isDesktopApp) this.app.workspace.onLayoutReady(() => this.setupTrackpadSwipe());
    this.app.workspace.onLayoutReady(() => this.setupTabThumbs());
    this.app.workspace.onLayoutReady(() => this.patchSelectTab());
    this.app.workspace.onLayoutReady(() => this.patchScreenSlide());
    this.app.workspace.onLayoutReady(() => this.setupFloatingSidebars());
    this.app.workspace.onLayoutReady(() => this.setupSidebarPeek());
    this.app.workspace.onLayoutReady(() => this.setupTopPeek());
    this.app.workspace.onLayoutReady(() => this.setupPhoneBar());
    this.androidNav = this.app.loadLocalStorage(ANDROID_NAV_KEY) === "buttons" ? "buttons" : "gestures";
    this.swipeStyle = this.app.loadLocalStorage(SWIPE_STYLE_KEY) === "chrome" ? "chrome" : "smooth";
    if (Platform2.isMobile) this.setupEdgeSwipe();
    this.setupPathSwitcher();
    if (Platform2.isMobile) this.setupHaptics();
    if (!Platform2.isPhone) this.setupTabOverview();
    this.setupFolderNotes();
    this.app.workspace.onLayoutReady(() => this.revealUI());
    if (!Platform2.isDesktopApp) return;
    this.swipe = null;
    const opts = { passive: true, capture: true };
    this.registerDomEvent(document, "touchstart", (e) => this.onTouchStart(e), opts);
    this.registerDomEvent(document, "touchmove", (e) => this.onTouchMove(e), opts);
    this.registerDomEvent(document, "touchend", () => this.onTouchEnd(), opts);
    this.registerDomEvent(document, "touchcancel", () => this.onTouchEnd(), opts);
    this.registerDomEvent(document, "click", (e) => this.onClick(e), { capture: true });
  }
  // ---- One place where the layout events come in (src/core/layoutHub.js) ----
  setupLayoutHub() {
    setupLayoutHub2(this);
  }
  onLayout(names, fn) {
    onLayout2(this, names, fn);
  }
  nudgeLayout(name) {
    nudgeLayout2(this, name);
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
    const tell = (webview) => webview.executeJavaScript(`window.__goguryeoZoomF = ${webview.getZoomFactor()}`).catch(() => {
    });
    const ready = (webview) => {
      try {
        webview.setVisualZoomLevelLimits?.(1, WEB_ZOOM_MAX);
        webview.executeJavaScript(listen).catch(() => {
        });
        tell(webview);
      } catch (e) {
      }
    };
    const onMessage = (webview, message) => {
      if (message?.startsWith(MARK + "swipe:")) {
        const [dx, dy] = message.slice(MARK.length + 6).split(":").map(Number);
        let leaf = null;
        this.app.workspace.iterateAllLeaves((l) => {
          if (l.view?.webview === webview) leaf = l;
        });
        if (leaf) this.onSwipeWheel({ deltaX: dx, deltaY: dy, deltaMode: 0, ctrlKey: false }, leaf);
        return;
      }
      if (!message?.startsWith(MARK + "zoom:")) return;
      const dir = -Math.sign(parseFloat(message.slice(MARK.length + 5)) || 0);
      if (!dir) return;
      const now = webview.getZoomFactor();
      const next = dir > 0 ? WEB_ZOOM_STEPS.find((z) => z > now + 1e-3) : [...WEB_ZOOM_STEPS].reverse().find((z) => z < now - 1e-3);
      if (!next) return;
      webview.setZoomFactor(next);
      tell(webview);
    };
    const wired = /* @__PURE__ */ new Set();
    const scan = () => this.app.workspace.iterateAllLeaves((leaf) => {
      const webview = leaf.view?.getViewType?.() === "webviewer" ? leaf.view.webview : null;
      if (!webview || wired.has(webview)) return;
      wired.add(webview);
      const onReady = () => ready(webview);
      const onConsole = (e) => onMessage(webview, e.message);
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
    this.onLayout(["layout-change", "active-leaf-change"], scan);
    this.register(() => {
      for (const webview of wired) {
        webview.gGoguryeoOff?.();
        try {
          webview.setVisualZoomLevelLimits?.(1, 1);
        } catch (e) {
        }
      }
    });
  }
  // A web page's picture as a small JPEG: a full-size PNG took Obsidian's
  // own thread long enough to stall it on every page load
  webShotURL(image) {
    try {
      const { width } = image.getSize();
      const small = width > WEB_SHOT_WIDTH ? image.resize({ width: WEB_SHOT_WIDTH, quality: "good" }) : image;
      if (small.toJPEG) return "data:image/jpeg;base64," + small.toJPEG(80).toString("base64");
      return small.toDataURL();
    } catch (e) {
      return null;
    }
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
    if (this.swipeStyle === "chrome") return;
    if (!webview.isConnected || !webview.offsetWidth) return;
    const now = Date.now();
    if (now - (this.webShotAt?.get(url) ?? 0) < WEB_SHOT_GAP_MS) return;
    (this.webShotAt ??= /* @__PURE__ */ new Map()).set(url, now);
    if (this.webShotAt.size > 80) this.webShotAt.delete(this.webShotAt.keys().next().value);
    webview.capturePage?.().then((image) => {
      const src = this.webShotURL(image);
      if (!src) return;
      const shots = this.webShots ??= /* @__PURE__ */ new Map();
      shots.delete(url);
      shots.set(url, src);
      while (shots.size > 40) shots.delete(shots.keys().next().value);
    }).catch(() => {
    });
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
      SPLIT_CLASS,
      ONE_PANE_CLASS,
      SHARED_TABS_CLASS,
      SOLO_CLASS,
      PANE_PREVIEW_CLASS,
      FLOAT_LEFT_CLASS,
      FLOAT_RIGHT_CLASS,
      PEEK_CLASS.left,
      PEEK_CLASS.right,
      TOP_HIDDEN_CLASS,
      TOP_PEEK_CLASS,
      OPEN_CLASS,
      OVERVIEW_CLASS + "-open",
      "goguryeo-pane-dragging",
      "goguryeo-phone-menu-open",
      BAKED_CLASS2
      // the copy fits the main window's size
    ];
    const vars = ["--g-root-top", "--g-root-left", "--g-root-right"];
    const strip = (body) => {
      for (const c of classes) if (body.classList.contains(c)) body.classList.remove(c);
      for (const v of vars) if (body.style.getPropertyValue(v)) body.style.removeProperty(v);
    };
    const watched = /* @__PURE__ */ new Map();
    const watch = (doc) => {
      const body = doc?.body;
      if (!body || body === document.body || watched.has(body)) return;
      strip(body);
      const observer = new doc.defaultView.MutationObserver(() => strip(body));
      observer.observe(body, { attributes: true, attributeFilter: ["class", "style"] });
      watched.set(body, observer);
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
    document.body.removeClass(BG_SHOWN_CLASS);
    const ribbon = this.getRibbon();
    if (ribbon) this.clearInline(ribbon);
  }
  // ---- Startup: the UI comes in once, laid out, then the picture ----
  // Obsidian draws the workspace before the plugins have finished: first
  // the plain dark look, then Style Settings' options (the background),
  // then the companion's layout (the floating card, the sidebar buttons),
  // each a jump. The theme keeps the panes hidden until this runs, after
  // every other layout-ready step and the frame that lays the cards out;
  // they fade in, then the background picture fades in under the glass
  // (only after: while the panes fade, their glass can't blur what's
  // behind them, and would sharpen at the end).
  revealUI() {
    const body = document.body;
    if (body.hasClass(READY_CLASS)) {
      this.uiShown = true;
      this.showBackground();
      return;
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      body.addClass(READY_CLASS);
      this.uiShownTimer = window.setTimeout(() => {
        this.uiShown = true;
        this.showBackground();
      }, this.reducedMotion() ? 0 : REVEAL_MS);
    }));
    this.register(() => window.clearTimeout(this.uiShownTimer));
  }
  // The picture behind everything. Loaded and decoded before it's used,
  // so it never shows half-drawn: at startup it then fades in (the theme,
  // once BG_SHOWN_CLASS is on), and a new picture replaces the old one
  // only once it's ready.
  updateBackground() {
    const body = document.body;
    const raw = getComputedStyle(body).getPropertyValue("--g-bg-image").trim().replace(/^(["'])(.*)\1$/, "$2").replace(/^!?\[\[([^|\]]+).*\]\]$/, "$1").trim();
    let url = "";
    let file = null;
    if (/^[a-z][a-z0-9+.-]+:/i.test(raw)) {
      url = raw;
    } else if (raw) {
      file = this.app.metadataCache.getFirstLinkpathDest(raw, "") ?? this.app.vault.getFileByPath(normalizePath(raw));
      if (file) url = this.app.vault.getResourcePath(file);
    }
    const value = url ? `url("${url.replace(/"/g, "%22")}")` : "";
    if (value === this.bgValue) {
      this.showBackground();
      this.scheduleBake();
      return;
    }
    this.bgValue = value;
    this.bgSource = value ? { file, url } : null;
    if (!value) {
      body.style.removeProperty("--g-bg-url");
      this.scheduleBake();
      return;
    }
    const done = () => {
      if (this.bgValue !== value) return;
      body.style.setProperty("--g-bg-url", value);
      this.bgReady = true;
      this.showBackground();
      this.scheduleBake();
    };
    const img = new Image();
    img.src = url;
    img.decode().then(done, done);
  }
  showBackground() {
    if (this.uiShown && this.bgReady) document.body.addClass(BG_SHOWN_CLASS);
  }
  // ---- Baked glass: the big panels don't blur live (src/features/bakedGlass.js) ----
  setupBakedGlass() {
    this.bakedGlass = setupBakedGlass2(this);
  }
  scheduleBake(ms) {
    this.bakedGlass?.schedule(ms);
  }
  bakeGlass() {
    return this.bakedGlass?.bake();
  }
  // ---- Background image pickers ----
  setupBackgroundPickers() {
    this.addSettingTab(new GoguryeoSettingTab(this.app, this));
    this.addCommand({
      id: "choose-background-image",
      name: "Choose background image",
      callback: () => this.chooseBackgroundImage()
    });
    this.addCommand({
      id: "import-background-image",
      name: "Background image from this device",
      callback: () => this.importBackgroundImage()
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!isImage(file)) return;
      menu.addItem((item) => item.setTitle("Use as background").setIcon("image").onClick(() => this.setBackgroundImage(file)));
    }));
  }
  // The value lives in Style Settings, next to the theme's other options
  getStyleSettings() {
    const manager = this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager;
    if (!manager) new Notice("Goguryeo: turn on the Style Settings plugin to set a background.");
    return manager;
  }
  getBackgroundImage() {
    return this.app.plugins.plugins["obsidian-style-settings"]?.settingsManager?.getSetting("goguryeo", "g-bg-image") || "";
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
    const app = this.app;
    ribbon.isShown = function() {
      const body = document.body;
      const floats = app.customCss?.theme === "Goguryeo" && !body.hasClass("is-mobile") && !body.hasClass("goguryeo-ribbon-static");
      return !floats && HTMLElement.prototype.isShown.call(this);
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
    workspace.updateFrameless = function(...args) {
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
    if (!Platform2.isDesktopApp || this.app.customCss?.theme !== "Goguryeo") return;
    const { rootSplit, leftSidebarToggleButtonEl: left, rightSidebarToggleButtonEl: right } = this.app.workspace;
    const bars = rootSplit?.containerEl.querySelectorAll(".workspace-tabs.mod-top > .workspace-tab-header-container");
    if (!bars?.length) return;
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
    if (!Platform2.isDesktopApp) return;
    this.onLayout(["window-resize", "layout-change", "resize", "css-change"], () => this.updateFloatingSidebars());
    this.registerDomEvent(document, "pointerdown", (e) => this.onFloatingDismiss(e), { capture: true });
    this.register(() => {
      document.body.removeClass(FLOAT_LEFT_CLASS, FLOAT_RIGHT_CLASS);
      this.refreshFrame();
    });
    this.autoHidden = { left: false, right: false, ...this.app.loadLocalStorage(AUTO_HIDDEN_KEY) };
    for (const side of ["left", "right"]) document.body.toggleClass(FLOAT_CLASS[side], this.autoHidden[side]);
    this.updateFloatingSidebars();
  }
  updateFloatingSidebars() {
    const { leftSplit, rightSplit } = this.app.workspace;
    const body = document.body;
    let left = body.hasClass(FLOAT_LEFT_CLASS), right = body.hasClass(FLOAT_RIGHT_CLASS);
    const width = this.app.customCss?.theme === "Goguryeo" && !Platform2.isMobile ? window.innerWidth : 0;
    if (width !== this.windowWidth) {
      this.windowWidth = width;
      const room = width - NOTE_MIN_WIDTH;
      left = width > 0 && leftSplit.size > room;
      right = width > 0 && leftSplit.size + rightSplit.size > room;
    }
    const was = this.sidebarsOpen;
    const open = { left: !leftSplit.collapsed, right: !rightSplit.collapsed };
    this.sidebarsOpen = open;
    const floats = (side, byWidth) => byWidth || body.hasClass(PEEK_CLASS[side]);
    if (floats("left", left) && floats("right", right) && was && open.left && open.right) {
      if (!was.left) this.closeSidebar("right");
      else if (!was.right) this.closeSidebar("left");
    }
    for (const side of ["left", "right"]) {
      if (!open[side] && body.hasClass(PEEK_CLASS[side])) this.endPeek(side);
    }
    const narrow = { left, right };
    const changed = ["left", "right"].filter((side) => body.hasClass(FLOAT_CLASS[side]) !== narrow[side]);
    if (!changed.length) return;
    body.toggleClass(FLOAT_LEFT_CLASS, left);
    body.toggleClass(FLOAT_RIGHT_CLASS, right);
    for (const side of changed) this.autoHide(side, narrow[side]);
    this.refreshFrame();
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
      if (peeking) {
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
    if (!Platform2.isDesktopApp) return;
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
    if (!Platform2.isDesktopApp) return;
    this.peekTimers = { left: null, right: null };
    this.peekFrames = { left: 0, right: 0 };
    this.updatePeekZone();
    this.onLayout(["css-change"], () => this.updatePeekZone());
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
    return (body.hasClass(PEEK_OPTION_CLASS) || body.hasClass(FLOAT_CLASS[side])) && !Platform2.isMobile && this.app.customCss?.theme === "Goguryeo";
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
        if (split.collapsed) continue;
        if (!left && this.nearPeek(side, e) || busy || this.holdsPeek(split)) this.stopWaitingPeek(side);
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
    return side === "left" ? e.clientX <= Math.max(r.right, this.peekZone) + PEEK_REACH : e.clientX >= Math.min(r.left, window.innerWidth - this.peekZone) - PEEK_REACH;
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
      if (shut || !split.collapsed || performance.now() - started > 1e3) {
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
    if (!Platform2.isDesktopApp) return;
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
    const on = body.hasClass("is-fullscreen") && body.hasClass(TOP_OPTION_CLASS) && !body.hasClass("goguryeo-no-cards") && !Platform2.isMobile && this.app.customCss?.theme === "Goguryeo";
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
      if (!left && e.clientY <= this.topRowsBottom() + PEEK_REACH || busy || this.holdsTop()) this.waitTop(null);
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
      ".mod-root .workspace-leaf-content > .view-header, .goguryeo-shared-tabs-bar, .mod-root .workspace-tabs > .workspace-tab-header-container"
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
    return !r || x >= r.left && x <= r.right;
  }
  // Typing in the rows (a rename in the path) keeps them out
  holdsTop() {
    const active = document.activeElement;
    return !!active?.closest?.(".mod-root .view-header, .goguryeo-shared-tabs-bar") && active.matches("input, textarea, [contenteditable='true']");
  }
  // ---- iPhone: a right sidebar button (Obsidian has none on phones) ----
  // ---- iPhone: one bar at the bottom ----
  // ( ‹ ) ( folder › name ) ( ⋯ ): the theme hides the top row and draws
  // the capsule over Obsidian's tabs button; the plugin gives the capsule
  // its gestures and turns Obsidian's ≡ into ⋯, one menu holding what the
  // top row had.
  setupPhoneBar() {
    if (!Platform2.isPhone) return;
    this.setupNameCapsule();
    this.setupNameGestures();
    this.setupPhoneMenu();
    this.setupPhoneTabZoom();
    this.setupStatusEdge();
  }
  // ---- iPhone: the status bar, Safari style ----
  // The clock and indicators stay while scrolling, as in Safari: Obsidian
  // hides the iOS status bar when the bottom bar folds (hideNavigation →
  // its StatusBar plugin's hide), so it is shown again right away. Behind
  // it there is no strip; text that scrolls under it is softened by a
  // graduated blur, four layers from strong at the top to none at its
  // lower edge (theme: .goguryeo-status-edge; design canvas "iPhone —
  // status bar like Safari").
  setupStatusEdge() {
    const edge = document.body.createDiv("goguryeo-status-edge");
    edge.setAttr("aria-hidden", "true");
    for (let i = 0; i < 4; i++) edge.createDiv();
    document.body.addClass("goguryeo-status-edge-on");
    this.register(() => {
      edge.remove();
      document.body.removeClass("goguryeo-status-edge-on");
    });
    const nav = this.app.mobileNavbar;
    if (!nav?.hideNavigation) return;
    const own = Object.hasOwn(nav, "hideNavigation");
    const original = nav.hideNavigation;
    nav.hideNavigation = function(...args) {
      const folding = !document.body.hasClass("is-hidden-nav");
      const result = original.apply(this, args);
      if (folding) try {
        window.Capacitor?.Plugins?.StatusBar?.show?.({ animation: "NONE" })?.catch?.(() => {
        });
      } catch (e) {
      }
      return result;
    };
    this.register(() => {
      if (own) nav.hideNavigation = original;
      else delete nav.hideNavigation;
    });
  }
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
    this.registerDomEvent(document, "click", (e) => {
      const action = e.target.closest?.(".mobile-navbar-action-menu");
      if (!action) return;
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
    const run = (fn) => () => {
      this.closePhoneMenu();
      window.setTimeout(() => {
        const before = this.suppressClickUntil;
        this.suppressClickUntil = Date.now() + 1e3;
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
      const seen = /* @__PURE__ */ new Set();
      const actions = view.containerEl.querySelectorAll(":scope > .view-header .view-actions > .view-action");
      for (const button of actions) {
        if (button === mode || button === view.moreOptionsButtonEl) continue;
        const label = (button.getAttribute("aria-label") ?? "").split("\n")[0];
        const icon = [...button.querySelector("svg")?.classList ?? []].find((c) => c.startsWith("lucide-"));
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
    const tr = (key, fallback) => {
      const text = window.i18next?.t?.(key);
      return text && text !== key ? text : fallback;
    };
    const prefix = {
      "info.copy": tr("interface.menu.copy-path", "Copy path"),
      "view.linked": tr("interface.menu.open-linked-view", "Open linked view")
    };
    return flat.map((e, i) => ({ ...e, i })).sort((a, b) => rank(a.section) - rank(b.section) || a.i - b.i).map(({ it, section }) => ({
      title: [prefix[section], it.titleEl?.textContent?.trim() || it.dom.textContent.trim()].filter(Boolean).join(" \xB7 "),
      iconEl: it.iconEl,
      warning: it.dom.hasClass("is-warning") || section === "danger",
      disabled: !!it.disabled || it.dom.hasClass("is-disabled"),
      checked: !!it.checked,
      run: (evt) => it.callback ? it.callback(evt) : it.handleEvent?.(evt)
    })).filter((e) => e.title);
  }
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
    this.folderNotePaths = /* @__PURE__ */ new Set();
    this.folderNoteStyle = document.head.createEl("style", { attr: { id: "goguryeo-folder-notes" } });
    this.app.workspace.onLayoutReady(async () => {
      this.folderNoteSettings = { enabled: true, ...await this.loadData() };
      this.refreshFolderNotes();
      const later = () => this.scheduleFolderNotes();
      this.registerEvent(this.app.vault.on("create", later));
      this.registerEvent(this.app.vault.on("delete", later));
      this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
        this.followFolderRename(file, oldPath);
        later();
      }));
      this.onLayout(["file-open", "layout-change", "active-leaf-change"], () => this.markCrumbs());
      for (const name of ["enablePlugin", "disablePlugin"]) {
        const plugins = this.app.plugins;
        const original = plugins[name];
        if (typeof original !== "function") continue;
        plugins[name] = function(...args) {
          const result = original.apply(this, args);
          Promise.resolve(result).then(later, later);
          return result;
        };
        this.register(() => {
          if (plugins[name] !== original) plugins[name] = original;
        });
      }
    });
    this.registerDomEvent(document, "click", (e) => this.onFolderClick(e), { capture: true });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!this.folderNotesOn()) return;
      if (file instanceof TFolder && !file.isRoot()) {
        const note = this.folderNoteOf(file.path);
        if (note) {
          menu.addItem((item) => item.setTitle("Open folder note").setIcon("file-text").setSection("open").onClick(() => this.openFolderNote(note)));
        } else {
          menu.addItem((item) => item.setTitle("Create folder note").setIcon("file-plus").setSection("action").onClick(() => this.createFolderNote(file)));
        }
      } else if (file instanceof TFile && !this.isFolderNote(file)) {
        menu.addItem((item) => item.setTitle("Turn into folder note").setIcon("folder-input").setSection("action").onClick(() => this.turnIntoFolderNote(file)));
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
    const rows = [...document.querySelectorAll(".nav-files-container .nav-file-title")].filter((r) => this.folderNotePaths?.has(r.dataset.path));
    const hidden = rows.filter((r) => !r.offsetParent || r.getBoundingClientRect().height === 0).length;
    return {
      on: this.folderNotesOn(),
      found: this.folderNotePaths?.size ?? 0,
      folders: document.querySelectorAll(".nav-files-container .nav-folder-title").length,
      hidden,
      visible: rows.length - hidden,
      error: this.folderNoteError ?? ""
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
    this.folderNotePaths = /* @__PURE__ */ new Set();
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
      notes.map((p) => `${list} .nav-folder-title${q(p.slice(0, p.lastIndexOf("/")))} .nav-folder-title-content`).join(",\n") + (this.folderNoteSettings.underline ? " { text-decoration: underline; text-decoration-color: var(--text-faint); text-underline-offset: 3px; cursor: pointer; }" : " { cursor: pointer; }"),
      // and the current row while its note is open
      notes.map((p) => `${list} .nav-folder:has(> .nav-folder-children .nav-file-title.is-active${q(p)}) > .nav-folder-title`).join(",\n") + " { background-color: var(--nav-item-background-active); color: var(--nav-item-color-active); font-weight: var(--nav-item-weight-active); }"
    ].join("\n") : "";
    this.markCrumbs();
  }
  // The path above a note (its folders, one breadcrumb each, outermost
  // first): a folder with a note is a link, and a folder note's own title
  // says so. The same classes as the Folder notes plugin's, which the theme
  // already styles.
  markCrumbs() {
    if (this.otherFolderNotesOn()) return;
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
      header.querySelector(".view-header-title")?.toggleClass("path-is-folder-note", on && !!file && this.folderNotePaths.has(file.path));
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
    e.preventDefault();
    e.stopPropagation();
    const shown = this.app.workspace.getActiveFile() === note;
    if (!shown || Keymap.isModEvent(e)) this.openFolderNote(note, e);
    const collapsed = !!title.parentElement?.hasClass("is-collapsed");
    if (!shown && !collapsed) return;
    const item = this.app.workspace.getLeavesOfType("file-explorer")[0]?.view?.fileItems?.[title.dataset.path];
    if (typeof item?.setCollapsed === "function") item.setCollapsed(!collapsed, true);
    else title.querySelector(".collapse-icon")?.click();
  }
  openFolderNote(note, e = null) {
    const leaf = this.app.workspace.getLeaf(e ? Keymap.isModEvent(e) : false);
    leaf.openFile(note);
    if (Platform2.isPhone && e?.target?.closest?.(".workspace-drawer")) this.app.workspace.leftSplit?.collapse?.();
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
    if (oldName === file.name) return;
    const note = file.children.find((f) => f instanceof TFile && this.folderNoteName(f) === oldName);
    if (!note) return;
    const target = normalizePath(`${file.path}/${note.name.replace(oldName, file.name)}`);
    if (this.app.vault.getAbstractFileByPath(target)) return;
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
    this.registerDomEvent(document, "click", (e) => {
      const tap = this.pathTapAt(e);
      if (!tap) return;
      if (tap.viaBar && tap.crumb) {
        e.preventDefault();
        e.stopImmediatePropagation();
        tap.crumb.click();
        return;
      }
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
        if (from || Platform2.isPhone) this.prefillSwitcher(file);
        return result;
      };
      this.register(() => {
        command.callback = callback;
      });
    });
  }
  // What a click means for the path, on every platform alike: null (not
  // the path), else { crumb } (a folder with a folder note, or null: the
  // rest of the path, which opens the quick switcher) and viaBar.
  // Desktop and iPad: the path capsule. iPhone: its folder pill, and the
  // capsule itself, which sits over Obsidian's tabs button (the bar is a
  // layer above the note), so the click lands on the button and is matched
  // by position; a drag on the pill swallows its click.
  pathTapAt(e) {
    const path = Platform2.isPhone ? ".mod-root .view-header-title-parent" : ".mod-root .view-header-title-container";
    if (e.target.closest?.(path)) {
      if (e.target.closest(".webviewer-address-container")) return null;
      return { crumb: e.target.closest(".view-header-breadcrumb.has-folder-note"), viaBar: false };
    }
    if (!Platform2.isPhone || Date.now() <= (this.suppressClickUntil ?? 0)) return null;
    if (!e.target.closest?.(".mobile-navbar-action-tabs") || !this.capsuleAt(e.clientX, e.clientY)) return null;
    const folder = this.capsuleFolderAt(e.clientX, e.clientY);
    return { crumb: folder?.matches(".has-folder-note") ? folder : null, viaBar: true };
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
    const crumb = [...header.querySelectorAll(".view-header-title-parent > .view-header-breadcrumb")].find((c) => c.offsetWidth > 0);
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
    if (Platform2.isPhone) return null;
    const header = this.app.workspace.getMostRecentLeaf()?.view?.containerEl.querySelector(":scope > .view-header");
    const el = header?.querySelector(".view-header-title-container");
    if (el?.matches(".webviewer-address-container")) return null;
    const rect = el?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0) return null;
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
    if (this.reducedMotion()) return;
    const p = prompt.getBoundingClientRect();
    const start = `inset(0 ${Math.max(0, p.right - c.right)}px ${Math.max(0, p.height - c.height)}px ${Math.max(0, c.left - p.left)}px round ${radius})`;
    const end = parseFloat(getComputedStyle(prompt).borderTopLeftRadius) + SHADOW_ROOM;
    this.play(prompt, [{ clipPath: start }, { clipPath: `inset(-${SHADOW_ROOM}px round ${end}px)` }], { duration: OMNI_MS, easing: OMNI_EASE });
    const dim = container.querySelector(".modal-bg");
    this.fadeIn(dim, { duration: OMNI_MS });
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
    this.onLayout(["layout-change"], () => {
      addIcons();
      if (this.overview) this.renderOverview();
    });
    this.register(() => {
      this.closeOverview(true);
      document.querySelectorAll(`.${OVERVIEW_ICON_CLASS}`).forEach((el) => el.remove());
    });
    this.registerDomEvent(document, "click", (e) => {
      const icon = e.target.closest?.(button)?.querySelector(`.${OVERVIEW_ICON_CLASS}`);
      if (!icon || getComputedStyle(icon).display === "none") return;
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
    this.onLayout(["window-resize"], () => this.overview && this.renderOverview());
    this.registerDomEvent(window, "pointermove", (e) => this.onCardMove(e));
    this.registerDomEvent(window, "pointerup", (e) => this.onCardUp(e));
    this.registerDomEvent(window, "pointercancel", (e) => this.onCardUp(e, true));
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
    bar.createEl("button", { cls: "goguryeo-tab-overview-done", text: "Done" }).addEventListener("click", () => this.closeOverview());
    const box = sheet.createDiv("goguryeo-tab-overview-panes");
    sheet.addEventListener("click", (e) => {
      if (e.target === sheet || e.target === box || e.target.classList?.contains("goguryeo-tab-overview-grid")) this.closeOverview();
    });
    this.overview = { sheet, box };
    document.body.addClass(OVERVIEW_CLASS + "-open");
    this.renderOverview();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const current = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
    const card = this.overview.grid?.querySelector(".goguryeo-tab-card.is-current");
    card?.scrollIntoView({ block: "nearest" });
    sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ZOOM_MS * 0.6, easing: "ease-out" });
    for (const other of this.overview.grid?.children ?? []) {
      if (other === card) continue;
      other.animate(
        [{ opacity: 0, scale: "0.94" }, { opacity: 1, scale: "1" }],
        { duration: ZOOM_MS, delay: 60, easing: ZOOM_EASE, fill: "backwards" }
      );
    }
    const thumb = card?.querySelector(".goguryeo-tab-card-thumb");
    let page = card && this.overviewPageRect(card, current);
    if (!thumb || !page) return;
    const at = thumb.getBoundingClientRect();
    if (!card.hasClass("is-split")) page = this.alignPage(page, current, thumb, at);
    card.querySelector(".goguryeo-tab-card-label")?.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: ZOOM_MS * 0.5, delay: ZOOM_MS * 0.5, easing: "ease-out", fill: "backwards" }
    );
    const copy = this.cardCopy(thumb);
    thumb.style.visibility = "hidden";
    this.zoomCopy(copy, page, at, true).then(() => thumb.style.removeProperty("visibility"));
  }
  // Where a card's page is on screen: a note's view, or for the split's
  // card the panes' area (as the card's map is drawn)
  overviewPageRect(card, leaf) {
    if (card.hasClass("is-split")) {
      const root = this.app.workspace.rootSplit.containerEl.getBoundingClientRect();
      const pane = leaf?.parent?.containerEl.getBoundingClientRect();
      const top = pane && pane.height > 0 ? pane.top : root.top;
      return { left: root.left, top, width: root.width, height: root.bottom - top };
    }
    const r = leaf?.view?.containerEl.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  }
  // The page's copy in a card is laid out without the theme's room for
  // the rows above the note (that padding only applies in the workspace),
  // so its text sits higher than on the page. Shift the page's box so the
  // note's own content lines up with its copy (thumb: the card's picture,
  // at card).
  alignPage(page, leaf, thumb, card) {
    const pick = [".inline-title", ".cm-sizer", ".markdown-preview-sizer", ".view-content > *"].find((sel) => leaf?.view?.containerEl.querySelector(sel) && thumb.querySelector(sel));
    if (!pick) return page;
    const real = leaf.view.containerEl.querySelector(pick).getBoundingClientRect();
    const copy = thumb.querySelector(pick).getBoundingClientRect();
    if (!real || !copy || !real.width || !copy.width) return page;
    const k = page.width / card.width;
    const dx = real.left - (page.left + (copy.left - card.left) * k);
    const dy = real.top - (page.top + (copy.top - card.top) * k);
    return { left: page.left + dx, top: page.top + dy, width: page.width, height: page.height };
  }
  // A card's picture, lifted out of the sheet so it can fly over it. Its
  // page is drawn at the note's size and shrunk by the card's zoom, read
  // from the sheet or the split's card.
  cardCopy(thumb) {
    const copy = thumb.cloneNode(true);
    const cs = getComputedStyle(thumb);
    for (const v of ["--g-card-scale", "--g-page-w", "--g-page-h"]) copy.style.setProperty(v, cs.getPropertyValue(v));
    copy.style.borderRadius = cs.borderRadius;
    return copy;
  }
  // Fly a copy between a page (big) and its card (small). The copy keeps
  // the card's size and is scaled, so the page drawn in it stays sharp to
  // its layout ("scale"); Obsidian's own phone previews are a picture
  // cropped to fit, so those change size instead ("box").
  zoomCopy(copy, page, card, opening, mode = "scale") {
    copy.addClass("goguryeo-zoom-copy");
    document.body.appendChild(copy);
    const radius = parseFloat(copy.style.borderRadius || getComputedStyle(copy).borderRadius) || 0;
    const px = (n) => `${n}px`;
    let big, small;
    if (mode === "scale") {
      Object.assign(copy.style, { left: px(card.left), top: px(card.top), width: px(card.width), height: px(card.height) });
      const k = page.width / card.width;
      big = { transform: `translate(${px(page.left - card.left)}, ${px(page.top - card.top)}) scale(${k})` };
      small = { transform: "none" };
    } else {
      big = { left: px(page.left), top: px(page.top), width: px(page.width), height: px(page.height), borderRadius: "0px" };
      small = { left: px(card.left), top: px(card.top), width: px(card.width), height: px(card.height), borderRadius: px(radius) };
      Object.assign(copy.style, opening ? big : small);
    }
    copy.animate(opening ? [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: ZOOM_MS, fill: "forwards" });
    return copy.animate(opening ? [big, small] : [small, big], { duration: ZOOM_MS, easing: ZOOM_EASE, fill: "forwards" }).finished.catch(() => {
    }).finally(() => copy.remove());
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
    workspace.iterateRootLeaves((leaf) => {
      leaves.push(leaf);
    });
    const bySplit = /* @__PURE__ */ new Map();
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
    o.leafOf = /* @__PURE__ */ new WeakMap();
    o.shotOf = /* @__PURE__ */ new WeakMap();
    const pages = [];
    const addPage = (thumb, leaf) => {
      let snapshot = null;
      const folded = leaf.parent?.containerEl.closest(`.${SOLO_OFF_CLASS}`) || leaf.parent?.children[leaf.parent.currentTab] !== leaf;
      try {
        snapshot = folded && this.splitShots?.get(leaf) || this.snapshotPage(leaf, true);
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
      if (this.overview?.dropped) return;
      this.haptic();
      workspace.setActiveLeaf(leaf, { focus: true });
      this.closeOverview(false, leaf);
    };
    const splitCards = [];
    for (const entry of entries) {
      if (Array.isArray(entry)) {
        const card2 = grid.createDiv("goguryeo-tab-card is-split");
        card2.gLeaves = entry;
        splitCards.push(card2);
        const onScreen = this.shownSplit === entry.gSplit && !document.body.hasClass(SOLO_CLASS);
        card2.toggleClass("is-current", onScreen);
        const thumb2 = card2.createDiv("goguryeo-tab-card-thumb");
        const places = this.splitPlaces(entry.gSplit);
        for (const leaf2 of entry) {
          const part = thumb2.createDiv("goguryeo-tab-card-part");
          const [x, y, w, h] = places.get(leaf2) ?? [entry.indexOf(leaf2) / entry.length, 0, 1 / entry.length, 1];
          part.gPlace = [x, y, w, h];
          part.style.left = `${x * 100}%`;
          part.style.top = `${y * 100}%`;
          part.style.width = `${w * 100}%`;
          part.style.height = `${h * 100}%`;
          part.toggleClass("is-focused", onScreen && leaf2 === current);
          addPage(part, leaf2);
          part.addEventListener("click", (e) => {
            e.stopPropagation();
            go(leaf2);
          });
        }
        const label2 = card2.createDiv("goguryeo-tab-card-label");
        setIcon(label2.createDiv("goguryeo-tab-card-icon"), "lucide-columns-2");
        label2.createDiv({ cls: "goguryeo-tab-card-title", text: entry.map((leaf2) => leaf2.getDisplayText()).join("  \xB7  ") });
        card2.addEventListener("click", () => go(entry.includes(current) ? current : entry[0]));
        continue;
      }
      const leaf = entry;
      const card = grid.createDiv("goguryeo-tab-card");
      card.gLeaves = [leaf];
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
        leaf.detach();
      });
      card.addEventListener("pointerdown", (e) => this.onCardDown(e, card, leaf));
      card.addEventListener("click", () => go(leaf));
    }
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean);
    const colW = parseFloat(columns[0]) || 0;
    const scale = colW / pageW;
    sheet.style.setProperty("--g-card-scale", `${scale}`);
    for (const splitCard of splitCards) {
      splitCard.style.gridColumn = `span ${Math.min(2, columns.length)}`;
      const thumb = splitCard.querySelector(".goguryeo-tab-card-thumb");
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
      if (e.pointerType === "touch") return this.endCardDrag();
      this.liftCard(drag);
    }
    e.preventDefault();
    drag.x = e.clientX;
    drag.y = e.clientY;
    this.placeGhost(drag);
    const x = e.clientX;
    const y = e.clientY + this.overview.grid.scrollTop - drag.scroll;
    const target = [...drag.slots].find(([, r2]) => x >= r2.left && x <= r2.right && y >= r2.top && y <= r2.bottom)?.[0];
    if (!target) return;
    const pane = this.overview.leafOf.get(target)?.parent;
    if (!pane) return;
    const r = drag.slots.get(target);
    const after = pane === drag.pane ? drag.card.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING : x > r.left + r.width / 2;
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
      this.glide(el, dx, dy);
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
    o.dropped = true;
    window.setTimeout(() => {
      if (this.overview === o) o.dropped = false;
    });
    const { card, leaf, ghost } = drag;
    drag.ghost = null;
    drag.card = null;
    this.endCardDrag();
    const pane = drag.pane;
    const index = [...o.grid.children].filter((el) => el === card || o.leafOf.get(el)?.parent === pane).indexOf(card);
    const from = ghost.getBoundingClientRect();
    const to = card.getBoundingClientRect();
    ghost.removeClass("is-lifted");
    this.play(ghost, [
      { translate: "0 0", scale: "1" },
      { translate: `${to.left - from.left}px ${to.top - from.top}px`, scale: `${to.width / (from.width || 1)}` }
    ], { duration: DUR2.glide, easing: EASE2.soft, fill: "forwards" }).then(() => {
      ghost.remove();
      card.removeClass("is-placeholder");
      if (cancelled || !pane || !leaf.parent || this.overview !== o) return;
      const home = leaf.parent;
      if (pane === home && index === home.children.indexOf(leaf)) return;
      const { workspace } = this.app;
      const active = workspace.activeLeaf;
      const shown = pane === home ? home.children[home.currentTab] : pane.children[pane.currentTab];
      home.removeChild(leaf);
      pane.insertChild(index, leaf);
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
  // On the way out the card picked (or the current one, for Done) grows
  // back into its page while the sheet fades
  closeOverview(now = false, leaf = null) {
    const o = this.overview;
    if (!o) return;
    this.overview = null;
    document.body.removeClass(OVERVIEW_CLASS + "-open");
    if (now) {
      o.sheet.remove();
      return;
    }
    o.sheet.style.pointerEvents = "none";
    this.overviewClosingUntil = Date.now() + ZOOM_MS;
    const { workspace } = this.app;
    leaf ??= workspace.getMostRecentLeaf(workspace.rootSplit);
    const card = [...o.grid?.children ?? []].find((c) => c.gLeaves?.includes(leaf));
    const thumb = card?.querySelector(".goguryeo-tab-card-thumb");
    const from = thumb?.getBoundingClientRect();
    const view = o.grid?.getBoundingClientRect();
    const seen = from && view && from.bottom > view.top && from.top < view.bottom && from.width > 0;
    o.sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ZOOM_MS * 0.7, easing: "ease-in", fill: "forwards" }).finished.catch(() => {
    }).finally(() => o.sheet.remove());
    if (!seen) return;
    const copy = this.cardCopy(thumb);
    thumb.style.visibility = "hidden";
    copy.addClass("goguryeo-zoom-copy");
    Object.assign(copy.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.appendChild(copy);
    window.requestAnimationFrame(() => {
      let page = this.overviewPageRect(card, leaf);
      if (page && !card.hasClass("is-split")) page = this.alignPage(page, leaf, thumb, from);
      if (page) this.zoomCopy(copy, page, from, false);
      else copy.remove();
    });
  }
  // ---- iPhone: Obsidian's own tab switcher zooms too ----
  // Obsidian fades its switcher in with a small scale (90ms). Here the
  // page shrinks into its preview instead, and the preview picked grows
  // back into the page. Obsidian's previews are pictures of the page
  // (taken as the switcher opens), cropped to fit the card.
  setupPhoneTabZoom() {
    const sw = this.app.mobileTabSwitcher;
    if (!sw) return;
    const plugin = this;
    const own = { show: Object.hasOwn(sw, "show"), hide: Object.hasOwn(sw, "hide") };
    const { show, hide } = sw;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sw.show = function(...args) {
      plugin.switcherFade?.cancel();
      plugin.switcherFade = null;
      document.body.addClass("goguryeo-tabs-open");
      const result = show.apply(this, args);
      if (!reduced()) Promise.resolve(result).then(() => plugin.phoneZoom(this, true));
      return result;
    };
    sw.hide = function(...args) {
      document.body.removeClass("goguryeo-tabs-open");
      const shown = this.containerEl?.isConnected;
      const result = hide.apply(this, args);
      if (shown && !reduced()) plugin.phoneZoom(this, false);
      return result;
    };
    this.register(() => {
      if (own.show) sw.show = show;
      else delete sw.show;
      if (own.hide) sw.hide = hide;
      else delete sw.hide;
      document.querySelectorAll(".goguryeo-zoom-copy, .goguryeo-zoom-backdrop").forEach((el) => el.remove());
      document.body.removeClass("goguryeo-tabs-open");
      this.switcherFade?.cancel();
    });
  }
  phoneZoom(sw, opening) {
    const container = sw.containerEl;
    if (!container?.isConnected) return;
    document.querySelectorAll(".goguryeo-zoom-copy, .goguryeo-zoom-backdrop").forEach((el) => el.remove());
    container.querySelectorAll(".mobile-tab-preview[style*='visibility']").forEach((el) => el.style.removeProperty("visibility"));
    const leaf = this.app.workspace.getMostRecentLeaf();
    const fade = opening ? [{ opacity: 0, transform: "none" }, { opacity: 1, transform: "none" }] : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "none" }];
    this.switcherFade?.cancel();
    this.switcherFade = container.animate(fade, { duration: opening ? ZOOM_MS * 0.6 : 140, easing: "ease-out", fill: opening ? "none" : "forwards" });
    const preview = sw.tabPreviews?.[leaf?.id]?.containerEl?.querySelector(".mobile-tab-preview");
    const card = preview?.getBoundingClientRect();
    if (!card || card.width === 0 || card.bottom < 0 || card.top > window.innerHeight) return;
    const view = leaf.view;
    const pageEl = view?.getViewType?.() === "markdown" && view.contentEl?.isShown() ? view.contentEl : view?.containerEl;
    const copy = preview.cloneNode(true);
    copy.style.borderRadius = getComputedStyle(preview).borderRadius;
    copy.addClass("goguryeo-zoom-copy");
    Object.assign(copy.style, { left: `${card.left}px`, top: `${card.top}px`, width: `${card.width}px`, height: `${card.height}px` });
    if (!opening) document.body.appendChild(copy);
    preview.style.visibility = "hidden";
    let backdrop = null;
    if (!opening) {
      backdrop = createDiv("goguryeo-zoom-backdrop");
      container.before(backdrop);
      backdrop.style.backgroundColor = getComputedStyle(container).backgroundColor;
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ZOOM_MS * 0.8, easing: "ease-in", fill: "forwards" });
    }
    const fly = () => {
      const page = pageEl?.getBoundingClientRect();
      const done = page && page.width > 0 ? this.zoomCopy(copy, page, card, opening, "box") : Promise.resolve(copy.remove());
      done.then(() => {
        preview.style.removeProperty("visibility");
        backdrop?.remove();
      });
    };
    if (opening) fly();
    else window.requestAnimationFrame(fly);
  }
  // ---- iPhone: haptics ----
  // A light tap from the Taptic Engine. Obsidian's iOS app carries
  // Capacitor's Haptics plugin; elsewhere (iPad without one, Android
  // without it, the desktop preview) this quietly does nothing, or falls
  // back to a short vibration where there is one.
  haptic(style = "LIGHT") {
    try {
      const haptics = window.Capacitor?.Plugins?.Haptics;
      if (haptics?.impact) haptics.impact({ style }).catch(() => {
      });
      else navigator.vibrate?.(8);
    } catch (e) {
    }
  }
  // Every tap on a control gives a tap back, like iOS: buttons and icons,
  // the bars, the path, menus, the tab overview and the file list. Taps
  // in the note itself don't.
  setupHaptics() {
    const controls = [
      "button",
      ".clickable-icon",
      ".mobile-navbar-action",
      ".view-header-breadcrumb",
      ".mobile-tab",
      ".menu-item",
      ".tree-item-self",
      ".workspace-drawer-tab-option-item",
      ".suggestion-item",
      ".checkbox-container",
      ".dropdown"
    ].join(", ");
    this.registerDomEvent(document, "click", (e) => {
      if (Date.now() <= (this.suppressClickUntil ?? 0)) return;
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
    this.registerDomEvent(document, "click", (e) => {
      if (Date.now() > this.suppressClickUntil) return;
      if (!e.target.closest?.(".mobile-navbar-action-tabs")) return;
      e.preventDefault();
      e.stopPropagation();
    }, { capture: true });
  }
  onPillStart(e) {
    if (this.pillDrag?.axis) return;
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
      pill,
      leaf,
      axis: null,
      armed: false,
      page: leaf.view?.contentEl ?? null,
      // the page that follows the finger
      width: leaf.containerEl.getBoundingClientRect().width || window.innerWidth,
      prev: i > 0 ? tabs[i - 1] : null,
      next: i >= 0 && i < tabs.length - 1 ? tabs[i + 1] : null,
      x0: t.clientX,
      y0: t.clientY,
      x: t.clientX,
      y: t.clientY,
      t: e.timeStamp,
      vx: 0,
      vy: 0
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
        this.pillDrag = null;
        return;
      }
      d.pill.style.transition = "none";
      this.pageFollow?.cancel?.();
      if (d.page) {
        d.page.getAnimations().forEach((a) => a.cancel());
        d.page.style.transition = "none";
      }
      if (d.axis === "y") document.body.addClass("goguryeo-tabs-pulling");
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
      d.target = dx < 0 ? d.next ?? NEW_TAB : d.prev;
      const shift = d.target ? dx : dx / 3;
      d.pill.style.translate = `${shift}px 0`;
      d.pill.style.opacity = String(1 - Math.min(Math.abs(shift) / d.pill.offsetWidth, 1) * 0.7);
      armed = !!d.target && Math.abs(dx) >= PILL_SWIPE_AT;
      this.peekTab(d, d.target && d.target !== NEW_TAB ? d.target : null);
      this.placeSideways(d, shift);
    } else {
      const up = Math.max(0, -dy);
      armed = up >= PILL_SWIPE_AT;
      this.placePull(d, Math.min(up / PILL_PULL_FULL, 1));
    }
    if (armed !== d.armed) this.haptic();
    d.armed = armed;
  }
  onPillEnd(finished) {
    const d = this.pillDrag;
    this.pillDrag = null;
    if (!d?.axis) return;
    this.suppressClickUntil = Date.now() + 500;
    let act = finished && d.armed;
    if (finished && !act) {
      const flick = d.axis === "x" ? d.target && Math.abs(d.vx) > PILL_FLICK && Math.sign(d.vx) === (d.target === d.prev ? 1 : -1) : d.vy < -PILL_FLICK;
      if (flick) {
        act = true;
        this.haptic();
      }
    }
    if (act && d.axis === "x") this.switchTabFromPill(d);
    else this.settlePill(d.pill);
    if (d.axis === "x" && !act) this.springPage(d, "x");
    if (d.axis === "y") {
      if (act) {
        this.app.mobileTabSwitcher?.show();
        window.setTimeout(() => this.clearPage(d), ZOOM_MS);
      } else {
        this.springPage(d, "y");
      }
    }
  }
  // ---- The page under the name pill follows the finger ----
  // Up: the page shrinks toward the tab overview (p: 0 → 1) with rounded
  // corners; the bar fades with it (theme: --g-tabs-pull)
  placePull(d, p) {
    document.body.style.setProperty("--g-tabs-pull", String(p));
    if (!d.page) return;
    d.page.style.scale = String(1 - 0.42 * p);
    d.page.style.translate = `0 ${-40 * p}px`;
    d.page.style.borderRadius = `${28 * p}px`;
    d.page.style.overflow = "clip";
    d.page.style.backgroundColor = `color-mix(in srgb, var(--background-primary-alt) ${Math.round(Math.min(p * 4, 1) * 100)}%, transparent)`;
    d.page.style.boxShadow = `0 ${12 * p}px ${40 * p}px rgba(0, 0, 0, ${0.35 * p})`;
  }
  // Sideways: the page moves with the finger; the tab it goes to shows
  // beside it (its real page, as on the desktop's slide)
  placeSideways(d, shift) {
    if (d.page) d.page.style.translate = `${shift}px 0`;
    const peek = d.peek?.view?.contentEl;
    if (peek) peek.style.translate = `${shift + (shift < 0 ? d.width : -d.width)}px 0`;
  }
  peekTab(d, leaf) {
    if (d.peek === leaf) return;
    if (d.peek) {
      d.peek.containerEl.removeClass("goguryeo-page-out");
      d.peek.view?.contentEl?.style.removeProperty("translate");
    }
    d.peek = leaf;
    leaf?.containerEl.addClass("goguryeo-page-out");
  }
  // Let go short of acting: everything springs back
  springPage(d, axis) {
    const page = d.page;
    const peek = d.peek?.view?.contentEl;
    const from = axis === "x" ? parseFloat(page?.style.translate) || 0 : 0;
    const anims = [];
    const ease = { duration: 300, easing: "cubic-bezier(0.25, 0.8, 0.25, 1)" };
    if (page) {
      const now = {
        scale: page.style.scale || "1",
        translate: page.style.translate || "0 0",
        borderRadius: page.style.borderRadius || "0px",
        backgroundColor: page.style.backgroundColor || "transparent",
        boxShadow: page.style.boxShadow || "none"
      };
      this.clearPage(d, false);
      page.style.overflow = "clip";
      anims.push(page.animate([now, { scale: "1", translate: "0 0", borderRadius: "0px", backgroundColor: "transparent", boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }], ease));
    }
    if (peek) {
      const side = from < 0 ? d.width : -d.width;
      const now = peek.style.translate || `${side}px 0`;
      anims.push(peek.animate([{ translate: now }, { translate: `${side}px 0` }], ease));
    }
    if (axis === "y") document.body.removeClass("goguryeo-tabs-pulling");
    const end = () => {
      page?.style.removeProperty("overflow");
      this.peekTab(d, null);
    };
    this.pageFollow = { cancel: () => {
      anims.forEach((a) => a.cancel());
      end();
    } };
    Promise.all(anims.map((a) => a.finished.catch(() => {
    }))).then(end);
  }
  // The page back to how it was, at once
  clearPage(d, all = true) {
    const page = d.page;
    if (page) for (const k of ["scale", "translate", "border-radius", "overflow", "transition", "background-color", "box-shadow"]) page.style.removeProperty(k);
    if (all) {
      this.peekTab(d, null);
      document.body.removeClass("goguryeo-tabs-pulling");
      document.body.style.removeProperty("--g-tabs-pull");
    }
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
    const toward = d.target === d.prev ? 1 : -1;
    const { pill } = d;
    pill.style.transition = "translate 0.14s ease-in, opacity 0.14s ease-in";
    pill.style.translate = `${toward * pill.offsetWidth * 0.6}px 0`;
    pill.style.opacity = "0";
    const page = d.page;
    const peek = d.peek?.view?.contentEl;
    const ms = 220;
    const ease = { duration: ms, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" };
    page?.animate([{ translate: page.style.translate || "0 0" }, { translate: `${toward * d.width}px 0` }], ease);
    peek?.animate([{ translate: peek.style.translate || `${-toward * d.width}px 0` }, { translate: "0 0" }], ease);
    window.setTimeout(() => {
      pill.style.transition = pill.style.translate = pill.style.opacity = "";
      const target = d.target === NEW_TAB ? this.app.workspace.getLeaf("tab") : d.target;
      this.app.workspace.setActiveLeaf(target, { focus: true });
      page?.getAnimations().forEach((a) => a.cancel());
      peek?.getAnimations().forEach((a) => a.cancel());
      this.clearPage(d);
      peek?.style.removeProperty("translate");
      const from = -toward;
      const slide = { scale: 1, duration: DUR2.in, easing: EASE2.out };
      this.enter(target.view?.containerEl.querySelector(":scope > .view-header .view-header-title-container"), { ...slide, x: from * 40 });
      if (!peek) this.enter(target.view?.contentEl, { ...slide, x: from * 48, opacity: 0.4 });
    }, ms);
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
    this.register(() => document.querySelectorAll(".view-header-title-container").forEach((el) => el.style.removeProperty("--g-capsule-name-w")));
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
    this.snapshots = /* @__PURE__ */ new WeakMap();
    this.edgeSwipe = null;
    const proto = WorkspaceLeaf.prototype;
    const own = Object.prototype.hasOwnProperty.call(proto, "getHistoryState");
    const original = proto.getHistoryState;
    const plugin = this;
    const patched = function(...args) {
      const state = original.apply(this, args);
      if (Platform2.isDesktopApp && plugin.swipeStyle === "chrome") return state;
      try {
        const reuse = plugin.leavingSnapshot?.leaf === this ? plugin.leavingSnapshot.snapshot : null;
        if (reuse) plugin.leavingSnapshot = null;
        const snapshot = reuse ?? plugin.snapshotPage(this);
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
    if (s && !s.wheel) return;
    if (s?.settling || now < (this.swipeQuietUntil ?? 0)) {
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault?.();
      this.swipeQuietUntil = now + 160;
      return;
    }
    if (!s) {
      if (!dx || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (now < (this.wheelScrollUntil ?? 0)) {
        this.wheelScrollUntil = now + 160;
        return;
      }
      let leaf = fromLeaf;
      if (!leaf) {
        const el = e.target?.closest?.(".mod-root .workspace-leaf");
        if (!el) return;
        this.app.workspace.iterateRootLeaves((l) => {
          if (l.containerEl === el) leaf = l;
        });
        if (!leaf || this.scrollsSideways(e.target, dx)) {
          this.wheelScrollUntil = now + 160;
          return;
        }
      }
      const type = leaf?.view?.getViewType?.();
      if (!leaf?.view?.contentEl || ["canvas", "graph", "localgraph", "excalidraw"].includes(type)) return;
      if (document.querySelector(".modal-container, .menu")) return;
      const dir = dx < 0 ? -1 : 1;
      s = this.beginSwipe(leaf, dir, { wheel: true, sum: 0, t: now });
      if (!s) return;
    }
    s.sum = Math.max(0, s.sum + dx * s.dir);
    const dt = now - s.t;
    if (dt > 0) s.v = 0.7 * (dx * s.dir / dt) + 0.3 * s.v;
    s.t = now;
    if (this.pullSwipe(s, s.sum)) e.preventDefault?.();
    const step = Math.abs(dx);
    if (dx * s.dir > 0 && step <= (s.lastStep ?? 0)) {
      s.glide ??= { from: s.lastStep, n: 0 };
      s.glide.n++;
    } else {
      s.glide = null;
    }
    s.lastStep = step;
    if (s.locked && s.glide && s.glide.n >= WHEEL_GLIDE_STEPS && step <= s.glide.from * 0.85 && s.pulled >= s.width * EDGE_SWIPE_AT) {
      window.clearTimeout(s.idle);
      this.endWheelSwipe(s);
      return;
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
    this.releaseSwipe(s, s.pulled >= s.width * EDGE_SWIPE_AT);
  }
  // A still copy of a leaf's page: its content inside a bare copy of the
  // content's frame (so the theme's rules for it still apply), plus where
  // each scrolled part was scrolled to.
  // anyView: also views that aren't pages you navigate (calendars,
  // plugin views), for the tab overview; the edge swipe wants notes only
  snapshotPage(leaf, anyView = false) {
    const content = leaf.view?.contentEl;
    if (!content || !anyView && !leaf.view.navigation || !content.isConnected) return null;
    const webview = leaf.view.getViewType?.() === "webviewer" ? leaf.view.webview : null;
    if (webview || content.querySelector("webview")) {
      const frame2 = leaf.view.containerEl.cloneNode(false);
      frame2.classList.remove("goguryeo-swiping");
      frame2.appendChild(content.cloneNode(false)).createEl("img", { cls: "goguryeo-swipe-shot" });
      let ready = null;
      try {
        ready = webview?.capturePage?.().then((image) => this.webShotURL(image)).catch(() => null) ?? null;
      } catch (e) {
      }
      ready?.then((src) => {
        if (src) frame2.querySelector(".goguryeo-swipe-shot").src = src;
      });
      return { frame: frame2, scrolls: [], ready };
    }
    const scrolls = [];
    const deep = ".cm-content, .cm-gutters, .markdown-preview-sizer, svg";
    const walk = (el, path) => {
      if (el.scrollTop || el.scrollLeft) scrolls.push([path, el.scrollTop, el.scrollLeft]);
      if (el.matches(deep)) return;
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
  // with the entry's name. fresh: a snapshot made for this page alone,
  // used as it is (a long note's copy isn't copied once more)
  makeSwipePage(snapshot, entry, fresh = false) {
    const page = createDiv("goguryeo-swipe-page");
    if (snapshot) {
      page.appendChild(fresh ? snapshot.frame : snapshot.frame.cloneNode(true));
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
    if (!Platform2.isAndroidApp || body.hasClass("goguryeo-edge-swipe-on")) return true;
    return this.androidNav === "buttons";
  }
  setAndroidNav(value) {
    this.androidNav = value;
    this.app.saveLocalStorage(ANDROID_NAV_KEY, value);
  }
  onEdgeStart(e) {
    if (this.edgeSwipe?.locked) return;
    this.edgeSwipe = null;
    if (e.touches.length !== 1 || !this.canEdgeSwipe()) return;
    const t = e.touches[0];
    const dir = t.clientX <= EDGE_SWIPE_ZONE ? -1 : t.clientX >= window.innerWidth - EDGE_SWIPE_ZONE ? 1 : 0;
    if (!dir) return;
    const leaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
    this.beginSwipe(leaf, dir, { x0: t.clientX, y0: t.clientY, x: t.clientX, t: e.timeStamp });
  }
  onEdgeMove(e) {
    const s = this.edgeSwipe;
    if (!s || s.settling) return;
    const t = e.touches[0];
    const dx = (t.clientX - s.x0) * -s.dir;
    const dy = t.clientY - s.y0;
    if (!s.locked && Math.abs(dy) > LOCK_AT && Math.abs(dy) > Math.abs(dx)) {
      this.edgeSwipe = null;
      return;
    }
    const dt = e.timeStamp - s.t;
    if (dt > 0) s.v = 0.8 * ((t.clientX - s.x) / dt) + 0.2 * s.v;
    s.x = t.clientX;
    s.t = e.timeStamp;
    if (this.pullSwipe(s, dx)) e.preventDefault();
  }
  onEdgeEnd(e, finished) {
    const s = this.edgeSwipe;
    if (!s || s.settling) return;
    const v = s.v * -s.dir;
    this.releaseSwipe(s, finished && (v > 0.35 || s.pulled >= s.width * EDGE_SWIPE_AT && v > -0.2));
  }
  // ---- Back / forward swipes: one core for the finger and the trackpad ----
  // A swipe follows a pull toward going back (dir -1) or forward (1): a
  // finger from the screen's edge (iPad, iPhone: onEdge*) or two fingers on
  // a trackpad (desktop: onSwipeWheel). The drivers only measure and
  // decide; the core shows it: the first LOCK_AT px decide nothing, then
  // the page stage (or the Chrome-style arrow, trackpad only) follows the
  // pull, drawn once a frame, with a tick each time it crosses the point
  // where letting go goes; let go, it goes or springs back.
  beginSwipe(leaf, dir, extra = {}) {
    const steps = dir < 0 ? leaf?.history?.backHistory : leaf?.history?.forwardHistory;
    if (!steps?.length || !leaf.view?.contentEl) return null;
    return this.edgeSwipe = { dir, leaf, entry: steps[steps.length - 1], locked: false, pulled: 0, v: 0, ...extra };
  }
  // The pull so far, in px inwards. True once the swipe has taken over
  // (the driver then keeps the page from scrolling).
  pullSwipe(s, distance) {
    if (!s.locked) {
      if (distance <= LOCK_AT) return false;
      s.locked = true;
      if (s.wheel && this.swipeStyle === "chrome") this.startArrowSwipe(s);
      else this.startPageSwipe(s);
    }
    this.queuePageSwipe(s, Math.max(0, Math.min(s.width, distance)));
    const armed = s.pulled >= s.width * EDGE_SWIPE_AT;
    if (armed !== !!s.armed && !s.wheel) this.haptic();
    s.armed = armed;
    return true;
  }
  releaseSwipe(s, go) {
    if (!s.locked) {
      if (this.edgeSwipe === s) this.edgeSwipe = null;
      return;
    }
    if (s.arrow) this.settleArrowSwipe(s, go);
    else this.settlePageSwipe(s, go);
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
    const currentPage = this.makeSwipePage(current, null, true);
    s.current = current;
    const targetPage = this.makeSwipePage(target, entry);
    const stage = createDiv("goguryeo-swipe-stage");
    stage.setAttr("inert", "");
    s.under = dir < 0 ? targetPage : currentPage;
    s.over = dir < 0 ? currentPage : targetPage;
    s.under.addClass("is-under");
    s.over.addClass("is-over");
    s.dim = s.under.createDiv("goguryeo-swipe-dim");
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
    const edge = s.dir < 0 ? pulled : w - pulled;
    const underX = -(w - edge) / 3;
    s.over.style.transform = `translateX(${edge}px)`;
    s.under.style.transform = `translateX(${underX}px)`;
    s.under.style.clipPath = `inset(0 ${w - edge + underX}px 0 ${-underX}px)`;
    if (s.dim) s.dim.style.opacity = String(1 - edge / w);
  }
  // From wheel and touch moves, which come faster than the screen draws:
  // the newest place is drawn once a frame
  queuePageSwipe(s, pulled) {
    s.pulled = pulled;
    if (s.raf) return;
    s.raf = window.requestAnimationFrame(() => {
      s.raf = 0;
      if (s.settling) return;
      if (s.arrow) this.setArrowSwipe(s, s.pulled);
      else if (s.stage) this.setPageSwipe(s, s.pulled);
    });
  }
  // ---- Chrome style: an arrow at the edge instead of the sliding page ----
  // For a slow computer (the user's choice, per device): no copies of
  // pages at all. Two fingers sideways bring a round glass arrow in from
  // the side the page would go to; past the go point it fills, and
  // letting go there goes back or forward at once, like Chrome.
  startArrowSwipe(s) {
    const arrow = createDiv("goguryeo-swipe-arrow");
    arrow.addClass(s.dir < 0 ? "is-back" : "is-forward");
    arrow.setAttr("inert", "");
    setIcon(arrow, s.dir < 0 ? "arrow-left" : "arrow-right");
    s.leaf.containerEl.appendChild(arrow);
    s.arrow = arrow;
    s.width = ARROW_PULL;
    this.setArrowSwipe(s, 0);
  }
  setArrowSwipe(s, pulled) {
    s.pulled = pulled;
    const p = Math.min(1, pulled / (s.width * EDGE_SWIPE_AT));
    const x = (-56 + 76 * p) * (s.dir < 0 ? 1 : -1);
    s.arrow.style.transform = `translateX(${x}px) scale(${0.7 + 0.3 * p})`;
    s.arrow.style.opacity = String(Math.min(1, p * 1.5));
    const armed = p >= 1;
    if (armed !== s.arrow.hasClass("is-armed")) s.arrow.toggleClass("is-armed", armed);
  }
  settleArrowSwipe(s, go) {
    s.settling = true;
    if (s.raf) window.cancelAnimationFrame(s.raf);
    s.raf = 0;
    const arrow = s.arrow;
    arrow.addClass("is-settling");
    arrow.style.opacity = "0";
    if (!go) this.setArrowSwipe(s, 0);
    window.setTimeout(() => arrow.remove(), 200);
    if (this.edgeSwipe === s) this.edgeSwipe = null;
    if (!go) return;
    Promise.resolve(s.leaf.history.go(s.dir)).then(() => this.focusNote(s.leaf)).catch((e) => console.error("Goguryeo: swipe navigation failed", e));
  }
  setSwipeStyle(value) {
    this.swipeStyle = value;
    this.app.saveLocalStorage(SWIPE_STYLE_KEY, value);
  }
  settlePageSwipe(s, go) {
    s.settling = true;
    if (s.raf) window.cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.stage.addClass("is-settling");
    this.setPageSwipe(s, go ? s.width : 0);
    const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));
    let drawn = null;
    let loaded = null;
    const navigate = () => {
      const webview = s.leaf.view?.getViewType?.() === "webviewer" ? s.leaf.view.webview : null;
      loaded = webview ? this.webPageLoaded(webview) : null;
      if (s.current) this.leavingSnapshot = { leaf: s.leaf, snapshot: s.current };
      drawn = Promise.resolve(s.leaf.history.go(s.dir)).catch((e) => console.error("Goguryeo: swipe navigation failed", e)).finally(() => {
        this.leavingSnapshot = null;
      }).then(() => sleep(80));
    };
    if (go && s.entry?.state?.type && s.entry.state.type === s.leaf.view?.getViewType?.()) navigate();
    window.setTimeout(async () => {
      if (go) {
        if (!drawn) navigate();
        await Promise.race([drawn, sleep(SWIPE_DRAW_MS)]);
        if (loaded) {
          await loaded;
          if (this.edgeSwipe === s) await this.liftPageSwipe(s);
        }
      }
      if (this.edgeSwipe === s) this.endPageSwipe();
      if (go && s.wheel) this.focusNote(s.leaf);
    }, SWIPE_SETTLE_MS);
  }
  focusNote(leaf) {
    const view = leaf?.view;
    if (view?.getViewType?.() !== "markdown" || view.getMode?.() !== "source") return;
    if (document.querySelector(".modal-container, .menu")) return;
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    view.editor?.focus();
  }
  // Resolves once a web viewer's page that's about to load has loaded and
  // settled, or soon if it doesn't start loading, or at WEB_LOAD_MAX_MS
  webPageLoaded(webview) {
    return new Promise((resolve) => {
      let timer = 0;
      const off = () => {
        window.clearTimeout(timer);
        webview.removeEventListener("did-start-loading", onStart);
        webview.removeEventListener("did-stop-loading", onStop);
        webview.removeEventListener("did-fail-load", onStop);
      };
      const done = () => {
        off();
        resolve();
      };
      const onStop = () => {
        off();
        window.setTimeout(resolve, WEB_SETTLE_MS);
      };
      const onStart = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(done, WEB_LOAD_MAX_MS);
      };
      webview.addEventListener("did-start-loading", onStart);
      webview.addEventListener("did-stop-loading", onStop);
      webview.addEventListener("did-fail-load", onStop);
      timer = window.setTimeout(() => {
        let loading = false;
        try {
          loading = webview.isLoading();
        } catch (e) {
        }
        if (loading) onStart();
        else done();
      }, SWIPE_DRAW_MS + 200);
    });
  }
  // The copy fades off the new page instead of vanishing
  liftPageSwipe(s) {
    s.frame.removeClass("goguryeo-swiping");
    s.stage.addClass("is-lifting");
    return new Promise((r) => window.setTimeout(r, 160));
  }
  endPageSwipe() {
    const s = this.edgeSwipe;
    this.edgeSwipe = null;
    s?.arrow?.remove();
    if (!s?.stage) return;
    s.stage.remove();
    s.frame.removeClass("goguryeo-swiping");
  }
  // ---- Sliding glass under the active tab ----
  setupTabThumbs() {
    this.thumbs = /* @__PURE__ */ new WeakMap();
    this.thumbSpots = /* @__PURE__ */ new WeakMap();
    this.observed = /* @__PURE__ */ new WeakSet();
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
      this.removeThumbs();
    });
    this.onLayout(["layout-change", "active-leaf-change", "css-change", "window-resize", "thumbs"], () => this.updateThumbs());
    if (this.app.workspace.rootSplit) this.resizeObserver.observe(this.app.workspace.rootSplit.containerEl);
    this.scheduleThumbs();
  }
  // In the hub's next frame, with whatever else the layout needs
  scheduleThumbs() {
    this.nudgeLayout("thumbs");
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
    const groups = [];
    const collect = (node) => node?.children?.forEach((child) => {
      if (child.type === "tabs") groups.push(child);
      else if (child.type === "split") collect(child);
    });
    collect(rootSplit);
    const panes = groups.map((g) => g.containerEl);
    const body = document.body;
    if (!(Platform2.isDesktopApp || Platform2.isTablet) || panes.length < 1) {
      this.clearSplit();
      return;
    }
    this.syncingPages = true;
    let shown;
    try {
      shown = groups.length > 1 && !body.hasClass("goguryeo-no-cards") ? this.syncSplitPages(groups) : { solo: null, split: null };
    } finally {
      this.syncingPages = false;
    }
    const loneTab = shown.solo ?? (groups.length === 1 ? groups[0].children[groups[0].currentTab] : null);
    this.screenKey = shown.split != null ? `split:${shown.split}` : loneTab ? `tab:${loneTab.id}` : null;
    if (this.pendingScreen) this.flipSkip = true;
    const solo = shown.solo;
    this.applyFold(groups, shown);
    if (groups.length < 2) this.splitPages = null;
    const r = rootSplit.containerEl.getBoundingClientRect();
    body.addClass(SPLIT_CLASS);
    body.toggleClass(ONE_PANE_CLASS, panes.length === 1 || !!solo);
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
    if (groups.length >= 1) this.renderSharedTabs(groups, shown);
    else this.removeSharedTabs();
    this.renderGrips(groups.length > 1 ? groups : []);
    if (groups.length === 1) this.splitGroups = groups;
    this.flipCards(groups);
    const pending = this.pendingScreen;
    this.pendingScreen = null;
    if (pending) this.slideScreen(pending);
    const leaving = this.pendingLeave;
    this.pendingLeave = null;
    if (leaving) this.playCardsLeave(leaving);
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
    const shape = (node) => node.type === "tabs" ? node.containerEl.hasClass(SOLO_OFF_CLASS) ? "o" : "s" : (node.direction === "vertical" ? "v(" : "h(") + (node.children ?? []).map(shape).join(",") + ")";
    const sig = shape(this.app.workspace.rootSplit) + "|" + els.length;
    if (this.flipping && sig === this.cardSig && !this.flipForce) return;
    this.endFlip();
    const rects = new Map(els.map((el) => [el, el.getBoundingClientRect()]));
    const shownIn = (g) => g.children[g.currentTab];
    const pageRects = new Map(groups.map((g) => [shownIn(g), rects.get(g.containerEl)]));
    const old = this.cardRects;
    const oldPages = this.pageRects ?? /* @__PURE__ */ new Map();
    const changed = old && (sig !== this.cardSig || this.flipForce);
    this.flipForce = false;
    this.cardRects = rects;
    this.pageRects = pageRects;
    this.cardSig = sig;
    if (!changed || this.flipSkip || this.panePreview || this.paneDrag || this.reducedMotion() || !document.body.hasClass(SPLIT_CLASS)) {
      this.flipSkip = false;
      return;
    }
    const moves = [];
    for (const g of groups) {
      const el = g.containerEl;
      const before = oldPages.get(shownIn(g));
      const a = before?.width && before.height ? before : old.get(el);
      const b = rects.get(el);
      if (!b.width || !b.height) continue;
      if (!a || !a.width || !a.height) {
        this.fadeIn(el, { duration: DUR2.glide });
        continue;
      }
      const d = Math.abs(a.left - b.left) + Math.abs(a.top - b.top) + Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
      if (d > 2) moves.push([el, a, b]);
    }
    if (!moves.length) return;
    const pin = (el, r) => Object.assign(el.style, {
      position: "fixed",
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      margin: "0",
      boxSizing: "border-box"
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
    this.grips ??= /* @__PURE__ */ new WeakMap();
    this.splitGroups = groups;
    const els = /* @__PURE__ */ new Set();
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
    try {
      grip.setPointerCapture(e.pointerId);
    } catch (err) {
    }
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
    this.haptic();
    const rects = this.previewPanes(d.pane, t);
    const r = rects?.get(d.pane) ?? t.pane.containerEl.getBoundingClientRect();
    const { left, top, width, height } = r;
    const pad = 6;
    Object.assign(d.drop.style, {
      left: `${left + pad}px`,
      top: `${top + pad}px`,
      width: `${Math.max(0, width - pad * 2)}px`,
      height: `${Math.max(0, height - pad * 2)}px`
    });
    d.drop.toggleClass("is-swap", t.side === "center");
  }
  // The pane under the pointer and the part of it: the edge it is nearest
  // to within its outer quarter, or its middle
  paneDropAt(x, y, from) {
    for (const pane of this.splitGroups ?? []) {
      if (pane === from || pane.containerEl.hasClass(SOLO_OFF_CLASS)) continue;
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
    if (!d || ev && ev.pointerId !== d.id) return;
    this.paneDrag = null;
    d.off();
    try {
      d.grip.releasePointerCapture(d.id);
    } catch (err) {
    }
    d.grip.removeClass("is-held");
    d.pane.containerEl.removeClass("goguryeo-pane-lifted");
    document.body.removeClass("goguryeo-pane-dragging");
    d.drop?.remove();
    const toBar = !cancelled && d.moving && d.target?.bar;
    this.hideBarSlot(toBar);
    const toPane = !cancelled && d.moving && d.target && !d.target.bar;
    if (toPane) this.flipSkip = true;
    this.clearPanePreview(toPane);
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
    if (p) window.clearTimeout(p.timer);
    else p = this.panePreview = {
      panes,
      home: new Map(panes.map((pane) => [pane, pane.containerEl.getBoundingClientRect()]))
    };
    const build = (node) => {
      if (node.type === "tabs") return panes.includes(node) ? { pane: node } : null;
      const kids = [];
      for (const k of node.children ?? []) {
        const m = build(k);
        if (m) kids.push({ node: m, size: k.dimension > 0 ? k.dimension : null });
      }
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
    const fresh = src === NEW_PANE;
    const s = tree && !fresh && find(tree, src);
    if (!fresh && !s?.parent || !tree || !find(tree, t.pane)) return null;
    if (t.side === "center") {
      find(tree, t.pane).node.pane = src;
      s.node.pane = t.pane;
    } else {
      if (!fresh) s.parent.kids = s.parent.kids.filter((k) => k.node !== s.node);
      const d = find(tree, t.pane);
      const dir = t.side === "left" || t.side === "right" ? "vertical" : "horizontal";
      const before = t.side === "left" || t.side === "top";
      const entry = d.parent?.kids.find((k) => k.node === d.node);
      if (entry && d.parent.dir === dir) {
        if (entry.size !== null) entry.size /= 2;
        const i = d.parent.kids.indexOf(entry);
        d.parent.kids.splice(before ? i : i + 1, 0, { node: { pane: src }, size: entry.size });
      } else {
        const pair = [{ node: { pane: src }, size: null }, { node: { pane: t.pane }, size: null }];
        if (!before) pair.reverse();
        delete d.node.pane;
        Object.assign(d.node, { dir, kids: pair });
      }
      const fold = (node) => {
        for (const k of node.kids ?? []) {
          fold(k.node);
          while (k.node.kids?.length === 1) k.node = k.node.kids[0].node;
        }
      };
      fold(tree);
    }
    p.margins ??= new Map(panes.map((pane) => {
      const s2 = getComputedStyle(pane.containerEl);
      return [pane, [s2.marginTop, s2.marginRight, s2.marginBottom, s2.marginLeft].map(parseFloat)];
    }));
    if (!p.area) {
      const root = this.app.workspace.rootSplit.containerEl;
      const r = root.getBoundingClientRect();
      const s2 = getComputedStyle(root);
      p.area = {
        x: r.left + parseFloat(s2.paddingLeft),
        y: r.top + parseFloat(s2.paddingTop),
        w: r.width - parseFloat(s2.paddingLeft) - parseFloat(s2.paddingRight),
        h: r.height - parseFloat(s2.paddingTop) - parseFloat(s2.paddingBottom)
      };
    }
    const homeTop = Math.min(...panes.map((pane) => p.home.get(pane).top - p.margins.get(pane)[0]));
    const topPane = panes.find((pane) => p.home.get(pane).top - p.margins.get(pane)[0] <= homeTop + 1);
    const lowPane = panes.find((pane) => pane !== topPane && p.home.get(pane).top - p.margins.get(pane)[0] > homeTop + 1);
    const topMargin = topPane ? p.margins.get(topPane)[0] : 0;
    const lowMargin = lowPane ? p.margins.get(lowPane)[0] : 0;
    const [, mr, mb, ml] = p.margins.get(panes[0]);
    const rects = /* @__PURE__ */ new Map();
    const walk = (node, x, y, w, h, atTop) => {
      if (node.pane) {
        const mt = atTop ? topMargin : lowMargin;
        return void rects.set(node.pane, new DOMRect(x + ml, y + mt, w - ml - mr, h - mt - mb));
      }
      const across = node.dir === "vertical";
      const margin = (k, i) => !k.node.pane ? 0 : across ? ml + mr : (atTop && i === 0 ? topMargin : lowMargin) + mb;
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
      boxSizing: "border-box"
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
    this.play(slot, [{ flexGrow: 0, opacity: 0 }, { flexGrow: 1, opacity: 1 }], { duration: DUR2.glide + 100, easing: EASE2.bounce });
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
    this.play(slot, [{ flexGrow: 1, opacity: 1 }, { flexGrow: 0, opacity: 0 }], { duration: DUR2.fade, easing: EASE2.in, fill: "forwards" }).then(() => slot.remove());
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
    const tabs = [...this.sharedBar?.children ?? []].filter((el) => el.hasClass("goguryeo-stab") && !el.hasClass("is-leaving"));
    const leafOf = (el) => el && !el.hasClass("goguryeo-stab-split") && el.gLeaf?.parent ? el.gLeaf : null;
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
      anchor = pages.get(home);
      after = !tabs[index]?.hasClass("goguryeo-stab-split");
    }
    for (const l of [...src.children]) {
      src.removeChild(l);
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
    home.selectTab(leaf);
    this.dropInTab = leaf;
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
    e.stopPropagation();
    const d = this.partDrag = { part, leaf, tab, id: e.pointerId, x: e.clientX, y: e.clientY, live: false, touch: e.pointerType === "touch", target: null };
    if (d.touch) d.timer = window.setTimeout(() => this.liftPart(d), CARD_HOLD_MS);
    const move = (ev) => this.onPartMove(ev);
    const up = (ev) => this.endPartDrag(ev, false);
    const cancel = (ev) => this.endPartDrag(ev, true);
    const touch = (ev) => {
      if (d.live) ev.preventDefault();
    };
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
    if (d.tab) this.followBar(400);
    document.body.addClass("goguryeo-pane-dragging");
    this.haptic();
  }
  placePartGhost(d) {
    d.ghost.style.left = d.x - d.gx + "px";
    d.ghost.style.top = d.y - d.gy + "px";
  }
  onPartMove(e) {
    const d = this.partDrag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.live) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      if (d.touch) return this.endPartDrag(null, true);
      this.liftPart(d);
    }
    e.preventDefault();
    d.x = e.clientX;
    d.y = e.clientY;
    this.placePartGhost(d);
    let index = this.barDropAt(d.x, d.y, d.tab ? d.part : d.part.closest(".goguryeo-stab-split"));
    if (d.tab && index != null) {
      const own = this.barTabs().indexOf(d.part);
      if (index === own || index === own + 1) index = null;
    }
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
    const lone = document.body.hasClass(SOLO_CLASS) || document.body.hasClass(ONE_PANE_CLASS);
    const t = index == null && offBar ? this.paneDropAt(d.x, d.y, null) : null;
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
        left: `${r.left + pad}px`,
        top: `${r.top + pad}px`,
        width: `${Math.max(0, r.width - pad * 2)}px`,
        height: `${Math.max(0, r.height - pad * 2)}px`
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
      (this.splitPages ??= /* @__PURE__ */ new Map()).set(leaf.parent, leaf);
      const id = this.splitOf?.get(t.pane) ?? this.shownSplit;
      if (id != null) (this.splitOf ??= /* @__PURE__ */ new Map()).set(leaf.parent, id);
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
    else p = this.panePreview = { panes: [pane], home: /* @__PURE__ */ new Map([[pane, pane.containerEl.getBoundingClientRect()]]) };
    const r = p.home.get(pane);
    const gap = 10;
    const across = t.side === "left" || t.side === "right";
    const first = t.side === "left" || t.side === "top";
    const half = across ? (r.width - gap) / 2 : (r.height - gap) / 2;
    const a = across ? new DOMRect(r.left, r.top, half, r.height) : new DOMRect(r.left, r.top, r.width, half);
    const b = across ? new DOMRect(r.left + half + gap, r.top, half, r.height) : new DOMRect(r.left, r.top + half + gap, r.width, half);
    const rects = /* @__PURE__ */ new Map([[NEW_PANE, first ? a : b], [pane, first ? b : a]]);
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
    const pages = this.splitPages ??= /* @__PURE__ */ new Map();
    const of = this.splitOf ??= /* @__PURE__ */ new Map();
    this.loosePanes ??= /* @__PURE__ */ new WeakSet();
    this.splitSeq ??= 1;
    const dir = side === "left" || side === "right" ? "vertical" : "horizontal";
    const before = side === "left" || side === "top";
    for (const pane of this.splitGroups ?? []) if (!of.has(pane)) this.loosePanes.add(pane);
    const src = leaf.parent;
    const srcShown = src.children[src.currentTab];
    src.removeChild(leaf);
    if (srcShown && srcShown !== leaf && srcShown.parent === src) src.selectTab(srcShown);
    let paneA = home;
    if (home.children.length > 1 || of.has(home)) {
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
    if (!d || e && e.pointerId !== d.id) return;
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
      window.setTimeout(() => {
        this.swallowPartClick = false;
      }, 400);
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
      this.swallowPartClick = true;
      window.setTimeout(() => {
        this.swallowPartClick = false;
      }, 400);
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
    return [...this.sharedBar?.children ?? []].filter((el) => el.hasClass("goguryeo-stab") && !el.hasClass("is-leaving"));
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
    const pages = this.splitPages ?? /* @__PURE__ */ new Map();
    const leafAt = (el) => {
      if (!el) return null;
      if (!el.hasClass("goguryeo-stab-split")) return el.gLeaf?.parent ? el.gLeaf : null;
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
    const pages = this.splitPages ??= /* @__PURE__ */ new Map();
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
      const of = this.splitOf ??= /* @__PURE__ */ new Map();
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
      moveAll(src, target, [...src.children]);
      keep.detach();
      const of = this.splitOf ??= /* @__PURE__ */ new Map();
      const srcId = of.get(src);
      pages.delete(src);
      of.delete(src);
      if (srcPage) pages.set(target, srcPage);
      if (srcId != null) of.set(target, srcId);
      if (srcShown) target.selectTab(srcShown);
    }
    if (active?.parent) workspace.setActiveLeaf(active, { focus: false });
    if (!this.flipSkip) this.flipForce = true;
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
    this.lastSplitPages ??= /* @__PURE__ */ new Map();
    if (!this.splitPages) {
      this.splitPages = /* @__PURE__ */ new Map();
      this.splitOf = /* @__PURE__ */ new Map();
      this.loosePanes = /* @__PURE__ */ new WeakSet();
      this.splitSeq ??= 1;
      let saved = [];
      try {
        saved = JSON.parse(this.app.loadLocalStorage(MEMBERS_KEY) || "[]");
      } catch (e) {
      }
      if (!Array.isArray(saved)) saved = [];
      if (saved.length && !Array.isArray(saved[0])) saved = [saved];
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
      for (const ids2 of this.savedSplits) {
        const id2 = this.splitSeq++;
        for (const pane of groups) {
          const leaf = !of.has(pane) && pane.children.find((l) => ids2.includes(l.id));
          if (!leaf) continue;
          pages.set(pane, leaf);
          of.set(pane, id2);
        }
      }
      const found = /* @__PURE__ */ new Map();
      for (const id2 of of.values()) found.set(id2, (found.get(id2) ?? 0) + 1);
      for (const [pane, id2] of [...of]) {
        if (found.get(id2) > 1) continue;
        of.delete(pane);
        pages.delete(pane);
      }
      if (!of.size) {
        const id2 = this.splitSeq++;
        for (const pane of groups) {
          pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
          of.set(pane, id2);
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
          of.delete(pane);
          pages.delete(pane);
          this.loosePanes.add(pane);
          continue;
        }
        pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
        continue;
      }
      if (this.loosePanes.has(pane)) continue;
      let id2 = live().has(this.shownSplit) ? this.shownSplit : null;
      const host = focused?.parent && focused.parent !== pane && groups.includes(focused.parent) ? focused.parent : null;
      if (id2 == null && host) {
        id2 = of.get(host);
        if (id2 == null) {
          id2 = this.splitSeq++;
          pages.set(host, focused);
          of.set(host, id2);
          this.loosePanes.delete(host);
        }
      }
      if (id2 == null) id2 = this.splitSeq++;
      pages.set(pane, pane.children[pane.currentTab] ?? pane.children[0]);
      of.set(pane, id2);
    }
    const count = /* @__PURE__ */ new Map();
    for (const id2 of of.values()) count.set(id2, (count.get(id2) ?? 0) + 1);
    for (const [pane, id2] of [...of]) {
      if (count.get(id2) > 1) continue;
      of.delete(pane);
      pages.delete(pane);
      this.loosePanes.add(pane);
    }
    const splits = /* @__PURE__ */ new Map();
    for (const pane of groups) {
      const id2 = of.get(pane);
      if (id2 == null) continue;
      if (!splits.has(id2)) splits.set(id2, []);
      splits.get(id2).push(pages.get(pane)?.id);
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
      this.lastSplitPages.set(id, focused);
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
    const places = /* @__PURE__ */ new Map();
    const pages = this.splitPages;
    if (!pages) return places;
    const member = (node) => node.type === "tabs" ? this.splitOf?.get(node) === id : (node.children ?? []).some(member);
    const walk = (node, x, y, w, h) => {
      if (node.type === "tabs") {
        const leaf = pages.get(node);
        if (leaf) places.set(leaf, [x, y, w, h]);
        return;
      }
      const kids = (node.children ?? []).filter(member);
      const sizes = kids.map((k) => k.dimension > 0 ? k.dimension : parseFloat(k.containerEl?.style.flexGrow) || 1);
      const total = sizes.reduce((a, b) => a + b, 0) || 1;
      let at = 0;
      kids.forEach((k, i) => {
        const f = sizes[i] / total;
        if (node.direction === "vertical") walk(k, x + w * at, y, w * f, h);
        else walk(k, x, y + h * at, w, h * f);
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
    const patched = function(index, ...rest) {
      const before = this.children?.[this.currentTab];
      try {
        plugin.keepSplitPage(this, this.children?.[index]);
      } catch (e) {
      }
      const result = original.call(this, index, ...rest);
      try {
        plugin.slideTabs(this, before, this.children?.[this.currentTab]);
      } catch (e) {
      }
      return result;
    };
    proto.selectTabIndex = patched;
    this.register(() => {
      if (proto.selectTabIndex !== patched) return;
      if (own) proto.selectTabIndex = original;
      else delete proto.selectTabIndex;
    });
  }
  // Desktop and iPad: switching tabs in a pane pushes the page aside, like
  // a carousel. The tab left behind stays on screen for the slide (body of
  // the pane, under the new one; Obsidian hid it with display: none) and
  // both pages' contents slide: the new one in from the side its tab is
  // on, the old one out the other way. Only the contents move, so the rows
  // above stay put, and each is clipped by its own view.
  slideTabs(pane, from, to) {
    if (!from || !to || from === to || Platform2.isPhone || pane.isStacked) return;
    if (this.syncingPages || this.screenSwitching) return;
    if (this.overview || Date.now() < (this.overviewClosingUntil ?? 0)) return;
    if (this.reducedMotion() || this.tabMotion?.() === "off") return;
    const children = pane.children ?? [];
    const a = children.indexOf(from), b = children.indexOf(to);
    if (a < 0 || b < 0 || !pane.containerEl?.isConnected || !from.containerEl?.isConnected) return;
    if (pane.containerEl.closest(`.${SOLO_OFF_CLASS}`)) return;
    const width = to.containerEl.getBoundingClientRect().width;
    if (!width) return;
    const dir = b > a ? 1 : -1;
    this.pageSlide?.finish();
    const out = from.containerEl;
    out.addClass("goguryeo-page-out");
    const move = (leaf, x0, x1) => [...leaf.view?.contentEl?.children ?? []].map((el) => el.animate([{ translate: `${x0}px 0` }, { translate: `${x1}px 0` }], { duration: TAB_SLIDE_MS, easing: ZOOM_EASE }));
    const anims = [...move(from, 0, -dir * width), ...move(to, dir * width, 0)];
    const done = () => out.removeClass("goguryeo-page-out");
    if (!anims.length) return done();
    this.pageSlide = { finish: () => {
      anims.forEach((x) => x.finish());
      done();
    } };
    Promise.all(anims.map((x) => x.finished.catch(() => {
    }))).then(() => {
      done();
      if (this.pageSlide?.anims === anims) this.pageSlide = null;
    });
    this.pageSlide.anims = anims;
  }
  // Desktop and iPad: switching between what's on screen (a split and a
  // lone tab, or two of them) slides the whole screen, like a tab switch
  // inside a pane: the cards that were on screen slide out one way (still
  // copies, made just before Obsidian switches) and the pages coming on
  // screen slide in from the other, in the tab row's order. The cards
  // themselves don't move (the path row is pinned inside the current one).
  patchScreenSlide() {
    const ws = this.app.workspace;
    const plugin = this;
    const own = Object.prototype.hasOwnProperty.call(ws, "setActiveLeaf");
    const original = ws.setActiveLeaf;
    const patched = function(leaf, ...rest) {
      let prep = null;
      try {
        prep = plugin.prepareScreenSlide(leaf);
      } catch (e) {
      }
      if (!prep) return original.call(this, leaf, ...rest);
      plugin.screenSwitching = true;
      try {
        return original.call(this, leaf, ...rest);
      } finally {
        plugin.screenSwitching = false;
        plugin.pendingScreen = prep;
        plugin.nudgeLayout?.("thumbs");
      }
    };
    ws.setActiveLeaf = patched;
    for (const name of ["movePane", "unsplitPage", "makeSplit", "splitTabInto", "moveTab"]) {
      const fn = this[name];
      if (typeof fn !== "function") continue;
      this[name] = function(...args) {
        plugin.ownLayout = (plugin.ownLayout ?? 0) + 1;
        try {
          return fn.apply(this, args);
        } finally {
          plugin.ownLayout--;
        }
      };
    }
    this.register(() => {
      if (ws.setActiveLeaf !== patched) return;
      if (own) ws.setActiveLeaf = original;
      else delete ws.setActiveLeaf;
    });
  }
  // Before the switch: will it change what's on screen (not just the tab
  // inside one pane, which slides by itself)? Then copy the cards on
  // screen, with their scroll, and note where they stand in the tab row.
  prepareScreenSlide(leaf) {
    const { workspace } = this.app;
    if (Platform2.isPhone || !leaf?.parent || !document.body.hasClass(SPLIT_CLASS) || this.ownLayout) return null;
    if (this.overview || Date.now() < (this.overviewClosingUntil ?? 0) || this.partDrag || this.paneDrag) return null;
    if (this.reducedMotion() || this.tabMotion?.() === "off" || !this.screenKey) return null;
    const pages = this.splitPages ?? /* @__PURE__ */ new Map();
    const id = pages.get(leaf.parent) === leaf ? this.splitOf?.get(leaf.parent) : null;
    const next = id != null ? `split:${id}` : `tab:${leaf.id}`;
    if (next === this.screenKey) return null;
    const old = this.screenKey;
    if (old.startsWith("tab:") && next.startsWith("tab:")) {
      const was = workspace.getLeafById?.(old.slice(4));
      if (was?.parent === leaf.parent) return null;
    }
    const clones = this.cloneCards();
    if (!clones.length) return null;
    return { old, clones, from: this.screenTabIndex(old) };
  }
  // Still copies of the cards on screen (only those of `panes`, if given),
  // with their scroll, where they stand
  cloneCards(panes = null) {
    const rootEl = this.app.workspace.rootSplit.containerEl;
    const only = panes && new Set(panes.map((p) => p.containerEl));
    const cards = [...rootEl.querySelectorAll(".workspace-tabs")].filter((el) => {
      if (el.hasClass(SOLO_OFF_CLASS) || el.closest(".goguryeo-screen-out") || only && !only.has(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    return cards.map((el) => {
      const clone = el.cloneNode(true);
      const real = [...el.querySelectorAll("webview")];
      clone.querySelectorAll("webview").forEach((copy, i) => {
        const img = createEl("img", { cls: "goguryeo-screen-shot" });
        img.style.cssText = copy.style.cssText;
        copy.replaceWith(img);
        try {
          real[i]?.capturePage?.().then((shot) => {
            img.src = shot.toDataURL();
          }).catch(() => {
          });
        } catch (e) {
        }
      });
      const scrolls = [];
      const walk = (node, path) => {
        if (node.scrollTop || node.scrollLeft) scrolls.push([path, node.scrollTop, node.scrollLeft]);
        [...node.children].forEach((k, i) => walk(k, path.concat(i)));
      };
      walk(el, []);
      return { clone, rect: el.getBoundingClientRect(), scrolls };
    });
  }
  // Copies laid where the cards stood, in a box over the panes' area
  // (so nothing crosses the sidebars); returns the box and its track
  layCards(clones) {
    const rootEl = this.app.workspace.rootSplit.containerEl;
    const R = rootEl.getBoundingClientRect();
    const box = rootEl.createDiv("goguryeo-screen-out");
    Object.assign(box.style, { left: `${R.left}px`, top: `${R.top}px`, width: `${R.width}px`, height: `${R.height}px` });
    const track = box.createDiv("goguryeo-screen-out-track");
    for (const { clone, rect, scrolls } of clones) {
      Object.assign(clone.style, {
        position: "absolute",
        left: `${rect.left - R.left}px`,
        top: `${rect.top - R.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        boxSizing: "border-box"
      });
      track.appendChild(clone);
      for (const [path, top, left] of scrolls) {
        let node = clone;
        for (const i of path) node = node?.children[i];
        if (node) {
          node.scrollTop = top;
          node.scrollLeft = left;
        }
      }
    }
    return { box, track, R };
  }
  // A card leaving the screen with the plugin's own move (a page taken
  // out of its split as its own tab, a split page closed): copied just
  // before, then, once the layout has changed, shrinking a little and
  // fading out toward its own side while the cards that stay glide
  prepareCardsLeave(panes) {
    if (Platform2.isPhone || this.reducedMotion() || !document.body.hasClass(SPLIT_CLASS)) return;
    const clones = this.cloneCards(panes);
    if (clones.length) this.pendingLeave = { clones };
  }
  playCardsLeave(p) {
    const { box, track, R } = this.layCards(p.clones);
    const mid = R.left + R.width / 2;
    const anims = [];
    for (const { clone, rect } of p.clones) {
      const side = rect.left + rect.width / 2 < mid ? -1 : 1;
      clone.style.transformOrigin = side < 0 ? "left center" : "right center";
      anims.push(clone.animate([
        { opacity: 1, scale: "1", translate: "0 0" },
        { opacity: 0, scale: "0.92", translate: `${side * 48}px 0` }
      ], { duration: TAB_SLIDE_MS - 60, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" }));
    }
    Promise.all(anims.map((x) => x.finished.catch(() => {
    }))).then(() => box.remove());
    void track;
  }
  // Where a screen (split:id or tab:leafId) stands in the shared tab row
  screenTabIndex(key) {
    if (!key) return -1;
    const tabs = this.barTabs();
    if (key.startsWith("split:")) return tabs.indexOf(this.splitTabs?.get(Number(key.slice(6))));
    const leaf = this.app.workspace.getLeafById?.(key.slice(4));
    return leaf ? tabs.indexOf(this.sharedTabs?.get(leaf)) : -1;
  }
  slideScreen(p) {
    const { workspace } = this.app;
    if (!this.screenKey || this.screenKey === p.old) return;
    const rootEl = workspace.rootSplit.containerEl;
    const R = rootEl.getBoundingClientRect();
    if (!R.width) return;
    const a = p.from, b = this.screenTabIndex(this.screenKey);
    const dir = a < 0 || b < 0 ? 1 : b > a ? 1 : -1;
    const W = R.width;
    this.screenOut?.remove();
    const { box, track } = this.layCards(p.clones);
    this.screenOut = box;
    const ease = { duration: TAB_SLIDE_MS, easing: ZOOM_EASE };
    const anims = [track.animate([{ translate: "0 0" }, { translate: `${-dir * W}px 0` }], { ...ease, fill: "forwards" })];
    for (const el of rootEl.querySelectorAll(".workspace-tabs")) {
      if (el.hasClass(SOLO_OFF_CLASS) || el.closest(".goguryeo-screen-out")) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const leafEl = el.querySelector(":scope > .workspace-tab-container > .workspace-leaf:not([style*='display: none']) .view-content");
      for (const k of leafEl?.children ?? []) anims.push(k.animate([{ translate: `${dir * W}px 0` }, { translate: "0 0" }], ease));
    }
    Promise.all(anims.map((x) => x.finished.catch(() => {
    }))).then(() => {
      if (this.screenOut === box) this.screenOut = null;
      box.remove();
    });
  }
  keepSplitPage(pane, next) {
    const page = this.splitPages?.get(pane);
    if (!page || !next || next === page || document.body.hasClass(SOLO_CLASS)) return;
    if (pane.children[pane.currentTab] !== page) return;
    const shot = this.snapshotPage(page, true);
    if (shot) (this.splitShots ??= /* @__PURE__ */ new WeakMap()).set(page, shot);
  }
  // Fold away every pane but those on screen (the lone tab's, or the
  // split's): every part of the layout holding none of them. They keep
  // their place in Obsidian's layout, so they come back as they were.
  applyFold(groups, shown) {
    const body = document.body;
    const solo = shown?.solo ?? null;
    const onScreen = new Set(solo ? [solo.parent] : shown?.split != null ? groups.filter((pane) => this.splitOf?.get(pane) === shown.split) : groups);
    this.splitShots ??= /* @__PURE__ */ new WeakMap();
    for (const pane of groups) {
      const page = this.splitPages?.get(pane);
      if (onScreen.has(pane) || !page || pane.containerEl.hasClass(SOLO_OFF_CLASS)) continue;
      if (pane.children[pane.currentTab] !== page) continue;
      try {
        const shot = this.snapshotPage(page, true);
        if (shot) this.splitShots.set(page, shot);
      } catch (e) {
      }
    }
    const off = /* @__PURE__ */ new Set();
    const walk = (node) => {
      if (node.type === "tabs") return onScreen.has(node);
      const kids = node.children ?? [];
      const has = kids.map(walk);
      if (has.some(Boolean)) kids.forEach((k, i) => {
        if (!has[i]) off.add(k.containerEl);
      });
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
    const solo = shown?.solo ?? (groups.length === 1 ? groups[0].children[groups[0].currentTab] ?? null : null);
    const { workspace } = this.app;
    document.body.addClass(SHARED_TABS_CLASS);
    let bar = this.sharedBar;
    const first = !bar?.isConnected;
    if (first) {
      const host = document.body.querySelector(":scope > .app-container") ?? document.body;
      bar = this.sharedBar = host.createDiv("goguryeo-shared-tabs-bar");
      this.sharedTabs = /* @__PURE__ */ new WeakMap();
      this.splitTabs = /* @__PURE__ */ new Map();
    }
    this.sharedSeen ??= /* @__PURE__ */ new WeakSet();
    this.sharedFirst = first;
    const prevOf = /* @__PURE__ */ new Map();
    for (const el of bar.children) prevOf.set(el, el.previousElementSibling);
    const was = /* @__PURE__ */ new Map();
    if (!first) {
      for (const el of bar.children) if (el.hasClass("goguryeo-stab")) was.set(el, el.getBoundingClientRect().left);
    }
    const focused = workspace.getMostRecentLeaf(workspace.rootSplit);
    this.splitTabs ??= /* @__PURE__ */ new Map();
    const keep = /* @__PURE__ */ new Set();
    for (const pane of groups) {
      for (const leaf of pane.children) {
        const id = this.splitIdOf(leaf);
        if (id != null) {
          if (keep.has(this.splitTabs.get(id))) continue;
          const tab2 = this.renderSplitTab(id, groups, shown, focused);
          keep.add(tab2);
          bar.appendChild(tab2);
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
        this.glide(el, dx, 0, { easing: EASE2.bounce });
        slid = true;
      }
      if (slid) this.followBar(380);
    }
    this.dropInTab = null;
    this.placeBarSlot();
    this.placeThumb(bar, bar, SHARED_ACTIVE, SHARED_INNER);
  }
  renderSplitTab(id, groups, shown, focused) {
    const pages = this.splitPages ?? /* @__PURE__ */ new Map();
    let tab = this.splitTabs.get(id);
    if (!tab) {
      tab = createDiv({ cls: "goguryeo-stab goguryeo-stab-split" });
      tab.gSplit = id;
      this.splitTabs.set(id, tab);
      tab.createDiv("goguryeo-stab-inner");
      if (!this.sharedFirst) this.popTab(tab);
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
    const prevParts = /* @__PURE__ */ new Map();
    for (const el of inner.children) prevParts.set(el, el.previousElementSibling);
    tab.toggleClass("is-active", !solo);
    const parts = /* @__PURE__ */ new Set();
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
  // ---- Motion: one set of moves for everything the companion animates ----
  // (src/core/motion.js; these stay as methods so every this.play(...) call works)
  reducedMotion() {
    return motion.reducedMotion();
  }
  play(el, keyframes, options) {
    return motion.play(el, keyframes, options);
  }
  enter(el, opts) {
    return motion.enter(el, opts);
  }
  leave(el, opts) {
    return motion.leave(el, opts);
  }
  fadeIn(el, opts) {
    return motion.fadeIn(el, opts);
  }
  fadeOut(el, opts) {
    return motion.fadeOut(el, opts);
  }
  glide(el, dx, dy, opts) {
    return motion.glide(el, dx, dy, opts);
  }
  // The settings tab's "Opening and closing tabs": subtle (default),
  // lively (the old spring and swell) or off. Saved with the plugin's data.
  tabMotion() {
    const v = this.folderNoteSettings?.tabMotion;
    return v === "lively" || v === "off" ? v : "subtle";
  }
  // A tab or a page's name comes in, or goes, in the tabMotion() style
  springIn(el, opts) {
    return motion.springIn(el, this.tabMotion(), opts);
  }
  springOut(el, opts) {
    return motion.springOut(el, this.tabMotion(), opts);
  }
  // ---- Tabs coming and going (exaggerated on purpose: the user's ask) ----
  // A new tab in the shared bar: it springs up from nothing, overshoots
  // and settles, pushing the others aside
  popTab(tab) {
    if (this.reducedMotion()) return;
    tab.style.minWidth = "0px";
    this.springIn(tab, { grow: "flexGrow" }).then(() => tab.style.removeProperty("min-width"));
    this.followBar(DUR2.pop + 40);
  }
  // A closed tab: it swells for a beat, then shrinks to nothing in its place
  leaveTab(tab) {
    tab.addClass("is-leaving");
    tab.removeClass("is-active", "is-focused");
    if (this.reducedMotion()) return tab.remove();
    tab.style.minWidth = "0px";
    this.springOut(tab, { room: [{ flexGrow: 1 }, { flexGrow: 0 }] });
    this.followBar(DUR2.leave + 40);
  }
  // The same for a page's name inside the joined split tab
  popPart(part) {
    if (this.reducedMotion()) return;
    this.springIn(part, { swell: 1.18, y: 0 });
    this.followBar(DUR2.pop + 40);
  }
  leavePart(part) {
    part.addClass("is-leaving");
    if (this.reducedMotion()) return part.remove();
    const w = part.offsetWidth;
    part.style.overflow = "hidden";
    this.springOut(part, {
      swell: 1.12,
      room: [
        { maxWidth: w + "px", paddingLeft: "9px", paddingRight: "9px" },
        { maxWidth: "0px", paddingLeft: "0px", paddingRight: "0px" }
      ]
    });
    this.followBar(DUR2.leave + 40);
  }
  // Obsidian's own tab rows (one pane, or each card): Obsidian grows a new
  // tab's width; the plugin adds the springy pop on its contents. A closed
  // tab Obsidian simply drops, so a copy of it takes its place and shrinks
  // away. A tab only moved (re-appended, or dragged to another pane) does
  // neither.
  watchTabAnimations(strip) {
    if (!strip.closest(".mod-root")) return;
    this.tabSeen ??= /* @__PURE__ */ new WeakSet();
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
    let live = null;
    const isLive = (el) => {
      if (!live) {
        live = /* @__PURE__ */ new Set();
        this.app.workspace.iterateAllLeaves((leaf) => {
          if (leaf.tabHeaderEl) live.add(leaf.tabHeaderEl);
        });
      }
      return live.has(el);
    };
    const isTab = (el) => el.nodeType === 1 && el.hasClass("workspace-tab-header") && !el.hasClass("goguryeo-tab-leaving");
    for (const m of list) {
      for (const el of m.addedNodes) {
        if (!isTab(el) || this.tabSeen.has(el)) continue;
        this.tabSeen.add(el);
        this.springIn(el.querySelector(".workspace-tab-header-inner"));
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
        this.springOut(ghost, { room: [{ width: w + "px" }, { width: "0px" }] });
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
    tab.addEventListener("pointerdown", (e) => this.onPartDown(e, tab, leaf, !part));
    tab.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.swallowPartClick) {
        this.swallowPartClick = false;
        return;
      }
      this.haptic();
      workspace.setActiveLeaf(leaf, { focus: true });
    });
    tab.addEventListener("mousedown", (e) => {
      if (e.button === 1) e.preventDefault();
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
    this.splitTabs = /* @__PURE__ */ new Map();
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
      this.prepareCardsLeave(mates);
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
          left: (q) => q.left,
          right: (q) => -q.right,
          top: (q) => q.top,
          bottom: (q) => -q.bottom
        };
        const now = (side) => boxes.every(([, q]) => edge[side](r) <= edge[side](q) + 2);
        for (const [side, icon, label] of [
          ["left", "lucide-panel-left", "Left"],
          ["right", "lucide-panel-right", "Right"],
          ["top", "lucide-panel-top", "Top"],
          ["bottom", "lucide-panel-bottom", "Bottom"]
        ]) {
          const here = now(side) && boxes.some(([, q]) => side === "left" || side === "right" ? q.top < r.bottom && q.bottom > r.top : q.left < r.right && q.right > r.left);
          const b2 = row.createEl("button", { cls: "goguryeo-grip-place" + (here ? " is-here" : ""), attr: { "aria-label": label } });
          setIcon(b2, icon);
          b2.addEventListener("click", (e) => {
            e.stopPropagation();
            this.haptic();
            if (here) return this.closeGripMenu();
            const [target] = boxes.slice().sort((a, c) => edge[side](a[1]) - edge[side](c[1]))[0];
            done(() => this.movePane(pane, target, side));
          });
        }
      });
    });
    tile("lucide-x", "Close", "mod-danger", () => done(() => {
      if (pane.children.length === 1) this.prepareCardsLeave([pane]);
      page.detach();
    }));
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
      menu,
      grip,
      pane,
      off: () => {
        window.removeEventListener("pointerdown", off, true);
        window.removeEventListener("keydown", off, true);
      }
    };
    this.placeGripMenu();
    this.enter(menu, { scale: 0.9, y: -6 });
  }
  // Under the grip, centred on it, inside the window
  placeGripMenu() {
    const m = this.gripMenu;
    if (!m) return;
    const g = m.grip.getBoundingClientRect();
    const w = m.menu.offsetWidth;
    const left = Math.min(Math.max(8, g.left + g.width / 2 - w / 2), window.innerWidth - w - 8);
    m.menu.style.left = left + "px";
    m.menu.style.top = g.bottom + 10 + "px";
  }
  closeGripMenu(now = false) {
    const m = this.gripMenu;
    if (!m) return;
    this.gripMenu = null;
    m.off();
    m.grip.removeClass("is-open");
    if (now) return m.menu.remove();
    this.leave(m.menu);
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
          attributeFilter: ["class", "style"]
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
    const switched = !!prev && prev.tab !== tab;
    const moved = !prev || ["x", "y", "w", "h"].some((k) => Math.abs(prev[k] - next[k]) > 0.5);
    const sliding = Date.now() < (thumb.gSlideUntil ?? 0);
    if (switched && fresh) {
      thumb.addClass("is-placing");
      this.setThumbSpot(thumb, prev);
      void thumb.offsetWidth;
    }
    if (switched) {
      thumb.removeClass("is-placing");
      thumb.gSlideUntil = Date.now() + SLIDE_MS;
      thumb.addClass("is-moving");
      window.clearTimeout(thumb.gSwell);
      thumb.gSwell = window.setTimeout(() => thumb.removeClass("is-moving"), SWELL_MS);
    } else if (fresh || moved && !sliding) {
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
      if (Math.abs(dy) > LOCK_AT && Math.abs(dy) > Math.abs(s.dx)) {
        this.swipe = null;
        return;
      }
      if (Math.abs(s.dx) < LOCK_AT) return;
      s.locked = true;
      s.ribbon.style.transition = "none";
      s.ribbon.style.opacity = "1";
    }
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
