import Dexie, { type Table } from "dexie";
import type { Crop } from "@/lib/image/process";
export interface SpriteDraft {
  id: "current";
  name: string;
  category: string;
  filename: string;
  originalImage: Blob;
  processedImage: Blob;
  spriteImage: Blob;
  crop: Crop;
  width: number;
  height: number;
  colors: number;
  modifiedAt: string;
}
class StudioDatabase extends Dexie {
  drafts!: Table<SpriteDraft, string>;
  constructor() {
    super("tama-paradise-studio");
    this.version(1).stores({ drafts: "id, modifiedAt" });
  }
}
export const db = new StudioDatabase();
