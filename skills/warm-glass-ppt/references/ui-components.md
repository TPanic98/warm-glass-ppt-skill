# Native UI components

Use this reference to choose C01–C24, edit UI briefs, or combine components. The index at `../assets/components.json` is the parameter and capacity catalog. Generate editable examples from `../examples/ui/components.json`: run `node scripts/build-ui.mjs examples/ui/components.json --out output/components` from the skill directory. Prebuilt decks and page renders are not installed with the skill.

This is the compatibility/component route. For new material whose relationships need a different composition, read `composition.md` and freely position native objects. Catalog capacities are not a reason to change the user's story or split a page mechanically.

## Choose a relationship

| Content relationship | Families |
| --- | --- |
| Subject, statement, grouping | C01 headline, C02 conclusion, C03 glass container, C04 icon/pin |
| Evidence and quantitative comparison | C05 metrics, C06 comparison, C11 evidence, C14 time trend, C15 target/actual |
| Order, stages and feedback | C07 steps, C08 roadmap, C17 feedback cycle, C18 role swimlane, C19 input/output |
| Containment, responsibilities and coverage | C09 nesting, C10 architecture, C12 action table, C16 qualitative matrix, C20 coverage table |
| Narrative and teaching | C13 agenda, C21 case, C22 questions, C23 transition, C24 cover/closing |

The labels describe relationships, not industries or seniority. A matrix needs two meaningful axes; nested layers need actual containment; a native chart needs numeric data. Do not turn unrelated words into an architecture or imply measured scores through a qualitative diagram.

## UI brief

The schema identifier selects the native component format. Coordinates are CSS pixels on a 1672×941 canvas. It preserves the approved reference proportions, which are very close to, but not exactly, 16:9.

```json
{
  "schema": "warm-glass-ui/v2",
  "title": "项目汇报",
  "mode": "report",
  "slides": [{
    "title": "下一阶段安排",
    "accent": "安排",
    "subtitle": "说明工作内容和检查节点。",
    "category": "汇报 / 工作计划",
    "footer": "计划范围以实际确认结果为准。",
    "components": [{
      "code": "C07",
      "props": {
        "x": 48, "y": 370, "w": 1576, "h": 370,
        "items": [
          {"title": "核对问题", "body": "整理遗留事项"},
          {"title": "补充验证", "body": "形成检查记录"},
          {"title": "评审范围", "body": "确认后续安排"}
        ]
      }
    }]
  }]
}
```

Top-level fields are `schema`, `title`, optional `mode`, optional `font`, optional text-only `brand:{name,sloganEn,sloganCn}`, and `slides`. The default is unbranded. Use the composition route for original image headers. Modes are `report`, `talk`, `training`, `product`, or `components` for the catalog. Slide fields are `title`, optional `subtitle`, `accent`, `category`, `footer`, `notes`, `code`, and `components`. Each instance has `code` and `props`. The catalog lists family-specific properties; all instances also need `x`, `y`, `w`, `h`. Unsupported fields fail rather than disappear silently. Scenario cover and transition components own their titles, rather than receiving an additional body-page title.

Start content around Y344, leave the footer rule at Y868 and keep objects inside the canvas. Typical page title size is 62 px and body text 23–28 px. The renderer rejects estimated text overflow; this is a conservative metric check, not an application-rendering guarantee. Reword or split crowded content before shrinking it.

## Quantitative content

C05, C14 and C15 require a non-empty `source`, unless `demonstration: true` explicitly identifies illustrative data. The renderer carries sources into notes and adds a visible demonstration disclosure if the slide lacks one. A source label is provenance supplied by the user, not independently verified evidence.

C14 takes ordered `categories` and `series: [{"name":"数量","values":[3,5,4]}]`. C15 takes `categories`, `target` and `actual` arrays. Arrays must match, with finite non-negative values. These components do not cover negative-value, mixed-unit, logarithmic or stacked analyses. Use another native chart configuration for those tasks. `unit` labels the chart; it does not convert values or apply a percentage format. Enter the actual displayed scale and check decimal precision in the final chart.

Charts carry editable embedded workbook snapshots of literal values. They do not retain an original workbook's formulas or external links. Rebuilding an existing linked chart requires a separate decision about its data lineage.

C12 and C20 use native tables. `headers` and every row must have the same number of cells. Optional `widths` are pixel widths summing to the inner table width, `w - 36`. Row capacity, estimated fit and width totals are checked. Editing a copy in PowerPoint allows native row/column operations.

## Editing and extension

Native shape/text groups are named by instance, such as `C07-1`. Enter or ungroup a copy to edit individual objects. Attached connectors, charts and tables remain independent so their endpoints and data retain native behavior. Check connection direction after moving or resizing nodes.

For new content, edit the brief rather than screenshots. Implementation is in `../lib/ui-components.mjs`; the recording surface and validation are in `../lib/ui-scene.mjs`. The portable PPTX/SVG exporters share those objects. SVGs in HTML are previews, not pictures embedded in the PPTX.

Variants, node counts and text length can change within catalog capacities. If a genuinely different relationship is needed, add a family with its parameter contract, an editable example and an export/fit test.

Maintainers can edit `lib/ui-presets.mjs` and run `node scripts/refresh-ui-catalog.mjs --out new-directory` to derive five briefs and the catalog without overwriting existing files. Review the generated changes before replacing packaged examples; regenerate and visually check the corresponding PPTX assets separately.
