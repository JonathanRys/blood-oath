import { OpenAPIV2, OpenAPIV3_1, OpenAPIV3 } from "openapi-types";
import { HttpHeaders, HttpMethod, HttpResponseCode } from "@/types";

// Actual return type
export type APIDocument<T extends object = NonNullable<unknown>> =
  | OpenAPIV2.Document<T>
  | OpenAPIV3_1.Document<T>
  | OpenAPIV3.Document<T>;

// mock OpenAPI types
export type OpenApiV3Info =
  | OpenAPIV3.InfoObject
  | OpenAPIV3_1.InfoObject
  | OpenAPIV2.InfoObject;

export type OpenApiV3Servers = {
  url: string;
};

export type OpenApiV3DataType =
  | "integer"
  | "array"
  | "string"
  | "boolean"
  | "number"
  | "object";

export type OpenApiV3DataValue = [] | string | boolean | number | object;

export type OpenApiV3DataFormat = "date";

export type OpenApiV3Schema = {
  type: string;
  integer?: string;
  items?: { type: OpenApiV3DataType };
  minItems?: number;
};

export type OpenApiV3RequestParams = {
  name: string;
  in: string;
  description: string;
  type: OpenApiV3DataType;
  required: string;
  schema: OpenApiV3Schema;
  minimum?: OpenApiV3DataValue;
  maximum?: OpenApiV3DataValue;
  default?: OpenApiV3DataValue;
  format?: string;
  enum?: [];
  items?: {
    type: OpenApiV3DataType;
  };
};

export type OpenApiV3RequestMethods = {
  summary: string;
  operationId: string;
  tags: string[];
  parameters: OpenApiV3RequestParams[];
  responses: OpenApiV3RequestResponses;
};

export type OpenApiV3RequestResponse = {
  description: string;
  headers: HttpHeaders;
  content: Record<string, string | number>;
};

export type OpenApiV3RequestResponses = Record<
  keyof HttpResponseCode | "default",
  OpenApiV3RequestResponse
>;

export type OpenApiV3Request = Record<HttpMethod, OpenApiV3RequestMethods>;

export type OpenApiV3Paths = {
  [key: string]: OpenApiV3Request;
};

export interface OpenApiV3Spec {
  openapi: string;
  info: OpenApiV3Info;
  servers: OpenApiV3Servers;
  paths: OpenApiV3Paths;
}
