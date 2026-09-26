export interface LogEntry {
  timestamp: string;
  direction: "TX" | "RX";
  hex: string;
  length: number;
}
export function toHex(data: Uint8Array) {
  return Array.from(data, (byte) =>
    byte.toString(16).padStart(2, "0").toUpperCase(),
  ).join(" ");
}
export function logEntry(
  direction: LogEntry["direction"],
  data: Uint8Array,
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    direction,
    hex: toHex(data),
    length: data.length,
  };
}
export function toAscii(hex: string) {
  return hex
    .split(" ")
    .map((v) => {
      const n = parseInt(v, 16);
      return n >= 32 && n <= 126 ? String.fromCharCode(n) : "·";
    })
    .join("");
}
export function decodeLog(entry: LogEntry) {
  if (entry.hex === "45 43 48 4F 20 52 45 51 0D 0A")
    return "ECHO request · public research";
  if (entry.hex === "45 43 48 4F 20 52 45 50 0D 0A")
    return "ECHO reply · public research";
  return "UNKNOWN / partial stream chunk";
}
export function exportLog(entries: LogEntry[], format: "json" | "txt") {
  return format === "json"
    ? JSON.stringify(entries, null, 2)
    : entries
        .map(
          (e) => `${e.timestamp} ${e.direction} ${e.hex} (${e.length} bytes)`,
        )
        .join("\n");
}
