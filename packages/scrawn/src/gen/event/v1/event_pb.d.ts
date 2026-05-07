// package: event.v1
// file: event/v1/event.proto

import * as jspb from "google-protobuf";

export class RegisterEventRequest extends jspb.Message {
  getType(): EventTypeMap[keyof EventTypeMap];
  setType(value: EventTypeMap[keyof EventTypeMap]): void;

  getUserid(): string;
  setUserid(value: string): void;

  getReportedtimestamp(): number;
  setReportedtimestamp(value: number): void;

  hasSdkcall(): boolean;
  clearSdkcall(): void;
  getSdkcall(): SDKCall | undefined;
  setSdkcall(value?: SDKCall): void;

  getDataCase(): RegisterEventRequest.DataCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterEventRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterEventRequest): RegisterEventRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterEventRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterEventRequest;
  static deserializeBinaryFromReader(message: RegisterEventRequest, reader: jspb.BinaryReader): RegisterEventRequest;
}

export namespace RegisterEventRequest {
  export type AsObject = {
    type: EventTypeMap[keyof EventTypeMap],
    userid: string,
    reportedtimestamp: number,
    sdkcall?: SDKCall.AsObject,
  }

  export enum DataCase {
    DATA_NOT_SET = 0,
    SDKCALL = 4,
  }
}

export class SDKCall extends jspb.Message {
  getSdkcalltype(): SDKCallTypeMap[keyof SDKCallTypeMap];
  setSdkcalltype(value: SDKCallTypeMap[keyof SDKCallTypeMap]): void;

  hasAmount(): boolean;
  clearAmount(): void;
  getAmount(): number;
  setAmount(value: number): void;

  hasTag(): boolean;
  clearTag(): void;
  getTag(): string;
  setTag(value: string): void;

  hasExpr(): boolean;
  clearExpr(): void;
  getExpr(): string;
  setExpr(value: string): void;

  getDebitCase(): SDKCall.DebitCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SDKCall.AsObject;
  static toObject(includeInstance: boolean, msg: SDKCall): SDKCall.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SDKCall, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SDKCall;
  static deserializeBinaryFromReader(message: SDKCall, reader: jspb.BinaryReader): SDKCall;
}

export namespace SDKCall {
  export type AsObject = {
    sdkcalltype: SDKCallTypeMap[keyof SDKCallTypeMap],
    amount: number,
    tag: string,
    expr: string,
  }

  export enum DebitCase {
    DEBIT_NOT_SET = 0,
    AMOUNT = 2,
    TAG = 3,
    EXPR = 4,
  }
}

export class RegisterEventResponse extends jspb.Message {
  getRandom(): string;
  setRandom(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterEventResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterEventResponse): RegisterEventResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterEventResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterEventResponse;
  static deserializeBinaryFromReader(message: RegisterEventResponse, reader: jspb.BinaryReader): RegisterEventResponse;
}

export namespace RegisterEventResponse {
  export type AsObject = {
    random: string,
  }
}

export class StreamEventRequest extends jspb.Message {
  getType(): EventTypeMap[keyof EventTypeMap];
  setType(value: EventTypeMap[keyof EventTypeMap]): void;

  getUserid(): string;
  setUserid(value: string): void;

  getReportedtimestamp(): number;
  setReportedtimestamp(value: number): void;

  hasSdkcall(): boolean;
  clearSdkcall(): void;
  getSdkcall(): SDKCall | undefined;
  setSdkcall(value?: SDKCall): void;

  hasAitokenusage(): boolean;
  clearAitokenusage(): void;
  getAitokenusage(): AITokenUsage | undefined;
  setAitokenusage(value?: AITokenUsage): void;

  getDataCase(): StreamEventRequest.DataCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamEventRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamEventRequest): StreamEventRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StreamEventRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamEventRequest;
  static deserializeBinaryFromReader(message: StreamEventRequest, reader: jspb.BinaryReader): StreamEventRequest;
}

export namespace StreamEventRequest {
  export type AsObject = {
    type: EventTypeMap[keyof EventTypeMap],
    userid: string,
    reportedtimestamp: number,
    sdkcall?: SDKCall.AsObject,
    aitokenusage?: AITokenUsage.AsObject,
  }

  export enum DataCase {
    DATA_NOT_SET = 0,
    SDKCALL = 4,
    AITOKENUSAGE = 5,
  }
}

export class AITokenUsage extends jspb.Message {
  getModel(): string;
  setModel(value: string): void;

  getInputtokens(): number;
  setInputtokens(value: number): void;

  getOutputtokens(): number;
  setOutputtokens(value: number): void;

  hasInputamount(): boolean;
  clearInputamount(): void;
  getInputamount(): number;
  setInputamount(value: number): void;

  hasInputtag(): boolean;
  clearInputtag(): void;
  getInputtag(): string;
  setInputtag(value: string): void;

  hasInputexpr(): boolean;
  clearInputexpr(): void;
  getInputexpr(): string;
  setInputexpr(value: string): void;

  hasOutputamount(): boolean;
  clearOutputamount(): void;
  getOutputamount(): number;
  setOutputamount(value: number): void;

  hasOutputtag(): boolean;
  clearOutputtag(): void;
  getOutputtag(): string;
  setOutputtag(value: string): void;

  hasOutputexpr(): boolean;
  clearOutputexpr(): void;
  getOutputexpr(): string;
  setOutputexpr(value: string): void;

  getInputdebitCase(): AITokenUsage.InputdebitCase;
  getOutputdebitCase(): AITokenUsage.OutputdebitCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AITokenUsage.AsObject;
  static toObject(includeInstance: boolean, msg: AITokenUsage): AITokenUsage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AITokenUsage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AITokenUsage;
  static deserializeBinaryFromReader(message: AITokenUsage, reader: jspb.BinaryReader): AITokenUsage;
}

export namespace AITokenUsage {
  export type AsObject = {
    model: string,
    inputtokens: number,
    outputtokens: number,
    inputamount: number,
    inputtag: string,
    inputexpr: string,
    outputamount: number,
    outputtag: string,
    outputexpr: string,
  }

  export enum InputdebitCase {
    INPUTDEBIT_NOT_SET = 0,
    INPUTAMOUNT = 4,
    INPUTTAG = 5,
    INPUTEXPR = 8,
  }

  export enum OutputdebitCase {
    OUTPUTDEBIT_NOT_SET = 0,
    OUTPUTAMOUNT = 6,
    OUTPUTTAG = 7,
    OUTPUTEXPR = 9,
  }
}

export class StreamEventResponse extends jspb.Message {
  getEventsprocessed(): number;
  setEventsprocessed(value: number): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamEventResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StreamEventResponse): StreamEventResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StreamEventResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamEventResponse;
  static deserializeBinaryFromReader(message: StreamEventResponse, reader: jspb.BinaryReader): StreamEventResponse;
}

export namespace StreamEventResponse {
  export type AsObject = {
    eventsprocessed: number,
    message: string,
  }
}

export interface EventTypeMap {
  EVENT_TYPE_UNSPECIFIED: 0;
  SDK_CALL: 1;
  AI_TOKEN_USAGE: 2;
}

export const EventType: EventTypeMap;

export interface SDKCallTypeMap {
  SDKCALLTYPE_UNSPECIFIED: 0;
  RAW: 1;
  MIDDLEWARE_CALL: 2;
}

export const SDKCallType: SDKCallTypeMap;

