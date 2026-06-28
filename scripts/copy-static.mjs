import { copyFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const requiredFiles = ["app.js", "env-config.js", "style.css"];

if (!existsSync(dist)) {
  throw new Error("dist folder was not created. Run this script after vite build.");
}

await mkdir(dist, { recursive: true });

for (const file of requiredFiles) {
  const source = new URL(file, root);
  const target = new URL(file, dist);
  await stat(source);
  await copyFile(source, target);
}

console.log("Copied app.js, env-config.js, and style.css into dist.");
