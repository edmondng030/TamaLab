# Existing item upload — implementation evidence

Scope: send the selected ARC2 item unchanged, maximum 16,384 bytes. No item ID
allocation or rewriting is needed for this operation. Generated items remain
experimental. No patch, firmware, factory, or arbitrary address operations.

Primary specification: [GMMan TCP](https://github.com/GMMan/tama-para-research/blob/3fe2cc57835895c5797ae01db347ce7202287e7b/protocols/tcp.md).
Local interoperability reference: user's Patchi Lab V1 `PatchiLab.dll`, SHA-256
`23d3133b868475d72727ae778d7c18422d74fbdbb7dc47ee841f62b3b5318427`.
Its download handler reads the selected file and
calls SendPacket with type 3 on a fresh TCP object. Session ID defaults to zero;
there is no set-session packet in this download path. Confidence: HIGH CONFIDENCE
from static inspection, supported by the user's successful upload report.
Decompiled application code and its key are not included in the repository.

| Field | Offset | Length/type | Endianness | Purpose / known value |
| --- | --- | --- | --- | --- |
| Nonce | 0 | 4 random bytes | raw LE representation | Per-chunk keystream seed |
| Session | 4 | uint32 | little | 0 for inspected download path |
| Magic | 8 | 3 ASCII bytes | N/A | TCP |
| Type | 11 | uint8 | N/A | 3; no additional flags |
| Index | 12 | uint8 | N/A | 0-based chunk number |
| Complement | 13 | uint8 | N/A | 255 minus index |
| CRC | 14 | uint16 | little | CRC16/ARC over plaintext payload |
| Payload | 16 | up to 4096 bytes | opaque | Original file bytes |

Offsets describe the wire chunk before encrypting bytes 4 onward. All rows are
HIGH CONFIDENCE from both sources. CRC uses reflected polynomial 0xA001, initial
and final XOR zero. Keystream starts with SHA256(nonce concatenated with key),
cycles through 32 bytes, updating each used byte to (2*b+1) modulo 256.

Transfer: PKT plus decimal file length and CRLF, wait ACK, then one encrypted
chunk at a time and wait ACK/NAK/ENQ/CAN. Initial wait 2 seconds; chunk wait 5
seconds from primary specification. Bound retries to three sends and bound ENQ
rewinds; do not reproduce the reference UI's unbounded whole-transfer retry loop.
Respond to ECHO REQ, abort on incoming PKT collision. Forward ENQ requests that
would skip unsent data are rejected. Cancellation/failure requires reconnecting.

The key is supplied by the user from a local configuration file, kept in memory
for this page session and never included in logs or persisted browser storage.
The local inspection output can generate `.local/patchi-protocol-key.json`, which
is Git-ignored. This key is extracted from the user's installed reference app;
TamaLab hardware acceptance remains NOT RUN until tested on the physical device.

ACK of the last chunk proves protocol acknowledgement, not that the item appears
or that existing items remain unaffected. Record the device result separately.
