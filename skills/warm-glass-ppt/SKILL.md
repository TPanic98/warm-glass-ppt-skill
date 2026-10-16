---
name: warm-glass-ppt
description: Create Chinese or bilingual enterprise presentations in a warm-white, orange-red glass style. Use for executive talks, training decks, roadmap or architecture slides, and extracting reusable UI assets from reference PPTX files.
license: MIT
metadata:
  version: "1.0.0"
  requires: "Node.js 20+ for the offline generator; image generation is optional. No API key is required."
---

# Warm Glass PPT

Create a presentation whose narrative and visual system remain consistent across pages. Start from the user's material, audience, duration, slide count, editability needs and delivery format. Infer routine choices from the conversation; a missing preference does not prevent a first draft.

## Choose the narrative

Read [narrative.md](references/narrative.md) for an executive talk or training course. Set one job and one main statement for each slide. Keep evidence and future plans distinct; keep a metric on the page that owns its explanation. A section divider marks a transition and does not repeat the following page's argument.

## Choose the visual treatment

Read [visual-system.md](references/visual-system.md) before designing. Use `assets/tokens.json` as the single source of design values. The warm-white canvas, restrained orange-red emphasis, dark text and translucent layers define the style. Preserve a user-supplied brand asset as an image with its aspect ratio; the public defaults are unbranded.

Read [layouts.md](references/layouts.md) when selecting or changing a page type. The generator includes cover, section, columns, comparison, process, roadmap, layers, architecture, metrics, quote and image layouts. Select the layout that expresses the relationship; do not fill every page with the same card grid.

## Build the deck

For the included offline generator, read [input-format.md](references/input-format.md), then write a JSON brief following `examples/showcase.json`. Run commands from this skill's folder:

```bash
npm install
node scripts/build.mjs path/to/brief.json --out path/to/output
```

`--out` is a directory. Output includes `deck.pptx`, `preview.html`, `scene.json` and `validation.json`. The builder refuses existing deliverables unless `--force` is supplied. It rejects unsupported fields, overflowing text and off-canvas elements; resolve the wording or layout and rerun.

In a host with a required presentation-authoring workflow, use that workflow and carry over this skill's tokens, narrative and layout decisions. The included generator is an independent portable implementation; it does not require a host's private libraries.

## Use visuals and reference assets

For 3D artwork, local illustrations, image-heavy decks or asset extraction, read [assets.md](references/assets.md). Keep labels, facts, data and required diagrams as native slide objects when editability is requested. A raster illustration can supply material and depth behind editable content.

Inspect the source before claiming components are extractable:

```bash
node scripts/inspect-pptx.mjs path/to/reference.pptx
node scripts/extract-assets.mjs path/to/reference.pptx --out path/to/asset-library
```

If the source contains one full-slide bitmap per page, extraction yields that bitmap, not original icons or vectors. Explicitly requested crops can be made with `--regions regions.json`; the manifest records source, bounds, dimensions and editability. Preserve crop backgrounds and record whether alpha actually exists.

## Finish

Read [quality.md](references/quality.md). Open the HTML preview and inspect every page, then render the actual PPTX through an available presentation renderer. HTML is a design preview, not proof of PowerPoint rendering. Recheck changed pages after corrections. Report which text, shapes, charts and images remain editable, and any missing rendering check or font substitution that affects use.

Deliver the deck and its preview; keep brief, scene and validation data available for later edits. Uploading or publishing source materials requires the user's authorization and the intended repository or destination.
