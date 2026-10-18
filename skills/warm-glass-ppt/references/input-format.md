# JSON brief

The entrypoint accepts UTF-8 JSON. `title` and `slides` are required. Each slide needs `layout` and `title`. Unknown fields fail explicitly so a typo does not silently drop content. Paths are relative to the brief; supply original local artwork when using an image. The compatibility alias `@assets/name.png` resolves inside the skill, but the lean installation ships no artwork.

```json
{
  "title": "从试点走向稳定交付",
  "author": "Your name",
  "mode": "report",
  "font": "Microsoft YaHei",
  "brand": {"name": "YOUR TEAM", "tagline": "Your presentation"},
  "slides": [
    {
      "layout": "cover",
      "title": "从试点走向\n稳定交付",
      "subtitle": "一个可验证、可持续的改进计划",
      "image": "assets/your-original-artwork.png"
    },
    {
      "layout": "process",
      "title": "先定义结果，再组织工作",
      "items": [
        {"title": "定义问题", "body": "明确对象与边界"},
        {"title": "验证方案", "body": "检查结果与证据"},
        {"title": "形成标准", "body": "沉淀可以复用的步骤"}
      ],
      "takeaway": "每一步都应留下下一步能够使用的结果。",
      "notes": "Supply speaker notes here.",
      "sources": ["A supplied report or an authoritative URL"]
    }
  ]
}
```

`mode` records narrative intent; it does not invent or rewrite content automatically. Choose `report` (汇报), `talk` (演讲), `training` (培训) or `product` (产品介绍). The skill uses that choice when planning the page script; the renderer lays out the supplied text. Omitting `mode` leaves the purpose unspecified. Existing briefs with the old value `executive` remain accepted and normalize to `talk` in `scene.json`; use the four canonical values for new work.

Optional slide fields: `subtitle`, `label`, `message`, `image`, `imageAlt`, `takeaway`, `notes`, `sources`, `demonstration`. Notes and sources go to PPTX speaker notes. The HTML preview displays projected slide content only.

Item fields depend on the selected layout. An unsupported field fails explicitly rather than silently dropping content:

- `columns` / `comparison`: `title`, `details` or `body`.
- `process` / `layers`: `title`, `body`.
- `roadmap`: `date`, `title`, `details`.
- `architecture`: `title`, `components`.
- `metrics`: `value`, `title`, `body`, `source`. `source` is required unless `demonstration` is true, in which case the slide shows a demonstration-data label.
- `quote`: uses slide-level `message`.
- `cover` / `section`: use slide-level `subtitle`, optional `message` and `image`.
- `image`: requires slide-level local PNG/JPEG `image`.

Numeric metrics are supplied as text to preserve units and comparison labels; the generator performs no arithmetic. Any changed denominator or data definition belongs in visible `body` text or a source note, as appropriate. Use a native chart/table tool when the required visual is an editable data chart or table.
