## ADDED Requirements

### Requirement: Suggestion Button Rendering

系统 SHALL 将 AI 回复中 `[文本](suggest:内容)` 格式的链接渲染为可点击的建议按钮。

#### Scenario: 建议链接渲染为按钮

- **WHEN** AI 回复包含 `[📍 查询三亚天气](suggest:查询三亚天气)`
- **THEN** 该链接 SHALL 渲染为带有蓝色背景的圆角标签按钮
- **AND** 按钮显示文本为 "📍 查询三亚天气"
- **AND** 按钮有 hover 状态变化

#### Scenario: 普通链接不受影响

- **WHEN** AI 回复包含 `[访问官网](https://example.com)`
- **THEN** 该链接 SHALL 渲染为普通超链接样式
- **AND** 点击后在新标签页打开

### Requirement: Suggestion Click Handling

用户点击建议按钮时，系统 SHALL 将建议内容填充到输入框。

#### Scenario: 点击建议填充输入框

- **WHEN** 用户点击建议按钮 `[查询天气](suggest:帮我查询三亚明天的天气)`
- **THEN** 输入框 SHALL 填充 "帮我查询三亚明天的天气"
- **AND** 输入框 SHALL 获得焦点
- **AND** 消息 SHALL NOT 自动发送

#### Scenario: 建议内容与显示文本不同

- **WHEN** AI 输出 `[简短显示](suggest:详细的查询请求内容)`
- **THEN** 按钮显示 "简短显示"
- **AND** 点击后输入框填充 "详细的查询请求内容"

### Requirement: AI Suggestion Format

AI 助手 SHALL 使用 `[显示文本](suggest:发送内容)` 格式输出可点击的建议。

#### Scenario: AI 回复末尾提供建议

- **WHEN** AI 完成主要回答
- **THEN** AI MAY 在 `<!-- END_ITINERARY -->` 之后提供建议
- **AND** 建议格式为 `[显示文本](suggest:内容)`
- **AND** 每个建议单独一行或用空格分隔
