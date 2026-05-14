import type { GrpcClient } from "@scrawn/core";

import { QueryServiceClient } from "../gen/query/v1/query_grpc_pb.js";
import type { QueryEventsResponse } from "../gen/query/v1/query_pb.js";
import { DataQueryServiceClient } from "../gen/data/v1/data_grpc_pb.js";
import type { QueryResponse } from "../gen/data/v1/data_pb.js";

import type {
  FilterGroup,
  Aggregation,
  OrderBy,
} from "../operators.ts";

type AnyProtoMsg = {
  setField?: (v: string) => void;
  setOperator?: (v: number) => void;
  setValue?: (v: string) => void;
  setLogical?: (v: number) => void;
  setConditionsList?: (v: unknown[]) => void;
  setGroupsList?: (v: unknown[]) => void;
  setType?: (v: number) => void;
  setDescending?: (v: boolean) => void;
};

function operatorToProto(op: string): number {
  switch (op) {
    case "EQ": return 1;
    case "GT": return 2;
    case "GTE": return 3;
    case "LT": return 4;
    case "LTE": return 5;
    case "NEQ": return 6;
    case "CONTAINS": return 7;
    default: return 0;
  }
}

function createFilterCondition(
  field: string,
  operator: string,
  value: string,
): AnyProtoMsg {
  const c: AnyProtoMsg = {};
  c.setField = (v) => { (c as Record<string, unknown>).field_ = v; };
  c.setOperator = (v) => { (c as Record<string, unknown>).operator_ = v; };
  c.setValue = (v) => { (c as Record<string, unknown>).value_ = v; };
  c.setField?.(field);
  c.setOperator?.(operatorToProto(operator));
  c.setValue?.(value);
  return c;
}

function buildFilterGroup(group: FilterGroup): AnyProtoMsg {
  const fg: AnyProtoMsg = {};
  fg.setLogical = (v) => { (fg as Record<string, unknown>).logical_ = v; };
  fg.setLogical?.(group.logical === "AND" ? 1 : 2);

  fg.setConditionsList = (v) => { (fg as Record<string, unknown>).conditions_ = v; };
  fg.setGroupsList = (v) => { (fg as Record<string, unknown>).groups_ = v; };
  fg.setConditionsList?.(group.conditions.map((c) =>
    createFilterCondition(c.field, c.operator, c.value),
  ));
  fg.setGroupsList?.(group.groups.map(buildFilterGroup));
  return fg;
}

function normalize(obj: AnyProtoMsg): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key.endsWith("_") && val !== undefined) {
      out[key.slice(0, -1)] = val;
    }
  }
  return out;
}

function buildQueryEventsPayload(params: {
  where?: FilterGroup;
  aggregation?: Aggregation;
  groupBy?: string;
  limit?: number;
  offset?: number;
  orderBy?: OrderBy[];
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (params.where) {
    payload.where = normalize(buildFilterGroup(params.where));
  }

  if (params.aggregation) {
    payload.aggregation = {
      type: params.aggregation.type === "SUM" ? 1 : 2,
      field: params.aggregation.field ?? "",
    };
  }

  if (params.groupBy) {
    payload.group_by = { field: params.groupBy };
  }

  payload.limit = params.limit ?? 100;
  payload.offset = params.offset ?? 0;

  if (params.orderBy && params.orderBy.length > 0) {
    payload.order_by_list = params.orderBy.map((o) => ({
      field: o.field,
      descending: o.descending,
    }));
  }

  return payload;
}

function buildDataQueryPayload(
  tableName: string,
  params: {
    where?: FilterGroup;
    limit?: number;
    offset?: number;
    orderBy?: OrderBy[];
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = { table: tableName };

  if (params.where) {
    payload.where = normalize(buildFilterGroup(params.where));
  }

  payload.limit = params.limit ?? 100;
  payload.offset = params.offset ?? 0;

  if (params.orderBy && params.orderBy.length > 0) {
    payload.order_by_list = params.orderBy.map((o) => ({
      field: o.field,
      descending: o.descending,
    }));
  }

  return payload;
}

export async function callEventQuery(
  grpc: GrpcClient,
  params: {
    where?: FilterGroup;
    aggregation?: Aggregation;
    groupBy?: string;
    limit?: number;
    offset?: number;
    orderBy?: OrderBy[];
  }
): Promise<QueryEventsResponse.AsObject> {
  const payload = buildQueryEventsPayload(params);
  const res = await grpc
    .newCall(QueryServiceClient, "queryEvents")
    .addPayload(payload)
    .request<QueryEventsResponse>();
  return res.toObject();
}

export async function callDataQuery(
  grpc: GrpcClient,
  tableName: string,
  params: {
    where?: FilterGroup;
    limit?: number;
    offset?: number;
    orderBy?: OrderBy[];
  }
): Promise<QueryResponse.AsObject> {
  const payload = buildDataQueryPayload(tableName, params);
  const res = await grpc
    .newCall(DataQueryServiceClient, "query")
    .addPayload(payload)
    .request<QueryResponse>();
  return res.toObject();
}



