# Public asset inventory

| Item | Origin | Distribution |
|---|---|---|
| Narrative, layout and quality guidance | Newly written from structural analysis of user-supplied examples | MIT |
| Theme values | Normalized warm-white / orange-red palette and material recommendations | MIT; not an official corporate VI |
| Example text and demonstration values | Newly written generic content | MIT; numerical examples are explicitly marked |
| `examples/legacy/assets/glass-journey.png` | AI-generated generic glass-path illustration made for this repository | Optional legacy example asset; excluded from the installed skill |
| Native layout objects | Generated from the scene model | Editable PowerPoint geometry and text |
| C01–C24 component definitions and four six-page JSON compatibility examples | Newly authored generic native text, shapes, diagrams, charts and tables following the approved visual direction | MIT; generate editable decks on demand |
| 1.2 overview image | Render overview of the earlier native examples | Historical reference only; not installed or embedded as component bodies |
| PptxGenJS | [Official project](https://github.com/gitbrent/PptxGenJS), dependency | MIT |
| JSZip | [Official project](https://github.com/Stuk/jszip), dependency | MIT or GPL-3.0-or-later; used under MIT |
| sharp | [Official project](https://github.com/lovell/sharp), optional crop helper | Apache-2.0; transitive binaries carry their own licenses |

Original presentations, embedded logos, screenshots, names, business claims and fonts are not distributed. Local source-inspection and crop manifests may refer to private source files; they are kept outside this repository.

The optional legacy illustration was created with the host's built-in image generation tool. It is a raster visual asset, not editable 3D geometry. Its dimensions, transparency metadata and prompt are recorded in `examples/legacy/assets/artwork.json`. It is not required by new composition or component examples and is excluded from skill installation. Generated decks, full-page previews and their HTML galleries are omitted from the current source tree; the earlier release archives remain available without rewriting Git history.

Technical references used during implementation:

- [Agent Skills specification](https://agentskills.io/specification)
- [PptxGenJS official documentation](https://gitbrent.github.io/PptxGenJS/)

These are documentation references, not copied manuals bundled with this skill.
