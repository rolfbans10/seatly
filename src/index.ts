import * as readline from "node:readline";
import {
  findBestSeatRange,
  getSeatRangeInStringFormat,
  handleInitialReservations,
  initSeatingPlan,
  reserveRange,
} from "./reservation";

const lines: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => lines.push(line));
rl.on("close", () => {
  if (lines.length < 1) {
    console.log("No Input provided.");
    return;
  }
  let seatingPlan = initSeatingPlan();
  const reservedLine = lines.shift()?.trim();
  if (reservedLine?.length || 0 > 0) {
    const reservedSeats = reservedLine?.split(" ");
    seatingPlan = handleInitialReservations(seatingPlan, reservedSeats ?? []);
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
    }
  }
  console.log(output.join("\n"));
});
