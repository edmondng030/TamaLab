# Sprite research

Status: **EXPERIMENTAL offline encoder/decoder implemented**. A pinned public
fixture is covered by tests. Generated output has not been tested on hardware.

| Name                   | Offset            | Length            | Data Type                 | Endianness          | Purpose                                     | Known Values                                        | Unknown Values                             | Source                                                                                            | Confidence      |
| ---------------------- | ----------------- | ----------------- | ------------------------- | ------------------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------- |
| Sprite package offsets | 0                 | 4 bytes each      | uint32                    | little              | Offset table before sprite data             | Offset entries point to sprite data                 | Package count/termination convention       | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Sprite image header    | 0                 | 24 bytes          | packed fields             | little              | Dimensions, palette and pixel-data metadata | Header fields documented publicly                   | Unknown flags and device acceptance        | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Palette entries        | palette offset    | palette-dependent | RGB565                    | little              | Indexed sprite colors                       | 2/4/16/256 colors for 1/2/4/8 bpp                   | Device-specific allowed palettes           | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |
| Pixel data             | pixel-data offset | image-dependent   | palette indices or RGB565 | little / bit-packed | Sprite pixels                               | Optional RLE and XOR 0x53 encryption are documented | Which flags are accepted for a custom item | [GMMan sprite format](https://github.com/GMMan/tama-para-research/blob/master/formats/sprites.md) | HIGH CONFIDENCE |

## Evidence to collect

- Public primary research URL and pinned revision.
- Device/adapter variant and the operation that produced a capture.
- Byte-level fixture provenance and expected decoded values.
- Validation cases, malformed inputs, and hardware test record if applicable.

## Implementation gate

Keep device-independent preview behavior separate from hardware support.
The implemented subset is indexed RGB565 with uncompressed or bytewise RLE
payloads, optionally XOR 0x53. Wordwise RLE, direct color and unknown flags fail
closed. Template editing requires one palette set. See the
[pinned implementation contract](encoding-milestone.md) and fixture provenance.

## Implemented header fields

All numeric multi-byte fields are little endian. Source for every row is the
pinned sprite document linked in the contract; confidence is HIGH CONFIDENCE
from documentation and fixture checks, not hardware verification. Unknown device
acceptance and undocumented flag meanings remain UNKNOWN.

| Offset | Bytes | Type | Purpose / supported values |
| --- | --- | --- | --- |
| 0 | 4 | uint32 | Declared sprite length; zero means infer |
| 4 | 1 | flags | Bits 0/1 retained; 2 transparency; 5 byte RLE; 7 XOR; other modes rejected |
| 5 | 1 | uint8 | Indexed depth codes 0/1/2/3 → 1/2/4/8 bits |
| 6 | 2 | uint16 | Number of frames |
| 8, 9 | 1 each | uint8 | Width and height, nonzero |
| 10, 11 | 1 each | int8 | Anchor offsets, retained from template |
| 12, 13 | 1 each | uint8 | Grid dimensions, retained |
| 14 | 1 | uint8 | Palette encoding 0x11 (RGB565) |
| 15 | 1 | uint8 | Palette set count; replacement requires one |
| 16 | 2 | uint16 | Transparent palette index when enabled |
| 18 | 2 | uint16 | Palette offset from sprite start |
| 20 | 2 | uint16 | Pixel data offset from sprite start |
| 22 | 2 | padding | Preserved; zero for generated standalone sprites |

Package entries are uint32 offsets; first offset divided by four gives entry
count. Palette entries are uint16 RGB565. Byte bit order is LSB-first while
indices accumulate MSB-first. Compressed frame entries contain offset/length
uint32 pairs; offsets are relative to the pixel region and the top bit marks
uncompressed payload. Payloads align to four bytes from sprite start. XOR applies
to payloads only. Byte RLE uses the high control bit for literal runs and the
low seven bits for length, otherwise repeats the next byte; zero terminates.
