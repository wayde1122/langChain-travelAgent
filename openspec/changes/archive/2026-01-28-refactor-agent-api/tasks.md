# Tasks: refactor-agent-api

## 1. 代码迁移

- [x] 1.1 更新 `agent.ts` 导入：移除 `@langchain/langgraph/prebuilt`，添加 `langchain` 的 `createAgent`
- [x] 1.2 简化提示词处理：移除 `createAgentPrompt` 函数，改为 `getSystemPrompt` 返回字符串
- [x] 1.3 更新 `createTravelAgent` 函数：使用 `createAgent` 替代 `createReactAgent`
- [x] 1.4 流式处理：新 API 的 `ReactAgent` 仍支持 `streamEvents`，无需改动

## 2. 验证测试

- [x] 2.1 运行 `npm run type-check` 确保类型正确
- [x] 2.2 运行 `npm run test` 确保测试通过 (19/19 passed)
- [ ] 2.3 手动测试聊天功能，验证工具调用正常
- [ ] 2.4 手动测试流式输出，验证事件格式正确

## 3. 文档更新

- [x] 3.1 验证 OpenSpec 变更：`openspec validate refactor-agent-api --strict --no-interactive`
- [ ] 3.2 完成后归档变更：`openspec archive refactor-agent-api --yes`
