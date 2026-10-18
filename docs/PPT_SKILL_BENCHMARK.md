# PPT 技能对标与改进方向

核验日期：2026-10-18（Asia/Shanghai）。范围：官方公开文档、实际技能文件和相关源码；未安装或运行下列外部项目，未上传用户材料，也未进行同题生成竞赛。因此，下文比较的是可核查的设计与实现，不是输出美观度排名。GitHub 星数不作为质量证据。

## 结论

Warm Glass 需要从“组件填充主导”转向“内容决策主导”，不必先换掉原生 PPTX 引擎。应借鉴成熟方案对任务分流、逐页构图和最终文件审查的组织方式，而不是搬入另一套固定模板。

对标时区分四类：工作流技能决定如何理解和设计；模板生成器把内容填入规定结构；渲染库负责对象和文件；整页图片生成器主要交付画面。后两类本身不能解决叙事问题，整页图片路线也不满足本项目的正文、图表和结构可编辑目标。

## 核查到的方案

| 方案与类别 | 内容与构图 | 品牌与可编辑性 | QA、移植与边界 |
| --- | --- | --- | --- |
| Anthropic 官方 `pptx`：工作流技能 | 将新建、改稿、模板编辑分流；新建使用 PptxGenJS，可逐页编排，明确反对机械重复布局 | 图表优先使用原生对象；并非要求把整页变成图片。没有理由复制其示例配色替代用户品牌 | 同时要求内容、文件和逐页实际渲染检查；依赖 Python、Node、LibreOffice、Poppler。其“预装依赖”假设不能直接搬到 WorkBuddy。[技能源文件](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/pptx/SKILL.md) |
| OpenAI 官方 Presentations 文档及公开 `google-slides`：产品工作流／模板专用技能 | 官方文档描述先形成短页计划再构建、渲染；公开 Google Slides 技能限于已有原生参考稿，按叙事作用匹配页面，不仅按框数套版 | 从原稿解析主题、字体、保护区域和几何；保留可编辑原生文本、表格等。找不到合适原型时才重构 | 读取结构和渲染分别取证；含占位内容、字号和空白页检查。需要宿主运行时或连接器，不是确认过的独立离线 PPTX 包。[官方用途说明](https://learn.chatgpt.com/use-cases/generate-slide-decks)、[公开技能](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/google-drive/skills/google-slides/SKILL.md) |
| PPTAgent 当前 `skills/pptagent`：开放工作流＋转换工具 | 宿主 agent 研究并编写 HTML 页面，工具负责转换与审查；不限定为若干整页模板 | 本地 CSS、字体及图像可组成品牌资源；声明输出可编辑 PPTX。但不能因此认定所有 CSS、连线或图表都会成为对应的原生对象 | 源页面、共享素材和输出均关联哈希；变更会使旧证据失效。默认交付关卡要求当前审查通过；还需核验转换限制和较重依赖。[技能](https://github.com/icip-cas/PPTAgent/blob/833cda553b343be0e486a93b0b57cac962cdd566/skills/pptagent/SKILL.md)、[源码关卡](https://github.com/icip-cas/PPTAgent/blob/833cda553b343be0e486a93b0b57cac962cdd566/skills/pptagent/scripts/pptagent_runtime/core.py) |
| PptxGenJS：文件生成库，不是设计技能 | API 可以任意放置文字、形状、图表和表格；不替使用者做内容策划 | 支持母版和主要原生对象，适合继续作为本项目底座 | 不会自动证明故事成立、排版合理或各应用显示一致。其 HTML 转换说明主要针对表格，不能等同通用网页保真转换。[项目说明](https://github.com/gitbrent/PptxGenJS/blob/3c9ec1b687c174952166f6a34b5e87ebf69fa469/README.md) |

PPTAgent 的 HTML 路线尤其需要验证导出结果：其作者自己说明中英混排的字体度量会变化，浏览器里合适的标题仍可能在 PPTX 中换行。它要求本地化依赖并检查导出的稿件，而不只检查 HTML。[转换约束](https://github.com/icip-cas/PPTAgent/blob/833cda553b343be0e486a93b0b57cac962cdd566/skills/pptagent/references/task-contract.md)

OpenAI 的通用 Presentations 能力有[官方文档](https://learn.chatgpt.com/use-cases/generate-slide-decks)支持；但本次未确认可直接再发布、与本机完整运行时等价的官方独立源码包。旧 [`openai/skills` README](https://github.com/openai/skills/blob/main/README.md) 已标注转向 `openai/plugins`。第三方“导出的官方 skills”不能据此视作官方维护、许可明确或跨宿主即装即用。

## 本项目的缺口与优先级

以已发布的 [v1.2.0-rc.1 技能](https://github.com/TPanic98/warm-glass-ppt-skill/blob/v1.2.0-rc.1/skills/warm-glass-ppt/SKILL.md) 为基线：它已有一页一观点、关系选组件和实际 PPTX 渲染要求；不足不是完全没有设计原则，而是执行主路径仍引导复制六页示例，且固定页眉、标题和内容起点。已有[测试记录](TEST_REPORT.md)主要证明分发、对象和渲染，不能证明新材料的设计泛化。

| 优先级 | 改进 | 可观察的验收条件 |
| --- | --- | --- |
| P0 | 分开“同风格自由设计”和“严格沿用模板”两条路由；默认根据用户意图，不强制复制示例 | 同一材料的封面、架构、双轨计划形成三种内容驱动构图，而非换标题的卡片页 |
| P0 | 先定每页任务、主要判断、证据和信息关系，再选局部组件；允许原生自由组合 | 架构能表达方向、依赖和人工节点；并行计划能显示两轨关系，不把并行误画成串行 |
| P0 | 品牌独立于主题和布局：显式 logo、slogan、宽高比、保护区与字体 profile | 本地样例沿用用户培训原件的品牌；公开默认不出现示例口号或任何机构标识；缺 logo 不伪造 |
| P0 | 文件结构、语义与视觉分层验收，加入品牌残留、重复标题和关系缺失检查 | “能生成、无溢出”不再自动等于设计通过；真正修改后的 PPTX 必须重新渲染 |
| P1 | 添加陌生材料的跨宿主任务，而不只测试预制 JSON | 汇报、演讲、培训、产品介绍都用新材料；记录使用模型、版本、过程和文件，区分引擎测试与 agent 行为测试 |
| P1 | 用源稿／素材／输出哈希绑定审查状态，避免旧图通过而新稿直接交付 | 改字、换品牌或改共享样式后，旧 QA 明确失效；报告写出未完成的检查，而不是伪造通过 |
| P2 | 再扩充组件和特殊图形；为必须的自由构图提供稳定 API | 新内容无需伪装成不适合的已有组件；避免把所有业务关系塞进表格或等宽卡片 |

以上是本项目建议，不是其他项目效果已经实测的结论。对于技能本身，还应测试触发、执行路径、产出和风格，而非只给生成器跑单测；这与 [OpenAI 的技能评估方法](https://developers.openai.com/blog/eval-skills)一致。

## 许可与未验证项

- Anthropic `pptx` 的[单独许可](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/pptx/LICENSE.txt)为 Proprietary，并限制复制、派生和分发。仅作公开材料对照，不复制其代码、提示词、素材或整段操作指令进入本项目。
- PPTAgent 技能的 [MIT 许可](https://github.com/icip-cas/PPTAgent/blob/833cda553b343be0e486a93b0b57cac962cdd566/skills/pptagent/LICENSE)与 PptxGenJS 的 [MIT 许可](https://github.com/gitbrent/PptxGenJS/blob/3c9ec1b687c174952166f6a34b5e87ebf69fa469/LICENSE)要求保留相应声明；以后复用仍需核对依赖和素材各自的权利。此次没有引入其代码。
- 对 OpenAI 公开 Google Slides 路径，本次未在所检目录及仓库根部确认清晰适用的再分发许可；不因“能在 GitHub 阅读”而默认可整包复制。本机运行时也不随技能打包。
- 本次未实测这些外部方案的中文质量、WPS/PowerPoint 兼容、图表数据编辑、4K 显示效果、耗时、费用或事实准确率；不作相关优胜承诺。用户私有品牌资产仅在本地使用，发布前需单独审查。

本次主要源码快照：Anthropic `dbd4588f`、OpenAI Plugins `0722921d`、PPTAgent `833cda55`、PptxGenJS `3c9ec1b6`。链接已固定到对应提交；官方产品文档按上述核验日读取，后续可能变化。
