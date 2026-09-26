# Hardware tests

No hardware tests have been performed. All existing automated serial tests are synthetic.
An echo response checks connectivity only; it does not verify item transfer.

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

With verified adapter wiring, choose USB serial in `/device`, start capture,
connect the port, place the device in its connection flow, and run one ECHO test.
Stop and export capture. Record even failures; do not infer compatibility from
an open serial port. No resource upload is available in this release.
