# Hardware tests

## Test 002 — PC UART item upload (user report)

Reported 2026-09-27, Asia/Hong_Kong. The user reports that uploading items through
TamaLab via PC UART is working. Result: **PASS, user reported**. Exact uploaded
filenames, browser version, device variant, on-device inventory behavior and a
transfer capture were not supplied with this report. This confirms the reported
PC upload workflow only; it does not verify all generated items or PhoneCom.
Earlier NOT RUN entries below describe the state before this user test.

The 2026-09-27 image-to-item workspace produces template-based artwork changes.
Physical acceptance of those generated files remains **NOT RUN**. Automated
browser tests can establish exact-byte handoff and simulated transfer only.

## Test 001 — ECHO connectivity


| Field                              | Value                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Date / time / timezone             | 2026-09-26 / time not captured / Asia/Hong_Kong                                                            |
| Adapter and interface              | USB Serial, Windows COM port shown as COM4 in chooser                                                      |
| Device variant / firmware          | UNKNOWN                                                                                                    |
| OS                                 | Windows / exact version UNKNOWN                                                                            |
| Browser / version                  | Chromium-based browser / exact version UNKNOWN                                                             |
| Baud rate / framing / flow control | 460800 / 8-N-1 / none (application default)                                                                |
| Action                             | Connected in web app and sent documented ECHO test                                                         |
| TX (capture path)                  | 10 × `45 43 48 4F 20 52 45 51 0D 0A` (`ECHO REQ\\r\\n`)                                                    |
| RX (capture path)                  | 10 RX chunks; 9 replies TOTAL, including one split as `45` + `43 48 4F 20 52 45 50 0D 0A` |
| Result                             | PASS — repeated connectivity echo                                                                          |
| Device behaviour                   | 9 replies arrived within the app timeout; one TX at 08:35:52.575Z had no RX record                         |
| Notes                              | Confirms a responding serial connection only. Does not verify item or sprite transfer.                     |

Evidence: `tama-capture-1790412323005.json`, supplied by the user, plus the
user-provided screenshot showing “Echo reply received. This confirms a responding
connection, not item compatibility.” Timestamps are UTC. The capture demonstrates
that Web Serial can split one reply across multiple reads; the protocol parser
reassembled it successfully. The capture itself does not identify mock versus
serial transport; the user's serial-mode screenshot supplies context. Baud/framing
above are application defaults, not independently recorded settings.
All automated serial tests are synthetic.

## Follow-up user capture — 2026-09-26

`tama-capture-1790412603085.json`: one ECHO request at 08:49:59.618Z and
one complete reply at 08:49:59.628Z, split into 1-byte and 9-byte RX chunks.
This supports a responding connection in the user's screenshot context; it does
not identify the responding hardware from the JSON alone. No resource was sent.

## Offline binary milestone — 2026-09-26

Published fixture parsing, single-frame rebuilding and local export are software
checks only. Generated sprite/item acceptance and encrypted transfer: **NOT RUN**.
No resource is Device Verified. Echo need not be repeated to resolve the missing
protocol key or item-transfer evidence.

## Test record template

Next test: TamaLab unchanged upload of `舞台.bin` (16,384 bytes, SHA-256
`85e726a6acadb6972d502a6f95f42c0ca2d59dbc0b04d8a29234a09a5000db87`).
Status: **NOT RUN on hardware**. The user reports prior new-item acceptance through
Patchi Lab V1. Static inspection identified that application's type-3 download
flow and local key. A TamaLab mock transfer with that key reconstructed the original
file byte-for-byte; that is software validation only. Record device screen/result,
adapter/settings, capture, and whether existing items remain available.

| Field                              | Value   |
| ---------------------------------- | ------- |
| Date / time / timezone             | UNKNOWN |
| Adapter and interface              | UNKNOWN |
| Device variant / firmware          | UNKNOWN |
| OS                                 | UNKNOWN |
| Browser / version                  | UNKNOWN |
| Baud rate / framing / flow control | UNKNOWN |
| Action                             | UNKNOWN |
| TX (capture path)                  | UNKNOWN |
| RX (capture path)                  | UNKNOWN |
| Result                             | NOT RUN |
| Device behaviour                   | UNKNOWN |
| Notes                              | UNKNOWN |

## Original connectivity procedure

For the next test, choose USB serial in `/device`, start capture,
connect the port, place the device in its connection flow, and run one ECHO test.
Stop and export capture. Record even failures; do not infer compatibility from
an open serial port. An experimental existing-item uploader is now available;
its result must be recorded separately from echo connectivity.
