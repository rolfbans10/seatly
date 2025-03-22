import * as readline from "node:readline";

const lines: string[] = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on("line", line => lines.push(line));
rl.on("close", () => console.log(lines));
