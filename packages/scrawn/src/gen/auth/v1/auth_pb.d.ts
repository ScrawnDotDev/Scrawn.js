// package: auth.v1
// file: auth/v1/auth.proto

import * as jspb from "google-protobuf";

export class CreateAPIKeyRequest extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getExpiresin(): number;
  setExpiresin(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAPIKeyRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAPIKeyRequest): CreateAPIKeyRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateAPIKeyRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAPIKeyRequest;
  static deserializeBinaryFromReader(message: CreateAPIKeyRequest, reader: jspb.BinaryReader): CreateAPIKeyRequest;
}

export namespace CreateAPIKeyRequest {
  export type AsObject = {
    name: string,
    expiresin: number,
  }
}

export class CreateAPIKeyResponse extends jspb.Message {
  getApikeyid(): string;
  setApikeyid(value: string): void;

  getApikey(): string;
  setApikey(value: string): void;

  getName(): string;
  setName(value: string): void;

  getCreatedat(): string;
  setCreatedat(value: string): void;

  getExpiresat(): string;
  setExpiresat(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateAPIKeyResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateAPIKeyResponse): CreateAPIKeyResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateAPIKeyResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateAPIKeyResponse;
  static deserializeBinaryFromReader(message: CreateAPIKeyResponse, reader: jspb.BinaryReader): CreateAPIKeyResponse;
}

export namespace CreateAPIKeyResponse {
  export type AsObject = {
    apikeyid: string,
    apikey: string,
    name: string,
    createdat: string,
    expiresat: string,
  }
}

