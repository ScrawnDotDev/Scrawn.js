const { execFileSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const protoDir = path.join(root, "proto");

execFileSync("bunx", ["buf", "generate"], {
  cwd: protoDir,
  stdio: "inherit",
  shell: true,
});

execFileSync(
  "bunx",
  [
    "grpc_tools_node_protoc",
    "--js_out=import_style=commonjs,binary:../src/gen",
    "auth/v1/auth.proto",
    "event/v1/event.proto",
    "payment/v1/payment.proto",
  ],
  {
    cwd: protoDir,
    stdio: "inherit",
    shell: true,
  }
);

require("./cleanup-generated.cjs");
