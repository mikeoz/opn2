// Simple global console buffer for diagnostics
// This module patches console methods to keep the last 200 entries

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;

type AppLog = { level: string; message: string; args: unknown[]; ts: string };

if (!w.__appLogs) {
  w.__appLogs = [] as AppLog[];
}

const levels: Array<keyof Console> = ["log", "info", "warn", "error"];

levels.forEach((level) => {
  const original = console[level] as (...args: unknown[]) => void;
  console[level] = (((...args: unknown[]) => {
    try {
      w.__appLogs.push({
        level,
        message: String(args[0] ?? ""),
        args,
        ts: new Date().toISOString(),
      });
      if (w.__appLogs.length > 200) w.__appLogs.shift();
    } catch {}
    original.apply(console, args);
  }) as any);
});

export const getAppLogs = () => {
  try {
    return (w.__appLogs as AppLog[]);
  } catch {
    return [];
  }
};

export const clearAppLogs = () => {
  try { w.__appLogs = []; } catch {}
};
