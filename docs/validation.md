# Initial foundation validation

## Existing-item upload milestone — 2026-09-26

Regression baseline before protocol changes: all 30 existing unit tests passed.
Final checks: lint, typecheck, production build, 50 unit tests and 5 Edge flows PASS.
Added encrypted chunk, CRC known-answer, independent decrypt/payload, unchanged
input, private-key parsing, split/duplicate ACK, NAK retry, ENQ bounds, timeout,
collision, cancellation, disconnect and mutual-exclusion tests. A Node Buffer
aliasing regression found during local verification was fixed by copying inputs
before clearing the temporary key.

Five Edge flows pass, including key gating, mock upload, capture download,
invalid item rejection, forgetting the key and cancellation/reconnect state.
Local simulation with the user's 舞台.bin and locally extracted key produced four
chunks that independently decrypt to the exact original SHA-256. No actual device
upload was performed. Key material and decompiled reference code stay out of Git.

## Offline encoding milestone — 2026-09-26

- Lint, typecheck and production build: PASS.
- Unit tests: PASS, 30 tests. Existing UART regressions remain unchanged.
- Edge browser flows: PASS, 4 tests, including template import, decoded preview,
  checksum-valid binary download, invalid template/dimension rejection, and stale
  export removal after changing the selected frame.
- Format tests use independent bit-order vectors and the pinned TamaCat fixture
  with SHA-256 verification. Rebuilding checks unchanged behavior, names, palette,
  unselected frame payloads, and the original input.
- Tests also cover malformed lengths, checksum corruption, truncated data,
  overlapping frame offsets, RLE bounds, partial alpha and unsupported formats.
- No UART writes or generated-resource hardware tests were performed. All binary
  output remains EXPERIMENTAL. A protocol key and validated transfer flow are missing.
- User-provided `舞台.bin` was previously accepted by Patchi Lab V1 as a new item.
  TamaLab did not perform that upload and has not allocated another identity.

The following section records the earlier foundation validation.

Date: 2026-09-25. Hardware: **NOT TESTED**.

## Required checks

- `npm run lint`: PASS (no warnings).
- `npm run typecheck`: PASS.
- `npm run test`: PASS, 22 tests including the rare-color palette regression.
- `npm run build`: PASS, all routes prerendered.
- `npm run test:e2e`: PASS, 3 Edge flows after review fixes.

## Covered behaviors

- Documented echo TX bytes, split replies, malformed/partial replies, buffer bounds,
  disconnected sends, concurrent request rejection, timeout, and mock error.
- Browser serial stream locks, sequential writes, open failure, permission
  cancellation, disconnect, unplug, and reconnect using injected synthetic streams.
- Unknown encoders and PCOM reject use rather than generating guessed bytes.
- Transparency, palette size, source pixel preservation, crop bounds, file limits.
- Browser connection/capture/download, route navigation, developer setting gate.
- Browser image import, invalid crop rejection, palette/size edits, PNG download,
  and IndexedDB draft recovery after reload.
- Device and studio page screenshots reviewed visually.

## Environment notes

The system npm shim is broken; checks used the installed npm CLI directly as
documented in README. Registry access required sandbox approval. The first
browser run's automatic Windows child-process cleanup stalled after all tests
passed; stopping its identified Next.js child processes let it exit successfully.
The final browser test run used approved process permissions and exited normally.

Tests use synthetic artwork and streams. They do not prove real UART adapter
compatibility, Paradise transfer, encoding, or physical device behavior.
