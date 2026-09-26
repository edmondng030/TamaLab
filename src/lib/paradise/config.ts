// HIGH CONFIDENCE: public research, not yet verified on this project's hardware.
// https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md
export const DEFAULT_SERIAL_CONFIG: SerialOptions = {
  baudRate: 460800,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};
export const ECHO_TIMEOUT_MS = 500;
export function validateBaudRate(value: number) {
  if (!Number.isInteger(value) || value < 300 || value > 3000000)
    throw new Error(
      "Enter a whole-number baud rate between 300 and 3,000,000.",
    );
  return value;
}
