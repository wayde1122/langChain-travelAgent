# Change: 添加工具调用能力（ReAct Agent via MCP）

## Why

当前旅行助手只能进行纯文本对话，无法获取实时信息（如天气、航班、火车票）。用户询问"东京今天天气"时，AI 只能给出泛泛的建议而非真实数据。此外，LLM 不知道当前日期，无法正确处理时间相关的查询。

通过集成 MCP 服务和本地工具，将助手从"聊天机器人"升级为"智能 ReAct Agent"。

## What Changes

- **ADDED**: ReAct Agent 架构（Reasoning + Acting）
- **ADDED**: 工具调用步骤实时展示（思考过程可视化）
- **ADDED**: 当前日期工具（CurrentDateTool）- 让 LLM 知道当前时间
- **ADDED**: LangChain MCP 适配器集成（`@langchain/mcp-adapters`）
- **ADDED**: Amap MCP 集成 - 天气查询、POI 景点搜索
- **ADDED**: Variflight MCP 集成 - 航班查询
- **ADDED**: 12306 MCP 集成 - 火车票查询
- **MODIFIED**: `/api/chat` 端点支持 Agent 事件流
- **ADDED**: 前端工具调用状态组件（ToolCallStatus）

## Impact

- Affected specs: `chat-api`（需要修改支持 Agent）, `agent-tools`（新增）
- Affected code:
  - `src/lib/langchain/tools/` - 工具定义
  - `src/lib/langchain/mcp-client.ts` - MCP 客户端配置
  - `src/lib/langchain/agent.ts` - Agent 配置
  - `src/app/api/chat/route.ts` - 适配 Agent 响应
  - `src/lib/langchain/prompts.ts` - 更新 System Prompt

## Dependencies

- `@langchain/mcp-adapters` - LangChain MCP 适配器
- MCP 服务的 API Key：
  - Amap MCP：高德地图 API Key
  - Variflight MCP：飞常准 API Key
  - 12306 MCP：ModelScope 部署

## Risks

- **MCP 进程管理**: 需要在 Next.js 后端管理 MCP 子进程生命周期
- **API 调用延迟**: Agent 需要先决策再调用工具，响应时间可能增加
- **MCP 服务可用性**: 依赖外部 MCP 服务的稳定性

## Migration

- 向后兼容：普通对话不受影响
- Agent 模式默认启用
