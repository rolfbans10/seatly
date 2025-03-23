import * as readline from "node:readline";
import {
  findBestSeatRange,
  getSeatRangeInStringFormat,
  handleInitialReservations,
  initSeatingPlan,
  reserveRange,
} from "./reservation";
import Logger from "./logger";

const lines: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => lines.push(line));
rl.on("close", () => {
  const execStart = process.hrtime();
  const logger = new Logger({ logStackTraces: true });
  if (lines.length < 1) {
    logger.log("No Input provided.");
    return;
  }
  let seatingPlan = initSeatingPlan();
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
  const requests = lines.map((line) => parseInt(line.trim()));
  const output: string[] = [];
  for (const amount of requests) {
    try {
      const bestRange = findBestSeatRange(seatingPlan, amount);
      reserveRange(seatingPlan, bestRange);
      output.push(getSeatRangeInStringFormat(bestRange));
    } catch (e) {
      output.push("Not Available");
      logger.log("Not Available: " + amount);
      logger.log(e as Error);
    }
  }
  console.log(output.join("\n"));
  logger.log("Result: ", output);
  const execEnd = process.hrtime(execStart);
  logger.log(
    "Finished, execution time: " +
      execEnd[0] +
      "s " +
      (execEnd[1] / 1_000_000).toFixed(0) +
      "ms",
  );
});
