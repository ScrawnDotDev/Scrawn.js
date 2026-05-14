import type { GrpcClient } from "@scrawn/core";

import {
  QueryServiceClient,
  QueryEventsRequest,
  QueryEventsResponse,
  FilterGroup as QFilterGroup,
  FilterCondition as QFilterCondition,
  Aggregation,
  GroupBy,
} from "@scrawn/core";

import {
  DataQueryServiceClient,
  QueryRequest,
  QueryResponse,
  FilterGroup as DFilterGroup,
  FilterCondition as DFilterCondition,
  OrderBy as DOrderBy,
} from "@scrawn/core";

import type {
  FilterGroup,
  Aggregation as AggType,
  OrderBy as OrderByType,
} from "../operators.ts";

function opQuery(op: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  switch (op) {
    case "EQ": return 1; case "GT": return 2; case "GTE": return 3;
    case "LT": return 4; case "LTE": return 5; case "NEQ": return 6;
    default: return 0;
  }
}

function buildQueryGroup(group: FilterGroup): QFilterGroup {
  const fg = new QFilterGroup();
  fg.setLogical(group.logical === "AND" ? 1 : 2);
  fg.setConditionsList(group.conditions.map((c) => {
    const fc = new QFilterCondition();
    fc.setField(c.field);
    fc.setOperator(opQuery(c.operator));
    fc.setValue(c.value);
    return fc;
  }));
  fg.setGroupsList(group.groups.map(buildQueryGroup));
  return fg;
}

function buildDataGroup(group: FilterGroup): DFilterGroup {
  const fg = new DFilterGroup();
  fg.setLogical(group.logical === "AND" ? 1 : 2);
  fg.setConditionsList(group.conditions.map((c) => {
    const fc = new DFilterCondition();
    fc.setField(c.field);
    fc.setOperator(opQuery(c.operator));
    fc.setValue(c.value);
    return fc;
  }));
  fg.setGroupsList(group.groups.map(buildDataGroup));
  return fg;
}

export async function callEventQuery(
  grpc: GrpcClient,
  params: { where?: FilterGroup; aggregation?: AggType; groupBy?: string; limit?: number; offset?: number },
): Promise<QueryEventsResponse.AsObject> {
  const req = new QueryEventsRequest();
  if (params.where) req.setWhere(buildQueryGroup(params.where));
  if (params.aggregation) {
    const a = new Aggregation();
    a.setType(params.aggregation.type === "SUM" ? 1 : 2);
    if (params.aggregation.field) a.setField(params.aggregation.field);
    req.setAggregation(a);
  }
  if (params.groupBy) {
    const gb = new GroupBy();
    gb.setField(params.groupBy);
    req.setGroupBy(gb);
  }
  req.setLimit(params.limit ?? 100);
  req.setOffset(params.offset ?? 0);

  const res = await grpc.newCall(QueryServiceClient, "queryEvents").addPayload(req).request<QueryEventsResponse>();
  return res.toObject();
}

export async function callDataQuery(
  grpc: GrpcClient,
  tableName: string,
  params: { where?: FilterGroup; limit?: number; offset?: number; orderBy?: OrderByType[] },
): Promise<QueryResponse.AsObject> {
  const req = new QueryRequest();
  req.setTable(tableName);
  if (params.where) req.setWhere(buildDataGroup(params.where));
  if (params.orderBy && params.orderBy.length > 0) {
    req.setOrderByList(params.orderBy.map((o) => {
      const ob = new DOrderBy();
      ob.setField(o.field);
      ob.setDescending(o.descending);
      return ob;
    }));
  }
  req.setLimit(params.limit ?? 100);
  req.setOffset(params.offset ?? 0);

  const res = await grpc.newCall(DataQueryServiceClient, "query").addPayload(req).request<QueryResponse>();
  return res.toObject();
}
