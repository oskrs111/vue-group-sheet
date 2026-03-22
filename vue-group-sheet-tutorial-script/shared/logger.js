export function createLogger(scope) {
  const format = (level, message, extra) => {
    const timestamp = new Date().toISOString();
    const suffix = extra ? ` ${JSON.stringify(extra)}` : "";
    return `[${timestamp}] [${scope}] [${level}] ${message}${suffix}`;
  };

  return {
    info(message, extra) {
      console.log(format("info", message, extra));
    },
    warn(message, extra) {
      console.warn(format("warn", message, extra));
    },
    error(message, extra) {
      console.error(format("error", message, extra));
    },
  };
}
