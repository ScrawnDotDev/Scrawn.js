import type { InferRow } from "../fieldRef.ts";

export interface DataQueryResult<TFields> {
  columns: string[];
  rows: InferRow<TFields>[];
  total: number;
}
