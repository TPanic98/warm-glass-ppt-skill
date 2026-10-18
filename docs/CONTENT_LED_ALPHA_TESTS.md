# Content-led alpha verification

Version: `1.3.0-alpha.1`. Checked on 2026-10-18. This is a local development build, not a replacement of the published `1.2.0-rc.1` release.

## Completed checks

- All 15 automated tests passed: six new composition/branding/identity tests plus the nine existing generator and native-object tests.
- The Codex skill-format validator passed. The public repository scan passed without including original user decks or private brand assets.
- A separate, private three-page pilot was authored and exported as PPTX. Its final file passed package-integrity, slide geometry, declared-font-policy and first-party import checks with no reported findings.
- All three actual exported pages were re-imported, rendered and visually inspected. The delivered PNG previews are exactly 3840 × 2160. Final PPTX bytes match the reviewed candidate.
- Private pilot object inspection found 15, 43 and 40 native shapes respectively, eight native connectors on the architecture page, and one explicit original-brand picture on each page. No body page is a full-slide screenshot.
- All embedded brand bytes match the private source asset. The original bitmap is 490 × 66 pixels; producing a 4K preview does not make that bitmap vector or recover additional detail.
- The independent portable PptxGenJS path exported the same private scene; all three resulting pages were re-imported and rendered successfully. This is not target-application interaction testing.
- The standalone alpha ZIP was extracted into a new empty directory. A lockfile-based install and the free-composition example generation both passed without relying on the development repository's dependencies. The example reported no composition warnings and explicitly left actual-render review unapproved.
- Archive inspection found no matching private pilot strings or original-brand image hash. The distributable remains generic and unbranded by default.

## Boundaries

The pilot is evidence for this particular design and file, not a blind cross-host quality test. The four unseen-material agent evaluations in [CONTENT_LED_EVALS.md](CONTENT_LED_EVALS.md) remain unexecuted. WorkBuddy has not yet rerun this alpha. WPS and PowerPoint UI interactions were not performed. A declared font-family check does not prove that the rendering machine used that font: fonts are not embedded and may be substituted.

The existing 48-page gallery and prebuilt example PPTX files remain version 1.2 reference assets. Do not present them as newly regenerated alpha outputs. This iteration has not published, committed or pushed a new release.
