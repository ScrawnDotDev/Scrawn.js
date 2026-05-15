import type { FieldRef } from "../fieldRef.js";
import type {
  FilterCondition,
  FilterGroup,
  Aggregation,
  OrderBy,
} from "../operators.js";
import { and } from "../operators.js";
import { callEventQuery } from "../grpc/client.js";
import type { GrpcClient } from "@scrawn/core";
import type { EventListResult, EventAggResult } from "./types.js";

export abstract class BaseEventBuilder<TFields, TAgg extends boolean = false> {
  protected _where?: FilterGroup;
  protected _aggregation?: Aggregation;
  protected _groupBy?: string;
  protected _limit: number = 100;
  protected _offset: number = 0;
  protected _orderBy: OrderBy[] = [];
  private _eventTypeFilter: FilterCondition;

  constructor(
    public readonly fields: TFields,
    eventType: string,
    private grpc: GrpcClient,
    private apiKey: string,
  ) {
    this._eventTypeFilter = { field: "eventType", operator: "EQ", value: eventType };
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

  aggregate(agg: Aggregation): BaseEventBuilder<TFields, true> {
    this._aggregation = agg;
    return this as unknown as BaseEventBuilder<TFields, true>;
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

  async execute(): Promise<TAgg extends true ? EventAggResult : EventListResult> {
    const params = this.buildParams();
    const res = await callEventQuery(this.grpc, this.apiKey, params);
    if (this._aggregation) return { rows: res.aggRowsList ?? [], total: res.total ?? 0 } as EventAggResult as TAgg extends true ? EventAggResult : never;
    return { rows: res.rowsList ?? [], total: res.total ?? 0 } as EventListResult as TAgg extends true ? never : EventListResult;
  }
}
