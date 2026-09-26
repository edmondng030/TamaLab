# Unknowns and blockers

| Question                                                 | Status                    | Evidence required                                           |
| -------------------------------------------------------- | ------------------------- | ----------------------------------------------------------- |
| User adapter electrical/interface compatibility          | UNKNOWN                   | Adapter model, vendor documentation, physical setup         |
| Physical echo behavior                                   | User evidence recorded    | See hardware-tests.md; transport is not recorded in JSON    |
| Indexed sprite format, palette, byte compression         | EXPERIMENTAL implemented  | Pinned source and fixture tests; hardware acceptance pending |
| Custom item structure and supported categories           | ARC2 template rebuilding implemented; behavior UNKNOWN | Hardware validation |
| Safe resource upload flow and compatibility              | UNKNOWN in implementation | Reviewed upstream protocol, captures, bounded encoder tests |
| PCOM USB/API mode                                        | UNKNOWN                   | Adapter-specific enumeration and public documentation       |
| Animation and interaction mappings                       | UNKNOWN                   | Resource captures and confirmed mappings                    |
| Character/planet replacement support                     | UNKNOWN                   | Separate future research                                    |

Unknown fields cannot be filled using convenient guesses. Creating new item
behavior still throws; existing behavior is preserved during template rebuilding.
Encrypted transfer remains blocked on a verified shared protocol key and a
hardware-tested flow. Plaintext ECHO cannot establish either prerequisite.
Do not create synthetic binaries and call them known Paradise assets.
AI and later editors wait for the Project.md review checkpoint.
