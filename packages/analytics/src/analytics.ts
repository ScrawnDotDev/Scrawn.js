import type { Scrawn } from "@scrawn/core";
import type { GrpcClient } from "@scrawn/core";
import { SdkEventBuilder } from "./query/sdkEvent.ts";
import { AiTokenBuilder } from "./query/aiToken.ts";
import { PaymentBuilder } from "./query/payment.ts";
import {
  UsersBuilder,
  SessionsBuilder,
  TagsBuilder,
  ExpressionsBuilder,
  MetadataBuilder,
} from "./data/tables.ts";

/**
 * Query interface for event analytics.
 * Each builder is pre-scoped to the correct event type.
 */
export interface EventQueries {
  sdkEvent: SdkEventBuilder;
  aiToken: AiTokenBuilder;
  payment: PaymentBuilder;
}

/**
 * Query interface for administrative data.
 * Each builder targets a specific table.
 */
export interface DataQueries {
  users: UsersBuilder;
  sessions: SessionsBuilder;
  tags: TagsBuilder;
  expressions: ExpressionsBuilder;
  metadata: MetadataBuilder;
}

/**
 * Analytics client for the Scrawn platform.
 *
 * Provides MongoDB/drizzle-style query builders for event analytics
 * and administrative data lookups, backed by the Scrawn gRPC API.
 *
 * @example
 * ```typescript
 * import { Analytics, eq, gt, and, desc } from "@scrawn/analytics";
 * import { biller } from "./scrawn/biller";
 *
 * const analytics = new Analytics(biller);
 *
 * // Query SDK events
 * const events = await analytics.query.sdkEvent
 *   .where(and(
 *     eq(analytics.query.sdkEvent.fields.sdkCallType, "RAW"),
 *     gt(analytics.query.sdkEvent.fields.debitAmount, 100),
 *   ))
 *   .orderBy(desc(analytics.query.sdkEvent.fields.reportedTimestamp))
 *   .limit(10)
 *   .execute();
 *
 * // Query user data
 * const users = await analytics.data.users
 *   .where(eq(analytics.data.users.fields.mode, "production"))
 *   .limit(10)
 *   .execute();
 * ```
 */
export class Analytics {
  private grpc: GrpcClient;

  /** Event query builders */
  public readonly query: EventQueries;

  /** Data query builders */
  public readonly data: DataQueries;

  constructor(biller: Scrawn<string, string>) {
    this.grpc = (biller as { grpc: GrpcClient }).grpc;
    const apiKey = biller.apikey;

    this.query = {
      sdkEvent: new SdkEventBuilder(this.grpc, apiKey),
      aiToken: new AiTokenBuilder(this.grpc, apiKey),
      payment: new PaymentBuilder(this.grpc, apiKey),
    };

    this.data = {
      users: new UsersBuilder(this.grpc, apiKey),
      sessions: new SessionsBuilder(this.grpc, apiKey),
      tags: new TagsBuilder(this.grpc, apiKey),
      expressions: new ExpressionsBuilder(this.grpc, apiKey),
      metadata: new MetadataBuilder(this.grpc, apiKey),
    };
  }
}



