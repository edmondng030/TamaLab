# Encoding implementation contract — 2026-09-26

Primary formats pinned to GMMan/tama-para-research commit
`3fe2cc57835895c5797ae01db347ce7202287e7b`:

- [Sprite format](https://github.com/GMMan/tama-para-research/blob/3fe2cc57835895c5797ae01db347ce7202287e7b/formats/sprites.md)
- [ARC2 format](https://github.com/GMMan/tama-para-research/blob/3fe2cc57835895c5797ae01db347ce7202287e7b/formats/archive.md)
- [Item archive layout](https://github.com/GMMan/tama-para-research/blob/3fe2cc57835895c5797ae01db347ce7202287e7b/formats/archive_structure.md)
- [Download protocol](https://github.com/GMMan/tama-para-research/blob/3fe2cc57835895c5797ae01db347ce7202287e7b/protocols/tcp.md)

Cross-reference: [TamaCat items](https://github.com/juliarscat/Tamacat/blob/8247a94d6e5dfc26fc25afafbf4b75e269836670/tamacat/items.py),
[sprites](https://github.com/juliarscat/Tamacat/blob/8247a94d6e5dfc26fc25afafbf4b75e269836670/tamacat/sprites.py),
and [TCP](https://github.com/juliarscat/Tamacat/blob/8247a94d6e5dfc26fc25afafbf4b75e269836670/tamacat/tcp.py).
The reference says its transfer is not hardware verified and needs a shared key.

## Scope

Implement offline sprite encoding/decoding and template-based item rebuilding.
Preserve template metadata and all unselected frame data. No new behavior IDs,
item names, categories, prices, or interaction fields are invented. In-app name
and category remain editor metadata. Encoded/rebuilt output is EXPERIMENTAL.

The download protocol specifies a shared encryption key. ECHO is plaintext and
does not supply that key. This project has no verified key and no real custom
item transfer capture. Preparing/exporting binary data must not enable UART writes.
The documented item download limit is 0x4000 bytes; larger downloads are patches,
which remain excluded. A checksum-valid archive does not prove item semantics.

## Corrections

- Sprite headers are **24 bytes**, not the 20 bytes in the previous notes.
- Capture 1790412323005 contains 10 requests and **9 replies total**, one of
  which occupies two RX chunks. Capture 1790412603085 has one reply split into
  two chunks, complete in 10 ms. The JSON format itself does not record mock
  versus serial provenance; the user's serial-mode screenshot supplies context.
