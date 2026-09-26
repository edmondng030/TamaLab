export interface ParadiseEncoder<T> {
  encode(resource: T): Promise<Uint8Array>;
}
export type Compatibility =
  "Preview Only" | "Experimental" | "Partially Verified" | "Device Verified";
export class UnverifiedFormatError extends Error {
  constructor(format: string) {
    super(
      `${format} format is UNKNOWN in this implementation. Device encoding and transfer are unavailable until verified.`,
    );
    this.name = "UnverifiedFormatError";
  }
}
