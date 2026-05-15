import type { FieldRef } from "./fieldRef.js";

export type QueryOperator = "EQ" | "GT" | "GTE" | "LT" | "LTE" | "NEQ" | "CONTAINS";

export interface FilterCondition {
  field: string;
  operator: QueryOperator;
  value: string;
}

export interface FilterGroup {
  logical: "AND" | "OR";
  conditions: FilterCondition[];
  groups: FilterGroup[];
}

export interface OrderBy {
  field: string;
  descending: boolean;
}

export interface Aggregation {
  type: "SUM" | "COUNT";
  field?: string;
}

// ---- comparison operators ----

function condition<T>(field: FieldRef<T>, operator: QueryOperator, value: T): FilterCondition {
  return { field: field.name, operator, value: String(value) };
}

export function eq<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "EQ", value);
}

export function neq<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "NEQ", value);
}

export function gt<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "GT", value);
}

export function gte<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "GTE", value);
}

export function lt<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "LT", value);
}

export function lte<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "LTE", value);
}

export function contains<T>(field: FieldRef<T>, value: T): FilterCondition {
  return condition(field, "CONTAINS", value);
}

// ---- logical operators ----

type FilterInput = FilterCondition | FilterGroup;

export function and(...filters: FilterInput[]): FilterGroup {
  return {
    logical: "AND",
    conditions: filters.filter((f): f is FilterCondition => "field" in f),
    groups: filters.filter((f): f is FilterGroup => "logical" in f),
  };
}

export function or(...filters: FilterInput[]): FilterGroup {
  return {
    logical: "OR",
    conditions: filters.filter((f): f is FilterCondition => "field" in f),
    groups: filters.filter((f): f is FilterGroup => "logical" in f),
  };
}

// ---- sorting ----

export function asc(field: FieldRef<unknown>): OrderBy {
  return { field: field.name, descending: false };
}

export function desc(field: FieldRef<unknown>): OrderBy {
  return { field: field.name, descending: true };
}

// ---- aggregation ----

export function sum(field: FieldRef<number>): Aggregation {
  return { type: "SUM", field: field.name };
}

export function count(): Aggregation {
  return { type: "COUNT" };
}



