import type { QueryEventsResponse } from "@scrawn/core";

export type EventRow = QueryEventsResponse["rows"][number];
export type AggregationRow = QueryEventsResponse["aggRows"][number];

export interface EventListResult {
  rows: EventRow[];
  total: number;
}

export interface EventAggResult {
  rows: AggregationRow[];
  total: number;
}
