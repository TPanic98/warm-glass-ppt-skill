---
name: warm-glass-ppt
description: Create editable Chinese or bilingual presentations for reports, talks, training and product introductions in a warm-white, orange-red glass style, using reusable native components and offline generation.
license: MIT
metadata:
  version: "1.2.0-rc.1"
  requires: "Node.js 20.9+ for the offline generator; image generation is optional. No API key is required."
---

# Warm Glass PPT

Create a presentation whose narrative and visual system remain consistent across pages. Start from the user's material, audience, duration, slide count, editability needs and delivery format. Infer routine choices from the conversation; a missing preference does not prevent a first draft.

## Choose the narrative

Read [narrative.md](references/narrative.md) to choose among four uses: report (汇报), talk (演讲), training (培训) or product (产品介绍). These describe the communication goal, not the presenter's seniority or a particular industry. For a mixed assignment, use the dominant purpose and adapt supporting sections. Set one job and one main statement for each slide. Keep evidence and future plans distinct; keep a metric on the page that owns its explanation. A section divider marks a transition and does not repeat the following page's argument.

## Choose the visual treatment

Read [visual-system.md](references/visual-system.md) before designing. Use `assets/tokens.json` as the single source of design values. The warm-white canvas, restrained orange-red emphasis, dark text and translucent layers define the style. Preserve a user-supplied brand asset as an image with its aspect ratio; the public defaults are unbranded.

Read [ui-components.md](references/ui-components.md) for C01–C24 selection and the native UI brief format. `assets/components.json` indexes parameters and capacities. `assets/component-library.pptx` contains editable examples for direct copying. Choose by the relationship: comparison, sequence, containment, role hand-off, time trend or scope mapping. A sparse statement may need only a headline; do not fill every page with the same card grid.

The approved component canvas is 1672×941. Keep the fixed header and clear upper-right corner. Use fill opacity for glass while leaving text fully opaque. The legacy 11-layout format remains at 1600×900; read [layouts.md](references/layouts.md) only for that format, and do not mix coordinates.

## Build the deck

For portable offline generation, read [ui-components.md](references/ui-components.md), copy the applicable six-page brief from `examples/ui/`, and replace its content and parameters. Run commands from this skill's folder:

```bash
npm ci
node scripts/build-ui.mjs examples/ui/report.json --out output/report
```

The four purpose examples are `report.json`, `talk.json`, `training.json` and `product.json`. `components.json` demonstrates all 24 families. Corresponding PPTX examples are included for direct editing. The generator lays out supplied copy; it does not research, rewrite a narrative or infer real business results.

`--out` is a directory. Output includes `deck.pptx`, a self-contained vector `preview.html`, `scene.json` and `validation.json`. The builder refuses existing deliverables unless `--force` is supplied. It rejects unsupported fields, estimated text overflow and off-canvas elements. Resolve the wording or layout and rerun. Native shape/text groups are named by component instance. Charts, tables and attached connectors remain independent editable objects; recheck connector routing after manual node changes.

For an existing v1 brief, use `scripts/build.mjs` and read [input-format.md](references/input-format.md). Both formats remain supported.

In a host with a required presentation-authoring workflow, use that workflow and carry over this skill's tokens, narrative and layout decisions. The included generator is an independent portable implementation; it does not require a host's private libraries.

## Use visuals and reference assets

For 3D artwork, local illustrations, image-heavy decks or requested source extraction, read [assets.md](references/assets.md). Components are native text, shapes, connectors, tables and data charts. Reference-page previews or cropped images are not component bodies. A separate raster illustration can supply material and depth when appropriate.

Inspect the source before claiming components are extractable:

```bash
node scripts/inspect-pptx.mjs path/to/reference.pptx
node scripts/extract-assets.mjs path/to/reference.pptx --out path/to/asset-library
```

If the source contains one full-slide bitmap per page, extraction yields that bitmap, not original icons or vectors. Use `--regions regions.json` only for explicitly requested raster crops. Record provenance and dimensions, and label them as image assets rather than editable UI.

## Finish

Read [quality.md](references/quality.md). Open the HTML preview and inspect every page, then render the actual PPTX through an available presentation renderer. HTML is a design preview, not proof of PowerPoint rendering. Recheck changed pages after corrections. Report which text, shapes, charts and images remain editable, and any missing rendering check or font substitution that affects use.

Deliver the deck and its preview; keep brief, scene and validation data available for later edits. Uploading or publishing source materials requires the user's authorization and the intended repository or destination.
