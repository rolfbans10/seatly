import * as readline from "node:readline";
import {
  findBestSeatRange,
  getSeatRangeInStringFormat,
  handleInitialReservations,
  initSeatingPlan,
  reserveRange,
} from "./reservation";
import logger from "./logger";
import { cliOptions } from "./cli-options";
import { end, start } from "./benchmark";

const lines: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => lines.push(line));
rl.on("close", () => {
  const execStart = start();
  logger.applyConfig(cliOptions);
  if (lines.length < 1) {
    logger.log("No Input provided.");
    return;
  }
  const { rows, columns } = cliOptions;
  let seatingPlan = initSeatingPlan({ rows, columns });
  const reservedLine = lines.shift()?.trim();
  if (reservedLine) {
    try {
      const reservedSeats = reservedLine.split(" ");
      seatingPlan = handleInitialReservations(seatingPlan, reservedSeats ?? []);
    } catch (e) {
      logger.log("Failed to handle initial reservations: " + reservedLine);
      logger.log(e as Error);
    }
  }
  const requests = lines.map((line) => line.trim());
  const output: string[] = [];
  for (const inputAmount of requests) {
    try {
      const amount = parseInt(inputAmount, 10);
      if (Number.isNaN(amount)) {
        output.push("Not Available");
        logger.log("Invalid input: " + inputAmount);
        continue;
      }
      const bestRange = findBestSeatRange(seatingPlan, amount);
      reserveRange(seatingPlan, bestRange);
      output.push(getSeatRangeInStringFormat(bestRange));
    } catch (e) {
      output.push("Not Available");
      logger.log("Not Available: " + inputAmount);
      logger.log(e as Error);
    }
  }
  console.log(output.join("\n"));
  logger.log("Result: ", output);
  const execEnd = end(execStart);
  logger.log(
    "Finished, execution time: " + execEnd[0] + "s " + execEnd[1] + "ms",
  );
});
