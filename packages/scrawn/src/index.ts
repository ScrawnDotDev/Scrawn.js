export * from "./core/scrawn.js";
export * from "./core/types/event.js";
export * from "./core/types/auth.js";

// Export error classes for user error handling
export * from "./core/errors/index.js";

// Export gRPC client abstraction layer
export * from "./core/grpc/index.js";

// Export pricing DSL for building complex billing expressions
export * from "./core/pricing/index.js";

// Export utilities
export { matchPath } from "./utils/pathMatcher.js";

// Export generated types for advanced usage
export * from "./gen/event/v1/event_grpc_pb.js";
export * from "./gen/event/v1/event_pb.js";
export * from "./gen/auth/v1/auth_grpc_pb.js";
export * from "./gen/auth/v1/auth_pb.js";
export * from "./gen/payment/v1/payment_grpc_pb.js";
export * from "./gen/payment/v1/payment_pb.js";

// Export central configuration
export { ScrawnConfig, scrawnConfig } from "./config.js";
export type { ScrawnCLIConfig } from "./config.js";
