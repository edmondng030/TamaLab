# Tama Paradise Studio

A local sprite workspace and UART research lab for Tamagotchi Paradise.

## Current Version

**Image-to-item workspace and existing-item upload.**
PC UART item upload is working according to the user's 2026-09-27 report.
Converted artwork still needs its own hardware test.
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
- `/device`: unchanged ARC2 item upload (maximum 16,384 bytes), local protocol-key
  import, acknowledged-byte progress, bounded retries, cancellation and TX/RX capture.
  Uses the download flow inspected in the user's Patchi Lab V1 installation.
- `/studio`: PNG/JPG/WEBP import (10 MB max), drag/drop, clipboard paste within
  the workspace, source-pixel crop with outline, nearest-neighbor resizing,
  median-cut palettes (2/4/16/256), transparent canvas preview, and 1–16× zoom.
- Export filename/local category, PNG export, and one explicit local draft in IndexedDB.
  Original, resized image, and sprite remain separate Blobs. Open draft restores it.
- `/settings`: persisted Developer Mode. `/projects`: clearly labelled future scope.
- Indexed RGB565 sprite binary encoding and decoded previews. Template-based ARC2
  item rebuilding replaces one frame while retaining behavior, names, palette and
  other frames. Exported binaries are experimental and not device verified.
- Template sprite thumbnails, automatic matching dimensions, aspect-preserving
  image fit, transparency conversion, and original/converted frame comparison.
  **Use in uploader** selects the exact converted archive without sending it.
- A PCOM placeholder, pinned format research, a provenance-backed item test fixture,
  and protocol/transport/image/binary tests.

## Working

Lint, TypeScript checks, unit tests, the production build, and Edge browser flows
have passed. Final verification details are recorded in [validation](docs/validation.md).
The mock adapter does not establish hardware or resource compatibility.

## Architecture

```text
React UI → Zustand device controller → ParadiseService
                                      → ParadiseProtocol (echo / type-3 item upload)
                                      → Transport
                                        ├─ WebSerialTransport
                                        ├─ MockTransport
                                        └─ PCOMTransport (unsupported)

React image workspace → image processing → device-independent quantization
                      → Canvas preview / PNG
                      → Dexie draft (original + processed + sprite Blobs)

React binary export → ParadiseService → sprite encoder / item template rebuilder
                                      → decoded preview / local binary download
```

`src/lib/paradise/` exclusively owns device-specific formats and commands.
No component constructs UART bytes. UART reads are chunks, not necessarily
packets; only complete ECHO lines are recognized by the diagnostic protocol.
The TX log records attempted writes, not proof that the device received bytes.

## Experimental

UART defaults and the echo command are sourced from public research and are
**HIGH CONFIDENCE**, with user-supplied echo evidence recorded separately. See
[UART research](docs/research/uart.md) and [protocol notes](docs/research/protocol.md).
The one-shot echo waits 500 ms and does not retry automatically.

## Known Issues

- One real-device ECHO connectivity test passed on 2026-09-26; see [hardware test log](docs/hardware-tests.md). No resource is Device Verified.
- PC UART uploads have user-reported success. Generated artwork is untested on
  hardware. The upload flow and key were identified in the user's Patchi Lab V1
  installation; local simulated transfer reconstructs 舞台.bin byte-for-byte.
- `舞台.bin` is a user-reported Patchi Lab V1 reference uploaded as a new item.
  Generating another new-item identity still requires evidence of its allocation fields.
- Template rebuilding preserves the existing palette, which can change the artwork's
  colors. It requires matching dimensions and binary alpha. Only indexed sprites
  with uncompressed or bytewise RLE frames and one palette set can be edited.
- Standalone binary sprites support 1–255 pixels per dimension; the editor's
  256-pixel previews cannot be encoded. New item behavior cannot be generated.
- PCOM transport behavior is UNKNOWN for the user's specific adapter.
- Only one explicit local draft; no autosave, project library, or .tamaproject exchange.
- Crop uses numeric source-pixel controls. Fit inside preserves proportions;
  Stretch fills the selected dimensions. Older drafts retain their stretch setting.
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

One ECHO connectivity test is recorded as PASS, and PC UART item upload has a
user-reported PASS. Converted artwork remains NOT RUN. See
[hardware test log](docs/hardware-tests.md). Browser tests and simulated
serial streams must never be reported as real-device verification.

## Next Tasks

1. Capture TX/RX and the device result for a converted item through TamaLab.
2. Record whether the item is added and existing items remain available.
3. Separately test modified output before marking any generated resource Device Verified.

## Upload an existing item

1. Close Patchi Lab and other software holding the serial port.
2. Open `/device`, choose USB serial and connect at 460800 baud.
3. Under **Upload an existing item**, select the original `.bin` and import the
   locally prepared `.local/patchi-protocol-key.json`. The key stays in memory for
   this page session; it is excluded from Git and deployment. No key is bundled
   in the app. Other users must supply their own protocol-key configuration.
4. Start capture, put the Tamagotchi on the download connection screen used with
   Patchi Lab, and choose **Upload item unchanged**.
5. After all chunks are acknowledged, check the device result, stop capture and
   export JSON. Cancellation or failure closes the connection; reconnect before retrying.

This sends the file unchanged. It does not assign IDs or guarantee storage behavior
on repeat upload. See [upload evidence and limits](docs/research/item-upload.md).
Mock mode simulates acknowledgements only and never proves hardware acceptance.

## Convert your artwork into an item

1. Open `/studio` and upload your PNG/JPG/WEBP. The original image is preserved.
2. Under **Create item .bin**, select a working item `.bin` as the template.
   Choose a sprite and frame; image dimensions match automatically. Fit inside
   preserves proportions, while Stretch fills the frame.
3. Choose **Convert image to item .bin** and inspect the converted preview.
   Colors map to the template palette; partial transparency becomes either
   transparent or opaque, or composites over white for opaque templates.
4. **Download item .bin** saves a copy. **Use in uploader** opens `/device` with
   the exact converted file selected. Connect USB serial, import your local key,
   and explicitly choose **Upload item unchanged** when ready.

The template supplies item structure and behavior. Only the selected frame changes;
identity, in-device name, palette, behavior and other frames stay the same. Uploading
may replace a download with that identity. This does not allocate a separate new
item ID. Changing the export filename does not change the device's item name.
The selected file stays in browser memory across navigation, but not a refresh.
Standalone sprite export remains under **Advanced** and is not a complete item.
See the [encoding contract](docs/research/encoding-milestone.md) for pinned sources.

## Research sources

- [GMMan's prongs protocol](https://github.com/GMMan/tama-para-research/blob/master/protocols/tcp.md)
- [GMMan's adapter notes](https://github.com/GMMan/tama-para-research/blob/master/hardware/prongs_adapter.md)
- [tamacom reference library](https://github.com/GMMan/tamacom)
- [Chrome Web Serial documentation](https://developer.chrome.com/docs/capabilities/serial)
- [Next.js setup](https://nextjs.org/docs/app/getting-started/installation)
- [shadcn manual setup](https://ui.shadcn.com/docs/installation/manual)

Independent community project. The app bundles no official artwork. Tests include
a community-authored fixture with [provenance and license](tests/fixtures/tamacat/PROVENANCE.md).

# TamaLab
