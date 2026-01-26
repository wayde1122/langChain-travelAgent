# Agent Tools Spec

## ADDED Requirements

### Requirement: Current Date Tool

系统 SHALL 提供当前日期工具，让 Agent 知道当前时间。

#### Scenario: Get current date

- **WHEN** Agent 调用当前日期工具
- **THEN** 返回格式化的日期字符串，包含：
  - 年、月、日
  - 星期几
  - 使用中国时区（Asia/Shanghai）

#### Scenario: User asks about today

- **WHEN** 用户问"今天是几号"或"现在是什么时候"
- **THEN** Agent 自动调用日期工具并返回当前日期

---

### Requirement: Weather Query via Amap MCP

系统 SHALL 通过 Amap MCP 提供天气查询功能。

#### Scenario: Query weather for a city

- **WHEN** 用户问"东京今天天气怎么样"
- **THEN** Agent 调用 Amap MCP 的天气工具并返回：
  - 城市名称
  - 当前温度
  - 天气状况
  - 体感温度

#### Scenario: Weather query fails

- **WHEN** Amap MCP 服务不可用
- **THEN** Agent 返回友好提示，建议用户稍后再试

---

### Requirement: POI Search via Amap MCP

系统 SHALL 通过 Amap MCP 提供景点搜索功能。

#### Scenario: Search attractions

- **WHEN** 用户问"东京有哪些景点"
- **THEN** Agent 调用 Amap MCP 的 POI 搜索工具并返回景点列表

---

### Requirement: Flight Query via Variflight MCP

系统 SHALL 通过 Variflight MCP 提供航班查询功能。

#### Scenario: Search flights by route

- **WHEN** 用户问"北京到上海的航班"
- **THEN** Agent 调用 Variflight MCP 并返回：
  - 航班号
  - 出发/到达时间
  - 航空公司

#### Scenario: Search flights by number

- **WHEN** 用户问"MU2157 航班状态"
- **THEN** Agent 调用 Variflight MCP 查询具体航班信息

---

### Requirement: Train Query via 12306 MCP

系统 SHALL 通过 12306 MCP 提供火车票查询功能。

#### Scenario: Search trains by route

- **WHEN** 用户问"北京到上海的火车"
- **THEN** Agent 调用 12306 MCP 并返回：
  - 车次
  - 出发/到达时间
  - 票价信息

---

### Requirement: Agent Automatic Tool Selection

系统 SHALL 支持 Agent 自动判断何时需要调用工具。

#### Scenario: Time-related question

- **WHEN** 用户问"今天去北京穿什么"
- **THEN** Agent 先调用日期工具获取日期，再调用天气工具查询天气

#### Scenario: General travel question

- **WHEN** 用户问"去日本需要准备什么"
- **THEN** Agent 直接回答，不调用任何工具

#### Scenario: Multi-tool question

- **WHEN** 用户问"明天从北京到上海，坐飞机还是火车好"
- **THEN** Agent 调用日期工具、航班工具和火车工具综合分析

---

### Requirement: Tool Error Handling

系统 SHALL 优雅处理工具调用失败的情况。

#### Scenario: MCP service unavailable

- **WHEN** MCP 服务连接失败
- **THEN** Agent 返回友好提示，降级为纯对话模式

#### Scenario: Tool timeout

- **WHEN** 工具调用超时（>30秒）
- **THEN** Agent 返回超时提示，建议用户稍后再试

---

### Requirement: Streaming Output with Tools

系统 SHALL 在使用工具时保持流式输出体验。

#### Scenario: Tool call during streaming

- **WHEN** Agent 在流式输出过程中需要调用工具
- **THEN** 按顺序输出：思考过程 → 工具调用 → 工具结果 → 最终回答

---

### Requirement: Tool Call Steps Display

系统 SHALL 在前端实时展示 Agent 的工具调用步骤。

#### Scenario: Display thinking process

- **WHEN** Agent 开始思考如何回答问题
- **THEN** 前端显示"正在思考..."或具体思考内容

#### Scenario: Display tool call in progress

- **WHEN** Agent 调用工具
- **THEN** 前端显示：
  - 工具名称
  - 调用参数
  - 加载状态（spinner）

#### Scenario: Display tool result

- **WHEN** 工具返回结果
- **THEN** 前端显示：
  - 工具名称
  - 返回结果摘要
  - 成功/失败状态图标

#### Scenario: Collapsible tool steps

- **WHEN** 工具调用完成，显示最终回答
- **THEN** 工具调用步骤可折叠，默认展开
- **AND** 用户可点击折叠/展开查看详情

---

### Requirement: ReAct Agent Loop

系统 SHALL 使用 ReAct（Reasoning + Acting）模式执行 Agent。

#### Scenario: Multi-step reasoning

- **WHEN** 用户问"明天北京天气怎么样"
- **THEN** Agent 执行以下循环：
  1. Thought: 需要先获取当前日期确定明天是哪天
  2. Action: 调用 get_current_date
  3. Observation: 2026年1月26日
  4. Thought: 明天是1月27日，查询北京天气
  5. Action: 调用 amap_weather
  6. Observation: 天气数据
  7. Final Answer: 综合回答
