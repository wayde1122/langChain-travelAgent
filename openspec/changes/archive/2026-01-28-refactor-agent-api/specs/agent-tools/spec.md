## MODIFIED Requirements

### Requirement: ReAct Agent Loop

系统 SHALL 使用 ReAct（Reasoning + Acting）模式执行 Agent。

实现使用 LangChain 的 `createAgent` API（来自 `langchain` 包），通过 `systemPrompt` 参数配置 Agent 行为，使用 `stream()` 方法获取流式响应。

#### Scenario: Multi-step reasoning

- **WHEN** 用户问"明天北京天气怎么样"
- **THEN** Agent 执行以下循环：
  1. Thought: 需要先获取当前日期确定明天是哪天
  2. Action: 调用 get_current_date
  3. Observation: 2026年1月28日
  4. Thought: 明天是1月29日，查询北京天气
  5. Action: 调用 amap_weather
  6. Observation: 天气数据
  7. Final Answer: 综合回答
