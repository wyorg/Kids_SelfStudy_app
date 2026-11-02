// Inlines the built CSS + JS into one self-contained HTML file so the app can be
// opened by double-clicking, with no dev server and no npm install.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// 단일 HTML(더블클릭)에서는 외부 파일(manifest·아이콘)을 불러올 수 없으므로
// PWA 전용 링크 태그를 제거해 file:// 404 를 방지한다. (서비스 워커 등록 코드는
// http(s) 가 아니면 스스로 건너뛴다.)
html = html.replace(/\s*<link\b[^>]*\brel="(?:manifest|apple-touch-icon|icon)"[^>]*>/g, '');

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

const out = path.join(root, '우리아이-오늘의미션.html');
fs.writeFileSync(out, html, 'utf8');
console.log('standalone written:', out, (html.length / 1024).toFixed(0) + ' KB');
