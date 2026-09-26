# Tama Paradise Studio

A local sprite workspace and UART research lab for Tamagotchi Paradise.

## Current Version

**v0.1.0 — initial foundation (Tasks 01–10).** This is not the completed device-transfer MVP.
The app lives at this repository's root; source code uses `src/` consistently.

## Run locally

Node.js 22+ and npm are required. Use desktop Chrome or Edge for serial access.

```powershell
npm ci
npm run dev
```

Open <http://localhost:3000>. The home route opens `/device`.
Web Serial requires localhost or HTTPS and a user-initiated port selection.

On the development machine, the default npm shim points at a missing roaming
installation. The installed CLI works directly:

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

## Implemented

- Next.js App Router, React, strict TypeScript, Tailwind, shadcn-style local Button
  with Radix Slot/CVA and shadcn registry configuration, Zustand, and Dexie.
- `/device`: mock/Web Serial connection, port information, configurable baud in
  Developer Mode, documented echo diagnostic, disconnect, HEX/ASCII/Decoded logs.
- Stream capture, stop, and JSON/TXT export. The visible log retains 1,000 chunks;
  capture stops at 10,000 chunks. Start Capture replaces the preceding capture.
- Mock success, synthetic error, and timeout modes. Mock mode is the default.
- `/studio`: PNG/JPG/WEBP import (10 MB max), drag/drop, clipboard paste within
  the workspace, source-pixel crop with outline, nearest-neighbor resizing,
  median-cut palettes (2/4/16/256), transparent canvas preview, and 1–16× zoom.
- Name/category metadata, PNG export, and one explicit local draft in IndexedDB.
  Original, resized image, and sprite remain separate Blobs. Open draft restores it.
- `/settings`: persisted Developer Mode. `/projects`: clearly labelled future scope.
- Encoder interfaces that fail closed, a PCOM placeholder, research templates,
  and synthetic protocol/transport/image tests.

## Working

Lint, TypeScript checks, unit tests, the production build, and Edge browser flows
have passed. Final verification details are recorded in [validation](docs/validation.md).
The mock adapter does not establish hardware or resource compatibility.

## Architecture

```text
React UI → Zustand device controller → ParadiseService
                                      → ParadiseProtocol (echo only)
                                      → Transport
                                        ├─ WebSerialTransport
                                        ├─ MockTransport
                                        └─ PCOMTransport (unsupported)

React image workspace → image processing → device-independent quantization
                      → Canvas preview / PNG
                      → Dexie draft (original + processed + sprite Blobs)

ParadiseEncoder<T> → UNKNOWN format error (no fabricated binary)
```

`src/lib/paradise/` exclusively owns device-specific formats and commands.
No component constructs UART bytes. UART reads are chunks, not necessarily
packets; only complete ECHO lines are recognized by the diagnostic protocol.
The TX log records attempted writes, not proof that the device received bytes.

## Experimental

UART defaults and the echo command are sourced from public research and are
**HIGH CONFIDENCE**, not tested on this project's hardware. See
[UART research](docs/research/uart.md) and [protocol notes](docs/research/protocol.md).
The one-shot echo waits 500 ms and does not retry automatically.

## Known Issues

- One real-device ECHO connectivity test passed on 2026-09-26; see [hardware test log](docs/hardware-tests.md). No resource is Device Verified.
- Paradise item/sprite encoding and resource transfer are unavailable. No generated
  device binary can be exported; only the preview PNG and UART logs can be exported.
- PCOM transport behavior is UNKNOWN for the user's specific adapter.
- Only one explicit local draft; no autosave, project library, or .tamaproject exchange.
- Crop uses numeric source-pixel controls. Crop-to-output aspect ratio can stretch.
- Original images above 24 megapixels are rejected after browser decoding to limit
  canvas allocation; large compressed images may still stress browser decoding.
- Browser storage can be cleared/evicted. Export artwork separately for retention.
- Closing/reloading the page ends the serial session. Navigation within the app preserves it.
- Decoded console labels only complete ECHO chunks; split chunks show UNKNOWN.
- No AI, animation, interaction, character, or planet features in this milestone.

## Checks

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Browser tests use installed Microsoft Edge and start a local Next.js server.
They exercise mock capture, timeouts, errors, crop validation, PNG export,
IndexedDB restoration, and settings. Hardware stream tests use synthetic streams.

## Hardware Tests

One ECHO connectivity test is recorded as PASS. Resource transfer remains NOT
RUN. See [hardware test log](docs/hardware-tests.md). Browser tests and simulated
serial streams must never be reported as real-device verification.

## Next Tasks

1. Review this architecture and UART foundation (the Project.md stop point).
2. Export the raw TX/RX JSON from the successful ECHO test and record adapter/browser details.
3. Pin upstream research revisions and acquire provenance-backed sprite/item fixtures.
4. Implement the documented sprite encoder behind tests, without claiming item compatibility.
5. Identify and validate the item container before enabling any device transfer.

## Research sources

- [GMMan's prongs protocol](https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md)
- [GMMan's adapter notes](https://github.com/GMMan/tama-para-research/blob/master/hardware/prongs_adapter.md)
- [tamacom reference library](https://github.com/GMMan/tamacom)
- [Chrome Web Serial documentation](https://developer.chrome.com/docs/capabilities/serial)
- [Next.js setup](https://nextjs.org/docs/app/getting-started/installation)
- [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual)

Independent community project; no official artwork is bundled.

# TamaLab
