# Item research

Status: **EXPERIMENTAL template rebuilding implemented**. Device acceptance is
UNKNOWN. Behavior fields remain opaque and are copied without modification.

| Name                    | Offset  | Length  | Data Type | Endianness | Purpose      | Known Values  | Unknown Values            | Source                  | Confidence |
| ----------------------- | ------- | ------- | --------- | ---------- | ------------ | ------------- | ------------------------- | ----------------------- | ---------- |
| Item behavior data | first ARC2 entry | variable | opaque bytes | UNKNOWN | Behavior and item metadata | Preserved exactly | Field semantics | Public fixture, see contract | UNKNOWN |

## Evidence to collect

- Public primary research URL and pinned revision.
- Device/adapter variant and the operation that produced a capture.
- Byte-level fixture provenance and expected decoded values.
- Validation cases, malformed inputs, and hardware test record if applicable.

## Implementation gate

Keep device-independent preview behavior separate from hardware support.
Do not implement binary fields or mark compatibility until evidence supports them.
Editor dimensions, palettes, metadata, and presets do not establish a Paradise encoding.

## Supported archive subset

Every field below comes from the [pinned ARC2 and item-layout sources](encoding-milestone.md).
Confidence: HIGH CONFIDENCE for archive structure; generated item compatibility
remains UNKNOWN. All multi-byte values are little endian uint32.

| Offset | Bytes | Purpose / known values |
| --- | --- | --- |
| 0 | 4 | Magic 0x32435241 (`ARC2`) |
| 4 | 4 | Sum of bytes from offset 8 to declared end, modulo 2^32 |
| 8 | 4 | Length excluding 16-byte header |
| 12 | 4 | Entry count |
| 16 + 16n | 4 | Compression flags; only zero supported |
| 20 + 16n | 4 | File offset; four-byte alignment |
| 24 + 16n | 4 | Stored length, actual length aligned to four |
| 28 + 16n | 4 | Actual file length |

Top-level templates require three files: opaque behavior data, sprite package,
and a nested string archive with nine language entries. Rebuilding preserves
behavior and the entire strings archive byte-for-byte, updates sprite offsets,
lengths and checksums, and zero-fills unused archive space. Unselected frame
payloads remain unchanged. No new category, price, name or behavior is synthesized.
The 16,384-byte item limit is enforced; patch-sized output is excluded.

`舞台.bin` is a user-reported accepted reference from Patchi Lab V1. It is kept
as the original workspace file and is not treated as proof that rebuilt output
will be accepted.
