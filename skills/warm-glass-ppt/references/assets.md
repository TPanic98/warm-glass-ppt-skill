# Assets and editability

## Inspect and extract

Run `inspect-pptx.mjs` before choosing a reuse strategy. The report counts native shapes, text runs, tables, charts and images per slide. `imageOnly` means the source has no native text, shapes, tables or charts on that slide; an exported screenshot cannot restore those elements.

`extract-assets.mjs` exports image files referenced by slides, plus a manifest and HTML gallery. It does not execute macros, scripts, remote relationships or embedded OLE objects. Unused media is excluded. Original SVGs are preserved when present, but the HTML gallery does not embed executable SVG markup.

For an explicit region request, provide a JSON array:

```json
[
  {"name":"focus-orb","slide":1,"imageIndex":1,"rect":[420,100,180,180],"purpose":"focal illustration"}
]
```

Coordinates are pixels of the selected original embedded image, not preview pixels or PowerPoint inches. Cropping alone needs optional `sharp`: run `npm ci --include=optional` in the skill directory when crops are requested. Basic generation and original-image extraction work without it. A crop retains its source background and pixel content. It does not gain alpha, vector editability or resolution. Check the gallery for clipped edges, labels and brand content before reusing it.

## New 3D artwork

Use the host's image-generation tool if available. Ask for a text-free illustration; place all live labels and facts in native text boxes. For an absent image tool, proceed with the native visual vocabulary or supplied assets, and describe the limit rather than requiring API credentials for an offline deck.

Suggested prompt:

> A premium isometric enterprise technology illustration of [subject], thick clear layered glass, warm-white studio light, amber and coral refraction, restrained orange-red focal point, soft contact shadow. Place the subject in [image frame] with breathing room for slide text. No text, numerals, brands or watermark. [Transparent background or warm-white canvas as needed].

Record prompt, source, original dimensions and actual transparency for each shipped asset. The lean skill ships no illustration or reference screenshots; original local artwork is supplied per task. The repository's optional legacy illustration is separate from the installed skill.

## Public distribution

The repository distributes newly written code, generic examples and an unbranded visual system. Original reference presentations, branded screenshots, raw extracted business pages, paid fonts and private local paths remain outside the repository. A separate local extracted-asset folder may contain those reference materials. Add new assets to the public package only when their redistribution is intended and the repository's asset inventory describes their origin.
