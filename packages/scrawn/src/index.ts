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
export {
  EventServiceClient,
  EventType,
  BasicUsageType,
} from "./gen/event/v1/event.js";
export type {
  StreamEventResponse,
  RegisterEventRequest,
  RegisterEventResponse,
  StreamEventRequest,
  BasicUsage,
  AITokenUsage,
} from "./gen/event/v1/event.js";
export type {
  CreateAPIKeyRequest,
  CreateAPIKeyResponse,
} from "./gen/auth/v1/auth.js";
export {
  PaymentServiceClient,
  CreateCheckoutLinkRequest,
  CreateCheckoutLinkResponse,
} from "./gen/payment/v1/payment.js";
export { QueryServiceClient } from "./gen/query/v1/query.js";
export type {
  QueryEventsRequest,
  QueryEventsResponse,
  EventRow,
  AggregationRow,
  FilterCondition as QueryFilterCondition,
  FilterGroup as QueryFilterGroup,
  Aggregation as QueryAggregation,
  GroupBy as QueryGroupBy,
} from "./gen/query/v1/query.js";
export { DataQueryServiceClient } from "./gen/data/v1/data.js";
export type {
  QueryRequest,
  QueryResponse,
  Row,
  FilterCondition as DataFilterCondition,
  FilterGroup as DataFilterGroup,
  OrderBy as DataOrderBy,
} from "./gen/data/v1/data.js";

// Export central configuration
export { ScrawnConfig, scrawnConfig } from "./config.js";
export type { ScrawnCLIConfig } from "./config.js";

// Export AI SDK wrapper types
export type {
  BillableAIOptions,
  BillableCallParams,
  LanguageModelUsage,
  ModelInfo,
  WithUserId,
} from "./core/ai/types.ts";
