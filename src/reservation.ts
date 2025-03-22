import * as sea from "node:sea";

export interface SeatingPlan {
  config: SeatMapConfig;
  seatMap: SeatMap;
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

export const initSeatingPlan = (
  config: SeatMapConfig = defaultConfig,
): SeatingPlan => {
  if (config.rows < 1 || config.columns < 1) {
    throw new Error("Invalid config: " + JSON.stringify(config));
  }
  const seatMap = new Map<number, boolean[]>();
  for (let row = 0; row < config.rows; row++) {
    seatMap.set(row, new Array(config.columns).fill(false));
  }
  return {
    config,
    seatMap,
  };
};

export type SeatLocation = [number, number];

export const parseSeatLocation = (input: string): SeatLocation => {
  const regex = /^R([0-9]+)C([0-9]+)$/;
  const match = regex.exec(input);
  if (match) {
    const row = parseInt(match[1]) - 1;
    const column = parseInt(match[2]) - 1;
    if (row < 0 || column < 0) {
      throw new Error("Invalid input: " + input.toString());
    }
    return [row, column];
  }
  throw new Error("Invalid input: " + input.toString());
};

export const isSeatAvailable = (
  seatingPlan: SeatingPlan,
  location: SeatLocation,
): boolean => {
  const { seatMap, config } = seatingPlan;
  const [row, column] = location;
  if (
    !(row >= 0 && row < config.rows && column >= 0 && column < config.columns)
  ) {
    throw new Error("Invalid location: " + location.toString());
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
  const initialLocations = initialReservations.map(parseSeatLocation);
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

export const getTopCenterLocation = (
  seatingPlan: SeatingPlan,
): SeatLocation => {
  return [0, Math.round(seatingPlan.config.columns / 2) - 1];
};

export const getSeatRangeInStringFormat = (range: SeatRange): string => {
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
  const topCenter = getTopCenterLocation(seatingPlan);
  const seatRanges: SeatRange[] = [];
  const { seatMap, config } = seatingPlan;
  for (let rowId = 0; rowId < config.rows; rowId++) {
    const row = seatMap.get(rowId);
    if (!row) continue;
    for (let columnId = 0; columnId < config.columns; columnId++) {
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
    range.output = getSeatRangeInStringFormat(range);
    range.center = getCenterFromRange(range);
    range.score = getManhattanDistance(topCenter, range.center);
  }

  return seatRanges;
};

export const findBestSeatRange = (
  seatingPlan: SeatingPlan,
  amountOfSeats: number,
): SeatRange => {
  let possibleRanges: SeatRange[] = findAllPossibleSeatRanges(
    seatingPlan,
    amountOfSeats,
  );

  if (possibleRanges.length === 0) {
    throw new Error("No possible ranges found: " + amountOfSeats.toString());
  }

  possibleRanges = possibleRanges.sort((a, b) => {
    const scoreA = a.score !== undefined ? a.score : Number.MAX_SAFE_INTEGER;
    const scoreB = b.score !== undefined ? b.score : Number.MAX_SAFE_INTEGER;
    return scoreA - scoreB;
  });

  return possibleRanges[0];
};
