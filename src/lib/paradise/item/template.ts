import { buildArchive, readArchive } from "./archive";
import { buildSpritePackage, readSpritePackage } from "../sprite/package";
import { decodeSprite } from "../sprite/decoder";
import { replaceSpriteFrame, type SpriteResource } from "../sprite/encoder";
export function inspectItemTemplate(bytes: Uint8Array) {
  const entries = readArchive(bytes);
  if (entries.length !== 3 || !entries[0].data.length)
    throw new Error("Expected a three-file downloadable item template.");
  const strings = readArchive(entries[2].data);
  if (strings.length !== 9)
    throw new Error("Expected nine language tables in the item template.");
  const parts = readSpritePackage(entries[1].data);
  const sprites = parts.map((part, index) => {
    try {
      const decoded = decodeSprite(part);
      return {
        index,
        decoded,
        issue:
          decoded.paletteSets !== 1
            ? "Multiple palettes cannot be edited."
            : "",
      };
    } catch (error) {
      return {
        index,
        decoded: undefined,
        issue: error instanceof Error ? error.message : "Unsupported sprite.",
      };
    }
  });
  return { entries, parts, sprites, size: bytes.length };
}
export function rebuildItemTemplate(
  bytes: Uint8Array,
  spriteIndex: number,
  frame: number,
  resource: SpriteResource,
) {
  const { entries, parts } = inspectItemTemplate(bytes);
  if (
    !Number.isInteger(spriteIndex) ||
    spriteIndex < 0 ||
    spriteIndex >= parts.length
  )
    throw new Error("Select a valid template sprite.");
  const updated = parts.slice();
  updated[spriteIndex] = replaceSpriteFrame(
    parts[spriteIndex],
    frame,
    resource,
  );
  const files = entries.map((entry, i) =>
    i === 1 ? buildSpritePackage(updated) : entry.data,
  );
  const result = buildArchive(files, bytes.length);
  inspectItemTemplate(result);
  return result;
}
