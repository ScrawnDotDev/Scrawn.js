import { FieldRef } from "../fieldRef.ts";
import { BaseDataBuilder } from "./base.ts";
import { callDataQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { DataQueryResult } from "./types.ts";

class UsersFields {
  id = new FieldRef<string>("id");
  last_billed_timestamp = new FieldRef<string>("last_billed_timestamp");
  payment_provider_user_id = new FieldRef<string>("payment_provider_user_id");
  mode = new FieldRef<string>("mode");
}

export class UsersBuilder extends BaseDataBuilder<UsersFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new UsersFields(), "users");
  }

  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "users", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

class SessionsFields {
  id = new FieldRef<string>("id");
  session_id = new FieldRef<string>("session_id");
  user_id = new FieldRef<string>("user_id");
  processed = new FieldRef<string>("processed");
  billed_upto = new FieldRef<string>("billed_upto");
  created_at = new FieldRef<string>("created_at");
  mode = new FieldRef<string>("mode");
}

export class SessionsBuilder extends BaseDataBuilder<SessionsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new SessionsFields(), "sessions");
  }

  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "sessions", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

class TagsFields {
  id = new FieldRef<string>("id");
  key = new FieldRef<string>("key");
  amount = new FieldRef<number>("amount");
}

export class TagsBuilder extends BaseDataBuilder<TagsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new TagsFields(), "tags");
  }

  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "tags", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

class ExpressionsFields {
  id = new FieldRef<string>("id");
  key = new FieldRef<string>("key");
  expr = new FieldRef<string>("expr");
}

export class ExpressionsBuilder extends BaseDataBuilder<ExpressionsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new ExpressionsFields(), "expressions");
  }

  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "expressions", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

class MetadataFields {
  id = new FieldRef<string>("id");
  payment_cron = new FieldRef<string>("payment_cron");
  payment_webhook = new FieldRef<string>("payment_webhook");
}

export class MetadataBuilder extends BaseDataBuilder<MetadataFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(new MetadataFields(), "metadata");
  }

  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "metadata", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}
