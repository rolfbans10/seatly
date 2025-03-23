# Seatly

Seatly is a CLI tool written in TypeScript for managing seat reservations in a row/column seating system.

## Requirements

1. This application was built with Node V20, you can use [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) to manage Node versions.
2. After installing NVM, run: `nvm install 20 && nvm use 20`

## Setup

1. Install dependencies:

   `npm install`

2. Build Project:

   `npm run build`

3. Run tests:

   `npm test`

3. Execute the CLI:

   `node dist/index.js`

## Input Format

- First line: space-separated reserved seats (e.g., R1C1 R2C5)
- Subsequent lines: numbers indicating group sizes to reserve
- Ends on EOF (Ctrl+D)

## Output Format

- Seat range reserved (e.g., R1C2 - R1C4)
- Or "Not Available" if no suitable seats are found
- Output remaining available seat counts in the last line.

## Configuration Flags
All arguments are optional, by default the program will assume 
3 rows and 11 columns, also logs will be stored in the `logs` directory.

```text
Usage:
  node index.js [options]
Options:
  --rows, -r <number>        Number of rows in the seating plan
  --columns, -c <number>     Number of columns in the seating plan
  --logFile, -l <string>     Path to the log file
  --help, -h                 Show this help message  
```

## Author:

Rolf Bansbach
