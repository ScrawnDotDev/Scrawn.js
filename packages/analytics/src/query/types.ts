import type { QueryEventsResponse } from "@scrawn/core";

export type EventRow = QueryEventsResponse.AsObject["rowsList"][number];
export type AggregationRow = QueryEventsResponse.AsObject["aggRowsList"][number];

export interface EventListResult {
  rows: EventRow[];
  total: number;
}

export interface EventAggResult {
  rows: AggregationRow[];
  total: number;
}
