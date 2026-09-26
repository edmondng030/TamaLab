# Tama Paradise Studio

## 1. Project Goal

Build a web application called **Tama Paradise Studio** for creating customized resources for **Tamagotchi Paradise** and transferring compatible resources to the physical device through a UART / PCOM-compatible connector.

The application should eventually allow users to:

1. Upload a real photo or image.
2. Convert the uploaded image into a cute **chibi / Q版 / Tamagotchi-like resource**.
3. Convert that resource into a device-compatible sprite.
4. Create items, gifts, food, toys, decorative assets, characters, and planet resources.
5. Create frame-based animations.
6. Define simple interactions between a customized item and a Tamagotchi character.
7. Preview the animation before sending it.
8. Connect to a Tamagotchi Paradise device.
9. Transfer supported customized resources to the device through UART / PCOM.
10. Save, load, export, and import projects locally.

---

# 2. Important Development Strategy

Do **NOT** attempt to implement everything at once.

The development priority must be:

```text
UART Communication
      ↓
Paradise Packet / Asset Research
      ↓
Custom Sprite
      ↓
Custom Item
      ↓
Transfer to Device
      ↓
AI Image Conversion
      ↓
Animation
      ↓
Interaction Templates
      ↓
Characters / Planet Resources
```

The most important milestone is:

> Successfully transfer one custom item with a custom sprite from the web application to a real Tamagotchi Paradise device.

Do not spend excessive time building a polished AI editor before the device communication pipeline works.

---

# 3. Development Principles

Follow these principles throughout the project.

## 3.1 Never guess the Tamagotchi protocol

Do not invent:

* packet structures
* command IDs
* asset offsets
* sprite formats
* compression formats
* checksums
* interaction IDs
* behavior IDs
* memory locations

If something is unknown:

```text
mark it as UNKNOWN
```

Create an abstraction/interface and leave the implementation isolated.

Research existing public reverse-engineering resources before implementing device-specific binary structures.

---

## 3.2 Separate device communication from the UI

The application must have independent modules for:

```text
UI
Image Processing
Sprite Processing
Animation
Paradise Encoding
Protocol
Serial Transport
```

The React UI must never directly construct raw UART packets.

Correct architecture:

```text
React UI

↓

ParadiseService

↓

ParadiseProtocol

↓

Transport Interface

├── WebSerialTransport
├── MockTransport
└── FuturePCOMTransport
```

---

# 4. Proposed Technology Stack

Use:

```text
Frontend:
Next.js
React
TypeScript

UI:
Tailwind CSS
shadcn/ui

State:
Zustand

Rendering:
HTML Canvas initially
PixiJS if required later

Image Processing:
Canvas API
Sharp if server-side processing is required

Storage:
IndexedDB
Dexie.js

Serial Communication:
Web Serial API

Testing:
Vitest
Playwright

Linting:
ESLint
Prettier
```

Do not introduce unnecessary dependencies.

---

# 5. Browser Target

Initial supported browsers:

```text
Google Chrome
Microsoft Edge
Desktop only
```

Initial target OS:

```text
Windows 10
Windows 11
```

Later support may include:

```text
macOS
Linux
Android Chrome
```

Do not make Safari support a requirement for MVP.

---

# 6. Application Layout

Create the main interface with the following layout.

```text
┌─────────────────────────────────────────────────────────┐
│ Tama Paradise Studio                         DEVICE ●   │
├──────────────┬──────────────────────┬───────────────────┤
│              │                      │                   │
│ Asset        │                      │ Properties        │
│ Library      │     Main Preview     │ Panel             │
│              │                      │                   │
│ Upload       │                      │ Name              │
│ Items        │                      │ Type              │
│ Characters   │                      │ Palette           │
│ Planet       │                      │ Animation         │
│              │                      │                   │
├──────────────┴──────────────────────┴───────────────────┤
│                                                       │
│ Animation Timeline                                    │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Console / Device Log                                  │
└───────────────────────────────────────────────────────┘
```

---

# 7. Main Navigation

Use these sections:

```text
Studio
Assets
Animation
Interactions
Device
Projects
Settings
```

Advanced / experimental features should be hidden behind:

```text
Settings
→ Developer Mode
```

---

# 8. Phase 0 — Research Layer

Before implementing proprietary / reverse-engineered binary formats, create:

```text
/docs/research/
```

Include:

```text
uart.md
protocol.md
sprites.md
items.md
animations.md
interactions.md
pcom.md
unknowns.md
```

For every discovered field document:

```text
Name
Offset
Length
Data Type
Endianness
Purpose
Known Values
Unknown Values
Source
Confidence
```

Example:

```text
Field: Width
Offset: 0x??
Size: 2 bytes
Type: uint16
Endian: little
Confidence: confirmed / likely / experimental
```

Never mark guessed information as confirmed.

---

# 9. Phase 1 — UART Proof of Concept

This is the first development milestone.

Create:

```text
/device
```

The page should contain:

```text
Connect Device

Connection Status

Serial Port Information

Baud Rate

Send Test

Disconnect

Clear Log
```

---

# 10. Serial Architecture

Create:

```text
/src/lib/transport/
```

Files:

```text
Transport.ts
WebSerialTransport.ts
MockTransport.ts
PCOMTransport.ts
```

Interface:

```ts
export interface Transport {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  isConnected(): boolean;

  write(data: Uint8Array): Promise<void>;

  onData(
    callback: (data: Uint8Array) => void
  ): void;
}
```

---

# 11. Web Serial

Implement browser serial communication using:

```text
navigator.serial
```

The baud rate must be configurable.

Default Paradise research value may be placed in configuration, but do not hard-code it throughout the application.

Example:

```ts
const DEFAULT_SERIAL_CONFIG = {
  baudRate: 460800,
  dataBits: 8,
  stopBits: 1,
  parity: "none"
};
```

Allow developer mode to change it.

---

# 12. Serial Logger

Implement a UART console.

Display:

```text
Timestamp
Direction
Data
Length
Decoded Command if known
```

Example:

```text
10:25:13.822 TX  04 82 10 00 AF
10:25:13.861 RX  04 82 00 01 00
```

Provide:

```text
HEX
ASCII
Decoded
```

tabs.

---

# 13. Raw Packet Capture

The user should be able to:

```text
Start Capture
Stop Capture
Export Log
```

Export as:

```text
JSON
TXT
```

JSON structure:

```json
{
  "timestamp": "",
  "direction": "TX",
  "hex": "",
  "length": 0
}
```

This will help future protocol research.

---

# 14. Mock Device

UART hardware should not be required for normal UI development.

Create:

```text
MockTransport
```

It should simulate:

```text
connect
disconnect
packet send
packet receive
success reply
error reply
timeout
```

The entire app should work against MockTransport.

---

# 15. Phase 2 — Image Import

Create a resource importer.

Supported formats:

```text
PNG
JPG
JPEG
WEBP
```

Maximum initial upload:

```text
10 MB
```

Features:

```text
Drag & Drop
File Picker
Clipboard Paste
```

---

# 16. Image Processing Workflow

Pipeline:

```text
Original Image

↓

Crop

↓

Background Removal

↓

Subject Isolation

↓

Resize

↓

Chibi Conversion

↓

Pixel / Sprite Conversion

↓

Palette Reduction

↓

Device Preview
```

Each step must preserve the original.

---

# 17. Non-Destructive Editing

Always save:

```text
originalImage
processedImage
spriteImage
```

Never overwrite the original uploaded file.

---

# 18. Background Removal

Implement the architecture first.

Do not initially require an AI background-removal service.

Create:

```ts
interface BackgroundRemovalProvider {
  removeBackground(
    input: Blob
  ): Promise<Blob>;
}
```

Initial providers:

```text
None
Manual
FutureAI
```

---

# 19. Chibi / Q版 Conversion

Create an AI abstraction.

```text
/src/lib/ai/
```

Examples:

```text
AIImageProvider.ts
MockAIProvider.ts
```

Interface:

```ts
interface AIImageProvider {

  generateChibi(
    image: Blob,
    options: ChibiOptions
  ): Promise<Blob>;

}
```

---

# 20. Chibi Styles

Provide:

```text
Cute
Super Chibi
Pixel Cute
Simple Toy
Tamagotchi Inspired
```

Do not copy any copyrighted official Tamagotchi artwork directly.

The goal is:

```text
small
cute
round
clean
simple
high readability
small-screen friendly
```

---

# 21. Suggested AI Prompt Structure

Internally generate prompts similar to:

```text
Convert the subject into a cute chibi game sprite.

Requirements:

- very simple silhouette
- large readable features
- centered subject
- isolated object
- transparent background
- no text
- no environment
- minimal shading
- clean outline
- suitable for conversion into a low-resolution sprite
```

---

# 22. Pixel / Sprite Conversion

Create:

```text
/src/lib/sprite/
```

Modules:

```text
resize.ts
palette.ts
quantize.ts
dither.ts
pixelate.ts
preview.ts
encoder.ts
```

---

# 23. Sprite Preview

Show:

```text
Original
Chibi
Pixel
Device Preview
```

Allow zoom:

```text
1x
2x
4x
8x
16x
```

Disable smoothing.

Use:

```css
image-rendering: pixelated;
```

---

# 24. Palette Reduction

Support:

```text
2 colors
4 colors
16 colors
256 colors
```

depending on future confirmed Paradise sprite requirements.

Provide options:

```text
Nearest Color
Median Cut
K-Means
```

Optional:

```text
Floyd-Steinberg Dithering
```

---

# 25. Transparent Color

Support transparent backgrounds.

Display transparency using checkerboard background.

---

# 26. Manual Sprite Editor

Later in Phase 2 or Phase 3 implement simple pixel editing.

Tools:

```text
Pencil
Eraser
Fill
Eyedropper
Move
Flip Horizontal
Flip Vertical
Undo
Redo
```

Do not attempt to compete with Photoshop or Aseprite.

Keep it simple.

---

# 27. Phase 3 — Item Creator

Create item project type:

```ts
type ResourceType =
  | "food"
  | "gift"
  | "toy"
  | "decoration"
  | "character"
  | "planet"
  | "unknown";
```

Do not encode unsupported item types until they are confirmed.

---

# 28. Item Properties

Support:

```text
Item Name

Internal ID

Category

Price

Description

Sprite

Palette

Animation

Interaction

Compatibility

Notes
```

---

# 29. Item Metadata UI

Right panel example:

```text
ITEM

Name:
Apple Toy

Type:
Toy

Price:
100

Sprite:
apple.sprite

Animation:
Bounce

Interaction:
Play

Status:
Ready
```

---

# 30. Paradise Encoder

All Tamagotchi-specific encoding must be located in:

```text
/src/lib/paradise/
```

Recommended structure:

```text
/src/lib/paradise/

config.ts

sprite/
  decoder.ts
  encoder.ts

item/
  decoder.ts
  encoder.ts

packet/
  parser.ts
  encoder.ts

protocol/
  commands.ts
  protocol.ts

checksum/
  checksum.ts

research/
  experimental.ts
```

---

# 31. Encoder Rules

Never allow React components to directly build binary formats.

Correct:

```ts
const data =
  await ParadiseItemEncoder.encode(item);
```

Incorrect:

```ts
const bytes = [
  0x01,
  item.id,
  item.price
];
```

inside a UI component.

---

# 32. Experimental Format Handling

Any unconfirmed field must have comments.

Example:

```ts
// EXPERIMENTAL:
// Field meaning not fully confirmed.
// Current observation suggests byte 0x12 controls item category.
```

---

# 33. Phase 4 — Device Transfer

Create:

```text
Send to Tamagotchi
```

workflow.

Before transfer show:

```text
Resource Name
Resource Type
Payload Size
Device
Estimated Compatibility
```

Button:

```text
SEND TO DEVICE
```

---

# 34. Transfer Progress

Display:

```text
Preparing resource

Encoding

Connecting

Handshake

Uploading

Waiting for response

Verifying

Complete
```

Do not show fake progress percentages.

Only show percentage if protocol supports meaningful byte-level progress.

---

# 35. Transfer Safety

Before sending:

```text
Validate file
Validate packet size
Validate required metadata
Validate connection
Validate supported protocol
```

Never send known-invalid payloads.

---

# 36. Device Backup

If device protocol allows reading data safely, implement backup before modification.

Potential workflow:

```text
Connect

↓

Read Existing Resource

↓

Save Backup

↓

Upload New Resource
```

Do not write to unexplored memory regions.

---

# 37. Dangerous Device Operations

Do not implement:

```text
arbitrary memory writes

firmware flashing

bootloader modification

raw flash overwrite

security bypasses
```

unless explicitly added as a separate advanced research module.

This project should initially focus on documented or experimentally verified resource transfer.

---

# 38. Phase 5 — Animation Editor

Create animation timeline.

Layout:

```text
Frame 1
Frame 2
Frame 3
Frame 4
Frame 5
```

Allow:

```text
Add Frame
Delete Frame
Duplicate Frame
Reorder Frame
Mirror Frame
Change Duration
```

---

# 39. Animation Data Model

Use a device-independent representation.

Example:

```ts
interface AnimationFrame {

  id: string;

  spriteId: string;

  durationMs: number;

  offsetX: number;

  offsetY: number;

  flipX: boolean;

  flipY: boolean;

}
```

Animation:

```ts
interface Animation {

  id: string;

  name: string;

  loop: boolean;

  frames: AnimationFrame[];

}
```

---

# 40. Animation Preview

Preview at:

```text
1x
2x
4x
```

Controls:

```text
Play
Pause
Stop
Loop
Speed
```

---

# 41. Animation Presets

Provide presets:

```text
Idle

Bounce

Shake

Jump

Spin

Sparkle

Eat

Gift

Happy

Sleep
```

These are editor-level animation presets.

Do not assume every preset can be transferred to the physical device.

---

# 42. AI Assisted Animation

Later support:

```text
Animate This
```

Example:

Input:

```text
Ball sprite
```

User chooses:

```text
Bounce
```

Generator creates:

```text
Frame 1
normal

Frame 2
move up

Frame 3
move higher

Frame 4
squash

Frame 5
return
```

The AI output must remain editable.

---

# 43. Phase 6 — Interaction Designer

Create a simple block-based interaction system.

Example:

```text
ON ITEM USE

↓

Tama Walk To Item

↓

Item Bounce

↓

Tama Jump

↓

Show Hearts

↓

Finish
```

---

# 44. Interaction Model

Device-independent representation:

```ts
interface InteractionStep {

  type: string;

  actor:
    | "tama"
    | "item"
    | "effect";

  action: string;

  duration?: number;

  parameters?: Record<string, unknown>;

}
```

---

# 45. Initial Interaction Templates

Create:

```text
Eat

Drink

Play

Hold

Bounce

Gift

Happy

Surprised

Place Object
```

---

# 46. Important Interaction Limitation

Separate:

```text
Studio Preview Interaction
```

from:

```text
Device-Compatible Interaction
```

The UI should clearly display:

```text
Preview Only
```

or:

```text
Device Compatible
```

Do not imply that arbitrary interaction scripting will work on Tamagotchi Paradise unless confirmed.

---

# 47. Phase 7 — Character Creator

Later add:

```text
Character
```

project type.

Potential resources:

```text
Idle

Happy

Sad

Eating

Walking

Sleeping

Reaction
```

Do not assume arbitrary custom characters can replace official ones until the format and compatibility are confirmed.

---

# 48. Phase 8 — Planet Resources

Later support:

```text
Planet Background

Planet Decoration

Planet Objects

Environmental Objects
```

Keep this separate from the Item encoder.

---

# 49. PCOM Support

Do not tightly couple PCOM with Web Serial.

Create:

```ts
class PCOMTransport
  implements Transport
```

PCOM support should be implemented only after its communication behavior is confirmed.

Possible PCOM modes:

```text
USB Serial

WebUSB

Vendor-specific protocol
```

The application architecture must support all three possibilities.

---

# 50. Project File Format

Use:

```text
.tamaproject
```

Internally JSON initially.

Example:

```json
{
  "formatVersion": 1,
  "name": "Apple Ball",
  "resourceType": "toy",
  "createdAt": "",
  "modifiedAt": "",
  "assets": [],
  "sprites": [],
  "animations": [],
  "interactions": [],
  "paradise": {}
}
```

---

# 51. Never Save Image Data Directly in Main JSON if Large

Use:

```text
IndexedDB Blob storage
```

with IDs referenced from the project.

---

# 52. Local Project Library

Create:

```text
Projects
```

with:

```text
New Project

Open

Duplicate

Rename

Delete

Export

Import
```

Cards show:

```text
Thumbnail
Name
Type
Last Modified
Compatibility
```

---

# 53. Autosave

Autosave local projects.

Display:

```text
Saved

Saving...

Unsaved Changes
```

---

# 54. Undo / Redo

Implement command or snapshot history for:

```text
sprite edits
animation edits
metadata edits
```

At minimum support:

```text
Ctrl + Z
Ctrl + Shift + Z
```

---

# 55. Developer Mode

Settings:

```text
Enable Developer Mode
```

When enabled show:

```text
Raw UART

Packet Inspector

Raw Asset Data

Unknown Fields

Manual Baud Rate

Experimental Commands

Export Binary
```

Keep this hidden from normal users.

---

# 56. Packet Inspector

Developer mode should show:

```text
Packet Type

Command

Length

Payload

Checksum

Raw HEX

Known Fields

Unknown Fields
```

---

# 57. Binary Inspector

Allow loading captured binary resources and showing:

```text
Offset

HEX

ASCII

Decoded Value
```

This helps reverse engineering.

---

# 58. Protocol Test Suite

Create test fixtures.

Directory:

```text
/tests/fixtures/
```

Example:

```text
known-sprite.bin

known-item.bin

known-packet.bin

uart-session.json
```

Tests:

```text
decode known sprite

encode sprite

encode → decode round trip

checksum

packet framing

malformed packet rejection
```

---

# 59. Fuzz Safety

Parser must safely reject invalid data.

Test:

```text
zero-byte input

truncated packet

oversized packet

invalid checksum

unknown command

invalid sprite dimensions
```

No parser should crash the application.

---

# 60. Error Messages

Never show only:

```text
Error
```

Use useful errors.

Example:

```text
Could not open serial port.

The selected adapter may already be in use by another application.
```

or:

```text
The resource was generated successfully, but its Paradise item format has not yet been verified for device transfer.
```

---

# 61. Compatibility Badge

Each resource should display one of:

```text
Preview Only

Experimental

Partially Verified

Device Verified
```

Do not mark anything Device Verified until tested on real hardware.

---

# 62. UI Style

Use a modern playful UI.

Style direction:

```text
cute

clean

modern

slightly Japanese toy aesthetic

soft rounded cards

large icons

pixel-art accents

not overly childish
```

Think:

```text
Nintendo / modern Tamagotchi editor

+

Apple-like clean layout

+

pixel editor
```

Avoid copying official Tamagotchi UI exactly.

---

# 63. Suggested Main Screen

```text
┌─────────────────────────────────────────────────────┐
│ Tama Paradise Studio          Paradise ● Connected │
├────────────┬──────────────────────┬─────────────────┤
│ ASSETS     │                      │ ITEM            │
│            │      PREVIEW         │                 │
│ + Upload   │                      │ Apple Ball      │
│            │       🍎             │                 │
│ Food       │                      │ Type: Toy       │
│ Toys       │                      │ Price: 100      │
│ Gifts      │                      │                 │
│ Planet     │                      │ Palette         │
│ Character  │                      │ ● ● ● ●         │
├────────────┴──────────────────────┴─────────────────┤
│ Animation                                            │
│ [1] [2] [3] [4] [5]            ▶ Preview          │
├─────────────────────────────────────────────────────┤
│           SEND TO TAMAGOTCHI                         │
└─────────────────────────────────────────────────────┘
```

---

# 64. MVP Scope

The FIRST working release must include only:

```text
1. Web application shell

2. Upload PNG / JPG

3. Crop image

4. Resize image

5. Basic palette reduction

6. Pixel sprite preview

7. Item name

8. Item category

9. Paradise encoder architecture

10. Web Serial connection

11. UART console

12. Mock device

13. Send Test Packet

14. Export generated binary

15. Real-device custom item test
```

Do not implement AI or advanced animation until these are stable.

---

# 65. MVP Definition of Done

MVP is complete when this workflow succeeds:

```text
Open Web App

↓

Upload PNG

↓

Convert to sprite

↓

Create basic item

↓

Preview item

↓

Connect Tamagotchi Paradise

↓

Encode resource

↓

Send resource

↓

Tamagotchi receives it

↓

Item appears / works as expected
```

---

# 66. Release Roadmap

## v0.1

```text
Project shell

Web Serial

Mock transport

UART console

Sprite importer
```

## v0.2

```text
Sprite converter

Palette tools

Paradise sprite encoder

Binary export
```

## v0.3

```text
Custom item

UART transfer

Device verification
```

## v0.4

```text
AI Chibi generation

Background removal
```

## v0.5

```text
Sprite editor

Animation timeline
```

## v0.6

```text
Animation templates

Interaction preview
```

## v0.7

```text
Device-compatible interaction mapping
```

## v0.8

```text
Character resources

Planet resources
```

## v0.9

```text
PCOM

Better device manager

Backup / restore where verified
```

## v1.0

```text
Stable Paradise Studio
```

---

# 67. Initial Folder Structure

Create:

```text
tama-paradise-studio/

├── app/
│
│   ├── page.tsx
│
│   ├── studio/
│   ├── device/
│   ├── projects/
│   └── settings/
│
├── components/
│
│   ├── editor/
│   ├── sprite/
│   ├── animation/
│   ├── device/
│   └── ui/
│
├── lib/
│
│   ├── ai/
│
│   ├── image/
│
│   ├── sprite/
│
│   ├── animation/
│
│   ├── interaction/
│
│   ├── paradise/
│   │
│   │   ├── sprite/
│   │   ├── item/
│   │   ├── packet/
│   │   └── protocol/
│   │
│   ├── transport/
│   │
│   │   ├── Transport.ts
│   │   ├── WebSerialTransport.ts
│   │   ├── MockTransport.ts
│   │   └── PCOMTransport.ts
│   │
│   └── storage/
│
├── docs/
│
│   └── research/
│       ├── uart.md
│       ├── protocol.md
│       ├── sprites.md
│       ├── items.md
│       ├── animations.md
│       ├── interactions.md
│       ├── pcom.md
│       └── unknowns.md
│
├── tests/
│
│   └── fixtures/
│
├── public/
│
├── AGENTS.md
├── README.md
└── package.json
```

---

# 68. README Progress Tracking

Codex must maintain:

```text
README.md
```

Include:

```text
Current Version

Implemented

Working

Experimental

Known Issues

Next Tasks

Hardware Tests
```

Update the README after every meaningful development milestone.

---

# 69. Hardware Test Log

Create:

```text
docs/hardware-tests.md
```

Every hardware test must log:

```text
Date

Adapter

OS

Browser

Baud Rate

Action

TX

RX

Result

Device Behaviour

Notes
```

Example:

```text
Test:
Send handshake

Adapter:
CH340

Browser:
Chrome

Result:
PASS

Notes:
Device returned expected response.
```

---

# 70. Research Confidence

Use these labels:

```text
CONFIRMED

HIGH CONFIDENCE

LIKELY

EXPERIMENTAL

UNKNOWN
```

Use them throughout protocol documentation.

---

# 71. AI Coding Rules

When implementing code:

1. Do not create fake Tamagotchi protocol implementations.

2. Do not silently make assumptions.

3. Clearly mark experimental code.

4. Keep modules small.

5. Keep binary parsing separate from UI.

6. Write comments explaining protocol structures.

7. Add tests for binary parsers.

8. Preserve existing working code when adding new features.

9. Do not rewrite unrelated modules.

10. Update README after major changes.

---

# 72. Codex Workflow

For every major task:

### Step 1

Inspect the existing codebase.

### Step 2

Read:

```text
README.md

AGENTS.md

docs/research/
```

### Step 3

Explain what will be changed.

### Step 4

Implement the smallest viable change.

### Step 5

Run:

```text
lint

typecheck

tests

build
```

### Step 6

Fix errors.

### Step 7

Update documentation.

---

# 73. Do Not Break Existing Working Features

If UART communication is already working:

```text
DO NOT rewrite it
```

unless required.

If modifying it:

```text
create tests first
```

---

# 74. Important First Tasks for Codex

Start with the following tasks only.

## TASK 01

Create the Next.js TypeScript project.

Add:

```text
Tailwind

shadcn/ui

Zustand

Dexie

Vitest
```

---

## TASK 02

Create the proposed folder structure.

---

## TASK 03

Create:

```text
Transport.ts

MockTransport.ts

WebSerialTransport.ts
```

---

## TASK 04

Build `/device`.

Include:

```text
Connect

Disconnect

Connection Status

Baud Rate

Console

HEX TX

HEX RX
```

---

## TASK 05

Implement MockTransport.

Allow testing without hardware.

---

## TASK 06

Implement WebSerialTransport.

Use browser Web Serial.

Do not yet implement undocumented Paradise commands.

---

## TASK 07

Create `/studio`.

Implement:

```text
Upload image

Canvas preview

Crop

Resize

Pixel preview

Palette preview
```

---

## TASK 08

Create the Paradise encoder interfaces.

Do NOT invent the actual binary format if it has not yet been verified.

Example:

```ts
interface ParadiseEncoder<T> {

  encode(
    resource: T
  ): Promise<Uint8Array>;

}
```

---

## TASK 09

Create research documentation templates.

---

## TASK 10

Run:

```text
npm run lint

npm run typecheck

npm run test

npm run build
```

Fix all errors.

---

# 75. STOP POINT

After completing Tasks 01–10:

STOP.

Do not start:

```text
AI generation

animation

character creator

interaction designer

planet editor
```

until the initial architecture and UART layer have been reviewed.

Provide a progress report containing:

```text
Completed

Files Added

Architecture

Known Issues

What Requires Hardware

What Requires Protocol Research

Recommended Next Step
```

---

# 76. Final Objective

The long-term user workflow should eventually be:

```text
Upload Photo

↓

Choose:
Item / Gift / Food / Character / Planet

↓

AI converts photo into cute chibi resource

↓

User edits sprite

↓

Create animation

↓

Choose interaction

↓

Preview with Tamagotchi character

↓

Validate Paradise compatibility

↓

Connect device

↓

Send via UART / PCOM

↓

Custom resource appears on Tamagotchi Paradise
```

The project should become a user-friendly **visual content creation studio for Tamagotchi Paradise**, while keeping all low-level hardware and protocol handling isolated, testable, documented, and safe.
