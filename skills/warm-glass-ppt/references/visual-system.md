# Warm-white and orange-red glass

The public theme is a normalized visual interpretation of supplied examples and the supplied HTML design specification, not an official bank VI standard. Exact values live in `assets/tokens.json`. Transfer the visual language to the current subject; the reference's course title, bank brand and business copy do not belong in unrelated decks.

Use dark charcoal for titles, deep gray for body text, and dark red for small emphasized text. Bright orange serves large keywords, illustration lighting and paths. Warm-gray borders, soft contact shadows and a white edge suggest layered glass while text remains fully opaque. The generator implements native gradients and shadows; CSS backdrop blur and true 3D refraction belong to image assets, not editable PowerPoint fills.

Keep the accent gradient local to the emphasized object. Its direction is orange at the start and deep red at the end. Do not turn color intensity into a completion status unless the supplied content defines that status.

The six gradients have different jobs:

| Token | Role | Boundary |
| --- | --- | --- |
| `accent` / G01 | Orange-to-red emphasis | Apply inside one keyword or object, not across unrelated text |
| `glass` / G02 | Neutral translucent surface | Stop opacity is 90%, 64%, 48%; text and the whole component stay opaque |
| `map` / G03 | Warm translucent map or layered artwork | Material approximation, not geographic or business data |
| `route` / G04 | Strong-to-soft emphasis along a route | Position along a path, not completion status |
| `focus` / G05 | The current core concept | Reserve saturation for the actual focus |
| `tag` / G06 | Small high-contrast white-text label | Use the darker red version for readability |

Gradient stops are `[positionPercent, hexColor, optionalOpacity]`, where opacity runs from 0 to 1 and defaults to 1. Angles use the PowerPoint direction convention: 0° points right and 45° points down-right; HTML adds 90° for the equivalent CSS direction. Map and route tokens are available for appropriate custom artwork; the standard roadmap layout uses editable milestones and does not automatically generate a map.

The reference material uses 24 px main corners, 16 px small corners, a 90%-white 1 px edge, 10 px backdrop blur, a soft outer shadow and a lighter contact shadow. These are separate effects. Native PPTX preserves gradient-stop alpha and an outer shadow but approximates the CSS contact, inset and backdrop effects. Never fade the text to simulate glass.

The source reference is 1672×941. The portable generator normalizes it to a true 16:9, 1600×900 canvas with about 64 px side margins; it is not a pixel-identical reconstruction. Typical generator title size is 50 px, body 25 px, auxiliary text 20 px. The source's content titles are 56–68 px and roadmap titles 88–104 px; use these when matching the original composition rather than the portable layout. Each layout has a text budget; revise the structure or move detail to notes before reducing type size. Required dense architecture pages may use a different grid with a deliberate readability tradeoff.

Chinese fonts are not bundled. Supply a font installed on both authoring and display systems. The default is Microsoft YaHei; a Linux environment may use Noto Sans CJK SC. A font declaration does not install or embed that font. Re-render the PPTX when the font changes.

For large-screen use, preserve native text and geometry. Export previews at 3840×2160 when possible; report the original pixel dimensions of raster artwork. A 4K screenshot does not improve the information in a small source image.

Use a fixed brand header only when the user supplies one. Keep its original aspect ratio, spacing and slogan alignment. The source header starts at X48/Y42 on its 1672×941 canvas, uses one divider, and left-aligns its two slogan lines. The upper-right corner stays clear of decorative marks, module badges and automatic sample page numbers. Public examples use a neutral text brand and contain no bank marks. A requested page-number scheme can be added deliberately without treating it as part of the source header.
