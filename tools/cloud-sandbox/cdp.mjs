// DevTools helper for the cloud test Obsidian (tools/cloud-sandbox/setup.sh).
// Talks only to port 9231. Screenshots and frames go wherever you say (use /tmp).
//   node cdp.mjs list
//   node cdp.mjs [--page "<title prefix>"] eval '<js>'        (promises are awaited)
//   node cdp.mjs evalfile <file.js>
//   node cdp.mjs shot <out.png> [x,y,w,h] [scale]
//   node cdp.mjs record <file.js> <outdir>      frames of the screen while the JS runs
//   node cdp.mjs startup <outdir> [seconds]     reload Obsidian, frames of the startup
//   node cdp.mjs slowmo <rate> '<js>' <out-prefix> <ms,ms,...>
//                                               runs the JS with every animation slowed
//                                               (0.05 = 1/20) and shoots at those times
// The test copy renders without a GPU: few frames, slow input. Time logic with
// events sent from inside the page; see motion with slowmo.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PORT = 9231;
const args = process.argv.slice(2);
let pagePrefix = null;
if (args[0] === "--page") { pagePrefix = args[1]; args.splice(0, 2); }
const [cmd, ...rest] = args;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
if (cmd === "list") {
    for (const t of targets) console.log(t.type, JSON.stringify(t.title), t.url);
    process.exit(0);
}
const pages = targets.filter((t) => t.type === "page");
const target = pagePrefix ? pages.find((t) => t.title.startsWith(pagePrefix))
    : pages.find((t) => t.url.startsWith("app://obsidian.md/index.html")) ?? pages[0];
if (!target) { console.error("no page"); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const waiting = new Map();
const frames = [];
ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
    if (msg.method === "Page.screencastFrame") {
        frames.push({ t: msg.params.metadata.timestamp, data: msg.params.data });
        send("Page.screencastFrameAck", { sessionId: msg.params.sessionId });
    }
};
const send = (method, params = {}) => new Promise((r) => {
    const n = ++id;
    waiting.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(expression) {
    const res = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (res.result?.exceptionDetails) {
        console.log("EXCEPTION:", res.result.exceptionDetails.exception?.description ?? res.result.exceptionDetails.text);
    } else {
        const v = res.result?.result?.value;
        console.log(typeof v === "string" ? v : JSON.stringify(v, null, 1));
    }
}

function saveFrames(out, t0) {
    mkdirSync(out, { recursive: true });
    frames.forEach((f, i) => writeFileSync(`${out}/f${String(i).padStart(3, "0")}_${Math.round((f.t - t0) * 1000)}ms.jpg`, Buffer.from(f.data, "base64")));
    console.log(frames.length, "frames in", out);
}

if (cmd === "eval") await evaluate(rest[0]);
else if (cmd === "evalfile") await evaluate(readFileSync(rest[0], "utf8"));
else if (cmd === "shot") {
    const params = { format: "png" };
    if (rest[1]) {
        const [x, y, width, height] = rest[1].split(",").map(Number);
        params.clip = { x, y, width, height, scale: Number(rest[2] ?? 1) };
    }
    const res = await send("Page.captureScreenshot", params);
    writeFileSync(rest[0], Buffer.from(res.result.data, "base64"));
    console.log("saved", rest[0]);
} else if (cmd === "record") {
    await send("Page.enable");
    await send("Page.startScreencast", { format: "jpeg", quality: 70 });
    const t0 = Date.now() / 1000;
    await evaluate(readFileSync(rest[0], "utf8"));
    await send("Page.stopScreencast");
    saveFrames(rest[1], t0);
} else if (cmd === "startup") {
    await send("Page.enable");
    await send("Page.startScreencast", { format: "jpeg", quality: 60 });
    const t0 = Date.now() / 1000;
    await send("Page.reload", {});
    await sleep(Number(rest[1] ?? 5) * 1000);
    await send("Page.stopScreencast");
    saveFrames(rest[0], t0);
} else if (cmd === "slowmo") {
    const [rate, js, prefix, times] = rest;
    await send("Animation.enable");
    await send("Animation.setPlaybackRate", { playbackRate: Number(rate) });
    const t0 = Date.now();
    await send("Runtime.evaluate", { expression: js, awaitPromise: true });
    for (const t of times.split(",").map(Number)) {
        const wait = t - (Date.now() - t0);
        if (wait > 0) await sleep(wait);
        const res = await send("Page.captureScreenshot", { format: "png" });
        writeFileSync(`${prefix}_${t}.png`, Buffer.from(res.result.data, "base64"));
    }
    await send("Animation.setPlaybackRate", { playbackRate: 1 });
    console.log("shots:", times);
} else console.log("unknown command");
ws.close();
