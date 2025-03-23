import logger from "./logger";
import { end, start } from "./benchmark";

export interface SeatingPlan {
  config: SeatMapConfig;
  seatMap: SeatMap;
  center: SeatLocation;
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

export const getTopCenterLocation = (config: SeatMapConfig): SeatLocation => {
  return [0, Math.round(config.columns / 2) - 1];
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
  const isAvailable = isSeatAvailable(seatingPlan, location);
  if (!isAvailable) {
    throw new Error("Seat is not available: " + location.toString());
  }
  const { seatMap } = seatingPlan;
  const [rowId, columnId] = location;
  const row = seatMap.get(rowId);
  if (!row) {
    throw new Error("Row not found: " + rowId.toString());
  }
  row[columnId] = true;
  return seatingPlan;
};

export const reserveRange = (
  seatingPlan: SeatingPlan,
  range: SeatRange,
): SeatingPlan => {
  if (range.start[0] !== range.end[0]) {
    throw new Error("Only single-row ranges are supported.");
  }
  if (range.start[0] > range.end[0] || range.start[1] > range.end[1]) {
    throw new Error("Invalid range: " + JSON.stringify(range));
  }
  for (let i = range.start[0]; i <= range.end[0]; i++) {
    for (let j = range.start[1]; j <= range.end[1]; j++) {
      seatingPlan = reserveSeat(seatingPlan, [i, j]);
    }
  }
  return seatingPlan;
};

export const handleInitialReservations = (
  seatingPlan: SeatingPlan,
  initialReservations: string[],
): SeatingPlan => {
  const initialLocations = initialReservations.map((reservation) =>
    parseSeatLocation(reservation, seatingPlan),
  );
  for (let location of initialLocations) {
    if (isSeatAvailable(seatingPlan, location)) {
      seatingPlan = reserveSeat(seatingPlan, location);
    } else {
      throw new Error("Seat was already reserved: " + location.toString());
    }
  }
  return seatingPlan;
};

export interface SeatRange {
  start: SeatLocation;
  end: SeatLocation;
  center?: SeatLocation;
  output?: string;
  score?: number;
}

export const getManhattanDistance = (
  location1: SeatLocation,
  location2: SeatLocation,
): number => {
  const [row1, column1] = location1;
  const [row2, column2] = location2;
  return Math.floor(Math.abs(row1 - row2) + Math.abs(column1 - column2));
};

export const getSeatRangeInStringFormat = (range: SeatRange): string => {
  if (range.start[0] === range.end[0] && range.start[1] === range.end[1]) {
    return `R${range.start[0] + 1}C${range.start[1] + 1}`;
  }
  return `R${range.start[0] + 1}C${range.start[1] + 1} - R${range.end[0] + 1}C${range.end[1] + 1}`;
};

export const getCenterFromRange = (range: SeatRange): SeatLocation => {
  return [
    Math.round((range.start[0] + range.end[0]) / 2),
    Math.round((range.start[1] + range.end[1]) / 2),
  ];
};

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
        seatRanges.push({
          start: [rowId, columnId],
          end: [rowId, columnId + amountOfSeats - 1],
        });
      }
    }
  }

  for (let range of seatRanges) {
    ticks++;
    range.output = getSeatRangeInStringFormat(range);
    range.center = getCenterFromRange(range);
    range.score = getManhattanDistance(topCenter, range.center);
  }
  const finish = end(begin);
  logger.log("findAllPossibleSeatRanges", {
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
  logger.log("findBestSeatRange", {
    ticks,
    time: `${finish[0]} s, ${finish[1]} ms`,
  });

  return bestRange;
};
