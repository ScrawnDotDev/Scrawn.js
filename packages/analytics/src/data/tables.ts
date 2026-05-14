import { BaseDataBuilder } from "./base.ts";
import { callDataQuery } from "../grpc/client.ts";
import type { GrpcClient } from "@scrawn/core";
import type { DataQueryResult } from "./types.ts";
import {
  usersFields,
  sessionsFields,
  tagsFields,
  expressionsFields,
  metadataFields,
} from "./fields.ts";

export class UsersBuilder extends BaseDataBuilder<typeof usersFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(usersFields, "users");
  }
  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "users", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

export class SessionsBuilder extends BaseDataBuilder<typeof sessionsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(sessionsFields, "sessions");
  }
  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "sessions", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

export class TagsBuilder extends BaseDataBuilder<typeof tagsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(tagsFields, "tags");
  }
  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "tags", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

export class ExpressionsBuilder extends BaseDataBuilder<typeof expressionsFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(expressionsFields, "expressions");
  }
  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "expressions", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}

export class MetadataBuilder extends BaseDataBuilder<typeof metadataFields> {
  constructor(private grpc: GrpcClient, private apiKey: string) {
    super(metadataFields, "metadata");
  }
  async execute(): Promise<DataQueryResult> {
    const params = this.buildParams();
    const res = await callDataQuery(this.grpc, this.apiKey, "metadata", params);
    return { columns: res.columnsList ?? [], rows: (res.rowsList ?? []).map((r: { valuesList?: string[] }) => r.valuesList ?? []), total: res.total ?? 0 };
  }
}
