// Inlines the built CSS + JS into one self-contained HTML file so the app can be
// opened by double-clicking, with no dev server and no npm install.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// Inline <link rel="stylesheet" href="./assets/xxx.css">
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_m, href) => {
  const css = fs.readFileSync(path.join(dist, href), 'utf8');
  return `<style>\n${css}\n</style>`;
});

// Inline <script type="module" crossorigin src="./assets/xxx.js"></script>
html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, (_m, src) => {
  const js = fs.readFileSync(path.join(dist, src), 'utf8');
  return `<script type="module">\n${js}\n</script>`;
});

const out = path.join(root, '민건이의-우주미션.html');
fs.writeFileSync(out, html, 'utf8');
console.log('standalone written:', out, (html.length / 1024).toFixed(0) + ' KB');
