import { promises as fs } from "fs";
import isEqual from "lodash/isEqual";
import type {
  Contract,
  ContractMeta,
  ContractRequest,
  ContractResponse,
  httpBody,
  HttpHeaders,
  HttpParams,
} from "@/types";
import { compileErrors, validate, dereference } from "@readme/openapi-parser";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";

// Utils
const parseParams = (params: HttpParams): string => {
  if (Object.keys(params).length === 0) return "";
  // convert these params to a string
  return `?${new URLSearchParams(params).toString()}`;
};

const getReqUrl = (contractRequest: ContractRequest): string => {
  const port = contractRequest.port ? `:${contractRequest.port}` : "";
  const params = parseParams(contractRequest.params);
  return `${contractRequest.host}${port}${contractRequest.path}${params}`;
};

const convertHeaders = (headers: Headers): HttpHeaders => {
  const httpHeaders: HttpHeaders = {};
  for (const header of headers) {
    httpHeaders[header[0]] = header[1];
  }
  return httpHeaders;
};

const convertBody = (
  body: ReadableStream<Uint8Array<ArrayBufferLike>> | null
): httpBody => {
  return {};
};

const convertResponse = async (input: Response): Promise<ContractResponse> => {
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
  try {
    await fs.access(filename);
    return true;
  } catch (err) {
    return false;
  }
};

const saveContracts = async (
  contracts: Contract[],
  filename: string = "./api.contracts.dat"
): Promise<boolean> => {
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

const validateSpec = async (specFile: string): Promise<boolean> => {
  const validation = await validate(specFile);
  if (!validation.valid) {
    console.log(compileErrors(validation));
    throw new Error(`Invalid spec file.\n${compileErrors(validation)}`);
  }
  return true;
};

const extractSpecMeta = (openApiSpec: {}): ContractMeta => {
  return {
    statement: "",
    description: "",
    action: "",
  };
};

type UnsignedContract = {
  meta: ContractMeta;
  request: ContractRequest;
};

const draftContracts = async (
  specFile: string
): Promise<UnsignedContract[]> => {
  // Check version of spec and parse depending on version
  // OpenAPI v3.0.0
  try {
    validateSpec(specFile);
  } catch {
    return [];
  }
  const openApiSpec = await dereference(specFile);

  const meta = extractSpecMeta(openApiSpec);

  const host = openApiSpec.externalDocs?.url;
  const port = host?.slice(0, 5) === "https" ? 443 : 80;
  const paths = { ...openApiSpec.paths } as Record<string, any>;

  const pathNames = Object.keys(paths);
  const contracts = pathNames.reduce((acc, path) => {
    const pathData = paths[path];
    const methods = Object.keys(pathData);
    const result = methods.map((method) => {
      const data = pathData[method];
      return {
        meta,
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
export const verifyContract = async (contract: Contract) => {
  try {
    const response = await (await fetch(getReqUrl(contract.request))).json();
    if (await compare(response, contract)) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const signContract = async (
  contract: UnsignedContract
): Promise<Contract> => {
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
  const unsignedContracts = await draftContracts(specFile);
  const contracts = await Promise.all(unsignedContracts.map(signContract));
  if (contractFile) {
    saveContracts(contracts, contractFile);
  }
  return contracts;
};

const findFailures = (arr: boolean[]): number[] => {
  const indexes = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === false) {
      indexes.push(i);
    }
  }
  return indexes;
};

export const verifyContracts = async (contracts: Contract[]) => {
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
  verifyContract,
  verifyContracts,
  signContract,
  snapshotSpec,
};
