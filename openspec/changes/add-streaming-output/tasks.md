# Tasks: 添加流式输出支持

## 1. 后端实现

- [x] 1.1 修改 LangChain chain - 添加 `chatStream` 函数使用 `.stream()` 方法
- [x] 1.2 修改 API 路由 - 支持 `stream=true` 参数，返回 SSE 格式响应
- [x] 1.3 更新类型定义 - `ChatApiRequest` 添加 `stream` 字段

## 2. 前端实现

- [x] 2.1 修改聊天服务 - 添加 `sendStreamMessage` 方法解析 SSE 流
- [x] 2.2 修改聊天服务 - 添加 `createCancellableStreamSend` 支持取消请求
- [x] 2.3 修改 ChatArea 组件 - 先添加空消息占位，再增量更新内容
- [x] 2.4 添加"停止生成"按钮 - 流式传输时显示停止按钮

## 3. 测试验证

- [✅] 3.1 手动测试流式输出效果（SSE 格式正确，逐块返回）
- [✅] 3.2 测试请求取消功能（停止按钮正常工作）
- [✅] 3.3 测试重新生成功能
- [✅] 3.4 测试错误处理（400 状态码，错误消息正确）

## 4. 文档更新

- [x] 4.1 创建 OpenSpec change proposal
