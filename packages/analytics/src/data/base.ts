import type { FieldRef, InferRow } from "../fieldRef.ts";
import type { FilterCondition, FilterGroup, OrderBy } from "../operators.ts";
import type { DataQueryResult } from "./types.ts";

export abstract class BaseDataBuilder<TFields> {
  protected _where?: FilterGroup;
  protected _orderBy: OrderBy[] = [];
  protected _limit: number = 100;
  protected _offset: number = 0;

  constructor(
    public readonly fields: TFields,
    public readonly tableName: string,
  ) {}

  where(filter: FilterCondition | FilterGroup): this {
    if ("operator" in filter) {
      this._where = { logical: "AND", conditions: [filter], groups: [] };
    } else {
      this._where = filter;
    }
    return this;
  }

  orderBy(...orders: OrderBy[]): this {
    this._orderBy = orders;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  protected buildParams() {
    return {
      where: this._where,
      limit: this._limit,
      offset: this._offset,
      orderBy: this._orderBy.length > 0 ? this._orderBy : undefined,
    };
  }

  protected unwrap(res: { columnsList?: string[]; rowsList?: Array<{ valuesList?: string[] }>; total?: number }): DataQueryResult<TFields> {
    const cols = res.columnsList ?? [];
    const rows = (res.rowsList ?? []).map((r) => {
      const vals = r.valuesList ?? [];
      const obj: Record<string, string> = {};
      cols.forEach((c, i) => { obj[c] = vals[i] ?? ""; });
      return obj as unknown as InferRow<TFields>;
    });
    return { columns: cols, rows, total: res.total ?? 0 };
  }

  abstract execute(): Promise<DataQueryResult<TFields>>;
}



