---
name: warm-glass-ppt
description: Design editable Chinese or bilingual presentations for reports, talks, training and product introductions, using a warm-white orange-red visual system and content-led native composition. Also supports explicitly requested template reuse.
license: MIT
metadata:
  version: "1.3.0-alpha.2"
  requires: "Node.js 20.9+ for the offline generator; image generation is optional. No API key is required."
---

# Warm Glass PPT

Create a presentation whose composition explains the user's material. Keep its visual language consistent while choosing the structure of each page from its communication job. Infer routine preferences and preserve explicit slide counts, facts, and delivery requirements.

## Choose the task

- **New material or same-style redesign:** follow the content-led path below. Reuse color, typography and material tokens, then design the page relationships for this material.
- **Explicitly preserve an existing template:** inspect its pages and native objects, protect its branding and geometry, and change only the requested content. The included examples can serve as templates when the user actually selects them.
- **Edit an existing file:** preserve the original. Inspect its structure before deciding whether to edit its native objects or rebuild selected pages in a new version.

## Choose the narrative

Read [content-planning.md](references/content-planning.md) for new material or a same-style redesign, and the relevant purpose in [narrative.md](references/narrative.md). Establish the audience and intended outcome, then make a short page script before choosing geometry or component codes. Check that neighboring page points form a supported argument. Preserve the user's counts, facts, dates and relationships. These decisions belong to the authoring agent: the renderer does not infer them.

## Choose the visual treatment

Read [visual-system.md](references/visual-system.md) before designing. Use `assets/tokens.json` for the warm-white canvas, local orange-red emphasis, dark text and translucent material. Treat these as visual constants, not a fixed page skeleton.

Use the user's original logo and slogan as an optional brand profile, with their original proportions and clear space. An original image stays an image; adjacent slide text stays editable. A missing brand means an unbranded deck. Keep private institution assets outside the distributable skill. See [composition.md](references/composition.md) for a local image profile.

Design the content area, title position and visual hierarchy for each page. A cover has its own composition; a diagram can use more canvas than a text page. Preserve a user's header and protected upper-right corner when applicable. Standard composition uses the reference canvas, 1672×941; the legacy 11-layout format uses 1600×900. Keep coordinate systems separate.

## Build the deck

For content-led offline authoring, read [composition.md](references/composition.md) and write a `warm-glass-compose/v1` brief. It supports freely positioned native text, shapes, lines and attached connectors, original image assets, and optional C01–C24 components. Each page records why its composition fits its information relationship. Run from the skill folder:

```bash
npm ci --omit=optional
node scripts/build-ui.mjs my-composition.json --out output/my-deck
```

The generic [composition example](examples/compose/content-led.json) demonstrates a cover, relationship diagram and parallel schedule. Separate `report.json`, `talk.json`, `training.json` and `product.json` in the same folder demonstrate different fictional material. Write the actual page plan from the user's content. Examples demonstrate techniques; they do not determine slide count, outline or geometry.

For consequential claims and relationships, use the optional source register and page `claims`, `relations` and `reviewQuestions`. A non-observed claim needs a visible status anchor; an observed claim needs a non-example source. Declared arrows, containment bounds and common-axis alignment are checked against the referenced native elements. Source references do not automatically establish truth: compare them with the user's material during content review.

Read [ui-components.md](references/ui-components.md) when a local component actually fits the relationship or when reproducing the older UI brief. `assets/components.json` lists capacities. The JSON files in `examples/ui/` generate editable compatibility examples on demand; they do not define the structure for every new assignment. More complex charts or unsupported relationships can use the host's native authoring API with the same visual tokens.

`--out` is a directory. Output includes `deck.pptx`, a self-contained vector `preview.html`, `scene.json` and `validation.json`. The builder refuses existing deliverables unless `--force` is supplied. It rejects unsupported fields, estimated text overflow and off-canvas elements. Resolve the wording or layout and rerun. Native shape/text groups are named by component instance. Charts, tables and attached connectors remain independent editable objects; recheck connector routing after manual node changes.

For an existing v1 brief, use `scripts/build.mjs` and read [input-format.md](references/input-format.md). The v2 component format remains supported too; new generation has no sample brand by default and cover/transition components own their titles.

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

Read [quality.md](references/quality.md). Check content and meaning against the material, whole-deck rhythm, and every actual rendered PPTX page separately from file integrity. Confirm an intentional title hierarchy and the intended brand. Recurring layouts are appropriate when the relationship benefits from them; repetition warnings call for judgment, not arbitrary variety.

For a finished deck, read [review.md](references/review.md). The portable renderer can open the actual PPTX through installed LibreOffice and Poppler. Initialize a review receipt, inspect the resulting pages, record content/design/page judgments, and verify its freshness. The record starts pending; a build, image, render or recipe change invalidates prior approval. If the environment cannot render PPTX, deliver only with that gap explicitly disclosed, not as a reviewed final. An explicitly requested draft can remain an identified draft. Target-application interaction is a separate check; do not imply WPS or PowerPoint was tested by a headless render.

Deliver the deck and its preview; keep brief, scene and validation data available for later edits. Uploading or publishing source materials requires the user's authorization and the intended repository or destination.
