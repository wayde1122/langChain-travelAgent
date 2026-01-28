# Tasks: 添加可点击建议按钮

## 1. 实现

- [x] 1.1 修改系统提示词，添加建议链接格式说明
- [x] 1.2 扩展 MarkdownRenderer，支持 `suggest:` 链接渲染为按钮
- [x] 1.3 修改 MessageItem，接收并传递 onSuggestionClick 回调
- [x] 1.4 修改 MessageList，接收并传递 onSuggestionClick 回调
- [x] 1.5 修改 ChatArea，传递 handleSuggestionClick 到 MessageList
- [x] 1.6 修改 ChatInput，支持外部填充输入值

## 2. 验证

- [x] 2.1 运行 TypeScript 类型检查
- [ ] 2.2 测试建议按钮渲染样式
- [ ] 2.3 测试点击建议自动填充输入框
- [ ] 2.4 测试流式输出时建议按钮的渲染

## 3. 文档

- [x] 3.1 更新 OpenSpec 规范
