// generate-prompt.js
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname nachbauen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CWD = process.cwd();
const argv = process.argv.slice(2);
const isFull = argv.includes("--full");

function argNum(name, def) {
  const m = argv.find(a => a.startsWith(`--${name}=`));
  return m ? parseInt(m.split("=")[1], 10) : def;
}

const MAX_FILES = argNum("maxFiles", isFull ? 600 : 250);
const MAX_FILE_BYTES = argNum("maxFileBytes", 200 * 1024);
const TREE_DEPTH = argNum("depth", isFull ? 4 : 3);

const DEFAULT_IGNORES = [
  "node_modules", ".git", ".github", ".vscode", ".idea",
  "dist", "build", "coverage", ".next", ".turbo", ".cache", ".pnpm-store",
  "tmp", "out", ".DS_Store"
];

// ---------- helpers ----------
const readFile = (p) => {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
};

const exists = (p) => {
  try { fs.accessSync(p); return true; } catch { return false; }
};

function loadGitignore() {
  const gi = path.join(CWD, ".gitignore");
  if (!exists(gi)) return new Set(DEFAULT_IGNORES);
  const lines = readFile(gi).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const names = new Set(DEFAULT_IGNORES);
  for (const l of lines) {
    if (l.startsWith("#")) continue;
    const base = l.replace(/^[/*]+|[/*]+$/g, "");
    if (base) names.add(base);
  }
  return names;
}

const IGNORE = loadGitignore();

function shouldIgnore(name) {
  return IGNORE.has(name) || name.startsWith(".");
}

function listTree(dir, depth = 0) {
  if (depth > TREE_DEPTH) return [];
  let items = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
  for (const e of entries) {
    if (shouldIgnore(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(CWD, full) || e.name;
    if (e.isDirectory()) {
      items.push({ type: "dir", path: rel });
      items = items.concat(listTree(full, depth + 1));
    } else {
      items.push({ type: "file", path: rel, size: fs.statSync(full).size });
    }
  }
  return items;
}

function detectFrameworks(deps) {
  const has = (n) => deps[n] != null;
  const list = [];
  if (has("express")) list.push("Express");
  if (has("@nestjs/core")) list.push("NestJS");
  if (has("fastify")) list.push("Fastify");
  if (has("koa")) list.push("Koa");
  if (has("next")) list.push("Next.js");
  if (has("prisma")) list.push("Prisma");
  if (has("mongoose")) list.push("Mongoose");
  if (has("typeorm")) list.push("TypeORM");
  if (has("jest")) list.push("Jest");
  if (has("vitest")) list.push("Vitest");
  if (has("tsx")) list.push("tsx");
  if (has("ts-node")) list.push("ts-node");
  return list;
}

function topN(obj, n=15) {
  if (!obj) return [];
  return Object.entries(obj).sort(([a],[b]) => a.localeCompare(b)).slice(0, n);
}

function extractExports(code) {
  // quick & dirty: export function foo, export class Bar, module.exports=..., exports.foo=...
  const out = new Set();
  const re = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
    /export\s+class\s+([A-Za-z0-9_]+)/g,
    /export\s+const\s+([A-Za-z0-9_]+)/g,
    /export\s+{([^}]+)}/g, // export { a, b as c }
    /exports\.([A-Za-z0-9_]+)\s*=/g,
    /module\.exports\s*=\s*{([^}]+)}/g
  ];
  for (const r of re) {
    let m;
    while ((m = r.exec(code))) {
      if (r === re[3] || r === re[5]) {
        const names = m[1].split(",").map(s => s.trim().split(/\s+as\s+/)[1] || s.trim().split(/\s+as\s+/)[0]);
        names.forEach(n => n && out.add(n.replace(/[^A-Za-z0-9_]/g,"")));
      } else {
        out.add(m[1]);
      }
    }
  }
  return Array.from(out).filter(Boolean).sort();
}

function extractRoutes(code) {
  // Express/Fastify/Nest (very coarse)
  const routes = [];
  const http = ["get","post","put","patch","delete","options"];
  for (const m of http) {
    const re = new RegExp(`\\.(?:route\\(['"\`].*?['"\`]\\)|${m})\\(\\s*['"\`]([^'"\`]+)['"\`]`, "g");
    let x;
    while ((x = re.exec(code))) {
      routes.push({ method: m.toUpperCase(), path: x[1] });
    }
  }
  // NestJS: @Get('/foo')
  const nest = /@([A-Z][a-zA-Z]+)\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let y;
  while ((y = nest.exec(code))) {
    routes.push({ method: y[1].toUpperCase(), path: y[2] });
  }
  return routes;
}

function extractEnvVars(code) {
  const set = new Set();
  const re = /process\.env\.([A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(code))) set.add(m[1]);
  return Array.from(set).sort();
}

// ---------- gather ----------
const readme = readFile(path.join(CWD, "README.md")).trim();
const pkgRaw = readFile(path.join(CWD, "package.json"));
let pkg = {};
try { pkg = JSON.parse(pkgRaw || "{}"); } catch { pkg = {}; }

const nodeFromEngines = pkg.engines?.node || "";
const nvmrc = readFile(path.join(CWD, ".nvmrc")).trim();
const nodeVersion = nvmrc || nodeFromEngines || "unbekannt";

const tree = listTree(CWD);
const filesJS = tree
  .filter(f => f.type === "file" && /\.(mjs|cjs|js|ts|tsx|mts)$/.test(f.path))
  .sort((a,b) => b.size - a.size)
  .slice(0, MAX_FILES);

let exportsIndex = {};
let routesIndex = {};
let envIndex = new Set();

for (const f of filesJS) {
  if (f.size > MAX_FILE_BYTES) continue; // cap
  const full = path.join(CWD, f.path);
  const code = readFile(full);
  if (!code) continue;
  const ex = extractExports(code);
  if (ex.length) exportsIndex[f.path] = ex;
  const rt = extractRoutes(code);
  if (rt.length) routesIndex[f.path] = rt;
  extractEnvVars(code).forEach(v => envIndex.add(v));
}

const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
const frameworks = detectFrameworks(deps);
const hasESLint = exists(path.join(CWD, ".eslintrc")) || exists(path.join(CWD, ".eslintrc.js")) || exists(path.join(CWD, ".eslintrc.cjs"));
const hasPrettier = exists(path.join(CWD, ".prettierrc")) || exists(path.join(CWD, ".prettierrc.js")) || exists(path.join(CWD, ".prettierrc.cjs"));
const hasTS = exists(path.join(CWD, "tsconfig.json"));
const hasDocker = exists(path.join(CWD, "Dockerfile"));
const hasCI = exists(path.join(CWD, ".github", "workflows")) || exists(path.join(CWD, ".gitlab-ci.yml"));

function formatTree(items) {
  const lines = [];
  const max = 1200; // avoid huge prompts
  for (const it of items) {
    if (lines.length > max) { lines.push("… (gekürzt)"); break; }
    lines.push(it.type === "dir" ? `📁 ${it.path}` : `📄 ${it.path}`);
  }
  return lines.join("\n");
}

function formatExports(idx) {
  const lines = [];
  const files = Object.keys(idx).slice(0, isFull ? 200 : 120);
  for (const f of files) {
    const names = idx[f].slice(0, 30).join(", ");
    lines.push(`- ${f}: ${names}${idx[f].length > 30 ? " …" : ""}`);
  }
  if (Object.keys(idx).length > files.length) lines.push("… (gekürzt)");
  return lines.join("\n");
}

function formatRoutes(idx) {
  const out = [];
  let count = 0, cap = isFull ? 250 : 120;
  for (const [file, arr] of Object.entries(idx)) {
    for (const r of arr) {
      if (++count > cap) { out.push("… (gekürzt)"); return out.join("\n"); }
      out.push(`${r.method} ${r.path}  (${file})`);
    }
  }
  return out.join("\n");
}

function topBySize(items, n=10) {
  return items
    .filter(f => f.type === "file")
    .sort((a,b) => b.size - a.size)
    .slice(0, n)
    .map(f => `${f.path} (${f.size} B)`)
    .join("\n");
}

// ---------- build prompt ----------
const prompt = `
System
Du bist ein erfahrener Node.js-/TypeScript-Architekt und Reviewer. Liefere klare, priorisierte Empfehlungen mit kurzen Codebeispielen. Bei vue-Dateien bevorzuge ich die Reihenfolge <template> und danach <setup>.

Ziele
- Schwachstellen finden (Architektur, Sicherheit, Performance, DX)
- Konkrete Next Steps vorschlagen (max. 10, nach Impact sortiert)
- Offene Fragen markieren

Kontext (Zusammenfassung)
- Projekt: ${pkg.name || "unbekannt"} v${pkg.version || "?"}
- Zweck/Beschreibung (aus README): ${readme ? readme.split(/\n{2,}/)[0].slice(0, 600) : "(README.md nicht gefunden)"}
- Laufzeit: Node ${nodeVersion}
- Frameworks/Tools erkannt: ${frameworks.join(", ") || "—"}
- Qualität/System: ${hasTS ? "TS " : ""}${hasESLint ? "ESLint " : ""}${hasPrettier ? "Prettier " : ""}${hasDocker ? "Docker " : ""}${hasCI ? "CI " : ""}

package.json (essenziell)
- Scripts (Top): ${topN(pkg.scripts, 12).map(([k,v])=>`${k}: ${v}`).join(" | ") || "—"}
- Dependencies (Top): ${topN(pkg.dependencies, 15).map(([k,v])=>`${k}@${v}`).join(", ") || "—"}
- DevDependencies (Top): ${topN(pkg.devDependencies, 15).map(([k,v])=>`${k}@${v}`).join(", ") || "—"}

Projektstruktur (bis Tiefe ${TREE_DEPTH})
${formatTree(tree)}

Öffentliche API / Interfaces
Exports (Datei → Namen)
${Object.keys(exportsIndex).length ? formatExports(exportsIndex) : "—"}

HTTP-Routen (erkannt)
${Object.keys(routesIndex).length ? formatRoutes(routesIndex) : "—"}

ENV-Variablen, die im Code verwendet werden
${Array.from(envIndex).slice(0, 80).join(", ") || "—"}

Hotspots (größte Dateien)
${topBySize(tree, 12) || "—"}

Deine Aufgabe
1) Beurteile Architektur & Risiken (Security, Performance, DX).
2) Nenne Quick Wins (1–2 Tage) und Bigger Bets (1–3 Wochen), priorisiert.
3) Liste gezielte Codeauszüge an, die du brauchst (Datei+Zeilen), max. 5.
4) Falls unklar: stelle präzise Rückfragen.
`.trim();

// ---------- outputs ----------
fs.writeFileSync(path.join(CWD, "project-prompt.txt"), prompt, "utf8");

// optional: detailliertes Manifest
const manifest = {
  name: pkg.name, version: pkg.version, nodeVersion,
  frameworks, flags: { hasTS, hasESLint, hasPrettier, hasDocker, hasCI },
  scripts: pkg.scripts || {}, dependencies: pkg.dependencies || {}, devDependencies: pkg.devDependencies || {},
  tree, exportsIndex, routesIndex, env: Array.from(envIndex)
};
fs.writeFileSync(path.join(CWD, "project-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

console.log("✓ project-prompt.txt erzeugt");
console.log("✓ project-manifest.json erzeugt (Detaildaten)");
console.log("Hinweis: Flags --full --depth=4 --maxFiles=400 verfügbar.");
