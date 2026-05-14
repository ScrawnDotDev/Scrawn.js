import type { FieldRef } from "../fieldRef.ts";
import type {
  FilterCondition,
  FilterGroup,
  Aggregation,
  OrderBy,
} from "../operators.ts";
import { and } from "../operators.ts";
import type { EventQueryResult, EventRow, AggregationRow } from "./types.ts";

export abstract class BaseEventBuilder<TFields> {
  protected _where?: FilterGroup;
  protected _aggregation?: Aggregation;
  protected _groupBy?: string;
  protected _limit: number = 100;
  protected _offset: number = 0;
  protected _orderBy: OrderBy[] = [];
  private _eventTypeFilter: FilterCondition;

  constructor(public readonly fields: TFields, eventType: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._eventTypeFilter = { field: "eventType", operator: "EQ", value: eventType } as any;
  }

  where(filter: FilterCondition | FilterGroup): this {
    if ("operator" in filter) {
      this._where = and(this._eventTypeFilter, filter);
    } else {
      this._where = {
        logical: filter.logical,
        conditions: [this._eventTypeFilter, ...filter.conditions],
        groups: filter.groups,
      };
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

  aggregate(agg: Aggregation): this {
    this._aggregation = agg;
    return this;
  }

  groupBy(field: FieldRef<unknown>): this {
    this._groupBy = field.name;
    return this;
  }

  protected buildParams() {
    return {
      where: this._where ?? and(this._eventTypeFilter),
      aggregation: this._aggregation,
      groupBy: this._groupBy,
      limit: this._limit,
      offset: this._offset,
      orderBy: this._orderBy.length > 0 ? this._orderBy : undefined,
    };
  }

  abstract execute(): Promise<EventQueryResult>;
}



