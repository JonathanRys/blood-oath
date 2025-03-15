import { promises as fs } from "fs";
import isEqual from "lodash/isEqual";
import type {
  APIDocument,
  Contract,
  ContractRequest,
  ContractResponse,
  HttpHeaders,
  HttpParams,
  OpenApiV3Info,
  UnsignedContract,
} from "@/types";
import { compileErrors, validate, dereference } from "@readme/openapi-parser";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

// Utils
const convertParams = (params: HttpParams): string => {
  /**
   * Converts params from a ContractRequest into a string for use in future requests
   */
  if (Object.keys(params).length === 0) return "";
  // convert these params to a string
  return `?${new URLSearchParams(params).toString()}`;
};

const getReqUrl = (contractRequest: ContractRequest): string => {
  /**
   * Takes the url components from a Contract and assembles them into a complete url string
   */
  const port = contractRequest.port ? `:${contractRequest.port}` : "";
  const params = convertParams(contractRequest.params);
  return `${contractRequest.host}${port}${contractRequest.path}${params}`;
};

const convertHeaders = (headers: Headers): HttpHeaders => {
  /**
   * Converts headers returned from `fetch` for use in Contracts
   */
  const httpHeaders: HttpHeaders = {};
  for (const header of headers) {
    httpHeaders[header[0]] = header[1];
  }
  return httpHeaders;
};

const findFailures = (arr: boolean[]): number[] => {
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
const convertResponse = async (input: Response): Promise<ContractResponse> => {
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

const compare = async (
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

const fileExists = async (filename: string): Promise<boolean> => {
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

const validateSpec = async (specFile: string): Promise<boolean> => {
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

const draftContracts = async (
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
  const host = openApiSpec.externalDocs?.url;
  const port = host?.slice(0, 5) === "https" ? 443 : 80;
  // iterate over the keys for every path
  const paths = { ...openApiSpec.paths } as Record<string, any>;
  const pathNames = Object.keys(paths);
  const contracts = pathNames.reduce((acc, path) => {
    const pathData = paths[path];
    // iterate over the keys for every method
    const methods = Object.keys(pathData);
    const result = methods.map((method) => {
      const data = pathData[method];
      const { summary, operationId, tags } = data;
      return {
        meta: {
          ...meta,
          summary,
          operationId,
          tags,
        },
        request: {
          host,
          port,
          path,
          method,
          headers: data.responses[200]?.headers,
          params: data.parameters,
        } as ContractRequest,
      } as UnsignedContract;
    });
    return acc.concat(result);
  }, [] as UnsignedContract[]);

  return contracts;
};

// Exported functions
export const saveContracts = async (
  contracts: Contract[],
  filename: string = "./api.contracts.dat"
): Promise<boolean> => {
  /**
   * Saves a collection of Contracts to disk as stringified JSON
   */
  // save contract as filename
  try {
    if (await fileExists(filename)) {
      const fileData = await fs.readFile(filename, "utf8");
      const fileJson = JSON.parse(fileData);
      fileJson.concat(contracts);
      const newText = JSON.stringify(fileJson);
      await fs.writeFile(filename, newText, "utf8");
    } else {
      await fs.writeFile(filename, JSON.stringify(contracts), "utf8");
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const verifyContract = async (contract: Contract): Promise<boolean> => {
  /**
   * Checks that a Contract still returns the same result
   */
  try {
    const response = await (await fetch(getReqUrl(contract.request))).json();
    if (await compare(response, contract)) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
};

export const signContract = async (
  contract: UnsignedContract
): Promise<Contract> => {
  /**
   * Takes an UnsignedContract, makes a request, and adds a snapshot of the response to "sign" the Contract
   */
  // call the endpoint in request and save the response in the format the contract expects
  const request = contract.request;
  const response = await fetch(getReqUrl(request));
  return {
    ...contract,
    response: await convertResponse(response),
  };
};

export const snapshotSpec = async (
  specFile: string,
  contractFile?: string
): Promise<Contract[]> => {
  /**
   * Ingests the OpenAPI Spec file located at the path in `specFile`, snapshots requests to every endpoint, and saves the resulting Contracts to disk
   */
  const unsignedContracts = await draftContracts(specFile);
  const contracts = await Promise.all(unsignedContracts.map(signContract));
  if (contractFile) {
    saveContracts(contracts, contractFile);
  }
  return contracts;
};

export const verifyContracts = async (contracts: Contract[]) => {
  /**
   * Checks that a collection of Contracts still returns same results
   */
  const testResults = await Promise.all(contracts.map(verifyContract));
  if (testResults.every((x) => x === true)) {
    console.log(`${green}All tests pass.${reset}`);
  } else {
    const failedTests = findFailures(testResults);
    const numFailed = failedTests.length;
    const prefix = numFailed > 1 ? "Oaths have" : "An oath has";
    console.log(
      `${red}${prefix} been broken:${reset} ${numFailed} tests failed.`
    );
  }
};

export default {
  saveContracts,
  verifyContract,
  verifyContracts,
  signContract,
  snapshotSpec,
};
