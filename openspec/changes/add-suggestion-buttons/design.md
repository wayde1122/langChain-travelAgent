# Design: 添加可点击建议按钮

## Context

用户希望在 AI 提供建议时，能够直接点击建议选项，自动填充到输入框中发送，而不是手动复制或输入。

## Goals / Non-Goals

### Goals

- 让 AI 回复中的建议可以被点击
- 点击后自动填充到输入框
- 建议按钮有清晰的视觉区分
- 支持流式输出时的按钮渲染

### Non-Goals

- 不自动发送（用户可能想编辑）
- 不支持复杂的交互（如多选）

## Decisions

### 1. 使用特殊链接语法

**决定**：使用 `[显示文本](suggest:实际内容)` 格式

**理由**：

- Markdown 原生语法，AI 容易生成
- 前端可以通过链接 href 前缀识别
- 不破坏原有 Markdown 渲染
- 显示文本和实际内容可以不同（如显示简短，发送详细）

**替代方案**：

1. 代码块标记 `\`\`\`suggestion` - 破坏文本连续性
2. HTML 按钮标签 - 需要 HTML 白名单，安全性考虑
3. JSON 结构化 - 对用户不友好

### 2. 按钮样式

**决定**：渲染为内联标签样式按钮

```tsx
<button
  className="inline-flex items-center gap-1 px-3 py-1.5 
  text-sm bg-blue-50 text-blue-700 rounded-full 
  hover:bg-blue-100 transition-colors cursor-pointer"
>
  💡 查询三亚天气
</button>
```

**理由**：

- 与普通链接有明显区分
- 圆角标签样式友好
- hover 状态明确可点击

### 3. 回调传递链路

```
ChatArea (handleSuggestionClick)
  └─> MessageList (onSuggestionClick)
       └─> MessageItem (onSuggestionClick)
            └─> MarkdownRenderer (onSuggestionClick)
                 └─> SuggestionButton (onClick)
```

## Risks / Trade-offs

- **风险**：AI 可能不遵循格式
- **缓解**：在提示词中给出明确示例和强调

- **风险**：流式输出时按钮可能闪烁
- **缓解**：建议通常在回复末尾，流式影响小

## Open Questions

- 是否需要点击后自动聚焦输入框？**决定：是**
- 是否需要自动发送选项？**决定：暂不需要，用户可能想编辑**
