import { httpBody, HttpHeaders, HttpParams } from "./http.types";
import { OpenApiV3Info, OpenApiV3Paths } from "./openapi.types";

export type ContractMeta = OpenApiV3Info & {
  summary: string;
  operationId: string;
  tags: string[];
};

export type ContractRequest = {
  host: string;
  // port: number;
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

export type GlobalData = {
  paths: OpenApiV3Paths;
  meta: OpenApiV3Info;
  host: string;
  // port: number
};
