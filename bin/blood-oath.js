#!/usr/bin/env node

// ############
// UTILS
const parseArg = (arg) => {
  const splitArg = arg.split("=");
  return { switch: splitArg[0], value: splitArg?.[1] };
};

const verifyContracts = (filename) => {
  console.log("Finding contracts...");
  // ingest saved contracts
  //   const contracts = loadContracts;
  if (!contracts.length) {
    console.log("No contracts found.");
    console.log("Try specifying a file name or loading an OpenAPI spec.");
    return;
  }
  console.log(`Verifying ${contracts.length} contracts...`);
  // verify contracts

  console.log("Results:");
  // print results
};
const cleanContracts = (filename) => {};
const signContracts = (filename) => {};
// ############

const contractFile = "./api.contracts.dat";

let filename = contractFile;
let specFile;
// process command line arguments
// First two arguments are ignored
//   0: path to Node,
//   1: path to this file
const args = process.argv.slice(2); //.map((val) => val.replace(/^-/, ""));
const tasks = [];
const parsedArgs = args.map(parseArg);
const switches = parsedArgs.map((arg) => arg.switch);
parsedArgs.forEach((arg) => {
  switch (arg.switch) {
    case "-f":
    case "-file":
    case "file":
      filename = arg.value;
      break;
    case "-spec":
    case "spec":
      specFile = arg.value;
      break;
    case "-c":
    case "clean":
    case "-clean":
      // remove invalid/unsigned contracts
      tasks.shift(cleanContracts);
      break;
    case "-s":
      // if a value was given, assume they were trying to supply and value for spec
      if (arg.value) return;
    case "snapshot":
    case "-snapshot":
      // make sure a spec file is specified and no other switches were given
      if (!(switches.includes("spec") || switches.includes("-spec"))) {
        console.log(
          `Please provide an OpenAPI spec file in YML or JSON format: blood-oath ${arg.value} -spec=<filename>`
        );
        return;
      }
      if (switches.length !== 2) {
        console.log(`Invalid combination of switches ${switches}`);
        return;
      }
      // save snapshots of responses for all unsigned contracts / "sign" them
      tasks.push(signContracts);
      break;
    case "-v":
    case "verify":
    case "-verify":
      // verify saved contracts
      tasks.push(verifyContracts);
      break;
    default:
      console.log(`Invalid switch: ${arg.switch}`);
      throw new TypeError("Unknown argument");
  }

  // -f -file - specify a path to a contract file
  // -spec - specify a path to an OpenAPI spec file
});

tasks.forEach((task) => task(filename));
