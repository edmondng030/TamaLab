# Sprite research

Status: **RESEARCH AVAILABLE; encoder still disabled**. Public format documentation
exists, but this project has not yet validated a generated sprite against hardware
or a provenance-backed local fixture.

| Name                   | Offset            | Length            | Data Type                 | Endianness          | Purpose                                     | Known Values                                        | Unknown Values                             | Source                                                                                            | Confidence      |
| ---------------------- | ----------------- | ----------------- | ------------------------- | ------------------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------- |
| Sprite package offsets | 0                 | 4 bytes each      | uint32                    | little              | Offset table before sprite data             | Offset entries point to sprite data                 | Package count/termination convention       | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Sprite image header    | 0                 | 20 bytes          | packed fields             | little              | Dimensions, palette and pixel-data metadata | Header fields documented publicly                   | Unknown flags and device acceptance        | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Palette entries        | palette offset    | palette-dependent | RGB565                    | little              | Indexed sprite colors                       | 2/4/16/256 colors for 1/2/4/8 bpp                   | Device-specific allowed palettes           | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Pixel data             | pixel-data offset | image-dependent   | palette indices or RGB565 | little / bit-packed | Sprite pixels                               | Optional RLE and XOR 0x53 encryption are documented | Which flags are accepted for a custom item | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |

## Evidence to collect

- Public primary research URL and pinned revision.
- Device/adapter variant and the operation that produced a capture.
- Byte-level fixture provenance and expected decoded values.
- Validation cases, malformed inputs, and hardware test record if applicable.

## Implementation gate

Keep device-independent preview behavior separate from hardware support.
The public document is sufficient to begin a separately tested, device-independent
sprite encoder, but not sufficient to claim that an arbitrary encoded sprite can be
sent as an item. Keep the current encoder stub disabled until a fixture and item
container format are identified.
Editor dimensions, palettes, metadata, and presets do not establish a Paradise encoding.
