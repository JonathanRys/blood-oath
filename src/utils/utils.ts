import { promises as fs } from "fs";
import isEqual from "lodash/isEqual";
import type {
  Contract,
  ContractRequest,
  ContractResponse,
  GlobalData,
  HttpHeaders,
  HttpMethod,
  HttpParams,
  OpenApiV3Info,
  OpenApiV3Paths,
  OpenApiV3RequestParams,
  OpenApiV3Schema,
  UnsignedContract,
} from "@/types";
import { compileErrors, validate, dereference } from "@readme/openapi-parser";
import partition from "lodash/partition";

export const convertContractParams = (params: HttpParams): string => {
  /**
   * Converts params from a ContractRequest into a string for use in future requests
   */
  if (Object.keys(params).length === 0) return "";
  // convert these params to a string
  return `?${new URLSearchParams(params).toString()}`;
};

export const getParamDefaultValue = (param: OpenApiV3RequestParams) => {
  const defaultValues = {
    integer: 0,
    array: [],
    string: "",
    boolean: false,
    number: 0,
    object: {},
  };

  const hasSchema = param.schema;

  const defaultValue =
    param.default ||
    param.minimum ||
    param.maximum ||
    defaultValues[param.type];
};

export const parseParam = (param: OpenApiV3RequestParams) => {
  /**
   * Convert an OpenAPI parameter to a key/value pair
   */

  // Save parameters by name and type.  Also save metadata like description
  return { [param.name]: getParamDefaultValue(param) };
};

export const valueFromSchema = (schema: OpenApiV3Schema): string => {
  /**
   * Generate a mock value based on the schema
   */

  return "";
};

export const convertOpenApiParams = (
  params: OpenApiV3RequestParams[]
): HttpParams => {
  /**
   * Converts params from a OpenAPI spec into httpParams
   */
  const [queryParams, pathParams] = partition(
    params,
    (param) => param.in === "query"
  );

  const processedParams = queryParams.reduce(
    (acc, param) => ({
      ...acc,
      ...parseParam(param),
    }),
    {}
  );

  return processedParams;
};

export const getReqUrl = (contractRequest: ContractRequest): string => {
  /**
   * Takes the url components from a Contract and assembles them into a complete url string
   */
  const port = ""; // contractRequest.port ? `:${contractRequest.port}` : "";
  const params = convertContractParams(contractRequest.params);
  return `${contractRequest.host}${port}${contractRequest.path}${params}`;
};

export const convertHeaders = (headers: Headers): HttpHeaders => {
  /**
   * Converts headers returned from `fetch` for use in Contracts
   */
  const httpHeaders: HttpHeaders = {};
  for (const header of headers) {
    httpHeaders[header[0]] = header[1];
  }
  return httpHeaders;
};

export const findFailures = (arr: boolean[]): number[] => {
  /**
   * Finds the indexes of false values in the given array
   */
  const indexes = [];
  for (let i = 0; i < arr.length; i++) {
    if (!!arr[i] === false) {
      indexes.push(i);
    }
  }
  return indexes;
};

// Async
export const convertResponse = async (
  input: Response
): Promise<ContractResponse> => {
  /**
   * Converts a response from a call to `fetch` to a response for use in a Contract
   */
  const { ok, type, status, headers, body } = input;
  return {
    ok,
    type,
    status,
    headers: convertHeaders(headers),
    body: input.bodyUsed ? await input.json() : {},
  };
};

export const compare = async (
  response: Response,
  contract: Contract
): Promise<boolean> => {
  /**
   * Compares a response from `fetch` to a Contract
   */
  const oath = contract.response;
  const _response = await convertResponse(response);
  // compare status
  if (
    _response.status === oath.status &&
    // compare headers
    isEqual(_response.headers, oath.headers) &&
    // compare response body
    isEqual(_response.body, oath.body)
  ) {
    return true;
  }
  return false;
};

export const fileExists = async (filename: string): Promise<boolean> => {
  /**
   * Checks if a file exists
   */
  try {
    await fs.access(filename);
    return true;
  } catch (err) {
    return false;
  }
};

export const getBackupFilename = (filename: string): string => {
  /**
   * Replaces the extension of file with .bak
   */
  const fileArr = filename.split(".");
  // remove the current file extension
  const newFile = fileArr.length > 1 ? fileArr.slice(0, -1) : fileArr;
  // add a .bak file extension
  newFile.push("bak");
  return newFile.join(".");
};

export const validateSpec = async (specFile: string): Promise<boolean> => {
  /**
   * Checks if the file path in `specFile` is a valid OpenAPI Spec
   */
  try {
    const validation = await validate(specFile);
    if (!validation.valid) {
      console.log(compileErrors(validation));
      throw new Error(`Invalid spec file.\n${compileErrors(validation)}`);
    }
  } catch {
    return false;
  }
  return true;
};

export const processPaths =
  (data: GlobalData) => (acc: UnsignedContract[], path: string) => {
    /**
     * Custom reducer for extracting data from an OpenAPI spec
     */
    const pathData = data.paths[path];
    // iterate over the keys for every method
    const methods = Object.keys(pathData);
    const result = methods.map((method) => {
      const methodData = pathData[method as HttpMethod];
      const { summary, operationId, tags } = methodData;
      return {
        meta: {
          ...data.meta,
          summary,
          operationId,
          tags,
        },
        request: {
          host: data.host,
          // port: data.port,
          path,
          method,
          headers: methodData.responses[200]?.headers, // Do I need to iterate this or do I only care about 20xs??
          params: convertOpenApiParams(methodData.parameters),
        } as ContractRequest,
      } as UnsignedContract;
    });
    return acc.concat(result);
  };

export const draftContracts = async (
  specFile: string
): Promise<UnsignedContract[]> => {
  /**
   * Creates a set of Unsigned Contracts given the contents of the OpenAPI Spec
   *  located at the file path in `specFile`
   */
  // @TODO check version of spec and parse depending on version
  // OpenAPI v3.0.0
  try {
    // @TODO return the version of the spec here
    validateSpec(specFile);
  } catch {
    return [];
  }
  const openApiSpec = await dereference(specFile);
  // get meta data - @todo this needs to happen inside a loop
  const meta = openApiSpec.info;
  // get request data
  const host = openApiSpec.externalDocs?.url || "https://localhost";
  // const port = host?.slice(0, 5) === "https" ? 443 : 80;
  // iterate over the keys for every path
  const paths = { ...openApiSpec.paths } as Record<string, any>;
  //
  const globalData: GlobalData = {
    paths,
    meta,
    host,
    // port
  };
  const draftContract = processPaths(globalData);
  const pathNames = Object.keys(paths);
  const contracts = pathNames.reduce(draftContract, [] as UnsignedContract[]);

  return contracts;
};
