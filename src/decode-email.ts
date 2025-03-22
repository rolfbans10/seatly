const leftShift = 1 << 3;
const hexValue = 0xc0de;

const result = leftShift | hexValue;

const email = `${result}@showclix.com`;

console.log("Decoded email:", email);
