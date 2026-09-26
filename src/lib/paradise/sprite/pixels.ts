// HIGH CONFIDENCE: pinned formats/sprites.md; see docs/research/encoding-milestone.md.
// Bytes are consumed LSB first, but each palette index is accumulated MSB first.
export function packIndices(indices: Uint8Array, bits: number) {
  if (![1, 2, 4, 8].includes(bits))
    throw new Error("Unsupported indexed bit depth.");
  const result = new Uint8Array(Math.ceil((indices.length * bits) / 8));
  let position = 0;
  for (const value of indices) {
    if (value >= 2 ** bits) throw new Error("Palette index exceeds bit depth.");
    for (let bit = bits - 1; bit >= 0; bit--, position++)
      result[position >> 3] |= ((value >> bit) & 1) << (position & 7);
  }
  return result;
}
export function unpackIndices(bytes: Uint8Array, bits: number, count: number) {
  if (
    ![1, 2, 4, 8].includes(bits) ||
    !Number.isInteger(count) ||
    count < 0 ||
    count > 1048576 ||
    bytes.length < Math.ceil((count * bits) / 8)
  )
    throw new Error("Invalid or truncated pixel bitstream.");
  const result = new Uint8Array(count);
  let position = 0;
  for (let i = 0; i < count; i++)
    for (let bit = 0; bit < bits; bit++, position++)
      result[i] =
        (result[i] << 1) | ((bytes[position >> 3] >> (position & 7)) & 1);
  return result;
}
export function rgb565(r: number, g: number, b: number) {
  return ((r & 248) << 8) | ((g & 252) << 3) | (b >> 3);
}
export function from565(word: number): [number, number, number] {
  const r = word >> 11;
  const g = (word >> 5) & 63;
  const b = word & 31;
  return [(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)];
}
export function xorPixels(bytes: Uint8Array) {
  return bytes.map((byte) => byte ^ 0x53);
}
export function decodeRle(bytes: Uint8Array, expected: number) {
  if (!Number.isInteger(expected) || expected < 1 || expected > 65536)
    throw new Error("Invalid decompressed frame size.");
  const result = new Uint8Array(expected);
  let out = 0;
  let i = 0;
  while (i < bytes.length) {
    const control = bytes[i++];
    if (control === 0) break;
    const count = control & 127;
    if (out + count > expected)
      throw new Error("RLE expands beyond the frame bounds.");
    if (control & 128) {
      if (i + count > bytes.length) throw new Error("Truncated RLE literal.");
      result.set(bytes.subarray(i, i + count), out);
      i += count;
    } else {
      if (i >= bytes.length) throw new Error("Truncated RLE repeat.");
      result.fill(bytes[i++], out, out + count);
    }
    out += count;
  }
  if (out !== expected)
    throw new Error("RLE does not match the expected frame size.");
  return result;
}
export function encodeRle(bytes: Uint8Array) {
  const out: number[] = [];
  let i = 0;
  const runAt = (start: number) => {
    let n = 1;
    while (
      n < 127 &&
      start + n < bytes.length &&
      bytes[start + n] === bytes[start]
    )
      n++;
    return n;
  };
  while (i < bytes.length) {
    const run = runAt(i);
    if (run >= 2) {
      out.push(run, bytes[i]);
      i += run;
    } else {
      const start = i++;
      while (i < bytes.length && i - start < 127 && runAt(i) < 2) i++;
      out.push(128 | (i - start), ...bytes.subarray(start, i));
    }
  }
  out.push(0);
  return Uint8Array.from(out);
}
