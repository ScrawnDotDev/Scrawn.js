const fs = require("fs");
const path = require("path");

const sourceRoot = path.join(__dirname, "..", "src", "gen");
const targetRoot = path.join(__dirname, "..", "dist", "gen");
const includeExtensions = new Set([".js", ".d.ts", ".json"]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(sourceDir, targetDir) {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(sourcePath, targetPath);
      continue;
    }

    if (includeExtensions.has(path.extname(entry.name))) {
      ensureDir(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

copyRecursive(sourceRoot, targetRoot);
