import { type ParadiseEncoder, UnverifiedFormatError } from "../encoder";
export interface SpriteResource {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}
export class ParadiseSpriteEncoder implements ParadiseEncoder<SpriteResource> {
  async encode(_resource: SpriteResource): Promise<Uint8Array> {
    void _resource;
    throw new UnverifiedFormatError("Paradise sprite");
  }
}
