# Protocol

Source: [GMMan TCP research](https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md), reviewed 2026-09-25.
Reference implementation to review later: [tamacom](https://github.com/GMMan/tamacom).

| Name                           | Offset         | Length                  | Data Type    | Endianness | Purpose               | Known Values              | Unknown Values                                                    | Source              | Confidence      |
| ------------------------------ | -------------- | ----------------------- | ------------ | ---------- | --------------------- | ------------------------- | ----------------------------------------------------------------- | ------------------- | --------------- |
| Echo request                   | N/A: text line | 10 bytes including CRLF | ASCII        | N/A        | Connection diagnostic | ECHO REQ followed by CRLF | Hardware response in this project                                 | Source above, Echo  | HIGH CONFIDENCE |
| Echo reply                     | N/A: text line | 10 bytes including CRLF | ASCII        | N/A        | Diagnostic response   | ECHO REP followed by CRLF | Hardware response in this project                                 | Source above, Echo  | HIGH CONFIDENCE |
| Reply timeout                  | N/A            | N/A                     | milliseconds | N/A        | Bound diagnostic wait | 500                       | Adapter/OS timing variation                                       | Source above, Echo  | HIGH CONFIDENCE |
| Resource packet implementation | UNKNOWN        | UNKNOWN                 | UNKNOWN      | UNKNOWN    | Custom item transfer  | None implemented          | Framing, payload, checksum, session rules remain unvalidated here | Research lead above | UNKNOWN         |

This release implements a single echo attempt and a separate bounded type-3 item
uploader. See [upload field ledger and evidence](item-upload.md). The earlier
resource-packet UNKNOWN row above records the foundation's state; current framing,
CRC and download session behavior are HIGH CONFIDENCE from documented sources and
local reference inspection, with hardware acceptance still pending. Read chunks are not packets.
The echo reader buffers split lines with a 1,024-character diagnostic limit.
That limit is an application limit, not a claimed Paradise packet size.

MOCK ERROR is synthetic diagnostic data and is never transmitted to hardware.
