const fs = require("node:fs");
const path = require("node:path");

console.log("patching @tanstack/router-plugin for apostrophe-in-path support...");

const patches = [
  {
    file: "node_modules/@tanstack/router-plugin/dist/esm/core/code-splitter/compilers.js",
    search: `const splitUrl = addSplitSearchParamToFilename(opts.filename, codeSplitGroup);`,
    replace: `const splitUrl = addSplitSearchParamToFilename(opts.filename, codeSplitGroup).replace(/'/g, "\\\\'");`,
  },
  {
    file: "node_modules/@tanstack/router-plugin/dist/esm/core/code-splitter/plugins/react-refresh-ignored-route-exports.js",
    search: `var buildReactRefreshIgnoredRouteExportsStatements = template.statements(\`
const hot = import.meta.hot
if (hot && typeof window !== 'undefined') {`,
    replace: `var buildReactRefreshIgnoredRouteExportsStatements = template.statements(\`
if (typeof import.meta.hot !== 'undefined' && typeof window !== 'undefined') {
  const hot = import.meta.hot`,
  },
];

const root = path.resolve(__dirname, "..");

let patched = 0;
for (const p of patches) {
  const fullPath = path.join(root, p.file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  SKIP — not found: ${p.file}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, "utf-8");
  if (content.includes(p.replace)) {
    console.log(`  OK — already patched: ${p.file}`);
    patched++;
    continue;
  }
  if (!content.includes(p.search)) {
    console.warn(`  SKIP — pattern not found: ${p.file}`);
    continue;
  }
  content = content.replace(p.search, p.replace);
  fs.writeFileSync(fullPath, content, "utf-8");
  console.log(`  PATCHED: ${p.file}`);
  patched++;
}

if (patched === patches.length) {
  console.log("all patches applied successfully.");
} else {
  console.warn(`applied ${patched}/${patches.length} patches. some may have failed.`);
}
