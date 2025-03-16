"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyContracts = exports.snapshotSpec = exports.signContract = exports.verifyContract = exports.loadContracts = exports.saveContracts = void 0;
const fs_1 = require("fs");
const utils_1 = require("@/utils");
const saveContracts = (contracts_1, ...args_1) => __awaiter(void 0, [contracts_1, ...args_1], void 0, function* (contracts, filename = utils_1.contractFile) {
    /**
     * Saves a collection of Contracts to disk as stringified JSON
     */
    try {
        if (yield (0, utils_1.fileExists)(filename)) {
            const fileData = yield fs_1.promises.readFile(filename, "utf8");
            // Save a backup as .bak before overwriting
            yield fs_1.promises.writeFile((0, utils_1.getBackupFilename)(filename), fileData, "utf8");
            // update contracts
            const fileJson = JSON.parse(fileData).concat(contracts);
            const newContent = JSON.stringify(fileJson);
            yield fs_1.promises.writeFile(filename, newContent, "utf8");
        }
        else {
            yield fs_1.promises.writeFile(filename, JSON.stringify(contracts), "utf8");
        }
        return true;
    }
    catch (err) {
        return false;
    }
});
exports.saveContracts = saveContracts;
const loadContracts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filename = utils_1.contractFile) {
    /**
     * Loads a collection of Contracts from disk
     */
    try {
        if (yield (0, utils_1.fileExists)(filename)) {
            const fileData = yield fs_1.promises.readFile(filename, "utf8");
            return JSON.parse(fileData);
        }
        return [];
    }
    catch (err) {
        console.log(`An error occurred loading file ${filename}: ${err}`);
        return [];
    }
});
exports.loadContracts = loadContracts;
const verifyContract = (contract) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Checks that a Contract still returns the same result
     */
    try {
        const response = yield (yield fetch((0, utils_1.getReqUrl)(contract.request))).json();
        if (yield (0, utils_1.compare)(response, contract)) {
            return true;
        }
    }
    catch (error) {
        return false;
    }
    return false;
});
exports.verifyContract = verifyContract;
const signContract = (contract) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Takes an UnsignedContract, makes a request, and adds a snapshot of the response to "sign" the Contract
     */
    // call the endpoint in request and save the response in the format the contract expects
    const request = contract.request;
    const response = yield fetch((0, utils_1.getReqUrl)(request));
    return Object.assign(Object.assign({}, contract), { response: yield (0, utils_1.convertResponse)(response) });
});
exports.signContract = signContract;
const snapshotSpec = (specFile, contractFile) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Ingests the OpenAPI Spec file located at the path in `specFile`, snapshots requests to every endpoint, and saves the resulting Contracts to disk
     */
    const unsignedContracts = yield (0, utils_1.draftContracts)(specFile);
    const contracts = yield Promise.all(unsignedContracts.map(exports.signContract));
    if (contractFile) {
        (0, exports.saveContracts)(contracts, contractFile);
    }
    return contracts;
});
exports.snapshotSpec = snapshotSpec;
const verifyContracts = (contracts) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Checks that a collection of Contracts still returns same results
     */
    const testResults = yield Promise.all(contracts.map(exports.verifyContract));
    if (testResults.every((x) => x === true)) {
        console.log(`${utils_1.green}All tests pass.${utils_1.reset}`);
    }
    else {
        const failedTests = (0, utils_1.findFailures)(testResults);
        const numFailed = failedTests.length;
        const prefix = numFailed > 1 ? "Oaths have" : "An oath has";
        console.log(`${utils_1.red}${prefix} been broken:${utils_1.reset} ${numFailed} tests failed.`);
    }
});
exports.verifyContracts = verifyContracts;
exports.default = {
    saveContracts: exports.saveContracts,
    verifyContract: exports.verifyContract,
    verifyContracts: exports.verifyContracts,
    signContract: exports.signContract,
    snapshotSpec: exports.snapshotSpec,
};
