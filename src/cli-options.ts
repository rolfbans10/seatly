import minimist from "minimist";
import * as path from "node:path";

interface CliOptionsInput {
  rows?: string;
  r?: string;
  columns?: string;
  c?: string;
  help?: boolean;
  h?: boolean;
  logFile?: string;
}

const args = minimist<CliOptionsInput>(process.argv.slice(2));
if (args.help || args.h) {
  console.log(`
Usage:
  node index.js [options]
Options:
  --rows, -r <number>        Number of rows in the seating plan
  --columns, -c <number>     Number of columns in the seating plan
  --logFile, -l <string>     Path to the log file
  --help, -h                 Show this help message  
  `);
  process.exit(0);
}

interface CliOptionsOutput {
  rows?: number;
  columns?: number;
  logFile?: string;
}

const output: CliOptionsOutput = {};

const validateNumberGreaterThanZero = (
  input: string | undefined,
  name: string,
) => {
  if (input) {
    const number = parseInt(input, 10);
    if (Number.isNaN(number) || number < 1) {
      console.log(`Invalid ${name} input: ${number}`);
      process.exit(1);
    }
    return number;
  }
  return undefined;
};

if (args.rows || args.r) {
  const inputRows = args.rows ?? args.r;
  const resultRows = validateNumberGreaterThanZero(inputRows, "rows");
  if (resultRows) {
    output.rows = resultRows;
  }
}

if (args.columns || args.c) {
  const inputColumns = args.columns ?? args.c;
  const resultColumns = validateNumberGreaterThanZero(inputColumns, "columns");
  if (resultColumns) {
    output.columns = resultColumns;
  }
}

if (args.logFile) {
  if (!path.isAbsolute(args.logFile)) {
    args.logFile = path.resolve(args.logFile);
  }
  output.logFile = args.logFile;
}

export const cliOptions = output;
