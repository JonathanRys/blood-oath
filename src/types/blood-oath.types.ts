// Http
export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "head"
  | "options"
  | "trace"
  | "patch"
  | "connect";

export type InformationalResponseCode = "100" | "101" | "102" | "103";
export type SuccessfulResponseCode =
  | "200"
  | "201"
  | "202"
  | "203"
  | "204"
  | "205"
  | "206"
  | "207"
  | "208"
  | "226";
export type RedirectionResponseCode =
  | "300"
  | "301"
  | "302"
  | "303"
  | "304"
  | "305"
  | "306"
  | "307"
  | "308";
export type ClientErrorResponseCode =
  | "400"
  | "401"
  | "402"
  | "403"
  | "404"
  | "405"
  | "406"
  | "407"
  | "408"
  | "409"
  | "410"
  | "411"
  | "412"
  | "413"
  | "414"
  | "415"
  | "416"
  | "417"
  | "418"
  | "421"
  | "422"
  | "423"
  | "424"
  | "425"
  | "426"
  | "428"
  | "429"
  | "431"
  | "451";
export type ServerErrorResponseCode =
  | "500"
  | "501"
  | "502"
  | "503"
  | "504"
  | "505"
  | "506"
  | "507"
  | "508"
  | "510"
  | "511";

export type HttpResponseCode =
  | InformationalResponseCode
  | SuccessfulResponseCode
  | RedirectionResponseCode
  | ClientErrorResponseCode
  | ServerErrorResponseCode;

export type HttpHeaders = Record<string, string | number>;
export type HttpParams = Record<string, string>;
export type httpBody = Record<string, any>;

export type HttpResponse = {};

// Contract
export type ContractMeta = {
  statement: string;
  description: string;
  action: string;
};

export type ContractRequest = {
  host: string;
  port: number;
  path: string;
  method: string;
  headers: HttpHeaders;
  params: HttpParams;
};

export type ContractResponse = {
  ok: boolean;
  type: string;
  status: number;
  headers: HttpHeaders;
  body: httpBody;
};

export interface Contract {
  meta: ContractMeta;
  request: ContractRequest;
  response: ContractResponse;
}

export interface UnsignedContract {
  meta: ContractMeta;
  request: ContractRequest;
}

// OpenAPI
export type OpenApiV3Info = {
  version: string;
  title: string;
  license: {
    name: string;
  };
};

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
