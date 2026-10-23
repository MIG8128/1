// Tiny Chrome DevTools Protocol client for the Obsidian window.
//   node cdp.mjs eval "<js expression>"     → prints the result as JSON
//   node cdp.mjs evalfile <file.js>         → evaluates a file's contents
//   node cdp.mjs shot <out.png> [scale]     → screenshot of the window
import { readFileSync, writeFileSync } from "node:fs";

const [, , cmd, arg, arg2] = process.argv;
const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
const page = targets.find((t) => t.type === "page" && t.url.startsWith("app://obsidian.md"));
if (!page) throw new Error("Obsidian page not found");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

async function evaluate(expression) {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text };
    return r.result?.result?.value;
}

if (cmd === "bounds") {
    // node cdp.mjs bounds                → print window bounds
    // node cdp.mjs bounds '{"width":..}' → set them (e.g. {"windowState":"normal","width":420,"height":900})
    const { result } = await send("Browser.getWindowForTarget", { targetId: page.id });
    if (arg) {
        const want = JSON.parse(arg);
        if (want.windowState === "normal") await send("Browser.setWindowBounds", { windowId: result.windowId, bounds: { windowState: "normal" } });
        const rest = { ...want }; delete rest.windowState;
        if (Object.keys(rest).length) await send("Browser.setWindowBounds", { windowId: result.windowId, bounds: rest });
        if (want.windowState && want.windowState !== "normal") await send("Browser.setWindowBounds", { windowId: result.windowId, bounds: { windowState: want.windowState } });
    }
    const after = await send("Browser.getWindowBounds", { windowId: result.windowId });
    console.log(JSON.stringify(after.result.bounds));
}
else if (cmd === "eval") console.log(JSON.stringify(await evaluate(arg), null, 2));
else if (cmd === "evalfile") console.log(JSON.stringify(await evaluate(readFileSync(arg, "utf8")), null, 2));
else if (cmd === "shot") {
    const scale = Number(arg2 || 1);
    const m = await evaluate("({w: innerWidth, h: innerHeight})");
    const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: m.w, height: m.h, scale } });
    writeFileSync(arg, Buffer.from(r.result.data, "base64"));
    console.log(`saved ${arg} (${m.w}x${m.h} css px, scale ${scale})`);
}
ws.close();
