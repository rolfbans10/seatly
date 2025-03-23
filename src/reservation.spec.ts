import {
  findAllPossibleSeatRanges,
  findBestSeatRange,
  getCenterFromRange,
  getManhattanDistance,
  getSeatRangeInStringFormat,
  getTopCenterLocation,
  handleInitialReservations,
  initSeatingPlan,
  isSeatAvailable,
  parseSeatLocation,
  reserveRange,
  reserveSeat,
  SeatingPlan,
  SeatLocation,
  SeatMapConfig,
  SeatRange,
} from "./reservation";
import * as sea from "node:sea";

describe("reservation", () => {
  describe("initSeatingPlan", () => {
    it("initializes the seat map", () => {
      const myConfig: SeatMapConfig = {
        rows: 3,
        columns: 11,
      };

      const seatingPlan = initSeatingPlan(myConfig);
      const { seatMap, config } = seatingPlan;
      expect(config).toBeDefined();
      expect(config.rows).toBe(3);
      expect(config.columns).toBe(11);
      expect(seatMap).toBeDefined();
      expect(seatMap.size).toBe(3);
      expect(seatMap.get(0)).toBeDefined();
      expect(seatMap.get(0)?.length).toBe(11);
      expect(seatMap.get(0)?.[0]).toBe(false);
    });
  });
  describe("parseSeatLocation", () => {
    it("returns the seat location", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const input = "R1C1";
      const expected = [0, 0];
      const actual = parseSeatLocation(input, seatingPlan);
      expect(actual).toEqual(expected);
    });
    it("returns the seat location large numbers", () => {
      const seatingPlan = initSeatingPlan({ rows: 2000, columns: 2000 });
      const input = "R1001C1005";
      const expected = [1000, 1004];
      const actual = parseSeatLocation(input, seatingPlan);
      expect(actual).toEqual(expected);
    });
    it("throws an error with input as zero", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const input = "R0C0";
      expect(() => parseSeatLocation(input, seatingPlan)).toThrow();
    });
    it("throws an error for invalid input", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const input = "R1C";
      expect(() => parseSeatLocation(input, seatingPlan)).toThrow();
    });
    it("throws an error for invalid input 2", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const input = "R1C1A";
      expect(() => parseSeatLocation(input, seatingPlan)).toThrow();
    });
  });
  describe("isSeatAvailable", () => {
    it("returns true if the seat is available", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const location: SeatLocation = [0, 0];
      expect(isSeatAvailable(seatingPlan, location)).toBe(true);
    });
    it("returns false if the seat is not available", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const { seatMap } = seatingPlan;
      const row = seatMap.get(0);
      if (row) {
        row[0] = true;
      }
      const location: SeatLocation = [0, 0];
      expect(isSeatAvailable(seatingPlan, location)).toBe(false);
    });
  });
  describe("reserveSeat", () => {
    it("reserves a seat", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const location: SeatLocation = [0, 0];
      expect(isSeatAvailable(seatingPlan, location)).toBe(true);
      const actual = reserveSeat(seatingPlan, location);
      expect(isSeatAvailable(actual, location)).toBe(false);
    });
    it("throws an error if the seat is already reserved", () => {
      let seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const location: SeatLocation = [0, 0];
      seatingPlan = reserveSeat(seatingPlan, location);
      expect(() => reserveSeat(seatingPlan, location)).toThrow();
    });
    it("throws an error if the seat is out of bounds", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const location: SeatLocation = [0, 12];
      expect(() => reserveSeat(seatingPlan, location)).toThrow();
    });
  });
  describe("reserveRange", () => {
    it("reserves a range of seats", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const range: SeatRange = {
        start: [0, 1],
        end: [0, 5],
      };
      expect(isSeatAvailable(seatingPlan, range.start)).toBe(true);
      expect(isSeatAvailable(seatingPlan, range.end)).toBe(true);
      const actual = reserveRange(seatingPlan, range);
      expect(isSeatAvailable(actual, range.start)).toBe(false);
      expect(isSeatAvailable(actual, range.end)).toBe(false);
    });
    it("throws an error if the range is invalid", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const range: SeatRange = {
        start: [0, 1],
        end: [0, 0],
      };
      expect(() => reserveRange(seatingPlan, range)).toThrow();
    });
    it("throws an error if the range is invalid 2", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const range: SeatRange = {
        start: [0, 1],
        end: [0, 12],
      };
      expect(() => reserveRange(seatingPlan, range)).toThrow();
    });
  });
  describe("handleInitialReservations", () => {
    it("reserves the initial reservations", () => {
      const input = ["R1C1", "R2C2"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const actual = handleInitialReservations(seatingPlan, input);
      expect(isSeatAvailable(actual, [0, 0])).toBe(false);
      expect(isSeatAvailable(actual, [1, 1])).toBe(false);
      expect(isSeatAvailable(actual, [2, 2])).toBe(true);
      expect(isSeatAvailable(actual, [0, 1])).toBe(true);
    });
    it("throws an error if a seat is already reserved", () => {
      const input = ["R1C1", "R1C1"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      expect(() => handleInitialReservations(seatingPlan, input)).toThrow();
    });
    it("throws an error if a seat is out of bounds", () => {
      const input = ["R1C12", "R2C2"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      expect(() => handleInitialReservations(seatingPlan, input)).toThrow();
    });
    it("throws an error if the input is invalid", () => {
      const input = ["R1C1A", "R2C2"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      expect(() => handleInitialReservations(seatingPlan, input)).toThrow();
    });
    it("throws an error if the input is invalid 2", () => {
      const input = ["R1C1", "R2C0"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      expect(() => handleInitialReservations(seatingPlan, input)).toThrow();
    });
    it("throws an error if the input is invalid 3", () => {
      const input = ["R1C1", "R7C2"];
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      expect(() => handleInitialReservations(seatingPlan, input)).toThrow();
    });
  });
  describe("getManhattanDistance", () => {
    it("returns the manhattan distance", () => {
      const location1: SeatLocation = [0, 0];
      const location2: SeatLocation = [0, 1];
      const expected = 1;
      const actual = getManhattanDistance(location1, location2);
      expect(actual).toBe(expected);
    });
    it("returns the manhattan distance 2", () => {
      const location1: SeatLocation = [0, 0];
      const location2: SeatLocation = [1, 1];
      const expected = 2;
      const actual = getManhattanDistance(location1, location2);
      expect(actual).toBe(expected);
    });
    it("returns the manhattan distance 3", () => {
      const location1: SeatLocation = [3, 5];
      const location2: SeatLocation = [10, 10];
      const expected = 12;
      const actual = getManhattanDistance(location1, location2);
      expect(actual).toBe(expected);
    });
    it("returns the manhattan distance 4", () => {
      const location1: SeatLocation = [0, 0];
      const location2: SeatLocation = [1, 4];
      const expected = 5;
      const actual = getManhattanDistance(location1, location2);
      expect(actual).toBe(expected);
    });
    it("returns the manhattan distance 5", () => {
      const location1: SeatLocation = [0, 1];
      const location2: SeatLocation = [0, 1];
      const expected = 0;
      const actual = getManhattanDistance(location1, location2);
      expect(actual).toBe(expected);
    });
  });

  describe("getTopCenterLocation", () => {
    it("returns the top center location", () => {
      const seatingPlan = initSeatingPlan({ rows: 3, columns: 11 });
      const expected: SeatLocation = [0, 5];
      const actual = getTopCenterLocation(seatingPlan.config);
      expect(actual).toEqual(expected);
    });
    it("returns the top center location 2", () => {
      const seatingPlan = initSeatingPlan({ rows: 900, columns: 999 });
      const expected: SeatLocation = [0, 499];
      const actual = getTopCenterLocation(seatingPlan.config);
      expect(actual).toEqual(expected);
    });
    it("returns the top center location 3", () => {
      const seatingPlan = initSeatingPlan({ rows: 900, columns: 12345 });
      const expected: SeatLocation = [0, 6172];
      const actual = getTopCenterLocation(seatingPlan.config);
      expect(actual).toEqual(expected);
    });
    it("returns the top center location 4", () => {
      const seatingPlan = initSeatingPlan({ rows: 900, columns: 3 });
      const expected: SeatLocation = [0, 1];
      const actual = getTopCenterLocation(seatingPlan.config);
      expect(actual).toEqual(expected);
    });
  });
  describe("getSeatRangeInStringFormat", () => {
    it("returns the seat range in string format", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 2],
      };
      const expected = "R1C1 - R1C3";
      const actual = getSeatRangeInStringFormat(range);
      expect(actual).toEqual(expected);
    });
    it("returns the seat range in string format 2", () => {
      const range: SeatRange = {
        start: [3, 5],
        end: [3, 8],
      };
      const expected = "R4C6 - R4C9";
      const actual = getSeatRangeInStringFormat(range);
      expect(actual).toEqual(expected);
    });
    it("returns the correct format if range is only one seat", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 0],
      };
      const expected = "R1C1";
      const actual = getSeatRangeInStringFormat(range);
      expect(actual).toEqual(expected);
    });
  });
  describe("getCenterFromRange", () => {
    it("returns the center of the range", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 2],
      };
      const expected: SeatLocation = [0, 1];
      const actual = getCenterFromRange(range);
      expect(actual).toEqual(expected);
    });
    it("returns the center of the range 2", () => {
      const range: SeatRange = {
        start: [3, 5],
        end: [3, 8],
      };
      const expected: SeatLocation = [3, 7];
      const actual = getCenterFromRange(range);
      expect(actual).toEqual(expected);
    });
    it("returns the center of the range 3", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 1],
      };
      const expected: SeatLocation = [0, 1];
      const actual = getCenterFromRange(range);
      expect(actual).toEqual(expected);
    });
    it("returns the center of the range 4", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 0],
      };
      const expected: SeatLocation = [0, 0];
      const actual = getCenterFromRange(range);
      expect(actual).toEqual(expected);
    });
    it("returns the center of the range 5", () => {
      const range: SeatRange = {
        start: [0, 0],
        end: [0, 10],
      };
      const expected: SeatLocation = [0, 5];
      const actual = getCenterFromRange(range);
      expect(actual).toEqual(expected);
    });
  });
  describe("findAllPossibleSeatRanges", () => {
    it("returns all possible seat ranges", () => {
      const seatingPlan = initSeatingPlan({ rows: 1, columns: 3 });
      const seatRanges: SeatRange[] = findAllPossibleSeatRanges(seatingPlan, 3);
      const expected: SeatRange[] = [
        {
          center: [0, 1],
          output: "R1C1 - R1C3",
          start: [0, 0],
          end: [0, 2],
          score: 0,
        },
      ];
      expect(seatRanges).toEqual(expected);
    });
    it("returns all possible seat ranges 2", () => {
      const seatingPlan = initSeatingPlan({ rows: 1, columns: 3 });
      const seatRanges: SeatRange[] = findAllPossibleSeatRanges(seatingPlan, 2);
      const expected: SeatRange[] = [
        {
          center: [0, 1],
          output: "R1C1 - R1C2",
          start: [0, 0],
          end: [0, 1],
          score: 0,
        },
        {
          center: [0, 2],
          output: "R1C2 - R1C3",
          start: [0, 1],
          end: [0, 2],
          score: 1,
        },
      ];
      expect(seatRanges).toEqual(expected);
    });
    it("returns all possible seat ranges 3", () => {
      let seatingPlan = initSeatingPlan({ rows: 1, columns: 6 });
      seatingPlan = reserveSeat(seatingPlan, [0, 0]);
      seatingPlan = reserveSeat(seatingPlan, [0, 1]);
      seatingPlan = reserveSeat(seatingPlan, [0, 2]);
      const seatRanges: SeatRange[] = findAllPossibleSeatRanges(seatingPlan, 4);
      const expected: SeatRange[] = [];
      expect(seatRanges).toEqual(expected);
    });
    it("returns all possible seat ranges 4", () => {
      let seatingPlan = initSeatingPlan({ rows: 2, columns: 7 });
      seatingPlan = reserveSeat(seatingPlan, [0, 0]);
      seatingPlan = reserveSeat(seatingPlan, [0, 1]);
      seatingPlan = reserveSeat(seatingPlan, [0, 2]);
      seatingPlan = reserveSeat(seatingPlan, [0, 3]);
      seatingPlan = reserveSeat(seatingPlan, [0, 4]);
      seatingPlan = reserveSeat(seatingPlan, [0, 5]);
      seatingPlan = reserveSeat(seatingPlan, [0, 6]);
      seatingPlan = reserveSeat(seatingPlan, [1, 6]);
      seatingPlan = reserveSeat(seatingPlan, [1, 5]);
      seatingPlan = reserveSeat(seatingPlan, [1, 4]);

      const seatRanges: SeatRange[] = findAllPossibleSeatRanges(seatingPlan, 4);
      const expected: SeatRange[] = [
        {
          center: [1, 2],
          output: "R2C1 - R2C4",
          start: [1, 0],
          end: [1, 3],
          score: 2,
        },
      ];
      expect(seatRanges).toEqual(expected);
    });
  });
  describe("findBestSeatRange", () => {
    const setUpSeatingPlan = (
      config: SeatMapConfig = { rows: 3, columns: 11 },
      reservations: SeatLocation[],
    ): SeatingPlan => {
      let seatingPlan = initSeatingPlan(config);
      for (const reservation of reservations) {
        seatingPlan = reserveSeat(seatingPlan, reservation);
      }
      return seatingPlan;
    };
    it("should return the best range by the smallest score when all seats are available", () => {
      const seatingPlan = setUpSeatingPlan({ rows: 3, columns: 11 }, []);
      const amountOfSeats = 3;

      const range = findBestSeatRange(seatingPlan, amountOfSeats);
      expect(range.start).toEqual([0, 4]);
      expect(range.end).toEqual([0, 6]);
    });
    it('should return the best range by the smallest score when there are "holes" in the seats', () => {
      const seatingPlan = setUpSeatingPlan({ rows: 3, columns: 11 }, [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [0, 7],
      ]);
      const amountOfSeats = 3;
      const range = findBestSeatRange(seatingPlan, amountOfSeats);
      expect(range.start).toEqual([1, 4]);
      expect(range.end).toEqual([1, 6]);
    });
    it("should return the best range by the smallest score when there are multiple best ranges", () => {
      const seatingPlan = setUpSeatingPlan({ rows: 3, columns: 11 }, [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [0, 5],
        [0, 6],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
      ]);
      const amountOfSeats = 3;
      const range = findBestSeatRange(seatingPlan, amountOfSeats);
      expect(range.start).toEqual([2, 4]);
      expect(range.end).toEqual([2, 6]);
    });
    it("should correctly handle ranges with some reserved seats", () => {
      const reservedSeats: [number, number][] = [
        [0, 0],
        [0, 1],
        [1, 3],
        [2, 5],
      ];
      const seatingPlan = setUpSeatingPlan(
        { rows: 3, columns: 10 },
        reservedSeats,
      );
      const amountOfSeats = 3;

      const range = findBestSeatRange(seatingPlan, amountOfSeats);
      expect(range.start).toEqual([0, 3]);
      expect(range.end).toEqual([0, 5]);
    });
    it("should correctly handle ranges with some reserved seats 2", () => {
      const reservedSeats: [number, number][] = [
        [0, 0],
        [0, 1],
        [0, 3],
        [0, 5],
        [1, 3],
        [2, 5],
      ];
      let seatingPlan = setUpSeatingPlan(
        { rows: 3, columns: 10 },
        reservedSeats,
      );
      const amountOfSeats = 3;

      const range = findBestSeatRange(seatingPlan, amountOfSeats);
      expect(range.start).toEqual([1, 4]);
      expect(range.end).toEqual([1, 6]);
    });

    it("should throw when no ranges are available", () => {
      let seatingPlan = initSeatingPlan({ rows: 1, columns: 3 });
      seatingPlan = reserveSeat(seatingPlan, [0, 0]);
      seatingPlan = reserveSeat(seatingPlan, [0, 1]);
      seatingPlan = reserveSeat(seatingPlan, [0, 2]);

      expect(() => findBestSeatRange(seatingPlan, 2)).toThrow(
        "No possible ranges",
      );
    });
  });
});
