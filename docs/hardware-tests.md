# Hardware tests

## Test 001 — ECHO connectivity

| Field                              | Value                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| Date / time / timezone             | 2026-09-26 / time not captured / Asia/Hong_Kong                                        |
| Adapter and interface              | USB Serial, Windows COM port shown as COM4 in chooser                                  |
| Device variant / firmware          | UNKNOWN                                                                                |
| OS                                 | Windows / exact version UNKNOWN                                                        |
| Browser / version                  | Chromium-based browser / exact version UNKNOWN                                         |
| Baud rate / framing / flow control | 460800 / 8-N-1 / none (application default)                                            |
| Action                             | Connected in web app and sent documented ECHO test                                     |
| TX (capture path)                  | ECHO REQ + CRLF expected; raw capture was not exported                                 |
| RX (capture path)                  | ECHO REP observed by app; raw capture was not exported                                 |
| Result                             | PASS — connectivity echo                                                               |
| Device behaviour                   | App reported “Echo reply received”                                                     |
| Notes                              | Confirms a responding serial connection only. Does not verify item or sprite transfer. |

Evidence: user-provided screenshot showing the app status “Echo reply received.
This confirms a responding connection, not item compatibility.” Raw TX/RX bytes
should be exported from the UART console in the next test. All other automated
serial tests are synthetic.

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
