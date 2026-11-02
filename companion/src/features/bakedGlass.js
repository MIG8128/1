// ---- Baked glass: the big panels don't blur live (desktop only) ----
//
// The note area and the docked sidebars sit over nothing but the
// background picture, which never moves, yet a live blur
// (backdrop-filter) is worked out again on every frame anything under
// or over it changes: typing, scrolling, switching tabs. Measured in the
// test Obsidian, that tripled the time of every frame. So on desktop the
// picture is blurred once, as the glass would see it (its blur, dim and
// veil, then the glass's own blur and saturation), at a quarter size,
// and those panels show that copy, fixed to the window so it lines up
// (theme section 12: --g-bg-glass + body goguryeo-glass-baked). Small
// glass (bars, buttons, menus) and anything over moving content still
// blurs live. Again whenever the picture, the window size or a glass
// option changes; until then, or if the picture can't be read (a web
// picture without permission), the live blur stays. Not on iPad and
// iPhone: Safari ignores fixed backgrounds, and their GPUs blur well.
//
// Reads from the plugin: app.vault, and the background updateBackground()
// keeps: plugin.bgSource ({ file, url } or null) and plugin.bgValue.

import { Platform } from "../core/platform.js";
import { BAKED_CLASS, BG_IMAGE_CLASS } from "../core/constants.js";

// Returns { schedule(ms), bake() }; off desktop both do nothing.
// Everything it adds is removed on the plugin's unload.
export function setupBakedGlass(plugin) {
    if (!Platform.isDesktopApp) return { schedule() {}, bake: async () => {} };
    const body = document.body;
    let timer = 0;
    let key; // what the current copy was made from ("" = none)
    let url = ""; // the current copy's blob URL

    const drop = () => {
        body.removeClass(BAKED_CLASS);
        body.style.removeProperty("--g-bg-glass");
    };

    const bake = async () => {
        const source = plugin.bgSource;
        const opts = readGlassOptions();
        // only for the picture background (the glass over a color has nothing to blur)
        const k = source && body.hasClass(BG_IMAGE_CLASS) ? JSON.stringify([plugin.bgValue, opts]) : "";
        if (k === key) return;
        key = k;
        if (!k) return drop();
        try {
            const bitmap = await readBackground(plugin.app.vault, source);
            if (k !== key) return; // a newer one started
            const blob = await renderBakedGlass(bitmap, opts);
            bitmap.close?.();
            if (k !== key) return;
            const old = url;
            url = URL.createObjectURL(blob);
            body.style.setProperty("--g-bg-glass", `url("${url}")`);
            body.addClass(BAKED_CLASS);
            // the old copy goes once the new one is drawn
            if (old) window.setTimeout(() => URL.revokeObjectURL(old), 1000);
        } catch (e) {
            // can't read the picture (a web one without permission): live blur
            if (k === key) drop();
        }
    };

    // A moment later, never in the middle of a css-change: Style Settings
    // takes its option classes off and puts them back around one, so the
    // background would look switched off right then
    const schedule = (ms = 60) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(bake, ms);
    };

    plugin.registerDomEvent(window, "resize", () => schedule(250));
    plugin.register(() => {
        window.clearTimeout(timer);
        key = ""; // a bake still running drops its result
        drop();
        if (url) URL.revokeObjectURL(url);
    });
    return { schedule, bake };
}

// The glass options as the theme has them now, in the main window
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
        veil: cs.getPropertyValue("--g-bg-veil").trim() || "#000",
    };
}

// The picture's own bytes: an <img> of it would make the canvas
// unreadable (app:// and web pictures count as another site)
async function readBackground(vault, { file, url }) {
    const data = file ? new Blob([await vault.readBinary(file)])
        : await (await fetch(url, { mode: "cors" })).blob();
    return createImageBitmap(data);
}

// The picture as the glass sees it: as section 12 paints it behind
// everything (cover, its own blur, the dim veil), mirrored past its edges
// so the blur has no dark rim, then the glass's blur and saturation
async function renderBakedGlass(img, { w: W, h: H, bgBlur, blur, sat, dim, veil }) {
    // blurred anyway: drawn small (the blur hides the scaling)
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
