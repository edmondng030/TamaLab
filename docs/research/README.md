# Research ledger

Confidence labels: **CONFIRMED**, **HIGH CONFIDENCE**, **LIKELY**,
**EXPERIMENTAL**, **UNKNOWN**.

Public documentation is evidence, not this project's hardware verification.
Sources were reviewed on 2026-09-25. Upstream branch URLs are mutable; pin a
commit and collect real fixtures before implementing resource transfer.

The 2026-09-26 offline encoding milestone pins its format sources and public
fixture in [encoding-milestone.md](encoding-milestone.md). Transfer remains disabled.

Every implemented field requires name, offset, length, data type, endianness,
purpose, known values, unknown values, source, and confidence. N/A means a field
does not apply (e.g. endianness for ASCII); UNKNOWN means not established.
