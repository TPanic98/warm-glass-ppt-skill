# Content-led native composition

Use this path for new material or a same-style redesign. First decide the page's communication job and information relationship, then position its objects. Reuse the visual tokens without inheriting an example's entire page structure.

## Input

The canvas is 1672×941 CSS pixels. Use `mode` report, talk, training or product. `title` is document/page metadata; the renderer only draws titles explicitly placed in `elements`, so a cover does not acquire a duplicate body-page title.

```json
{
  "schema": "warm-glass-compose/v1",
  "title": "协作方式介绍",
  "mode": "product",
  "font": "Microsoft YaHei",
  "slides": [{
    "title": "从任务到交付",
    "role": "body",
    "plan": {
      "job": "说明任务如何交接",
      "mainPoint": "任务输入与验收依据一起传递",
      "relationship": "输入、协作与交付的顺序关系",
      "composition": "左侧解释任务边界，右侧画可追踪的交接链",
      "evidence": "用户提供的流程说明"
    },
    "elements": [
      {"id":"heading","type":"text","role":"title","x":64,"y":170,"w":1000,"h":92,"size":62,"bold":true,"color":"@title","text":"从任务到交付"},
      {"id":"input","type":"shape","x":100,"y":390,"w":540,"h":150,"geometry":"roundRect","fill":"@glass","stroke":"#FFFFFF/90"},
      {"id":"input-label","type":"text","x":130,"y":434,"w":470,"h":52,"size":30,"bold":true,"text":"任务输入与完成标准"},
      {"id":"output","type":"shape","x":950,"y":390,"w":540,"h":150,"geometry":"roundRect","fill":"@glass","stroke":"#FFFFFF/90"},
      {"id":"output-label","type":"text","x":980,"y":434,"w":470,"h":52,"size":30,"bold":true,"text":"交付结果与检查证据"},
      {"id":"handoff","type":"connector","from":"input","to":"output","fromSide":"right","toSide":"left"}
    ]
  }]
}
```

Run `node scripts/build-ui.mjs brief.json --out output/new-deck`. The regular `scripts/build.mjs` entry also detects this schema. Output is editable PPTX, offline HTML design preview, scene data and validation data. Generation resets the actual-rendering status to unchecked. Render the actual PPTX before delivery.

## Elements

Every element has a unique short ASCII `id` and a `type`. Optional `role` documents its semantic job; use `title` or `headline` for the main heading. Frames use `x,y,w,h`; text size is in CSS pixels.

| Type | Fields beyond id/frame/role | Purpose |
| --- | --- | --- |
| `text` | `text,size,bold,color,align,wrap,textFill` | Native editable text. `wrap:false` keeps authored line breaks and checks width. |
| `shape` | `geometry,fill,stroke,strokeWidth,radius,shadow` | Native `rect`, `roundRect` or `ellipse` for a real node, region or data mark. |
| `line` | `x,y,x2,y2,color,width,dash,arrowEnd` | An editable rule, time scale or explicitly routed relationship segment. |
| `connector` | `from,to,fromSide,toSide,color,width,dash,kind,arrowEnd` | Native connection to two shape ids. `kind` is straight or elbow. Recheck routing after moving nodes. |
| `image` | `src,alt,x,y,w,h` | An original local PNG/JPEG asset, not a screenshot used as a substitute for required editable content. |

Colors accept `#RRGGBB`, optional `/opacityPercent`, or color tokens such as `@title`, `@body`, `@muted`, `@border`, `@accentText`. Fills also accept `@glass`, `@focus`, `@accent` and the other named gradient tokens. For a gradient keyword, give a text element `textFill:"@accent"`; ordinary text color remains solid. Keep label text fully opaque.

`role` is cover, body, transition or closing. It does not select a layout. A page may additionally contain `components:[{"code":"C07","props":{...}}]` when a catalog component fits; see `ui-components.md` for its contract. Charts and tables remain native through these optional components. Use a host native authoring API for configurations outside the catalog's supported numeric/table cases.

## Brand profile

The default is unbranded. Supply an authentic original header/brand asset explicitly:

```json
"brand": {"src":"assets/original-header.png","alt":"用户提供的标识与口号","x":48,"y":36,"w":490,"h":66}
```

The frame must preserve the asset's actual aspect ratio. A page can set `brand:false` if the requested cover treatment omits it. Image paths resolve relative to the brief; local PNG/JPEG data URIs are also supported. Remote URLs are rejected. Keep private brand assets and briefs outside the public skill folder. If only a small raster original exists, retain it and disclose its pixel dimensions rather than pretending a larger export creates new detail. A user-supplied vector original can instead be placed through the host's supported image/native authoring API.

## Page decisions and checking

`plan.job`, `mainPoint`, `relationship` and `composition` are short authoring records, not extra slide text. `evidence` and `notes` carry provenance and detail. This makes a content decision inspectable without forcing it into a card or footer.

For an architecture, distinguish containment, invocation, hand-off and feedback. For parallel plans, place the tracks on the same time basis and retain differences in granularity. For a cover, give the subject one clear title hierarchy. A table is still the right choice when row/column lookup is the actual task.

Inspect the full rendered deck for reading rhythm and each page for relationship accuracy and fit. `duplicate-title` and `repeated-composition` warnings identify review candidates; they are not design scores. A source, brand or style change requires a new render. Store the reviewed PPTX hash with any visual QA receipt. See `quality.md`.

## Optional content contract

Use this for material facts or relationships whose loss would change the message. It supplements the page script; it does not impose a universal outline or force every label into an evidence register.

At the document root, `context` accepts `audience`, `goal`, optional positive `durationMinutes` and a text-array `constraints`. `sources` is an array of `{id,title,kind,locator?}`. Kinds are `user`, `public`, `example`. Locators are provenance descriptions, not commands or automatically fetched URLs.

`plan.claims` is an array of:

```json
{"id":"trial-target","text":"计划覆盖两条线","status":"planned","sourceRefs":["S1"],"elements":["trial-label"],"statusElement":"plan-disclosure"}
```

Statuses are `observed`, `planned`, `example`, `assumption`, `unverified`. `elements` reference drawn element ids. Non-observed statuses require a `statusElement` pointing to visible native text; one clear page-level disclosure may serve several claims. Observed claims require at least one non-example source. The checker verifies references and anchors, not whether the source is true or the visible wording is sufficiently clear; the content review decides that.

`plan.relations` supports three checkable assertions:

```json
[
 {"type":"directed","from":"input","to":"output","via":"handoff"},
 {"type":"containment","container":"platform","children":["capability"]},
 {"type":"aligned","axis":"x","anchor":"start","elements":["business-nov","technology-nov"]}
]
```

The directed assertion needs a native connector with the same endpoints and an arrow. Containment checks the children's bounding boxes inside a native region. Alignment checks framed objects on `x` or `y` at `start`, `center` or `end` (2 px tolerance). Use alignment for the shared boundaries that really exist; unequal duration spans can have unequal widths. Explicitly routed free lines and more complex diagrams remain supported without a relation assertion and require visual checking.

`plan.reviewQuestions` is an optional non-empty array of content-specific questions copied into the pending review receipt. Use it for questions a geometry checker cannot answer, such as whether a roadmap capability might be mistaken for currently available functionality.
