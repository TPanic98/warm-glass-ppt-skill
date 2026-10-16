# Public asset inventory

| Item | Origin | Distribution |
|---|---|---|
| Narrative, layout and quality guidance | Newly written from structural analysis of user-supplied examples | MIT |
| Theme values | Normalized warm-white / orange-red palette and material recommendations | MIT; not an official corporate VI |
| Example text and demonstration values | Newly written generic content | MIT; numerical examples are explicitly marked |
| `glass-journey.png` | AI-generated generic glass-path illustration made for this repository | Included for reuse; not copied from a reference deck |
| Native layout objects | Generated from the scene model | Editable PowerPoint geometry and text |
| C01–C24 component library and four six-page purpose examples | Newly authored generic native text, shapes, diagrams, charts and tables following the approved visual direction | MIT; no original deck screenshots or cropped UI |
| UI gallery previews | Renders of those newly authored native examples | Review images only; never used as PPTX component bodies |
| PptxGenJS | [Official project](https://github.com/gitbrent/PptxGenJS), dependency | MIT |
| JSZip | [Official project](https://github.com/Stuk/jszip), dependency | MIT or GPL-3.0-or-later; used under MIT |
| sharp | [Official project](https://github.com/lovell/sharp), optional crop helper | Apache-2.0; transitive binaries carry their own licenses |

Original presentations, embedded logos, screenshots, names, business claims and fonts are not distributed. Local source-inspection and crop manifests may refer to private source files; they are kept outside this repository.

The supplied illustration was created with the host's built-in image generation tool. It is a raster visual asset, not editable 3D geometry. Its dimensions and alpha-channel metadata are recorded in `skills/warm-glass-ppt/assets/artwork.json`. The full generation prompt is retained there for reproducibility of intent; a repeated generation need not be pixel-identical.

Technical references used during implementation:

- [Agent Skills specification](https://agentskills.io/specification)
- [PptxGenJS official documentation](https://gitbrent.github.io/PptxGenJS/)

These are documentation references, not copied manuals bundled with this skill.
