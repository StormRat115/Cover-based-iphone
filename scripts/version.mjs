import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const version = process.argv[2];
if (!/^\d{8}-\d+$/.test(version || ""))
  throw new Error("Usage: node scripts/version.mjs YYYYMMDD-N");
// Mechanical cache-key rewrite: every local JS module has exactly one URL.
for (const file of readdirSync("js").filter((file) => file.endsWith(".js"))) {
  const path = "js/" + file;
  let source = readFileSync(path, "utf8");
  source = source.replace(
    /(["'])(\.\/[^"'\n?]+\.js)(?:\?v=[^"'\n]+)?\1/g,
    (_, quote, path) => quote + path + "?v=" + version + quote,
  );
  source = source.replace(
    /(const BUILD = ["'])[^"']+(["'])/,
    "$1" + version + "$2",
  );
  writeFileSync(path, source);
}
let html = readFileSync("index.html", "utf8");
html = html.replace(
  /((?:css|js)\/[^"?]+\.(?:css|js))\?v=[^"]+/g,
  "$1?v=" + version,
);
html = html.replace(/BUILD \d{8}-\d+/g, "BUILD " + version);
writeFileSync("index.html", html);
