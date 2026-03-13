if (typeof window !== "undefined") {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  const badge = {
    log: "background:#3b82f6;color:#000;padding:0 6px;border-radius:10px;", // blue
    info: "background:#22c55e;color:#000;padding:0 6px;border-radius:10px;", // green
    warn: "background:#facc15;color:#000;padding:0 6px;border-radius:10px;", // yellow
    error: "background:#ef4444;color:#000;padding:0 6px;border-radius:10px;", // red
    text: "color:#e5e7eb",
  };

  console.log = (...args) => {
    original.log("%cLOG%c", badge.log, badge.text, ...args);
  };

  console.info = (...args) => {
    original.info("%cINFO%c", badge.info, badge.text, ...args);
  };

  console.warn = (...args) => {
    original.warn("%cWARN%c", badge.warn, badge.text, ...args);
  };

  console.error = (...args) => {
    original.error("%cERROR%c", badge.error, badge.text, ...args);
  };
}
