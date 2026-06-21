const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { transformSync } = require("@babel/core");

const rootDir = path.resolve(__dirname, "..");
const moduleCache = new Map();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function loadSourceModule(relativePath) {
  const fullPath = path.resolve(rootDir, relativePath);
  if (moduleCache.has(fullPath)) {
    return moduleCache.get(fullPath).exports;
  }

  const module = { exports: {} };
  moduleCache.set(fullPath, module);

  const code = fs.readFileSync(fullPath, "utf8");
  const transformed = transformSync(code, {
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-env", { modules: "commonjs", targets: { node: "current" } }]],
    filename: fullPath,
  }).code;

  const localRequire = (request) => {
    if (request.startsWith(".")) {
      const resolved = path.resolve(path.dirname(fullPath), request);
      const withExtension = path.extname(resolved) ? resolved : `${resolved}.js`;
      return loadSourceModule(path.relative(rootDir, withExtension));
    }
    return require(request);
  };

  const fn = new Function("require", "module", "exports", "__filename", "__dirname", transformed);
  fn(localRequire, module, module.exports, fullPath, path.dirname(fullPath));
  return module.exports;
}

function assertVersionsSynced() {
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");
  const manifest = readJson("public/manifest.json");
  const readmes = ["README.md", "README.zh-CN.md", "README.zh-TW.md"];

  assert.strictEqual(lock.version, pkg.version, "package-lock version must match package.json");
  assert.strictEqual(lock.packages[""].version, pkg.version, "package-lock root package version must match package.json");
  assert.strictEqual(manifest.version, pkg.version, "manifest version must match package.json");

  for (const file of readmes) {
    const text = fs.readFileSync(path.join(rootDir, file), "utf8");
    assert(text.includes(`version-${pkg.version}-2ea44f`), `${file} badge must match package.json version`);
  }
}

function shouldCheckTextFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).toLowerCase();
  const textExtensions = new Set([
    ".js",
    ".json",
    ".md",
    ".html",
    ".css",
    ".txt",
    ".editorconfig",
    ".gitattributes",
    ".gitignore",
  ]);

  return textExtensions.has(ext) || textExtensions.has(base) || base === "license";
}

function listProjectTextFiles() {
  const output = execSync("git ls-files --cached --others --exclude-standard", {
    cwd: rootDir,
    encoding: "utf8",
  });

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(shouldCheckTextFile);
}

function assertCleanTextEncoding() {
  for (const file of listProjectTextFiles()) {
    const bytes = fs.readFileSync(path.join(rootDir, file));
    if (bytes.includes(0)) {
      continue;
    }
    assert(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), `${file} must not start with UTF-8 BOM`);
    assert(!bytes.toString("utf8").includes("\r\n"), `${file} must use LF line endings`);
  }
}

function assertExclusionMatcher() {
  const { matchesExcludePattern } = loadSourceModule("src/util/exclusion_matcher.js");

  assert.strictEqual(matchesExcludePattern("https://mail.google.com/inbox", "mail.google.com"), true);
  assert.strictEqual(matchesExcludePattern("https://accounts.google.com/signin", "*.google.com"), true);
  assert.strictEqual(matchesExcludePattern("https://github.com/settings/profile", "*.github.com/settings/*"), true);
  assert.strictEqual(matchesExcludePattern("https://github.com/Will-being/MouseTransLite", "*.github.com/settings/*"), false);
  assert.strictEqual(matchesExcludePattern("https://example.com/path", ""), false);
}

function assertTooltipRenderer() {
  global.document = {
    createElement() {
      return {
        set textContent(value) {
          this._text = String(value);
          this.innerHTML = this._text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;");
        },
        get textContent() {
          return this._text || "";
        },
        innerHTML: "",
      };
    },
  };

  const { buildTooltipContent, emptyClientRect } = loadSourceModule("src/tooltip/tooltip_renderer.js");
  const html = buildTooltipContent(
    { targetText: "<translated>", transliteration: "sound", dict: "noun: x", targetLang: "ar" },
    "<source>"
  );

  assert(html.includes('dir="rtl"'), "Arabic tooltip content should be rtl");
  assert(html.includes("&lt;source&gt;"), "source text should be escaped");
  assert(html.includes("&lt;translated&gt;"), "target text should be escaped");
  assert.deepStrictEqual(emptyClientRect(), { width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 });

  delete global.document;
}

assertVersionsSynced();
assertCleanTextEncoding();
assertExclusionMatcher();
assertTooltipRenderer();
console.log("Project checks passed");
