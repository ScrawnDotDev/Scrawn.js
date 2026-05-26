const fs = require("fs");
const path = require("path");

const genRoot = path.join(__dirname, "..", "src", "gen");

const removeSuffixes = ["_grpc_pb.js", "_pb.d.ts"];

function clean(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      clean(fullPath);
    } else if (removeSuffixes.some((s) => entry.name.endsWith(s))) {
      fs.rmSync(fullPath, { force: true });
    }
  }
}

if (fs.existsSync(genRoot)) {
  clean(genRoot);
}
