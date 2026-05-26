import type { GrpcClient } from "@scrawn/core";

import {
  QueryServiceClient,
} from "@scrawn/core";
import type {
  QueryEventsRequest,
  QueryEventsResponse,
  QueryFilterGroup as QFilterGroup,
  QueryFilterCondition as QFilterCondition,
  QueryAggregation as Aggregation,
  QueryGroupBy as GroupBy,
} from "@scrawn/core";

import {
  DataQueryServiceClient,
} from "@scrawn/core";
import type {
  QueryRequest,
  QueryResponse,
  DataFilterGroup as DFilterGroup,
  DataFilterCondition as DFilterCondition,
  DataOrderBy as DOrderBy,
} from "@scrawn/core";

import type {
  FilterGroup,
  Aggregation as AggType,
  OrderBy as OrderByType,
} from "../operators.js";

function opQuery(op: string): number {
  switch (op) {
    case "EQ": return 1; case "GT": return 2; case "GTE": return 3;
    case "LT": return 4; case "LTE": return 5; case "NEQ": return 6;
    default: return 0;
  }
}

function buildQueryGroup(group: FilterGroup): QFilterGroup {
  return {
    logical: group.logical === "AND" ? 1 : 2,
    conditions: group.conditions.map((c) => ({
      field: c.field,
      operator: opQuery(c.operator),
      value: c.value,
    })),
    groups: group.groups.map(buildQueryGroup),
  };
}

function buildDataGroup(group: FilterGroup): DFilterGroup {
  return {
    logical: group.logical === "AND" ? 1 : 2,
    conditions: group.conditions.map((c) => ({
      field: c.field,
      operator: opQuery(c.operator),
      value: c.value,
    })),
    groups: group.groups.map(buildDataGroup),
  };
}

export async function callEventQuery(
  grpc: GrpcClient,
  apiKey: string,
  params: { where?: FilterGroup; aggregation?: AggType; groupBy?: string; limit?: number; offset?: number },
): Promise<QueryEventsResponse> {
  const req: QueryEventsRequest = {
    where: params.where ? buildQueryGroup(params.where) : undefined,
    aggregation: params.aggregation
      ? { type: params.aggregation.type === "SUM" ? 1 : 2, field: params.aggregation.field ?? "" }
      : undefined,
    groupBy: params.groupBy ? { field: params.groupBy } : undefined,
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
  };

  const res = await grpc
    .newCall(QueryServiceClient, "queryEvents")
    .addMetadata("authorization", `Bearer ${apiKey}`)
    .addPayload(req)
    .request<QueryEventsResponse>();
  return res;
}

export async function callDataQuery(
  grpc: GrpcClient,
  apiKey: string,
  tableName: string,
  params: { where?: FilterGroup; limit?: number; offset?: number; orderBy?: OrderByType[] },
): Promise<QueryResponse> {
  const req: QueryRequest = {
    table: tableName,
    where: params.where ? buildDataGroup(params.where) : undefined,
    orderBy: params.orderBy?.map((o) => ({
      field: o.field,
      descending: o.descending,
    })) ?? [],
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
  };

  const res = await grpc
    .newCall(DataQueryServiceClient, "query")
    .addMetadata("authorization", `Bearer ${apiKey}`)
    .addPayload(req)
    .request<QueryResponse>();
  return res;
}
