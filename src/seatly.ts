import fileLogger from "./file-logger";
import { end, start } from "./benchmark";
import { CliOptionsOutput, getCliOptions } from "./cli-options";

export interface SeatingPlan {
  config: SeatMapConfig;
  seatMap: SeatMap;
  center: TopCenterLocation;
}

type SeatMap = Map<number, boolean[]>;

export interface SeatMapConfig {
  rows: number;
  columns: number;
}

const defaultConfig: SeatMapConfig = {
  rows: 3,
  columns: 11,
};

type TopCenterLocation =
  | [number, number]
  | [[number, number], [number, number]];

/**
 * When picking the center spot we need to account whether the amount of columns
 * are even or uneven, if they are uneven, we can pick only one seat as the center
 * and when they are uneven, we need to pick the two seats at the center to really
 * distribute reservations evenly at the center.
 * @param config
 */
export const getTopCenterLocation = (
  config: SeatMapConfig,
): TopCenterLocation => {
  // uneven
  if (config.columns % 2 === 1) {
    return [0, Math.round(config.columns / 2) - 1];
  }
  //even
  return [
    [0, config.columns / 2 - 1],
    [0, config.columns / 2],
  ];
};

export const initSeatingPlan = (
  configInput?: Partial<SeatMapConfig>,
): SeatingPlan => {
  const config = { ...defaultConfig };
  if (configInput) {
    if (configInput.rows) config.rows = configInput.rows;
    if (configInput.columns) config.columns = configInput.columns;
  }
  if (config.rows < 1 || config.columns < 1) {
    throw new Error(
      "Invalid config, neither rows or columns can be less than 1: " +
        JSON.stringify(config),
    );
  }
  const seatMap = new Map<number, boolean[]>();
  for (let row = 0; row < config.rows; row++) {
    seatMap.set(row, new Array(config.columns).fill(false));
  }

  return {
    config,
    seatMap,
    center: getTopCenterLocation(config),
  };
};

export type SeatLocation = [number, number];

type SeatLocationInput = [string | undefined, string | undefined];

const isDecimal = (input: string): boolean => {
  return (
    !Number.isNaN(parseFloat(input)) &&
    Number.isFinite(Number(input)) &&
    input.includes(".")
  );
};

const isNegative = (input: string): boolean => {
  return input.startsWith("-");
};

const validateSeatLocation = (
  location: SeatLocationInput,
  seatingPlan: SeatingPlan,
): void => {
  const [row, column] = location;
  if (row === undefined || column === undefined) {
    throw new Error("Invalid input: " + location.toString());
  }
  if (isDecimal(row) || isDecimal(column)) {
    throw new Error(
      "Invalid input, no decimals allowed: " + location.toString(),
    );
  }
  if (isNegative(row) || isNegative(column)) {
    throw new Error(
      "Invalid input, no negative numbers allowed: " + location.toString(),
    );
  }

  const rowNumber = parseInt(row, 10);
  const columnNumber = parseInt(column, 10);
  if (Number.isNaN(rowNumber) || Number.isNaN(columnNumber)) {
    throw new Error("Invalid input: " + location.toString());
  }

  if (rowNumber < 1 || columnNumber < 1) {
    throw new Error(
      "Invalid location, location out of bounds: " + location.toString(),
    );
  }
  if (
    rowNumber > seatingPlan.config.rows ||
    columnNumber > seatingPlan.config.columns
  ) {
    throw new Error(
      "Invalid location, location out of bounds: " + location.toString(),
    );
  }
};

const validateSeatRange = (range: SeatRange) => {
  if (range.start[0] !== range.end[0]) {
    throw new Error("Only single-row ranges are supported.");
  }
  if (range.start[0] > range.end[0] || range.start[1] > range.end[1]) {
    throw new Error("Invalid range: " + JSON.stringify(range));
  }
};

export const parseSeatLocation = (
  input: string,
  seatingPlan: SeatingPlan,
): SeatLocation => {
  const regex = /^R(-?\d+(?:\.\d+)?)C(-?\d+(?:\.\d+)?)$/;
  const match = regex.exec(input);
  if (match) {
    validateSeatLocation([match[1], match[2]], seatingPlan);
    const row = parseInt(match[1], 10);
    const column = parseInt(match[2], 10);
    return [row - 1, column - 1];
  }
  throw new Error("Invalid input: " + input.toString());
};

export const isSeatAvailable = (
  seatingPlan: SeatingPlan,
  location: SeatLocation,
): boolean => {
  const { seatMap, config } = seatingPlan;
  const [row, column] = location;
  if (row < 0 || row >= config.rows || column < 0 || column >= config.columns) {
    throw new Error(
      "Invalid location, location out of bounds: " + location.toString(),
    );
  }
  return !seatMap.get(row)?.[column];
};

export const reserveSeat = (
  seatingPlan: SeatingPlan,
  location: SeatLocation,
): SeatingPlan => {
  const { seatMap, config, center } = seatingPlan;
  const [rowId, columnId] = location;

  if (!isSeatAvailable(seatingPlan, location)) {
    throw new Error("Seat is not available: " + location.toString());
  }

  const oldRow = seatMap.get(rowId);
  if (!oldRow) {
    throw new Error("Row not found: " + rowId.toString());
  }

  const newRow = [...oldRow];
  newRow[columnId] = true;

  const newSeatMap = new Map(seatMap);
  newSeatMap.set(rowId, newRow);

  return { config, seatMap: newSeatMap, center };
};

export const reserveRange = (
  seatingPlan: SeatingPlan,
  range: SeatRange,
): SeatingPlan => {
  validateSeatRange(range);

  let newPlan = seatingPlan;
  for (let j = range.start[1]; j <= range.end[1]; j++) {
    newPlan = reserveSeat(newPlan, [range.start[0], j]);
  }
  return newPlan;
};

/**
 * When thinking about this function and how it should behave,
 * my opinion is that if the initial input is already wrong,
 * we might as well abort the entire operation, since the reserved seats
 * are arguably more important to the event organizer so that they don't get
 * sold to other people who are trying to make reservations.
 */
export const handleInitialReservations = (
  seatingPlan: SeatingPlan,
  initialReservations: string[],
): SeatingPlan => {
  let currentPlan = seatingPlan;

  for (const reservation of initialReservations) {
    const location = parseSeatLocation(reservation, currentPlan);
    currentPlan = reserveSeat(currentPlan, location);
  }

  return currentPlan;
};

export interface SeatRange {
  start: SeatLocation;
  end: SeatLocation;
  center?: SeatLocation;
  output?: string;
  score?: number;
}

export const getManhattanDistance = (
  location1: SeatLocation | TopCenterLocation,
  location2: SeatLocation,
): number => {
  /**
   * If the center is composed of 2 squares (even seatMap), we calculate the distance
   * to both, and return the smallest of the two.
   */
  if (Array.isArray(location1[0]) && Array.isArray(location1[1])) {
    const [left, right] = location1;
    const [leftRow, leftColumn] = left;
    const [rightRow, rightColumn] = right;
    const [destinationRow, destinationColumn] = location2;
    if (
      (leftRow === destinationRow && leftColumn === destinationColumn) ||
      (rightRow === destinationRow && rightColumn === destinationColumn)
    ) {
      return 0;
    }
    const leftDistance =
      Math.abs(leftRow - destinationRow) +
      Math.abs(leftColumn - destinationColumn);
    const rightDistance =
      Math.abs(rightRow - destinationRow) +
      Math.abs(rightColumn - destinationColumn);
    return Math.min(leftDistance, rightDistance);
  } else {
    const l1 = location1 as SeatLocation;
    const l2 = location2 as SeatLocation;
    const [row1, column1] = l1;
    const [row2, column2] = l2;
    return Math.floor(Math.abs(row1 - row2) + Math.abs(column1 - column2));
  }
};

export const getSeatRangeInStringFormat = (range: SeatRange): string => {
  if (range.start[0] === range.end[0] && range.start[1] === range.end[1]) {
    return `R${range.start[0] + 1}C${range.start[1] + 1}`;
  }
  return `R${range.start[0] + 1}C${range.start[1] + 1} - R${range.end[0] + 1}C${range.end[1] + 1}`;
};

/**
 * Optimization #2
 * Originally a pure brute force algorithm, this was refactored to use
 * the Window technique, decreasing the amount of iterations needed. (Still brute forcing it lol)
 *
 * Todo:
 * Add more optimizations. I'm sure given enough time, I can think of
 * a better way of doing this, until then this will have to do. I did took a stab
 * at optimizing it a few times, but anything I tried wasn't really working well for some edge cases
 * so I decided for the sake of getting things working correctly and given the limited amount of time,
 * to keep it as it is.
 */
export const findAllPossibleSeatRanges = (
  seatingPlan: SeatingPlan,
  amountOfSeats: number,
): SeatRange[] => {
  const begin = start();
  const topCenter = seatingPlan.center;
  const seatRanges: SeatRange[] = [];
  const { seatMap, config } = seatingPlan;
  let ticks = 0;
  for (let rowId = 0; rowId < config.rows; rowId++) {
    const row = seatMap.get(rowId);
    if (!row) continue;
    if (row.every((seat) => seat)) continue;
    for (
      let columnId = 0;
      columnId <= config.columns - amountOfSeats;
      columnId++
    ) {
      ticks++;
      let isAvailable = true;
      for (let offset = 0; offset < amountOfSeats; offset++) {
        const column = columnId + offset;
        if (column >= config.columns || row[column]) {
          isAvailable = false;
          break;
        }
      }
      if (isAvailable) {
        let range: SeatRange = {
          start: [rowId, columnId],
          end: [rowId, columnId + amountOfSeats - 1],
        };
        range.output = getSeatRangeInStringFormat(range);
        range.score = 0;
        /**
         * Initially I calculated the center of the range to try to center reservations as much as possible.
         * This kind of worked, but was not precise enough; Sometimes picking other ranges when there was an
         * obvious better location (usually just off by one seat). This was the same predicament of having
         * even number seating columns. To fix this, I decided that all the seats mattered equally, so now we have a score
         * calculation instead of a distance calculation, which is just basically the sum of the distances
         * of each reservation seat to the center. This gave all the seats equal priority causing it to naturally
         * find the most centered location for all the seats.
         */
        for (let i = 0; i < amountOfSeats; i++) {
          ticks++;
          const distance = getManhattanDistance(topCenter, [
            rowId,
            columnId + i,
          ]);
          range.score += distance;
        }
        seatRanges.push(range);
      }
    }
  }

  const finish = end(begin);
  fileLogger.log("findAllPossibleSeatRanges", {
    ticks,
    seatRangesFound: seatRanges.length,
    time: `${finish[0]} s, ${finish[1]} ms`,
  });

  return seatRanges;
};

export const findBestSeatRange = (
  seatingPlan: SeatingPlan,
  amountOfSeats: number,
): SeatRange => {
  const begin = start();
  let ticks = 0;

  const possibleRanges = findAllPossibleSeatRanges(seatingPlan, amountOfSeats);

  if (possibleRanges.length === 0) {
    throw new Error("No possible ranges found: " + amountOfSeats.toString());
  }

  /**
   * Optimization #1
   * Initially this was just a sort, but was refactored to use a reduce function,
   * which only needs to iterate once through the available ranges to get the range
   * with the lowest distance.
   *
   * Improvement:
   * After some testing, I think the user would rather be on the closest seat
   * to the front of the event, even if another seat on the row behind has the same distance,
   * so this was refactored to prefer front row seats that have the same distance from the
   * center as the one behind the center.
   */
  const bestRange = possibleRanges.reduce((best, curr) => {
    ticks++;
    const bestScore = best.score ?? Infinity;
    const currScore = curr.score ?? Infinity;

    if (currScore < bestScore) {
      return curr;
    }

    // break ties prefer top row
    if (currScore === bestScore) {
      const currRow = curr.start[0];
      const bestRow = best.start[0];
      if (currRow < bestRow) {
        return curr;
      }
    }

    return best;
  });

  const finish = end(begin);
  fileLogger.log("findBestSeatRange", {
    ticks,
    time: `${finish[0]} s, ${finish[1]} ms`,
  });

  return bestRange;
};

/**
 * Todo: Optimization Refactor
 * Instead of iterating trough the entire seatMap, we could
 * store counters that keep track of available seats per row
 * and we just need to add those up at the end.
 */
export const getAvailableSeatCount = (seatingPlan: SeatingPlan): number => {
  const { seatMap, config } = seatingPlan;
  let count = 0;
  for (let rowId = 0; rowId < config.rows; rowId++) {
    const row = seatMap.get(rowId);
    if (!row) continue;
    for (let columnId = 0; columnId < config.columns; columnId++) {
      if (!row[columnId]) count++;
    }
  }
  return count;
};

/**
 * This is the main function, it accepts an cliOverrides parameter
 * that is used mostly on the unit tests to test for different
 * seatMap sizes, and other things.
 */
export const Seatly = (
  lines: string[],
  cliOverrides?: Partial<CliOptionsOutput>,
): string[] => {
  const { rows, columns } = getCliOptions(cliOverrides);
  let seatingPlan = initSeatingPlan({ rows, columns });
  const reservedLine = lines.shift()?.trim();
  if (reservedLine) {
    try {
      const reservedSeats = reservedLine.split(" ");
      seatingPlan = handleInitialReservations(seatingPlan, reservedSeats ?? []);
    } catch (e) {
      fileLogger.log("Failed to handle initial reservations: " + reservedLine);
      fileLogger.log(e as Error);
    }
  }
  const requests = lines.map((line) => line.trim());
  const output: string[] = [];
  for (const inputAmount of requests) {
    try {
      const amount = parseInt(inputAmount, 10);
      if (Number.isNaN(amount)) {
        output.push("Not Available");
        fileLogger.log("Invalid input: " + inputAmount);
        continue;
      }
      const bestRange = findBestSeatRange(seatingPlan, amount);
      seatingPlan = reserveRange(seatingPlan, bestRange);
      output.push(getSeatRangeInStringFormat(bestRange));
    } catch (e) {
      output.push("Not Available");
      fileLogger.log("Not Available: " + inputAmount);
      fileLogger.log(e as Error);
    }
  }
  output.push(getAvailableSeatCount(seatingPlan).toString());
  return output;
};
