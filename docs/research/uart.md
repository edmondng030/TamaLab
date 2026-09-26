# UART

Source: [GMMan protocol research](https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md), reviewed 2026-09-25.

| Name                 | Offset | Length | Data Type          | Endianness | Purpose           | Known Values                                                     | Unknown Values           | Source                            | Confidence      |
| -------------------- | ------ | ------ | ------------------ | ---------- | ----------------- | ---------------------------------------------------------------- | ------------------------ | --------------------------------- | --------------- |
| Serial configuration | N/A    | N/A    | UART configuration | N/A        | Transport framing | 460800 baud, 8 data bits, no parity, 1 stop bit, no flow control | User adapter suitability | Source above, TCP Transport Layer | HIGH CONFIDENCE |

Defaults live in `src/lib/paradise/config.ts`. Developer Mode allows changing baud.
No adapter voltage or pin arrangement is assumed. Consult the actual adapter
documentation and [upstream adapter notes](https://github.com/GMMan/tama-para-research/blob/master/hardware/prongs_adapter.md).

Browser lifecycle reference: [Chrome Web Serial](https://developer.chrome.com/docs/capabilities/serial).
Cancel the reader and release reader/writer locks before closing the port.
Implementation tests use synthetic readable/writable streams, not a UART device.
