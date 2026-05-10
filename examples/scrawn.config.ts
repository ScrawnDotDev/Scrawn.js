import { scrawnConfig } from "@scrawn/core";

export default scrawnConfig({
  apiKey: process.env.SCRAWN_KEY!,
  grpcUrl: process.env.SCRAWN_BASE_URL || "http://localhost:8069",
  httpUrl: process.env.SCRAWN_HTTP_URL || "http://localhost:8070",
  directory: "scrawn",
});
