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
  const reservedSeats = reservedLine?.split(" ");
  seatingPlan = handleInitialReservations(seatingPlan, reservedSeats ?? []);
  const requests = lines.map((line) => parseInt(line.trim()));

  try {
    for (const amount of requests) {
      const bestRange = findBestSeatRange(seatingPlan, amount);
      reserveRange(seatingPlan, bestRange);
      console.log(getSeatRangeInStringFormat(bestRange));
    }
  } catch (e) {
    console.error("Not Available");
  }
});
