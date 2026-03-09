type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  const { level, message, timestamp, ...extra } = entry;
  const extraStr = Object.keys(extra).length > 0 ? " " + JSON.stringify(extra) : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${extraStr}`;
}

function createEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    const entry = createEntry("info", message, meta);
    console.log(formatLog(entry));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    const entry = createEntry("warn", message, meta);
    console.warn(formatLog(entry));
  },
  error(message: string, meta?: Record<string, unknown>) {
    const entry = createEntry("error", message, meta);
    console.error(formatLog(entry));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      const entry = createEntry("debug", message, meta);
      console.debug(formatLog(entry));
    }
  },
};
