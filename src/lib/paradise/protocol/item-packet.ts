// Independent implementation of the documented TCP download format.
// Source and inspected reference behavior: docs/research/item-upload.md.
export function crc16Arc(bytes: Uint8Array) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xa001 : 0);
  }
  return crc;
}
export async function encodeItemChunk(
  payload: Uint8Array,
  index: number,
  key: Uint8Array,
  nonce = crypto.getRandomValues(new Uint8Array(4)),
) {
  if (
    !payload.length ||
    payload.length > 4096 ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 3 ||
    nonce.length !== 4
  )
    throw new Error("Invalid item chunk.");
  if (key.length < 1 || key.length > 256)
    throw new Error("Import a valid protocol key before uploading.");
  const out = new Uint8Array(16 + payload.length);
  out.set(nonce);
  out.set([84, 67, 80, 3, index, 255 - index], 8);
  new DataView(out.buffer).setUint16(14, crc16Arc(payload), true);
  out.set(payload, 16);
  const seed = new Uint8Array(4 + key.length);
  seed.set(nonce);
  seed.set(key, 4);
  const stream = new Uint8Array(await crypto.subtle.digest("SHA-256", seed));
  seed.fill(0);
  for (let i = 4; i < out.length; i++) {
    const p = (i - 4) % 32;
    out[i] ^= stream[p];
    stream[p] = (stream[p] * 2 + 1) & 255;
  }
  stream.fill(0);
  return out;
}
export function parseProtocolKey(text: string) {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Choose the local protocol-key JSON file.");
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("keyHex" in data) ||
    typeof data.keyHex !== "string" ||
    !/^(?:[a-fA-F0-9]{2}){1,256}$/.test(data.keyHex)
  )
    throw new Error("Invalid protocol-key file.");
  return Uint8Array.from(data.keyHex.match(/../g)!, (pair) =>
    parseInt(pair, 16),
  );
}
