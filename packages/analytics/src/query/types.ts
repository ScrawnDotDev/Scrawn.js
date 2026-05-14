import type { QueryEventsResponse } from "../gen/query/v1/query_pb.js";

export type EventRow = QueryEventsResponse.AsObject["rowsList"][number];
export type AggregationRow = QueryEventsResponse.AsObject["aggRowsList"][number];

export interface EventQueryResult {
  rows: EventRow[];
  total: number;
}

export interface AggregationQueryResult {
  rows: AggregationRow[];
  total: number;
}



