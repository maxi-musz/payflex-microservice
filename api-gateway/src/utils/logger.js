import { createLogger, format as _format, transports as _transports } from "winston";

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: _format.combine(
    _format.timestamp(),
    _format.errors({ stack: true }),
    _format.splat(),
    _format.json()
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    new _transports.Console({
      format: _format.combine(
        _format.colorize(),
        _format.simple()
      ),
    }),
    new _transports.File({ filename: "error.log", level: "error" }),
    new _transports.File({ filename: "combined.log" }),
  ],
});

export default logger;