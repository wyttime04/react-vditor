// 用 babel 把 src 的 .js / .jsx 編譯到 dist，再附上手寫的 index.d.ts 與樣式
// （樣式由 css.cjs 產生：vditor 的 index.css 加上局部化的 light / dark 主題）
const {execSync} = require("child_process");
const fs = require("fs");
const path = require("path");
const {buildCss} = require("./css.cjs");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
fs.rmSync(dist, {recursive: true, force: true});
execSync(`"${path.join(root, "node_modules/.bin/babel")}" src --out-dir dist --extensions .js,.jsx`, {cwd: root, stdio: "inherit"});
fs.copyFileSync(path.join(root, "src/index.d.ts"), path.join(dist, "index.d.ts"));
fs.writeFileSync(path.join(dist, "index.css"), buildCss());
