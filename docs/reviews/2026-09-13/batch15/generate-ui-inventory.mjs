import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const inventoryPath = path.join(root, "docs/reviews/2026-09-13/batch15/ui-inventory.json");
const normalize = (file) => path.normalize(file);
const relative = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const sourceFiles = ts.sys.readDirectory(sourceRoot, [".ts", ".tsx"], undefined, undefined)
  .filter((file) => !file.endsWith(".d.ts"))
  .map(normalize);
const componentFiles = sourceFiles.filter((file) => /[\\/]src[\\/](components|features)[\\/].+\.tsx$/.test(file));
const compilerOptions = {
  jsx: ts.JsxEmit.Preserve,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  baseUrl: root,
  paths: { "@/*": ["src/*"] },
  allowJs: false,
  skipLibCheck: true
};
const program = ts.createProgram(sourceFiles, compilerOptions);
const checker = program.getTypeChecker();
const sourceSet = new Set(sourceFiles);
const edges = new Map(sourceFiles.map((file) => [file, []]));
const incoming = new Map(sourceFiles.map((file) => [file, []]));

function isRuntimeImport(statement) {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) return false;
    if (clause.name || !clause.namedBindings || ts.isNamespaceImport(clause.namedBindings)) return true;
    return clause.namedBindings.elements.some((element) => !element.isTypeOnly);
  }
  if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) return false;
  if (!statement.exportClause || ts.isNamespaceExport(statement.exportClause)) return true;
  return statement.exportClause.elements.some((element) => !element.isTypeOnly);
}

for (const sourceFile of program.getSourceFiles()) {
  const from = normalize(sourceFile.fileName);
  if (!sourceSet.has(from)) continue;
  for (const statement of sourceFile.statements) {
    if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) || !statement.moduleSpecifier || !isRuntimeImport(statement)) continue;
    const specifier = statement.moduleSpecifier.text;
    const resolved = ts.resolveModuleName(specifier, from, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
    if (!resolved) continue;
    const to = normalize(resolved);
    if (!sourceSet.has(to)) continue;
    edges.get(from).push(to);
    incoming.get(to).push(from);
  }
}

function runtimeExports(file) {
  const sourceFile = program.getSourceFile(file);
  const symbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!symbol) return [];
  return checker.getExportsOfModule(symbol)
    .filter((entry) => {
      const resolved = entry.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(entry) : entry;
      return Boolean(resolved.flags & ts.SymbolFlags.Value);
    })
    .map((entry) => entry.getName())
    .sort();
}

function reverseReachability(start) {
  const queue = [{ file: start, chain: [start] }];
  const seen = new Set([start]);
  const found = [];
  while (queue.length) {
    const current = queue.shift();
    for (const parent of incoming.get(current.file) ?? []) {
      const chain = [parent, ...current.chain];
      if (!seen.has(parent)) {
        seen.add(parent);
        queue.push({ file: parent, chain });
        found.push({ file: relative(parent), modulePath: chain.map(relative) });
      }
    }
  }
  return found;
}

function nativeControls(file) {
  const text = fs.readFileSync(file, "utf8");
  return [...new Set([...text.matchAll(/<(button|input|textarea|select|form|table|dialog)\b/g)].map((match) => match[1]))].sort();
}

function routePattern(pageFile) {
  let result = relative(pageFile).replace(/^src\/app\//, "").replace(/\([^/]+\)\//g, "").replace(/(?:^|\/)page\.tsx$/, "");
  return result ? `/${result}` : "/";
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
inventory.method = "Static TypeScript AST/module-resolution inspection. This is not browser verification.";
inventory.routePageIndex = inventory.pageFiles.map((entry) => ({ file: entry, routePattern: routePattern(path.join(root, entry)) }));
inventory.componentUsageIndex = componentFiles.map((file) => {
  const direct = [...new Set(incoming.get(file) ?? [])].sort();
  const transitive = reverseReachability(file);
  const entryConnections = transitive.filter((entry) => /\/page\.tsx$|\/layout\.tsx$/.test(entry.file));
  return {
    file: relative(file),
    runtimeExports: runtimeExports(file),
    ownership: relative(file).startsWith("src/components/ui/") ? "shared UI primitive" : relative(file).startsWith("src/components/layout/") ? "shared layout" : relative(file).startsWith("src/features/admin/") ? "admin feature" : relative(file).startsWith("src/features/public-site/") ? "public-site feature" : "feature or domain",
    nativeControlTags: nativeControls(file),
    directRuntimeModuleConsumers: direct.map(relative),
    connectedPageOrLayoutModules: entryConnections
  };
}).sort((a, b) => a.file.localeCompare(b.file));
delete inventory.exportedComponentIndex;
delete inventory.componentGroups;
inventory.graphSemantics = {
  directRuntimeModuleConsumers: "One runtime import or runtime re-export resolves directly to this source module. Type-only imports are excluded.",
  connectedPageOrLayoutModules: "Transitive consumers that are app page.tsx or layout.tsx entry modules. The reverse graph resolves relative imports, @/ alias imports, index modules, export-star and named runtime re-exports; modulePath is consumer-to-source and does not claim a symbol-level render relationship."
};
inventory.themeSources = {
  administration: { sources: ["src/lib/design-system/tokens.ts", "src/app/globals.css"], values: { navy: "#0f172a", gold: "#997b44", goldDark: "#755a26", paper: "#ffffff", canvas: "#f8fafc", ink: "#0f172a", muted: "#64748b", border: "#e2e8f0" } },
  public: { source: "src/app/globals.css", values: { canvas: "#060504", surface: "#07090b", surfaceMuted: "#0c1116", header: "#070604", panel: "rgb(255 255 255 / 3.5%)", text: "#f8f3ea", muted: "#cbd5e1", gold: "#c79a52" } },
  typographyAndSpacing: { source: "tailwind.config.ts", fonts: { bodyAndDisplay: "IBM Plex Sans Arabic", labels: "Inter" }, scales: ["48px/60px", "32px/40px", "24px/32px", "16px/24px", "18px/28px", "12px/16px", "40px/52px", "24px/34px", "16px/26px", "13px/18px"], spacing: ["8px", "16px", "24px", "32px", "40px", "1200px"] },
  preservation: "Public gold and administration gold are distinct existing source tokens; this inventory does not unify them."
};
const byFile = new Map(inventory.componentUsageIndex.map((entry) => [entry.file, entry]));
const assertConnection = (component, consumer) => {
  const reachable = reverseReachability(path.join(root, component));
  if (!reachable.some((entry) => entry.file === consumer)) throw new Error(`Missing expected graph connection: ${consumer} -> ${component}`);
};
assertConnection("src/components/brand/kmt-brand-logo.tsx", "src/features/payments/consultation-payment-receipt-document.tsx");
assertConnection("src/features/payments/receipt-print-button.tsx", "src/features/payments/consultation-payment-receipt-document.tsx");
assertConnection("src/components/ui/button.tsx", "src/features/admin/content/content-forms.tsx");
assertConnection("src/components/ui/button.tsx", "src/features/public-site/public-pages.tsx");
for (const name of ["HomePageView", "BookConsultationPageView"]) {
  if (!byFile.get("src/features/public-site/public-pages.tsx")?.runtimeExports.includes(name)) throw new Error(`Missing runtime export: ${name}`);
}
if (!byFile.get("src/components/layout/public-shell.tsx")?.runtimeExports.includes("PublicShell")) throw new Error("Missing layout export: PublicShell");
if (inventory.routePageIndex.length !== 58 || inventory.componentUsageIndex.length !== 68) throw new Error("Inventory coverage count changed unexpectedly");
fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(`Validated ${inventory.routePageIndex.length} routes and ${inventory.componentUsageIndex.length} component sources.`);
