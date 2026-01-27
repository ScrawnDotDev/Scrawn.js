import fs from "fs";
import path from "path";
import chalk from "chalk";
import pino from "pino";
import { ScrawnConfig } from "../config.js";

type LogLevel = "info" | "warn" | "error" | "debug";

// ensure log file directory exists
const logFilePath = path.resolve(process.cwd(), "scrawn.log");
fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

// create pino instance writing to file
const baseLogger = pino(
  {
    name: "scrawn",
    level: ScrawnConfig.logging.enableDebug ? "debug" : "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(logFilePath)
);

export class ScrawnLogger {
  constructor(private context: string = "Scrawn") {}

  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = `[${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}]`;
    const prefix = `[${this.context}]`;

    let colorizedPrefix: string;
    switch (level) {
      case "info":
        colorizedPrefix = chalk.cyan(`${timestamp} ${prefix}`);
        baseLogger.info({ context: this.context, ...args[0] }, message);
        break;
      case "warn":
        colorizedPrefix = chalk.yellow(`${timestamp} ${prefix}`);
        baseLogger.warn({ context: this.context, ...args[0] }, message);
        break;
      case "error":
        colorizedPrefix = chalk.redBright(`${timestamp} ${prefix}`);
        baseLogger.error({ context: this.context, ...args[0] }, message);
        break;
      case "debug":
        colorizedPrefix = chalk.magenta(`${timestamp} ${prefix}`);
        baseLogger.debug({ context: this.context, ...args[0] }, message);
        break;
      default:
        colorizedPrefix = `${timestamp} ${prefix}`;
    }

    // skip debug unless enabled
    if (level === "debug" && !process.env.SCRAWN_DEBUG) return;

    // print to console with color
    console.log(`${colorizedPrefix} ${message}`);
  }

  info(msg: string, data?: any) {
    this.log("info", msg, data);
  }

  warn(msg: string, data?: any) {
    this.log("warn", msg, data);
  }

  error(msg: string, err?: any) {
    this.log(
      "error",
      msg,
      err instanceof Error ? { err: err.message, stack: err.stack } : err
    );
  }

  debug(msg: string, data?: any) {
    this.log("debug", msg, data);
  }
}
