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
