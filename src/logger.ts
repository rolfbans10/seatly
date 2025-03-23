import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";

export interface LoggerOptions {
  id?: string;
  logFile?: string;
  enabled?: boolean;
  logStackTraces?: boolean;
}

class Logger {
  private id: string;
  private logFile: string;
  private enabled: boolean;
  private logStackTraces: boolean;

  constructor({
    id = Logger.getRandomId(6),
    logFile = path.resolve("out.log"),
    enabled = true,
    logStackTraces = false,
  }) {
    this.id = id;
    this.logFile = logFile;
    this.enabled = enabled;
    this.logStackTraces = logStackTraces;
  }

  public log(errorOrString: Error | string, data?: object) {
    let message =
      errorOrString instanceof Error ? errorOrString.message : errorOrString;

    if (!this.enabled) {
      return;
    }
    const isError = errorOrString instanceof Error;
    if (isError) {
      data = {
        ...data,
        error: {
          name: errorOrString.name,
          message: errorOrString.message,
        },
      };
    }
    this._log(message, data);
    if (isError && this.logStackTraces) {
      this._log(`STACK TRACE: \n${errorOrString.stack}`);
    }
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  public applyConfig(config: LoggerOptions) {
    this.id = config.id ?? this.id;
    this.logFile = config.logFile ?? this.logFile;
    this.enabled = config.enabled !== undefined ? config.enabled : this.enabled;
    this.logStackTraces =
      config.logStackTraces !== undefined
        ? config.logStackTraces
        : this.logStackTraces;
  }

  private _log(message: string, data?: object) {
    if (data) {
      try {
        message += `\ncontext:\n${JSON.stringify(data, null, 2)}`;
      } catch (e) {
        message += `\ncontext:\nfailed to stringify context: \n${
          e instanceof Error
            ? `name: ${e.name}\n
               message: ${e.message}\n
               ${this.logStackTraces ? `stack: \n${e.stack}` : ""}\n`
            : "unknown error\n"
        }`;
      }
    }
    this.logToFile(
      `[Run ID: ${this.id}][${new Date().toUTCString()}] ${message}\n`,
    );
  }

  private logToFile(message: string) {
    try {
      fs.writeFileSync(this.logFile, message, { flag: "a" });
    } catch (e) {
      // fail silently on purpose and disable logger to stop trying
      this.disable();
      throw new Error("Failed to write to log file");
    }
  }

  public static getRandomId(bytes: number): string {
    return randomBytes(bytes).toString("hex");
  }
}
// singleton
const logger = new Logger({});
export default logger;
