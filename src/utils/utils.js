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
exports.draftContracts = exports.processPaths = exports.validateSpec = exports.getBackupFilename = exports.fileExists = exports.compare = exports.convertResponse = exports.findFailures = exports.convertHeaders = exports.getReqUrl = exports.convertOpenApiParams = exports.valueFromSchema = exports.parseParam = exports.getParamDefaultValue = exports.convertContractParams = void 0;
const fs_1 = require("fs");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const openapi_parser_1 = require("@readme/openapi-parser");
const partition_1 = __importDefault(require("lodash/partition"));
const convertContractParams = (params) => {
    /**
     * Converts params from a ContractRequest into a string for use in future requests
     */
    if (Object.keys(params).length === 0)
        return "";
    // convert these params to a string
    return `?${new URLSearchParams(params).toString()}`;
};
exports.convertContractParams = convertContractParams;
const getParamDefaultValue = (param) => {
    const defaultValues = {
        integer: 0,
        array: [],
        string: "",
        boolean: false,
        number: 0,
        object: {},
    };
    const hasSchema = param.schema;
    const defaultValue = param.default ||
        param.minimum ||
        param.maximum ||
        defaultValues[param.type];
};
exports.getParamDefaultValue = getParamDefaultValue;
const parseParam = (param) => {
    /**
     * Convert an OpenAPI parameter to a key/value pair
     */
    // Save parameters by name and type.  Also save metadata like description
    return { [param.name]: (0, exports.getParamDefaultValue)(param) };
};
exports.parseParam = parseParam;
const valueFromSchema = (schema) => {
    /**
     * Generate a mock value based on the schema
     */
    return "";
};
exports.valueFromSchema = valueFromSchema;
const convertOpenApiParams = (params) => {
    /**
     * Converts params from a OpenAPI spec into httpParams
     */
    const [queryParams, pathParams] = (0, partition_1.default)(params, (param) => param.in === "query");
    const processedParams = queryParams.reduce((acc, param) => (Object.assign(Object.assign({}, acc), (0, exports.parseParam)(param))), {});
    return processedParams;
};
exports.convertOpenApiParams = convertOpenApiParams;
const getReqUrl = (contractRequest) => {
    /**
     * Takes the url components from a Contract and assembles them into a complete url string
     */
    const port = ""; // contractRequest.port ? `:${contractRequest.port}` : "";
    const params = (0, exports.convertContractParams)(contractRequest.params);
    return `${contractRequest.host}${port}${contractRequest.path}${params}`;
};
exports.getReqUrl = getReqUrl;
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
exports.convertHeaders = convertHeaders;
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
exports.findFailures = findFailures;
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
        headers: (0, exports.convertHeaders)(headers),
        body: input.bodyUsed ? yield input.json() : {},
    };
});
exports.convertResponse = convertResponse;
const compare = (response, contract) => __awaiter(void 0, void 0, void 0, function* () {
    /**
     * Compares a response from `fetch` to a Contract
     */
    const oath = contract.response;
    const _response = yield (0, exports.convertResponse)(response);
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
exports.compare = compare;
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
exports.fileExists = fileExists;
const getBackupFilename = (filename) => {
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
exports.getBackupFilename = getBackupFilename;
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
exports.validateSpec = validateSpec;
const processPaths = (data) => (acc, path) => {
    /**
     * Custom reducer for extracting data from an OpenAPI spec
     */
    const pathData = data.paths[path];
    // iterate over the keys for every method
    const methods = Object.keys(pathData);
    const result = methods.map((method) => {
        var _a;
        const methodData = pathData[method];
        const { summary, operationId, tags } = methodData;
        return {
            meta: Object.assign(Object.assign({}, data.meta), { summary,
                operationId,
                tags }),
            request: {
                host: data.host,
                // port: data.port,
                path,
                method,
                headers: (_a = methodData.responses[200]) === null || _a === void 0 ? void 0 : _a.headers, // Do I need to iterate this or do I only care about 20xs??
                params: (0, exports.convertOpenApiParams)(methodData.parameters),
            },
        };
    });
    return acc.concat(result);
};
exports.processPaths = processPaths;
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
        (0, exports.validateSpec)(specFile);
    }
    catch (_b) {
        return [];
    }
    const openApiSpec = yield (0, openapi_parser_1.dereference)(specFile);
    // get meta data - @todo this needs to happen inside a loop
    const meta = openApiSpec.info;
    // get request data
    const host = ((_a = openApiSpec.externalDocs) === null || _a === void 0 ? void 0 : _a.url) || "https://localhost";
    // const port = host?.slice(0, 5) === "https" ? 443 : 80;
    // iterate over the keys for every path
    const paths = Object.assign({}, openApiSpec.paths);
    //
    const globalData = {
        paths,
        meta,
        host,
        // port
    };
    const draftContract = (0, exports.processPaths)(globalData);
    const pathNames = Object.keys(paths);
    const contracts = pathNames.reduce(draftContract, []);
    return contracts;
});
exports.draftContracts = draftContracts;
