import {reserveSeat} from "./reservation";

describe("reservation", () => {
    it('reserves a seat', () => {
        expect(reserveSeat('A1')).toBe(true);
    })
})