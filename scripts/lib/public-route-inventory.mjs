import vm from "node:vm";
import ts from "typescript";

// Execute only the dispatcher, with inert view markers: no page rendering, imports,
// database calls or network access. Unknown new dispatcher dependencies fail closed.
// This consumes trusted repository code; Node vm is not a security boundary.
export async function deriveArabicPublicRoutes(source) {
  const ast = ts.createSourceFile("public-pages.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const dispatcher = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "renderPublicPath");
  if (!dispatcher) throw new Error("renderPublicPath dispatcher was not found");
  const sections = new Set();
  const views = new Set();
  function visit(node) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken && node.left.getText(ast) === "section" && ts.isStringLiteral(node.right)) sections.add(node.right.text);
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) views.add(node.tagName.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(dispatcher);
  const context = { exports: {}, notFound() { throw new Error("INVENTORY_NOT_FOUND"); },
    renderElement(view, props) { return { view, props }; } };
  for (const view of views) context[view] = view;
  const compiled = ts.transpileModule(dispatcher.getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, jsxFactory: "renderElement" }
  }).outputText;
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  const candidates = [[], ...[...sections].flatMap(section => [[section], [section, "__inventory_slug__"]])];
  const routes = [];
  for (const segments of candidates) {
    try {
      const result = await context.exports.renderPublicPath("ar", segments);
      if (!result?.view) throw new Error("Dispatcher did not return a supported view");
      routes.push({ pattern: "/ar" + (segments.length ? "/" + segments.map(segment => segment === "__inventory_slug__" ? "[slug]" : segment).join("/") : ""), view: result.view });
    } catch (error) {
      if (error.message !== "INVENTORY_NOT_FOUND") throw error;
    }
  }
  return routes.sort((a, b) => a.pattern.localeCompare(b.pattern));
}

export function missingArabicRoutes(before, after) {
  const current = new Set(after.map(route => route.pattern));
  return before.filter(route => !current.has(route.pattern)).map(route => route.pattern);
}
