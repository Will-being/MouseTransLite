const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgPath = path.join(rootDir, "package.json");
const lockPath = path.join(rootDir, "package-lock.json");
const manifestPath = path.join(rootDir, "public", "manifest.json");
const readmePaths = ["README.md", "README.zh-CN.md", "README.zh-TW.md"].map((file) => path.join(rootDir, file));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function syncVersionBadge(text, version) {
  return text.replace(/version-\d+\.\d+\.\d+-2ea44f/g, `version-${version}-2ea44f`);
}

const pkg = readJson(pkgPath);
const version = pkg.version;

const lock = readJson(lockPath);
lock.version = version;
if (lock.packages && lock.packages[""]) {
  lock.packages[""].version = version;
}
writeJson(lockPath, lock);

const manifest = readJson(manifestPath);
manifest.version = version;
writeJson(manifestPath, manifest);

for (const readmePath of readmePaths) {
  const text = fs.readFileSync(readmePath, "utf8");
  const nextText = syncVersionBadge(text, version);
  if (nextText !== text) {
    fs.writeFileSync(readmePath, nextText, "utf8");
  }
}

console.log(`Synced project version to ${version}`);
