import type { QueryEventsResponse } from "@scrawn/core";

export type EventRow = QueryEventsResponse.AsObject["rowsList"][number];
export type AggregationRow = QueryEventsResponse.AsObject["aggRowsList"][number];

export interface EventQueryResult {
  rows: (EventRow | AggregationRow)[];
  total: number;
}




