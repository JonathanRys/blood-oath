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

export type OpenApiV3RequestParams = {
  name: string;
  in: string;
  description: string;
  required: string;
  schema: {
    type: string;
    integer: string;
  };
};

export type OpenApiV3RequestMethods = {
  summary: string;
  operationId: string;
  tags: string[];
  parameters: OpenApiV3RequestParams;
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

export type OpenApiV3Request = Record<
  keyof HttpMethod,
  OpenApiV3RequestMethods
>;

export type OpenApiV3Paths = {
  [key: string]: OpenApiV3Request;
};

export interface OpenApiV3Spec {
  openapi: string;
  info: OpenApiV3Info;
  servers: OpenApiV3Servers;
  paths: OpenApiV3Paths;
}
