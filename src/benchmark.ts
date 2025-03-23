export const start = () => process.hrtime();
export const end = (start: [number, number]) => {
  const [seconds, nanoseconds] = process.hrtime(start);
  return [seconds, (nanoseconds / 1_000_000).toFixed(0)];
};
