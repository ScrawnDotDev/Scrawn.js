import type { FieldRef } from "../fieldRef.ts";
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

  abstract execute(): Promise<DataQueryResult>;
}



