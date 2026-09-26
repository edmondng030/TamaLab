# Hardware tests

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
| RX (capture path)                  | 10 RX chunks; 9 complete `ECHO REP\\r\\n` replies and 1 reply split as `45` + `43 48 4F 20 52 45 50 0D 0A` |
| Result                             | PASS — repeated connectivity echo                                                                          |
| Device behaviour                   | 9 replies arrived within the app timeout; one TX at 08:35:52.575Z had no RX record                         |
| Notes                              | Confirms a responding serial connection only. Does not verify item or sprite transfer.                     |

Evidence: `tama-capture-1790412323005.json`, supplied by the user, plus the
user-provided screenshot showing “Echo reply received. This confirms a responding
connection, not item compatibility.” Timestamps are UTC. The capture demonstrates
that Web Serial can split one reply across multiple reads; the protocol parser
reassembled it successfully. All other automated serial tests are synthetic.

## Test record template

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

## First proposed test

For the next test, choose USB serial in `/device`, start capture,
connect the port, place the device in its connection flow, and run one ECHO test.
Stop and export capture. Record even failures; do not infer compatibility from
an open serial port. No resource upload is available in this release.
