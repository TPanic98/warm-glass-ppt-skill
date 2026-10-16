# Warm Glass PPT

暖白、红橙渐变与玻璃层次的可编辑 PPT 生成技能，适用于中文或中英双语的**汇报、演讲、培训、产品介绍**。

它包含可安装的 Agent Skill、叙事与设计规范，以及能离线运行的 PPTX / HTML 生成器。无需 API Key。图像生成能力是可选项。

`1.2.0-rc.1` 预发布版包含 **24 个通用组件、四类用途各 6 页样例**。已完成独立安装、离线生成、48 页实际渲染与 LibreOffice 打开另存测试。Microsoft PowerPoint 实机交互尚未验证，字体未嵌入，详见[测试记录](docs/TEST_REPORT.md)。[下载预发布包](https://github.com/TPanic98/warm-glass-ppt-skill/releases/tag/v1.2.0-rc.1)。

## 四类用途

| 用途 | 叙事重点 | 输入模式 | 示例 |
| --- | --- | --- | --- |
| 汇报 | 结论与进展、证据与偏差、风险与待决策事项 | `report` | [6 页输入](skills/warm-glass-ppt/examples/ui/report.json) / [可编辑样例](skills/warm-glass-ppt/examples/ui/report.pptx) |
| 演讲 | 核心观点、解释与案例、面向听众的启示 | `talk` | [6 页输入](skills/warm-glass-ppt/examples/ui/talk.json) / [可编辑样例](skills/warm-glass-ppt/examples/ui/talk.pptx) |
| 培训 | 学习目标、概念与示例、练习与评估 | `training` | [6 页输入](skills/warm-glass-ppt/examples/ui/training.json) / [可编辑样例](skills/warm-glass-ppt/examples/ui/training.pptx) |
| 产品介绍 | 目标用户、场景与价值、能力证据与采用条件 | `product` | [6 页输入](skills/warm-glass-ppt/examples/ui/product.json) / [可编辑样例](skills/warm-glass-ppt/examples/ui/product.pptx) |

四类用途共用视觉规范，不限制演讲者职级或所在行业。路线图、架构图等属于可用于不同用途的页面版式。`mode` 记录叙事意图；技能据此组织内容，离线生成器排版已有文案，不会自动改写或补造事实。

![四类用途示例](docs/ui-gallery/overview.jpg)

[48 页效果画廊，下载完整仓库后本地打开](docs/ui-gallery/index.html) · [24 页可编辑组件库](skills/warm-glass-ppt/assets/component-library.pptx) · [组件参数清单](skills/warm-glass-ppt/assets/components.json)

## 快速开始

需要 Node.js 20.9 或以上版本：

```bash
git clone https://github.com/TPanic98/warm-glass-ppt-skill.git
cd warm-glass-ppt-skill
npm ci
npm run demo
```

打开 `dist/ui/components/preview.html` 查看矢量设计预览，打开同目录的 `deck.pptx` 编辑组件。无需先生成也可以打开随包的可编辑组件库和四类用途样例。

HTML 和 PPTX 共用布局数据，但不同应用的字体、阴影与换行可能不同。正式交付前需要检查实际 PPTX 渲染。生成器提供估算文字边界与画布检查，不会据此宣称已通过 PowerPoint 检查。

## 安装为技能

```bash
npm run install:skill
```

默认安装到 `~/.codex/skills/warm-glass-ppt`；`CODEX_HOME` 已设置时，使用其中的 `skills` 目录。安装器完整复制技能与独立依赖锁文件，跳过 `node_modules`，并在安装目录运行 `npm ci`。已存在同名目录时停止，不覆盖个人修改。

其他支持 Agent Skills 的工具可以使用同一个技能目录。例如安装到自选目录：

```bash
node scripts/install-skill.mjs --dest /your/agent/skills/warm-glass-ppt
```

安装后在支持技能的工具中调用：

```text
使用 $warm-glass-ppt，把我的材料整理成一套项目汇报 PPT，用于阶段评审。
先明确逐页职责，再统一暖白红橙玻璃风格，保留文字与关键图形可编辑。
```

## 自己生成 PPT

按用途复制并修改 `skills/warm-glass-ppt/examples/ui/` 中的 JSON 文件，然后运行：

```bash
node skills/warm-glass-ppt/scripts/build-ui.mjs my-brief.json --out output/my-deck
```

也可运行 `npm run demo:report`、`npm run demo:talk`、`npm run demo:training`、`npm run demo:product`，分别生成四类结构示例。

输出包括可编辑文稿、离线预览、布局数据和检查记录。文件已存在时会停止；确实要重新生成同一目录时添加 `--force`。所有图片采用本地 PNG/JPEG 或随包资产，构建过程不请求远程图片服务。

组件按关系组织：标题与结论、玻璃容器与定位节点、指标与比较、流程与路线图、嵌套与架构、证据与责任表，以及目录、趋势、目标实绩、二维矩阵、闭环、泳道、输入输出、能力覆盖表、案例、答疑、转场和收束。详细参数与容量见[组件说明](skills/warm-glass-ppt/references/ui-components.md)。支持在一页组合多个组件，不是用截图充当素材。

图表保留原生数据与嵌入式工作簿，表格保留单元格、行列与边框。组件的文字和形状按实例分组，图表、表格和附着连接线保持独立，修改节点后需复核连线路由。字体未嵌入；安装一致字体后仍需检查实际应用的排版。

旧版 11 类简易版式继续通过 `scripts/build.mjs` 使用，`npm run demo:legacy` 可生成旧格式示例。新旧输入分别采用 1672×941 和 1600×900 画布，不混用坐标。生成器不宣称能自动编辑任意现有 PPTX。

## 可选：检查参考 PPT 中的图像

```bash
node skills/warm-glass-ppt/scripts/inspect-pptx.mjs reference.pptx
node skills/warm-glass-ppt/scripts/extract-assets.mjs reference.pptx --out extracted
```

这不是组件库的制作方式。先检查源文件是不是图片封装；若整页只有一张图，提取结果就是位图，不能恢复原始文字或矢量。仅在用户要求提取图片素材时使用裁切，并记录来源和像素范围。不要将裁切图标成可编辑组件。详见[素材说明](skills/warm-glass-ppt/references/assets.md)。

## 风格与编辑性

新组件库与四类用途样例均使用原生 PowerPoint 对象，没有图片组件。玻璃表面保留各渐变停靠点的不透明度，文字保持实色。PPT 使用透明填充、细边和软阴影近似玻璃，不包含实时背景模糊或真实折射。旧版示例中的可选玻璃插画是独立图片，不参与新组件实现。

参考 HTML 的六组渐变、暖白色板、玻璃材质和页眉边界已转入[视觉规范](skills/warm-glass-ppt/references/visual-system.md)与设计变量。新组件沿用获认可的 1672×941 画布和页眉，右上角不加样板页码。仅迁移视觉语言，不复制原材料的品牌、课程名称或业务内容。

设计变量来自参考材料的规范化提炼，属于视觉复现建议，不是任何银行的官方 VI。原始课件、业务数字、标识、付费字体与本地提取素材不随仓库发布。字体不嵌入：请在编辑与投屏设备安装一致的中文字体。[资产来源](docs/ASSETS.md)说明了随包插画与公开内容的范围。

## 维护与发布

```bash
npm test
npm run audit:public
npm run package:skill
```

测试覆盖新旧输入、24 个组件的覆盖、四类各 6 页样例、原生分组与图表工作簿、表格、附着连接线、渐变透明度、文字容量、图像提取、防覆盖，以及全零和小数图表数据。`docs/github-actions-ci.yml` 是可选 CI 配置，放入 `.github/workflows/ci.yml` 后才启用。打包命令仅生成本地 ZIP 和 SHA-256，不会创建远程版本、推送代码或上传文件。[测试记录](docs/TEST_REPORT.md)列出已执行和未覆盖的检查，[发布说明](docs/RELEASE_REVIEW.md)说明本次范围。

## English quick start

For reports, talks, training and product introductions. Install Node.js 20.9+, clone this repository, run `npm ci` and `npm run demo`. Install the agent skill with `npm run install:skill`, then invoke `$warm-glass-ppt`. Use `report`, `talk`, `training` or `product` to record narrative intent. The offline generator produces native editable text, shapes and gradient-stop transparency plus a self-contained HTML design preview. It is reference-informed, unbranded and does not require an API key. Inspect the actual PPTX in your presentation application before delivery.

## License

New code, generic examples and documentation are released under MIT. Original reference decks and third-party brands are excluded. Dependency licenses and generated-artwork provenance are listed in [docs/ASSETS.md](docs/ASSETS.md).
