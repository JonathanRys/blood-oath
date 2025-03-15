const fs = await import("fs");

const { validate, dereference, bundle, parse } = await import(
  "@readme/openapi-parser"
);

const yamlDoc = "./sample-spec.yml";

const openApiSpec = await dereference(yamlDoc);

const host = openApiSpec.externalDocs?.url;
const port = host?.slice(0, 5) === "https" ? 443 : 80;
const paths = { ...openApiSpec.paths };

const pathNames = Object.keys(paths);

const contracts = pathNames.reduce((acc, path) => {
  const methods = Object.keys(paths[path]);
  console.log("methods", methods);
  const result = methods.map((method) => {
    const r = paths[path][method];
    console.log("r", r);
    return {
      host,
      port,
      path,
      method,
      headers: r.responses[200]?.headers,
      params: r.parameters,
    };
  });
  console.log("acc", acc);
  console.log("result", result);
  return acc.concat(result);
}, []);

console.log("\n\n\ncontracts", contracts);
