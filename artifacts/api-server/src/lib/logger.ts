import pino from "pino";
import { env } from "./env.js";

/**
 * Structured logger — JSON in production (for log aggregation), pretty
 * console output in development. Replaces the console.log/error calls that
 * were scattered across the codebase with no request context, timestamps,
 * or log levels.
 */
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production" || env.NODE_ENV === "test"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
});
