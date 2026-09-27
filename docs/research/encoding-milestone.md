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
does not supply that key. Subsequent inspection of the user's Patchi Lab V1
installation identified its key and unchanged download flow. See
[item-upload.md](item-upload.md). Offline preparation/export does not send bytes;
the separate device uploader requires explicit selection and a local key import.
TamaLab's real custom-item transfer capture remains outstanding.
The documented item download limit is 0x4000 bytes; larger downloads are patches,
which remain excluded. A checksum-valid archive does not prove item semantics.

## User-provided accepted reference

`舞台.bin` is present in the project workspace. SHA-256:
`85e726a6acadb6972d502a6f95f42c0ca2d59dbc0b04d8a29234a09a5000db87`.
The user reports that this exact file was successfully uploaded by Patchi Lab V1
as a new item, while existing device items remained available.
TamaLab parses it as a 16,384-byte ARC2 archive with three files and six indexed
sprite entries (nine frames total). This is strong evidence that the container is
accepted by at least the user's device/toolchain, but it does not identify the
transfer encryption key, prove every field's semantics, or prove that a modified
file will be accepted. The original file remains unmodified in the workspace.

## Image-to-item workflow — 2026-09-27

This refinement adds editor preprocessing and an in-memory uploader handoff; it
does not change the binary encoder, item identity fields, protocol or transport.
Confidence in the format remains based on the pinned sources above. Hardware
acceptance of newly converted artwork is UNKNOWN.

The selected template frame determines output dimensions. Aspect-preserving fit
is the default for new artwork. Partial alpha is normalized to 0/255 using a
user-selected cutoff, or composited over white for opaque templates. The existing
encoder maps artwork to the original palette. Other frames and item metadata
remain unchanged. Export filenames are local metadata, not device item names.

The decoded rebuilt frame supplies the conversion preview. Download and uploader
handoff share one validated archive snapshot and SHA-256. Selecting it does not
send anything; the existing uploader still requires explicit upload and a local
key. No allocation of a new inventory identity is implemented or claimed.

## Earlier corrections

- Sprite headers are **24 bytes**, not the 20 bytes in the previous notes.
- Capture 1790412323005 contains 10 requests and **9 replies total**, one of
  which occupies two RX chunks. Capture 1790412603085 has one reply split into
  two chunks, complete in 10 ms. The JSON format itself does not record mock
  versus serial provenance; the user's serial-mode screenshot supplies context.
