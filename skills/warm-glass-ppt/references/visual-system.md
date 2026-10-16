# Warm-white and orange-red glass

The public theme is a normalized visual interpretation of supplied examples, not an official bank VI standard. Exact values live in `assets/tokens.json`.

Use dark charcoal for titles, deep gray for body text, and dark red for small emphasized text. Bright orange serves large keywords, illustration lighting and paths. Warm-gray borders, soft contact shadows and a white edge suggest layered glass while text remains fully opaque. The generator implements native gradients and shadows; CSS backdrop blur and true 3D refraction belong to image assets, not editable PowerPoint fills.

Keep the accent gradient local to the emphasized object. Its direction is orange at the start and deep red at the end. Do not turn color intensity into a completion status unless the supplied content defines that status.

At a 1600×900 design canvas, reserve about 64 px on each side. Typical title size is 50 px, body 25 px, auxiliary text 20 px. Each layout has a text budget; revise the structure or move detail to notes before reducing type size. Required dense architecture pages may use a different grid with a deliberate readability tradeoff.

Chinese fonts are not bundled. Supply a font installed on both authoring and display systems. The default is Microsoft YaHei; a Linux environment may use Noto Sans CJK SC. A font declaration does not install or embed that font. Re-render the PPTX when the font changes.

For large-screen use, preserve native text and geometry. Export previews at 3840×2160 when possible; report the original pixel dimensions of raster artwork. A 4K screenshot does not improve the information in a small source image.

Use a fixed brand header only when the user supplies one. Keep its original aspect ratio, spacing and slogan alignment. Public examples carry a neutral text brand and contain no bank marks.
