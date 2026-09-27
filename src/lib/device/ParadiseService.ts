import type { Transport, Unsubscribe } from "@/lib/transport/Transport";
import { ParadiseProtocol } from "@/lib/paradise/protocol/protocol";
import { logEntry, type LogEntry } from "./log";
import type { UploadOptions } from "@/lib/paradise/protocol/item-upload";
import { parseProtocolKey } from "@/lib/paradise/protocol/item-packet";
import {
  ParadiseSpriteEncoder,
  type SpriteResource,
} from "@/lib/paradise/sprite/encoder";
import {
  decodeSprite,
  frameRgba,
  type DecodedSprite,
} from "@/lib/paradise/sprite/decoder";
import {
  inspectItemTemplate,
  rebuildItemTemplate,
} from "@/lib/paradise/item/template";
export class ParadiseService {
  static previewFrame(sprite: DecodedSprite, frame: number) {
    return {
      width: sprite.width,
      height: sprite.height,
      rgba: frameRgba(sprite, frame),
    };
  }
  static async prepareUpload(
    bytes: Uint8Array,
    name: string,
    origin: "studio" | "file",
  ): Promise<PreparedUploadItem> {
    const copy = new Uint8Array(bytes);
    inspectItemTemplate(copy);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", copy));
    return {
      bytes: copy,
      name,
      origin,
      hash: Array.from(digest, (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    };
  }
  static parseProtocolKey = parseProtocolKey;
  static inspectItem = inspectItemTemplate;
  static async prepareSprite(resource: SpriteResource) {
    const bytes = await new ParadiseSpriteEncoder().encode(resource);
    const sprite = decodeSprite(bytes);
    return {
      bytes,
      rgba: frameRgba(sprite, 0),
      width: sprite.width,
      height: sprite.height,
    };
  }
  static prepareItem(
    template: Uint8Array,
    index: number,
    frame: number,
    resource: SpriteResource,
  ) {
    const bytes = rebuildItemTemplate(template, index, frame, resource);
    const sprite = inspectItemTemplate(bytes).sprites[index].decoded!;
    return {
      bytes,
      rgba: frameRgba(sprite, frame),
      width: sprite.width,
      height: sprite.height,
    };
  }
  private protocol: ParadiseProtocol;
  private subscriptions: Unsubscribe[];
  constructor(
    private transport: Transport,
    onLog: (entry: LogEntry) => void,
    onDisconnect: (reason: string) => void,
  ) {
    this.protocol = new ParadiseProtocol(transport, (bytes) =>
      onLog(logEntry("TX", bytes)),
    );
    this.subscriptions = [
      transport.onData((bytes) => onLog(logEntry("RX", bytes))),
      transport.onDisconnect(onDisconnect),
    ];
  }
  connect() {
    return this.transport.connect();
  }
  disconnect() {
    return this.transport.disconnect();
  }
  isConnected() {
    return this.transport.isConnected();
  }
  getInfo() {
    return this.transport.getInfo();
  }
  sendTest() {
    return this.protocol.echo();
  }
  sendItem(bytes: Uint8Array, key: Uint8Array, options: UploadOptions) {
    return this.protocol.sendItem(bytes, key, options);
  }
  async dispose() {
    this.subscriptions.forEach((off) => off());
    await this.transport.disconnect();
  }
}
export interface PreparedUploadItem {
  bytes: Uint8Array;
  name: string;
  hash: string;
  origin: "studio" | "file";
}
