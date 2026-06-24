import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "stitch_kmt_legal_platform_ui_system");
const workspaceRoot = path.join(root, "_workspace", "stitch-clone");
const outputFile = path.join(root, "src", "app", "stitch-clone", "[screen-name]", "stitchScreens.tsx");
const assetManifestFile = path.join(root, "public", "stitch-assets", "manifest.json");

const screens = [
  ["kmt_legal_21", "home"],
  ["kmt_legal_20", "services"],
  ["kmt_legal_18", "service-corporate-contracts"],
  ["kmt_legal_1", "team"],
  ["._kmt_legal", "lawyer-profile-karim"],
  ["kmt_legal_22", "book-consultation"],
  ["kmt_legal_19", "case-studies"],
  ["kmt_legal_17", "case-study-commercial-dispute"],
  ["kmt_legal_16", "media"],
  ["kmt_legal_15", "articles"],
  ["kmt_legal_14", "contact"],
  ["kmt_legal_6", "login"],
  ["kmt_legal_13", "portal-dashboard"],
  ["kmt_legal_10", "portal-case-detail"],
  ["kmt_legal_11", "portal-documents"],
  ["kmt_legal_12", "portal-appointments"],
  ["kmt_legal_9", "admin-dashboard"],
  ["kmt_legal_5", "admin-clients"],
  ["kmt_legal_8", "admin-cases"],
  ["kmt_legal_7", "admin-case-detail"],
  ["kmt_legal_2", "admin-calendar"],
  ["kmt_legal_4", "admin-tasks"],
  ["kmt_legal_3", "admin-content-social"]
];

const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const assetManifest = fs.existsSync(assetManifestFile)
  ? JSON.parse(fs.readFileSync(assetManifestFile, "utf8"))
  : { assets: {} };

function readHtml(sourceId) {
  const htmlPath = path.join(sourceRoot, sourceId, "code.html");
  return fs.readFileSync(htmlPath, "utf8");
}

function extractTitle(html, fallback) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1]?.trim() || fallback);
}

function extractBodyClass(html) {
  const match = html.match(/<body\b([^>]*)>/i);
  return match?.[1]?.match(/\bclass="([^"]*)"/i)?.[1] || "";
}

function extractBody(html) {
  const match = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) {
    throw new Error("Could not find body element");
  }
  return match[1].trim();
}

function extractStyles(html) {
  const styles = [];
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html))) {
    styles.push(match[1].trim());
  }
  return styles.join("\n\n");
}

function localizeAssetUrls(markup) {
  return Object.entries(assetManifest.assets || {}).reduce((current, [remoteUrl, asset]) => {
    const publicPath = typeof asset === "string" ? asset : asset.publicPath;
    return publicPath ? current.replaceAll(remoteUrl, publicPath) : current;
  }, markup);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function camelCaseProperty(property) {
  const trimmed = property.trim();
  if (trimmed.startsWith("--")) {
    return JSON.stringify(trimmed);
  }
  return trimmed.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function styleStringToJsx(styleValue) {
  const declarations = styleValue
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const pairs = declarations.map((declaration) => {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) {
      return null;
    }
    const property = declaration.slice(0, colonIndex).trim();
    const value = decodeHtml(declaration.slice(colonIndex + 1).trim());
    return `${camelCaseProperty(property)}: ${JSON.stringify(value)}`;
  }).filter(Boolean);

  return `style={{ ${pairs.join(", ")} }}`;
}

function convertAttributes(markup) {
  return markup
    .replace(/\sclass=/g, " className=")
    .replace(/\sfor=/g, " htmlFor=")
    .replace(/\stabindex=/g, " tabIndex=")
    .replace(/\smaxlength=/g, " maxLength=")
    .replace(/\sminlength=/g, " minLength=")
    .replace(/\sreadonly=/g, " readOnly=")
    .replace(/\scolspan=/g, " colSpan=")
    .replace(/\srowspan=/g, " rowSpan=")
    .replace(/\sautocomplete=/g, " autoComplete=")
    .replace(/\sautofocus=/g, " autoFocus=")
    .replace(/\snovalidate=/g, " noValidate=")
    .replace(/\sstyle="([^"]*)"/g, (_, styleValue) => ` ${styleStringToJsx(styleValue)}`)
    .replace(/\s(rows|cols|size)="(\d+)"/g, " $1={$2}")
    .replace(/\s(required|checked|disabled|selected|multiple)=""/g, " $1");
}

function closeVoidTags(markup) {
  return markup.replace(/<([a-zA-Z][\w:-]*)([^<>]*?)(?<!\/)>/g, (full, tagName, attrs) => {
    const lower = tagName.toLowerCase();
    if (!voidTags.has(lower)) {
      return full;
    }
    return `<${tagName}${attrs} />`;
  });
}

function convertComments(markup) {
  return markup.replace(/<!--([\s\S]*?)-->/g, (_, comment) => `{/*${comment.replaceAll("*/", "* /")}*/}`);
}

function convertBodyScripts(markup) {
  return markup.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, attrs, scriptBody) => {
    return `<script${attrs} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(scriptBody)} }} />`;
  });
}

function convertToJsx(bodyHtml) {
  return closeVoidTags(convertAttributes(convertComments(convertBodyScripts(bodyHtml))));
}

function componentName(routeName) {
  return `Screen_${routeName.replace(/[^a-zA-Z0-9]+/g, "_")}`;
}

function writeWorkspaceFiles({ sourceId, routeName, html, title, bodyClass, styles }) {
  const folder = path.join(workspaceRoot, routeName);
  fs.mkdirSync(folder, { recursive: true });

  const sourceFolder = path.join(sourceRoot, sourceId);
  const htmlPath = path.join(sourceFolder, "code.html");
  const screenshotPath = path.join(sourceFolder, "screen.png");

  fs.writeFileSync(
    path.join(folder, "00_source-inventory.md"),
    `# ${routeName} Source Inventory

- Source id: \`${sourceId}\`
- Route: \`/stitch-clone/${routeName}\`
- Source HTML: \`${path.relative(root, htmlPath)}\`
- Exported CSS file: unavailable; inline \`<style>\` blocks are preserved in the generated component when present.
- Reference screenshot: \`${path.relative(root, screenshotPath)}\`
- Asset paths: original remote URLs are preserved as source inputs and rewritten to local \`public/stitch-assets/*\` files when \`public/stitch-assets/manifest.json\` exists.
- Fonts/icons: Google Fonts and Material Symbols links are provided by the app root layout.
- Source title: ${title}
- Source body class: \`${bodyClass || "(none)"}\`
- Target mobile viewport: \`390x844\`
- Target desktop viewport: \`1440x900\` if desktop reference exists.
- Source byte length: ${Buffer.byteLength(html, "utf8")}
`
  );

  fs.writeFileSync(
    path.join(folder, "01_conversion-log.md"),
    `# ${routeName} Conversion Log

- Converted \`${sourceId}/code.html\` into generated JSX component \`${componentName(routeName)}\`.
- Mechanical transforms only:
  - \`class\` -> \`className\`
  - \`for\` -> \`htmlFor\`
  - selected HTML attributes converted to JSX names
  - inline style strings converted to React style objects
  - HTML comments converted to JSX comments
  - void tags self-closed where needed
- DOM hierarchy and Tailwind classes are preserved from the source body.
`
  );

  fs.writeFileSync(
    path.join(folder, "02_css-assets-log.md"),
    `# ${routeName} CSS And Assets Log

- External exported CSS file: not present in Stitch source folder.
- Inline style blocks preserved: ${styles ? "yes" : "none found"}.
- Tailwind CDN script is not copied into the app; equivalent custom tokens are configured in \`tailwind.config.ts\` for production build.
- Remote Stitch image URLs are localized through \`public/stitch-assets/manifest.json\` when available.
- Material Symbols and IBM Plex Sans Arabic/Inter are loaded locally in \`src/app/layout.tsx\`.
`
  );

  fs.writeFileSync(
    path.join(folder, "03_playwright-screenshots.md"),
    `# ${routeName} Playwright Screenshots

Status: pending until \`npm run stitch:screenshots\` is executed.

Expected outputs:
- \`test-results/stitch-clone/${routeName}-mobile.png\`
- \`test-results/stitch-clone/${routeName}-desktop.png\` when desktop reference exists.
`
  );

  fs.writeFileSync(
    path.join(folder, "04_visual-diff-report.md"),
    `# ${routeName} Visual Diff Report

Status: pending Playwright screenshot comparison.

Review categories:
- font
- spacing
- card size
- border radius
- shadow
- background
- icon size
- alignment
- overflow
`
  );

  fs.writeFileSync(
    path.join(folder, "05_fix-log.md"),
    `# ${routeName} Fix Log

Status: no targeted visual fixes applied yet.

Only differences documented in \`04_visual-diff-report.md\` may be fixed here.
`
  );

  fs.writeFileSync(
    path.join(folder, "06_acceptance.md"),
    `# ${routeName} Acceptance

Status: pending screenshot evidence.

Acceptance requires:
- route renders without runtime error
- required screenshots captured
- visual differences documented
- targeted fixes applied only for documented differences
`
  );
}

const imports = `import type { JSX } from "react";\n\n`;
const componentBlocks = [];
const entries = [];
const names = [];

for (const [sourceId, routeName] of screens) {
  const html = readHtml(sourceId);
  const title = extractTitle(html, routeName);
  const bodyClass = extractBodyClass(html);
  const body = convertToJsx(localizeAssetUrls(extractBody(html)));
  const styles = localizeAssetUrls(extractStyles(html));
  const name = componentName(routeName);

  writeWorkspaceFiles({ sourceId, routeName, html, title, bodyClass, styles });

  componentBlocks.push(`function ${name}(): JSX.Element {
  return (
    <div className={${JSON.stringify(bodyClass || "stitch-clone-screen")}} data-stitch-source={${JSON.stringify(sourceId)}}>
      ${styles ? `<style dangerouslySetInnerHTML={{ __html: ${JSON.stringify(styles)} }} />` : ""}
      <>
${body.split("\n").map((line) => `        ${line}`).join("\n")}
      </>
    </div>
  );
}
`);

  entries.push(`  ${JSON.stringify(routeName)}: {
    sourceId: ${JSON.stringify(sourceId)},
    title: ${JSON.stringify(title)},
    Component: ${name}
  }`);
  names.push(routeName);
}

const output = `${imports}${componentBlocks.join("\n")}
export const stitchScreenNames = ${JSON.stringify(names, null, 2)} as const;

export const stitchScreens: Record<
  string,
  {
    sourceId: string;
    title: string;
    Component: () => JSX.Element;
  }
> = {
${entries.join(",\n")}
};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output);

console.log(`Generated ${screens.length} Stitch clone screens.`);
