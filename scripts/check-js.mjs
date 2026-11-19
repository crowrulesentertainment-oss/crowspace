import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const root = "assets/js";
const files = readdirSync(root).filter(name => name.endsWith(".js")).map(name => join(root, name));
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) { failed = true; process.stderr.write(result.stderr || result.stdout); }
}
if (failed) process.exit(1);
console.log("JavaScript syntax OK:", files.length, "files");
