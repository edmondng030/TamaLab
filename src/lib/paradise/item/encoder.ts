import { type ParadiseEncoder, UnverifiedFormatError } from "../encoder";
import type { SpriteResource } from "../sprite/encoder";
export type ResourceType =
  "food" | "gift" | "toy" | "decoration" | "character" | "planet" | "unknown";
export interface ItemResource {
  name: string;
  category: ResourceType;
  sprite: SpriteResource;
}
export class ParadiseItemEncoder implements ParadiseEncoder<ItemResource> {
  async encode(_resource: ItemResource): Promise<Uint8Array> {
    void _resource;
    throw new UnverifiedFormatError("Paradise item");
  }
}
