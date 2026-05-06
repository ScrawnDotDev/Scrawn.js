const fs = require("fs");
const path = require("path");

const genRoot = path.join(__dirname, "..", "src", "gen");
const removeNames = new Set([
  "auth_connect.ts",
  "event_connect.ts",
  "payment_connect.ts",
  "auth_pb.ts",
  "event_pb.ts",
  "payment_pb.ts",
]);

function cleanup(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      cleanup(entryPath);
      continue;
    }

    if (removeNames.has(entry.name)) {
      fs.rmSync(entryPath, { force: true });
    }
  }
}

cleanup(genRoot);
