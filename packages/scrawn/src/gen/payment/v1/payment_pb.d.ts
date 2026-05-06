// package: payment.v1
// file: payment/v1/payment.proto

import * as jspb from "google-protobuf";

export class CreateCheckoutLinkRequest extends jspb.Message {
  getUserid(): string;
  setUserid(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCheckoutLinkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCheckoutLinkRequest): CreateCheckoutLinkRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateCheckoutLinkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCheckoutLinkRequest;
  static deserializeBinaryFromReader(message: CreateCheckoutLinkRequest, reader: jspb.BinaryReader): CreateCheckoutLinkRequest;
}

export namespace CreateCheckoutLinkRequest {
  export type AsObject = {
    userid: string,
  }
}

export class CreateCheckoutLinkResponse extends jspb.Message {
  getCheckoutlink(): string;
  setCheckoutlink(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateCheckoutLinkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateCheckoutLinkResponse): CreateCheckoutLinkResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateCheckoutLinkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateCheckoutLinkResponse;
  static deserializeBinaryFromReader(message: CreateCheckoutLinkResponse, reader: jspb.BinaryReader): CreateCheckoutLinkResponse;
}

export namespace CreateCheckoutLinkResponse {
  export type AsObject = {
    checkoutlink: string,
  }
}

