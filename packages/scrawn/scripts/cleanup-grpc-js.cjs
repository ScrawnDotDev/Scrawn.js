const fs = require("fs");
const path = require("path");

const genRoot = path.join(__dirname, "..", "src", "gen");

function deleteGrpcJs(dirPath) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      deleteGrpcJs(fullPath);
    } else if (entry.name.endsWith("_grpc_pb.js")) {
      fs.rmSync(fullPath, { force: true });
    }
  }
}

if (fs.existsSync(genRoot)) {
  deleteGrpcJs(genRoot);
}
