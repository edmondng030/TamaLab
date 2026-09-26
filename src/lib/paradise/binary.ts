export function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
export function align4(n: number) {
  return Math.ceil(n / 4) * 4;
}
export function requireRange(
  offset: number,
  length: number,
  end: number,
  label: string,
) {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > end
  )
    throw new Error(`${label} is truncated or out of bounds.`);
}
export function byteSum(bytes: Uint8Array) {
  let sum = 0;
  for (const byte of bytes) sum = (sum + byte) >>> 0;
  return sum;
}
