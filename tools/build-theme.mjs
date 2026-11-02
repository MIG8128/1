// Concatenates src/theme/*.css (00-…, 01-… 13-…, in numeric order) into theme.css, byte for byte.
// Usage (repo root): node tools/build-theme.mjs
import fs from "fs";
import path from "path";
const dir = "src/theme";
const files = fs.readdirSync(dir).filter((f) => /^\d+-.*\.css$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
fs.writeFileSync("theme.css", Buffer.concat(files.map((f) => fs.readFileSync(path.join(dir, f)))));
console.log(`theme.css <- ${files.length} files`);
