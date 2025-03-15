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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyContracts = exports.snapshotSpec = exports.signContract = exports.verifyContract = exports.saveContracts = void 0;
const fs_1 = require("fs");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const openapi_parser_1 = require("@readme/openapi-parser");
const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
// Utils
const convertParams = (params) => {
    /**
     * Converts params from a ContractRequest into a string for use in future requests
     */
    if (Object.keys(params).length === 0)
        return "";
    // convert these params to a string
    return `?${new URLSearchParams(params).toString()}`;
};
const getReqUrl = (contractRequest) => {
    /**
     * Takes the url components from a Contract and assembles them into a complete url string
     */
    const port = contractRequest.port ? `:${contractRequest.port}` : "";
    const params = convertParams(contractRequest.params);
    return `${contractRequest.host}${port}${contractRequest.path}${params}`;
};
const convertHeaders = (headers) => {
    /**
     * Converts headers returned from `fetch` for use in Contracts
     */
    const httpHeaders = {};
    for (const header of headers) {
        httpHeaders[header[0]] = header[1];
    }
    return httpHeaders;
};
const findFailures = (arr) => {
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
const convertResponse = (input) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Converts a response from a call to `fetch` to a response for use in a Contract
     */
    const { ok, type, status, headers, body } = input;
    return {
        ok,
        type,
        status,
        headers: convertHeaders(headers),
        body: input.bodyUsed ? yield input.json() : {},
    };
});
const compare = (response, contract) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Compares a response from `fetch` to a Contract
     */
    const oath = contract.response;
    const _response = yield convertResponse(response);
    // compare status
    if (_response.status === oath.status &&
        // compare headers
        (0, isEqual_1.default)(_response.headers, oath.headers) &&
        // compare response body
        (0, isEqual_1.default)(_response.body, oath.body)) {
        return true;
    }
    return false;
});
const fileExists = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Checks if a file exists
     */
    try {
        yield fs_1.promises.access(filename);
        return true;
    }
    catch (err) {
        return false;
    }
});
const validateSpec = (specFile) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Checks if the file path in `specFile` is a valid OpenAPI Spec
     */
    try {
        const validation = yield (0, openapi_parser_1.validate)(specFile);
        if (!validation.valid) {
            console.log((0, openapi_parser_1.compileErrors)(validation));
            throw new Error(`Invalid spec file.\n${(0, openapi_parser_1.compileErrors)(validation)}`);
        }
    }
    catch (_a) {
        return false;
    }
    return true;
});
const draftContracts = (specFile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    /**
     * Creates a set of Unsigned Contracts given the contents of the OpenAPI Spec
     *  located at the file path in `specFile`
     */
    // @TODO check version of spec and parse depending on version
    // OpenAPI v3.0.0
    try {
        // @TODO return the version of the spec here
        validateSpec(specFile);
    }
    catch (_b) {
        return [];
    }
    const openApiSpec = yield (0, openapi_parser_1.dereference)(specFile);
    // get meta data - @todo this needs to happen inside a loop
    const meta = openApiSpec.info;
    // get request data
    const host = (_a = openApiSpec.externalDocs) === null || _a === void 0 ? void 0 : _a.url;
    const port = (host === null || host === void 0 ? void 0 : host.slice(0, 5)) === "https" ? 443 : 80;
    // iterate over the keys for every path
    const paths = Object.assign({}, openApiSpec.paths);
    const pathNames = Object.keys(paths);
    const contracts = pathNames.reduce((acc, path) => {
        const pathData = paths[path];
        // iterate over the keys for every method
        const methods = Object.keys(pathData);
        const result = methods.map((method) => {
            var _a;
            const data = pathData[method];
            const { summary, operationId, tags } = data;
            return {
                meta: Object.assign(Object.assign({}, meta), { summary,
                    operationId,
                    tags }),
                request: {
                    host,
                    port,
                    path,
                    method,
                    headers: (_a = data.responses[200]) === null || _a === void 0 ? void 0 : _a.headers,
                    params: data.parameters,
                },
            };
        });
        return acc.concat(result);
    }, []);
    return contracts;
});
// Exported functions
const saveContracts = (contracts_1, ...args_1) => __awaiter(void 0, [contracts_1, ...args_1], void 0, function* (contracts, filename = "./api.contracts.dat") {
    /**
     * Saves a collection of Contracts to disk as stringified JSON
     */
    // save contract as filename
    try {
        if (yield fileExists(filename)) {
            const fileData = yield fs_1.promises.readFile(filename, "utf8");
            const fileJson = JSON.parse(fileData);
            fileJson.concat(contracts);
            const newText = JSON.stringify(fileJson);
            yield fs_1.promises.writeFile(filename, newText, "utf8");
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
const verifyContract = (contract) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Checks that a Contract still returns the same result
     */
    try {
        const response = yield (yield fetch(getReqUrl(contract.request))).json();
        if (yield compare(response, contract)) {
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
    const response = yield fetch(getReqUrl(request));
    return Object.assign(Object.assign({}, contract), { response: yield convertResponse(response) });
});
exports.signContract = signContract;
const snapshotSpec = (specFile, contractFile) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Ingests the OpenAPI Spec file located at the path in `specFile`, snapshots requests to every endpoint, and saves the resulting Contracts to disk
     */
    const unsignedContracts = yield draftContracts(specFile);
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
        console.log(`${green}All tests pass.${reset}`);
    }
    else {
        const failedTests = findFailures(testResults);
        const numFailed = failedTests.length;
        const prefix = numFailed > 1 ? "Oaths have" : "An oath has";
        console.log(`${red}${prefix} been broken:${reset} ${numFailed} tests failed.`);
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
