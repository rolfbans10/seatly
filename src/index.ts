import * as readline from "node:readline";
import { Seatly } from "./seatly";
import logger from "./logger";
import { end, start } from "./benchmark";
import { getCliOptions } from "./cli-options";

const lines: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => lines.push(line));
rl.on("close", () => {
  const execStart = start();
  logger.applyConfig(getCliOptions());
  if (lines.length < 1) {
    logger.log("No Input provided.");
    return;
  }
  const output = Seatly(lines);
  console.log(output.join("\n"));
  logger.log("Result: ", output);
  const execEnd = end(execStart);
  logger.log(
    "Finished, execution time: " + execEnd[0] + "s " + execEnd[1] + "ms",
  );
});
