// Motion: every animation of the companion uses these curves and times, the
// same ones theme section 13 names for CSS (--g-ease, --g-spring, ...), so
// whatever moves, script or CSS, moves alike. Change a feel in both places.
// Moves use the individual scale / translate properties, never transform,
// so they add to whatever the theme places with transform.

export const EASE = {
    out: "cubic-bezier(0.2, 0.8, 0.2, 1)", // settling: slides and fades in (--g-ease)
    in: "cubic-bezier(0.4, 0, 1, 1)", // going away
    spring: "cubic-bezier(0.3, 1.3, 0.4, 1)", // menus and panels opening, the tab glass (--g-spring)
    soft: "cubic-bezier(0.3, 1.15, 0.4, 1)", // gliding to a new place, making room (--g-spring-soft)
    bounce: "cubic-bezier(0.3, 1.5, 0.4, 1)", // tabs and slots growing in (--g-spring-bounce)
    pop: "cubic-bezier(0.2, 0.8, 0.3, 1)", // keyframed pops: their overshoot is in the keyframes
};
export const DUR = { in: 240, out: 150, fade: 200, glide: 280, pop: 540, leave: 350 }; // ms (in, out: --g-dur-in, --g-dur-out)

export function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Keyframes on an element, unless the user asked for less motion.
// Resolves once done (at once without motion); never throws.
export function play(el, keyframes, options) {
    if (!el || reducedMotion()) return Promise.resolve();
    try {
        return el.animate(keyframes, options).finished.then(() => {}, () => {});
    } catch (e) {
        return Promise.resolve();
    }
}

// A surface comes in, from a little smaller (or bigger), offset and see-through
export function enter(el, { scale = 0.94, x = 0, y = 0, opacity = 0, duration = DUR.in, easing = EASE.spring } = {}) {
    return play(el, [
        { opacity, scale: String(scale), translate: `${x}px ${y}px` },
        { opacity: 1, scale: "1", translate: "0 0" },
    ], { duration, easing });
}

// ...and goes: it stops taking clicks at once, shrinks a little, fades,
// and is removed
export function leave(el, { scale = 0.94, x = 0, y = 0, duration = DUR.out, remove = true } = {}) {
    if (!el) return Promise.resolve();
    el.style.pointerEvents = "none";
    return play(el, [
        { opacity: 1, scale: "1", translate: "0 0" },
        { opacity: 0, scale: String(scale), translate: `${x}px ${y}px` },
    ], { duration, easing: EASE.in, fill: "forwards" }).then(() => { if (remove) el.remove(); });
}

// A dim or a sheet fading in to its own opacity, or out and removed
export function fadeIn(el, { duration = DUR.fade } = {}) {
    if (!el) return Promise.resolve();
    return play(el, [{ opacity: 0 }, { opacity: getComputedStyle(el).opacity }], { duration, easing: EASE.out });
}

export function fadeOut(el, { duration = DUR.out, remove = true } = {}) {
    if (!el) return Promise.resolve();
    el.style.pointerEvents = "none";
    return play(el, [{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration, easing: EASE.in, fill: "forwards" })
        .then(() => { if (remove) el.remove(); });
}

// From where it stood to where it is now (dx, dy: old place less new)
export function glide(el, dx, dy = 0, { duration = DUR.glide, easing = EASE.soft } = {}) {
    if (!dx && !dy) return Promise.resolve();
    return play(el, [{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration, easing });
}

// A tab or a page's name comes in. style: the settings tab's "Opening and
// closing tabs" ("subtle", "lively" or "off"). Subtle: it fades in, a
// little smaller, while its room opens (grow: the property that opens it,
// flexGrow in a row). Lively: from small, past its size, back.
export function springIn(el, style, { grow = null, swell = 1.14, y = -10 } = {}) {
    if (style === "off") return Promise.resolve();
    const room = (v) => (grow ? { [grow]: v } : {});
    if (style === "subtle") {
        return play(el, [
            { opacity: 0, scale: "0.94", ...room(0) },
            { opacity: 1, scale: "1", ...room(1) },
        ], { duration: DUR.in, easing: EASE.out });
    }
    const at = (opacity, scale, dy, r) => ({ opacity, scale: String(scale), translate: `0 ${dy}px`, ...room(r) });
    return play(el, [
        at(0, 0.3, y, 0),
        { ...at(1, swell, 0, 1.2), offset: 0.6 },
        at(1, 1, 0, 1),
    ], { duration: DUR.pop, easing: EASE.pop });
}

// ...and one closing goes, its room closing with it (room: the properties
// at full size and at none), then is removed. Subtle: it fades out first,
// so the neighbours visibly slide into its place. Lively: it swells for a
// beat, then shrinks to nothing.
export function springOut(el, style, { room = [{}, {}], swell = 1.1 } = {}) {
    el.style.pointerEvents = "none";
    if (style === "off") {
        el.remove();
        return Promise.resolve();
    }
    const frames = style === "subtle" ? [
        { ...room[0], opacity: 1, scale: "1" },
        { ...room[0], opacity: 0, scale: "0.96", offset: 0.4 },
        { ...room[1], opacity: 0, scale: "0.96" },
    ] : [
        { ...room[0], opacity: 1, scale: "1" },
        { ...room[0], opacity: 1, scale: String(swell), offset: 0.22 },
        { ...room[1], opacity: 0, scale: "0.3" },
    ];
    return play(el, frames, { duration: style === "subtle" ? DUR.glide : DUR.leave, easing: style === "subtle" ? EASE.out : EASE.in, fill: "forwards" })
        .then(() => el.remove());
}
