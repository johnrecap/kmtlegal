import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { deriveArabicPublicRoutes } from "./lib/public-route-inventory.mjs";

// Source discovery only: expressions are retained, never executed as application code.
const root = process.cwd();
const output = process.argv[2] || "docs/reviews/2026-09-11/surface-inventory.json";
const baseline = process.argv.includes("--baseline");
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
const changed = new Set(baseline ? git(["diff", "HEAD", "--name-only", "--", "src"]).trim().split(/\r?\n/) : []);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|mjs)$/.test(entry.name)) files.push(full);
  }
}
if (baseline) files.push(...git(["ls-tree", "-r", "--name-only", "HEAD", "--", "src"]).trim().split(/\r?\n/).filter(p => /\.(tsx?|mjs)$/.test(p)).map(p => path.join(root, p)));
else walk(path.join(root, "src"));
const records = files.sort().map(full => {
  const file = path.relative(root, full).replaceAll("\\", "/");
  const source = baseline && changed.has(file) ? git(["show", `HEAD:${file}`]) : fs.readFileSync(full, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const links = [], contentSlugs = [], actions = [], controls = [], calls = [], imports = [], methods = [];
  const location = node => ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
  function visit(node) {
    if (ts.isImportDeclaration(node)) imports.push(node.moduleSpecifier.text);
    if (file.startsWith("src/content/") && ts.isPropertyAssignment(node) && node.name.getText(ast) === "slug" && ts.isStringLiteral(node.initializer)) {
      let parent = node.parent;
      while (parent && !ts.isVariableDeclaration(parent)) parent = parent.parent;
      const collection = parent?.name.getText(ast) || "unknown";
      const section = { lawyers: "team", articles: "articles", caseStudies: "case-studies", publicLegalServicesAr: "services", publicLegalServicesEn: "services" }[collection];
      const locale = collection.endsWith("Ar") || file.endsWith(".ar.ts") ? "ar" : "en";
      contentSlugs.push({ line: location(node), slug: node.initializer.text, collection, locale,
        href: section ? `${locale === "ar" ? "/ar" : ""}/${section}/${node.initializer.text}` : null,
        evidence: "source-content-url-not-live-database-enumeration" });
    }
    if (ts.isPropertyAssignment(node) && /^(href|actionHref|apiPath|consumerHref)$/.test(node.name.getText(ast).replaceAll(/["']/g, ""))) {
      links.push({ line: location(node), attribute: node.name.getText(ast), expression: node.initializer.getText(ast) });
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (/^(button|Button|a|Link|form|input|TextInput|select|textarea)$/.test(tag)) {
        controls.push({ line: location(node), tag, attributes: node.attributes.getText(ast) });
      }
    }
    if (ts.isFunctionDeclaration(node) && /^(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)$/.test(node.name?.text || "")) methods.push(node.name.text);
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(ast);
      const entry = { line: location(node), attribute: name, expression: node.initializer?.getText(ast) || "true" };
      if (name === "href") links.push(entry);
      if (/^on(Click|Submit|Change|KeyDown)$/.test(name) || name === "action" || name === "formAction") actions.push(entry);
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(ast);
      if (/fetch$|router\.(push|replace)|redirect$|require.*Auth|assert.*Access|hasPermission/.test(callee)) {
        calls.push({ line: location(node), callee, arguments: node.arguments.map(arg => arg.getText(ast)) });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const route = /\/(page\.tsx|route\.ts)$/.test(file)
    ? "/" + file.replace(/^src\/app\//, "").split("/").slice(0, -1).filter(part => !/^\(.*\)$/.test(part)).join("/")
    : null;
  return { file, route, methods, imports, links, contentSlugs, actions, controls, calls, evidence: "source-discovery-only" };
});
const dispatcherFile = "src/features/public-site/public-pages.tsx";
const dispatcherSource = baseline ? git(["show", `HEAD:${dispatcherFile}`]) : fs.readFileSync(dispatcherFile, "utf8");
const arabicRoutes = await deriveArabicPublicRoutes(dispatcherSource);
const result = {
  date: "2026-09-11",
  revision: baseline ? git(["rev-parse", "HEAD"]).trim() : "working-tree",
  limitations: "Not runtime verification or an authorization proof. Dynamic IDs/slugs are route patterns, not a count of live pages. JSX expressions and call arguments require consumer/service review. Arabic patterns checked against renderPublicPath; database content is not enumerated.",
  counts: { pageFiles: records.filter(r => r.file.endsWith("/page.tsx")).length, apiRouteFiles: records.filter(r => r.file.startsWith("src/app/api/") && r.file.endsWith("/route.ts")).length, apiOperations: records.filter(r => r.file.startsWith("src/app/api/")).reduce((sum, r) => sum + r.methods.length, 0), sourceFiles: records.length },
  arabicCatchAll: { source: dispatcherFile, evidence: "dispatcher-executed-with-inert-views", patterns: arabicRoutes.map(route => route.pattern), routes: arabicRoutes },
  records
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
const beforePath = path.join(path.dirname(output), "surface-before.json");
if (!baseline && fs.existsSync(beforePath)) {
  const before = JSON.parse(fs.readFileSync(beforePath, "utf8"));
  const select = data => ({
    arabicPatterns: data.arabicCatchAll.patterns,
    files: data.records.map(r => r.file),
    routes: data.records.filter(r => r.route).map(r => `${r.file}: ${r.route}`),
    links: data.records.flatMap(r => r.links.map(link => `${r.file}: ${link.attribute}=${link.expression}`)),
    contentSlugs: data.records.flatMap(r => r.contentSlugs.map(entry => `${r.file}: ${entry.slug}`))
  });
  const previous = select(before), current = select(result);
  const comparison = { baseline: before.revision, scope: "Static source comparison; runtime/database-populated URLs remain unverified.", before: before.counts, after: result.counts, changes: {} };
  for (const key of Object.keys(previous)) comparison.changes[key] = {
    removed: previous[key].filter(value => !current[key].includes(value)),
    added: current[key].filter(value => !previous[key].includes(value))
  };
  fs.writeFileSync(path.join(path.dirname(output), "surface-comparison.json"), JSON.stringify(comparison, null, 2) + "\n");
}
console.log(JSON.stringify(result.counts));
