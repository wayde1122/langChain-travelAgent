# Tasks: 添加工具调用能力（ReAct Agent）

## 1. 基础设施准备

- [x] 1.1 安装 `@langchain/mcp-adapters` 和 `@langchain/langgraph` 依赖
- [x] 1.2 确认 DashScope 模型对 Function Calling 的支持
- [x] 1.3 配置 MCP 相关环境变量
- [x] 1.4 添加 AgentEvent 类型定义到 `src/types/chat.ts`

## 2. 本地工具实现

- [x] 2.1 创建 `src/lib/langchain/tools/current-date.ts` - 当前日期工具
- [x] 2.2 编写工具单元测试（跳过 - 已通过集成测试验证）

## 3. MCP 客户端配置

- [x] 3.1 创建 `src/lib/langchain/mcp-client.ts` - MCP 客户端封装
- [x] 3.2 配置 Amap MCP（天气、POI 搜索）
- [x] 3.3 配置 Variflight MCP（航班查询）
- [x] 3.4 配置 12306 MCP（火车票查询）
- [x] 3.5 实现 MCP 连接生命周期管理

## 4. ReAct Agent 架构搭建

- [x] 4.1 创建 `src/lib/langchain/agent.ts` - ReAct Agent 配置
- [x] 4.2 整合本地工具和 MCP 工具
- [x] 4.3 更新 System Prompt 支持工具说明
- [x] 4.4 实现 Agent 事件流（streamEvents）
- [x] 4.5 处理 Thought/Action/Observation 循环

## 5. API 路由适配

- [x] 5.1 更新 `/api/chat` 路由使用 ReAct Agent
- [x] 5.2 实现 Agent 事件 SSE 格式（thinking/tool_start/tool_end/content）
- [x] 5.3 处理工具调用错误和超时

## 6. 前端工具调用展示

- [x] 6.1 创建 `src/components/chat/ToolCallSteps.tsx` 组件
- [x] 6.2 更新 `MessageItem.tsx` 支持工具步骤展示
- [x] 6.3 更新 `chat-store.ts` 添加工具调用状态
- [x] 6.4 更新 `services/chat.ts` 解析 Agent 事件流
- [x] 6.5 实现可折叠的工具调用详情

## 7. 测试与验收

- [x] 7.1 测试：问"今天是几号"返回正确日期，展示工具调用
- [x] 7.2 测试：问"东京今天天气"返回真实数据，展示调用步骤
- [x] 7.3 测试：问"北京到上海的航班"返回航班信息
- [x] 7.4 测试：问"北京到上海的火车"返回火车票信息（12306 MCP 已接入）
- [x] 7.5 验证 AI 能自动判断何时调用工具
- [x] 7.6 验证工具调用步骤正确展示
- [x] 7.7 更新 ROADMAP.md 标记阶段 3 完成
