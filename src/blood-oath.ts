import { promises as fs } from "fs";
import type { Contract, UnsignedContract } from "@/types";
import {
  red,
  green,
  reset,
  fileExists,
  getReqUrl,
  compare,
  convertResponse,
  draftContracts,
  findFailures,
  getBackupFilename,
  contractFile,
} from "@/utils";

export const saveContracts = async (
  contracts: Contract[],
  filename: string = contractFile
): Promise<boolean> => {
  /**
   * Saves a collection of Contracts to disk as stringified JSON
   */
  try {
    if (await fileExists(filename)) {
      const fileData = await fs.readFile(filename, "utf8");
      // Save a backup as .bak before overwriting
      await fs.writeFile(getBackupFilename(filename), fileData, "utf8");
      // update contracts
      const fileJson = JSON.parse(fileData).concat(contracts);
      const newContent = JSON.stringify(fileJson);
      await fs.writeFile(filename, newContent, "utf8");
    } else {
      await fs.writeFile(filename, JSON.stringify(contracts), "utf8");
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const loadContracts = async (
  filename: string = contractFile
): Promise<Contract[]> => {
  /**
   * Loads a collection of Contracts from disk
   */
  try {
    if (await fileExists(filename)) {
      const fileData = await fs.readFile(filename, "utf8");
      return JSON.parse(fileData);
    }
    return [];
  } catch (err) {
    console.log(`An error occurred loading file ${filename}: ${err}`);
    return [];
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
