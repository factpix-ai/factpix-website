#!/usr/bin/env node
/**
 * Netlify build script — copies static site to dist/ and injects
 * Paddle environment variables into index.html placeholders.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const PADDLE_ENVIRONMENT = process.env.PADDLE_ENVIRONMENT;
const PADDLE_CLIENT_TOKEN = process.env.PADDLE_CLIENT_TOKEN;

const REQUIRED = [
  ["PADDLE_ENVIRONMENT", PADDLE_ENVIRONMENT],
  ["PADDLE_CLIENT_TOKEN", PADDLE_CLIENT_TOKEN],
];

for (const [name, value] of REQUIRED) {
  if (!value || !String(value).trim()) {
    console.error(`Build failed: missing required environment variable ${name}`);
    process.exit(1);
  }
}

const COPY_FILES = [
  "index.html",
  "privacy.html",
  "terms.html",
  "refund.html",
  "_headers",
];

function copyFile(name) {
  const src = path.join(ROOT, name);
  const dest = path.join(DIST, name);
  if (!fs.existsSync(src)) {
    console.warn(`Skipping missing file: ${name}`);
    return;
  }
  fs.copyFileSync(src, dest);
}

function copyDir(dirName) {
  const srcDir = path.join(ROOT, dirName);
  if (!fs.existsSync(srcDir)) {
    return;
  }
  const destDir = path.join(DIST, dirName);
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const sub of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, sub), path.join(dest, sub));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const file of COPY_FILES) {
  copyFile(file);
}

// Copy optional asset directories if present
for (const dir of ["assets", "images", "css", "js"]) {
  copyDir(dir);
}

const indexPath = path.join(DIST, "index.html");
let html = fs.readFileSync(indexPath, "utf8");

html = html
  .replaceAll("__PADDLE_ENVIRONMENT__", PADDLE_ENVIRONMENT.trim())
  .replaceAll("__PADDLE_CLIENT_TOKEN__", PADDLE_CLIENT_TOKEN.trim());

fs.writeFileSync(indexPath, html, "utf8");

console.log(
  `Build OK → dist/ (PADDLE_ENVIRONMENT=${PADDLE_ENVIRONMENT.trim()})`
);
