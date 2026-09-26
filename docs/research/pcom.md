# PCOM research

Status: **UNKNOWN** in this implementation. No binary format or compatibility claim is made.

| Name                    | Offset  | Length  | Data Type | Endianness | Purpose      | Known Values  | Unknown Values            | Source                  | Confidence |
| ----------------------- | ------- | ------- | --------- | ---------- | ------------ | ------------- | ------------------------- | ----------------------- | ---------- |
| PCOM format / interface | UNKNOWN | UNKNOWN | UNKNOWN   | UNKNOWN    | PCOM support | None verified | All implementation fields | No verified fixture yet | UNKNOWN    |

## Evidence to collect

- Public primary research URL and pinned revision.
- Device/adapter variant and the operation that produced a capture.
- Byte-level fixture provenance and expected decoded values.
- Validation cases, malformed inputs, and hardware test record if applicable.

## Implementation gate

Keep device-independent preview behavior separate from hardware support.
Do not implement binary fields or mark compatibility until evidence supports them.
Determine whether the particular connector exposes USB serial, WebUSB, or a vendor API before implementing PCOMTransport.
