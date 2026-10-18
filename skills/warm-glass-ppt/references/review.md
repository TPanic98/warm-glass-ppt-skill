# Review the current PPTX

Use this for a finished generated deck. Build success proves file and estimated geometry checks, not content truth or design quality. The review receipt records judgments and binds them to current files; it cannot prove reviewer honesty.

## Render

From the skill directory, after building a new version:

```bash
node scripts/render-pptx.mjs output/my-deck --out output/my-deck/renders
node scripts/review.mjs init output/my-deck --render-manifest output/my-deck/renders/render.json
```

The renderer needs installed LibreOffice (`soffice`) and Poppler (`pdftoppm`). Explicit `--soffice` and `--pdftoppm` executable paths are accepted. It uses a separate temporary Office profile, exports the actual `deck.pptx` to PDF, then renders all pages as PNG. It preserves `deck.pdf`, PNGs and `render.json`, refuses an existing render directory, and reports `rendered-not-reviewed`. No remote service or API key is used. Missing tools stop without declaring a visual pass.

Choose an installed, suitable Chinese font in the brief before final layout. When `fc-match` is available, preflight records the requested and resolved families; a known substitution stops by default. `--allow-font-substitution` is an explicit opt-in, not an assertion of equivalence. Without `fc-match`, the report says preflight was not checked. Some isolated headless Office bundles do not discover host fonts even when the host lists them: an appropriate `--fontconfig fonts.conf` can be supplied to that process only. No system configuration or fonts are installed or changed. Inspect actual glyphs; extraction of correct Unicode or a successful PDF export can coexist with visible empty boxes.

The build's `validation.json` includes the brief, image bytes, scene, PPTX and generation-recipe hashes. The source brief and original local assets must remain available to verify freshness. Older builds without provenance must be regenerated or identified as older/unverified; do not retrofit an approval without rendering the corresponding file.

This receipt route supports current `warm-glass-ui/v2` and `warm-glass-compose/v1` builds. The original 11-layout v1 compatibility exporter does not emit this manifest: migrate a new design to composition, or inspect its actual rendered output with an external review and disclose that automated freshness checking was unavailable.

## Judge

Open every actual PNG, compare the full deck's progression and inspect each page at readable size. Resolve clipping, awkward wraps, unintended overlap, misleading arrows, mismatched dates, sample branding and duplicate conclusions. Compare claims and visible statuses against their sources. Use the page's authored `reviewQuestions` where present.

The initialized `review.json` has pending `content`, `design` and individual `pages` entries. After inspection, give each a `status` of `pass` or `needs-fix` with concrete `notes`. The authoring agent may record this judgment; a separate human approval is required only when the user's workflow calls for it. Record what was actually checked, not boilerplate approval.

Each composition warning needs a reasoned decision. A justified repeated layout may be `accepted` with a `reason`. If it is a real problem, fix the source, rebuild in a new version and rerender. Copying the old receipt does not approve the new version.

Keep `targetApplication.status` as `not-tested` unless a separate interaction test was performed. A claimed `passed` test needs an application name and observations; a failed test blocks completion of the record. A headless LibreOffice render is not a WPS/PowerPoint edit-save-reopen test.

## Verify

```bash
node scripts/review.mjs verify output/my-deck
```

Exit 0 means the current review record is complete, not machine-proven design perfection. Exit 2 means review is pending or stale; exit 1 indicates invalid input or an operational error. The result includes the actual renderer and target-app limitations. Changing a source brief, original image, scene, PPTX, rendering, validation record or generation recipe invalidates the prior review. A page copy edit therefore needs a fresh build and review.

## Other actual-PPTX renderers

A host can provide an equivalent `warm-glass-render/v1` JSON manifest. Include `pptxSha256` of the rendered file, `renderer` with `name` and `method` (and preferably `version`, `limitations`), and one `pages` entry per slide: `{slide,path,sha256}`. PNG paths resolve relative to the manifest. The receipt verifies hashes and page coverage, not whether an external provider really rendered the claimed file: preserve renderer logs and disclose the method. Do not label HTML screenshots as actual PPTX renders.
