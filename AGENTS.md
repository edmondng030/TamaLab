# Tama Paradise Studio development rules

Read Project.md, README.md, and docs/research before major work.
Tasks 01–10 are the initial scope. Stop for architecture/UART review before AI,
animation, interactions, characters, or planet editing.

- Never invent Paradise commands, formats, offsets, checksums, or capabilities.
- UNKNOWN is an acceptable result. Record sources and confidence before coding.
- React calls ParadiseService; protocol code owns wire messages; transports own I/O.
- Preserve the source image and isolate editor formats from device formats.
- Never label resources Device Verified without an actual recorded hardware test.
- No arbitrary memory writes, firmware flashing, bootloader changes, or raw flash writes.
- Preserve working UART behavior; add regression coverage before modifying it.
- Run lint, typecheck, test, and build after meaningful changes. Run browser tests for UI flows.
- Update README.md progress and docs/hardware-tests.md when applicable.
- Keep changes small and respect existing user files. Do not fabricate binary fixtures.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
