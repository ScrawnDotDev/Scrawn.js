const fs = require("fs");
const path = require("path");

const sourceRoot = path.join(__dirname, "..", "src", "gen");
const targetRoot = path.join(__dirname, "..", "dist", "gen");
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

    const ext = path.extname(entry.name);
    if (
      ext === ".js" ||
      ext === ".json" ||
      entry.name.endsWith(".d.ts")
    ) {
      ensureDir(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

copyRecursive(sourceRoot, targetRoot);
