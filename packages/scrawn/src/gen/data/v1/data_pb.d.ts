// package: data.v1
// file: data/v1/data.proto

import * as jspb from "google-protobuf";

export class FilterCondition extends jspb.Message {
  getField(): string;
  setField(value: string): void;

  getOperator(): OperatorMap[keyof OperatorMap];
  setOperator(value: OperatorMap[keyof OperatorMap]): void;

  getValue(): string;
  setValue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FilterCondition.AsObject;
  static toObject(includeInstance: boolean, msg: FilterCondition): FilterCondition.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FilterCondition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FilterCondition;
  static deserializeBinaryFromReader(message: FilterCondition, reader: jspb.BinaryReader): FilterCondition;
}

export namespace FilterCondition {
  export type AsObject = {
    field: string,
    operator: OperatorMap[keyof OperatorMap],
    value: string,
  }
}

export class FilterGroup extends jspb.Message {
  getLogical(): LogicalOperatorMap[keyof LogicalOperatorMap];
  setLogical(value: LogicalOperatorMap[keyof LogicalOperatorMap]): void;

  clearConditionsList(): void;
  getConditionsList(): Array<FilterCondition>;
  setConditionsList(value: Array<FilterCondition>): void;
  addConditions(value?: FilterCondition, index?: number): FilterCondition;

  clearGroupsList(): void;
  getGroupsList(): Array<FilterGroup>;
  setGroupsList(value: Array<FilterGroup>): void;
  addGroups(value?: FilterGroup, index?: number): FilterGroup;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FilterGroup.AsObject;
  static toObject(includeInstance: boolean, msg: FilterGroup): FilterGroup.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FilterGroup, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FilterGroup;
  static deserializeBinaryFromReader(message: FilterGroup, reader: jspb.BinaryReader): FilterGroup;
}

export namespace FilterGroup {
  export type AsObject = {
    logical: LogicalOperatorMap[keyof LogicalOperatorMap],
    conditionsList: Array<FilterCondition.AsObject>,
    groupsList: Array<FilterGroup.AsObject>,
  }
}

export class OrderBy extends jspb.Message {
  getField(): string;
  setField(value: string): void;

  getDescending(): boolean;
  setDescending(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OrderBy.AsObject;
  static toObject(includeInstance: boolean, msg: OrderBy): OrderBy.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OrderBy, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OrderBy;
  static deserializeBinaryFromReader(message: OrderBy, reader: jspb.BinaryReader): OrderBy;
}

export namespace OrderBy {
  export type AsObject = {
    field: string,
    descending: boolean,
  }
}

export class QueryRequest extends jspb.Message {
  getTable(): string;
  setTable(value: string): void;

  hasWhere(): boolean;
  clearWhere(): void;
  getWhere(): FilterGroup | undefined;
  setWhere(value?: FilterGroup): void;

  clearOrderByList(): void;
  getOrderByList(): Array<OrderBy>;
  setOrderByList(value: Array<OrderBy>): void;
  addOrderBy(value?: OrderBy, index?: number): OrderBy;

  getLimit(): number;
  setLimit(value: number): void;

  getOffset(): number;
  setOffset(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: QueryRequest): QueryRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryRequest;
  static deserializeBinaryFromReader(message: QueryRequest, reader: jspb.BinaryReader): QueryRequest;
}

export namespace QueryRequest {
  export type AsObject = {
    table: string,
    where?: FilterGroup.AsObject,
    orderByList: Array<OrderBy.AsObject>,
    limit: number,
    offset: number,
  }
}

export class QueryResponse extends jspb.Message {
  clearColumnsList(): void;
  getColumnsList(): Array<string>;
  setColumnsList(value: Array<string>): void;
  addColumns(value: string, index?: number): string;

  clearRowsList(): void;
  getRowsList(): Array<Row>;
  setRowsList(value: Array<Row>): void;
  addRows(value?: Row, index?: number): Row;

  getTotal(): number;
  setTotal(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): QueryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: QueryResponse): QueryResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: QueryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): QueryResponse;
  static deserializeBinaryFromReader(message: QueryResponse, reader: jspb.BinaryReader): QueryResponse;
}

export namespace QueryResponse {
  export type AsObject = {
    columnsList: Array<string>,
    rowsList: Array<Row.AsObject>,
    total: number,
  }
}

export class Row extends jspb.Message {
  clearValuesList(): void;
  getValuesList(): Array<string>;
  setValuesList(value: Array<string>): void;
  addValues(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Row.AsObject;
  static toObject(includeInstance: boolean, msg: Row): Row.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Row, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Row;
  static deserializeBinaryFromReader(message: Row, reader: jspb.BinaryReader): Row;
}

export namespace Row {
  export type AsObject = {
    valuesList: Array<string>,
  }
}

export interface OperatorMap {
  OPERATOR_UNSPECIFIED: 0;
  EQ: 1;
  GT: 2;
  GTE: 3;
  LT: 4;
  LTE: 5;
  NEQ: 6;
  CONTAINS: 7;
}

export const Operator: OperatorMap;

export interface LogicalOperatorMap {
  LOGICAL_OPERATOR_UNSPECIFIED: 0;
  AND: 1;
  OR: 2;
}

export const LogicalOperator: LogicalOperatorMap;

export interface UsersFieldMap {
  USERS_FIELD_UNSPECIFIED: 0;
  USERS_ID: 1;
  USERS_LAST_BILLED_TIMESTAMP: 2;
  USERS_PAYMENT_PROVIDER_USER_ID: 3;
  USERS_MODE: 4;
}

export const UsersField: UsersFieldMap;

export interface SessionsFieldMap {
  SESSIONS_FIELD_UNSPECIFIED: 0;
  SESSIONS_ID: 1;
  SESSIONS_SESSION_ID: 2;
  SESSIONS_USER_ID: 3;
  SESSIONS_PROCESSED: 4;
  SESSIONS_BILLED_UPTO: 5;
  SESSIONS_CREATED_AT: 6;
  SESSIONS_MODE: 7;
}

export const SessionsField: SessionsFieldMap;

export interface TagsFieldMap {
  TAGS_FIELD_UNSPECIFIED: 0;
  TAGS_ID: 1;
  TAGS_KEY: 2;
  TAGS_AMOUNT: 3;
}

export const TagsField: TagsFieldMap;

export interface ExpressionsFieldMap {
  EXPRESSIONS_FIELD_UNSPECIFIED: 0;
  EXPRESSIONS_ID: 1;
  EXPRESSIONS_KEY: 2;
  EXPRESSIONS_EXPR: 3;
}

export const ExpressionsField: ExpressionsFieldMap;

export interface MetadataFieldMap {
  METADATA_FIELD_UNSPECIFIED: 0;
  METADATA_ID: 1;
  METADATA_PAYMENT_CRON: 2;
  METADATA_PAYMENT_WEBHOOK: 3;
}

export const MetadataField: MetadataFieldMap;

