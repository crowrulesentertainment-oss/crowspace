import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
const root = process.cwd();
const htmlFiles = readdirSync(root).filter(name => name.endsWith(".html"));
const missing = [];
for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref)) continue;
    const pathname = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!pathname) continue;
    const target = resolve(root, pathname);
    if (!existsSync(target)) missing.push(file + " -> " + ref);
  }
}
if (missing.length) { console.error("Missing local references:\n" + missing.join("\n")); process.exit(1); }
console.log("HTML local references OK:", htmlFiles.length, "pages");
