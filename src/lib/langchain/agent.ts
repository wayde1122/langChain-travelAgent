/**
 * ReAct Agent 配置
 * 使用 LangChain createAgent 创建具有工具调用能力的 Agent
 */
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { createAgent } from 'langchain';

import type { StructuredToolInterface } from '@langchain/core/tools';
import type { Message, AgentEvent } from '@/types';

import { createChatModel } from './model';
import { TRAVEL_AGENT_SYSTEM_PROMPT, RAG_AGENT_SYSTEM_PROMPT } from './prompts';
import { localTools, TOOL_DISPLAY_NAMES } from './tools';
import {
  initializeMCPClient,
  getMCPTools,
  MCP_TOOL_DISPLAY_NAMES,
} from './mcp-client';
import {
  retrieveKnowledge,
  shouldRetrieve,
  extractCityFromQuery,
  type RetrievalContext,
} from './rag';

/**
 * 获取工具的显示名称
 */
export function getToolDisplayName(toolName: string): string {
  return (
    TOOL_DISPLAY_NAMES[toolName] ?? MCP_TOOL_DISPLAY_NAMES[toolName] ?? toolName
  );
}

/**
 * 将应用消息转换为 LangChain 消息格式
 */
function convertToLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((msg) => {
    switch (msg.role) {
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      default:
        return new HumanMessage(msg.content);
    }
  });
}

/**
 * 获取系统提示词
 * @param ragContext RAG 检索上下文（可选）
 */
function getSystemPrompt(ragContext?: RetrievalContext): string {
  // 如果有 RAG 上下文，使用 RAG 增强的提示词
  if (ragContext?.hasResults) {
    return RAG_AGENT_SYSTEM_PROMPT.replace(
      '{context}',
      ragContext.formattedContext
    );
  }

  // 否则使用基础提示词
  return TRAVEL_AGENT_SYSTEM_PROMPT;
}

/**
 * 获取所有可用工具
 */
async function getAllTools(): Promise<StructuredToolInterface[]> {
  // 初始化 MCP 客户端
  await initializeMCPClient();

  // 获取 MCP 工具
  const mcpTools = getMCPTools();

  // 合并本地工具和 MCP 工具
  return [...localTools, ...mcpTools];
}

/**
 * 创建 ReAct Agent
 * @param ragContext RAG 检索上下文（可选）
 */
export async function createTravelAgent(ragContext?: RetrievalContext) {
  const model = createChatModel();
  const tools = await getAllTools();

  console.log(
    '创建 Agent，可用工具:',
    tools.map((t) => t.name)
  );

  // 使用 LangChain createAgent 创建 ReAct Agent
  const agent = createAgent({
    model,
    tools,
    systemPrompt: getSystemPrompt(ragContext),
  });

  return agent;
}

/**
 * Agent 执行参数
 */
interface AgentExecuteParams {
  input: string;
  history?: Message[];
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 执行 Agent 并返回流式事件
 */
export async function* executeAgentStream(
  params: AgentExecuteParams
): AsyncGenerator<AgentEvent> {
  const { input, history = [] } = params;

  try {
    // RAG 检索
    let ragContext: RetrievalContext | undefined;

    if (shouldRetrieve(input)) {
      console.log('\n🔍 执行 RAG 检索...');
      const city = extractCityFromQuery(input);
      ragContext = await retrieveKnowledge(input, { city });

      if (ragContext.hasResults) {
        yield {
          type: 'thinking',
          content: `正在检索相关知识（找到 ${ragContext.results.length} 条）...`,
        };
      }
    }

    const agent = await createTravelAgent(ragContext);
    const historyMessages = convertToLangChainMessages(history);

    // 构建输入消息
    const messages = [...historyMessages, new HumanMessage(input)];

    // 使用 streamEvents 获取详细的执行事件
    const eventStream = agent.streamEvents({ messages }, { version: 'v2' });

    // 使用 Map 跟踪多个并行工具调用
    const toolCallIds = new Map<string, string>();
    let finalContent = '';

    console.log('\n========== Agent 执行开始 ==========');
    console.log('📝 用户输入:', input);
    console.log('📚 历史消息数:', history.length);
    console.log(
      '🔍 RAG 结果:',
      ragContext?.hasResults ? `${ragContext.results.length} 条` : '无'
    );

    for await (const event of eventStream) {
      const eventType = event.event;

      // 处理不同类型的事件
      switch (eventType) {
        case 'on_chat_model_start':
          // 模型开始思考
          console.log('\n🤔 [LLM] 开始思考...');
          yield { type: 'thinking', content: '正在思考...' };
          break;

        case 'on_tool_start': {
          // 工具开始执行 - 使用 run_id 跟踪并行工具调用
          const runId = event.run_id ?? generateId();
          const toolCallId = generateId();
          toolCallIds.set(runId, toolCallId);

          const toolInput = event.data?.input ?? {};
          console.log('\n🔧 [Tool Start]', event.name, `(runId: ${runId})`);
          console.log('   📥 输入:', JSON.stringify(toolInput, null, 2));
          yield {
            type: 'tool_start',
            id: toolCallId,
            name: event.name,
            displayName: getToolDisplayName(event.name),
            input: toolInput,
          };
          break;
        }

        case 'on_tool_end': {
          // 工具执行完成 - 根据 run_id 匹配对应的工具调用
          const runId = event.run_id;
          const toolCallId = runId ? toolCallIds.get(runId) : null;

          if (toolCallId) {
            const toolOutput =
              typeof event.data?.output === 'string'
                ? event.data.output
                : JSON.stringify(event.data?.output ?? '');
            console.log('✅ [Tool End]', event.name, `(runId: ${runId})`);
            console.log(
              '   📤 输出:',
              toolOutput.slice(0, 200) + (toolOutput.length > 200 ? '...' : '')
            );
            yield {
              type: 'tool_end',
              id: toolCallId,
              name: event.name,
              output: toolOutput,
            };
            toolCallIds.delete(runId);
          }
          break;
        }

        case 'on_chat_model_stream': {
          // 模型流式输出
          const chunk = event.data?.chunk;
          if (chunk?.content) {
            const content =
              typeof chunk.content === 'string'
                ? chunk.content
                : JSON.stringify(chunk.content);
            if (content) {
              finalContent += content;
              yield { type: 'content', content };
            }
          }
          break;
        }

        case 'on_chat_model_end':
          // 模型输出完成（可能有工具调用）
          console.log('💭 [LLM] 思考完成');
          break;
      }
    }

    console.log('\n📊 最终回复长度:', finalContent.length, '字符');
    console.log('========== Agent 执行结束 ==========\n');

    // 完成
    yield { done: true };
  } catch (error) {
    console.error('Agent 执行错误:', error);
    yield {
      type: 'error',
      message: error instanceof Error ? error.message : '执行失败',
    };
    yield { done: true };
  }
}

/**
 * 执行 Agent（非流式，返回最终结果）
 */
export async function executeAgent(
  params: AgentExecuteParams
): Promise<{ content: string; success: boolean; error?: string }> {
  const { input, history = [] } = params;

  try {
    // RAG 检索
    let ragContext: RetrievalContext | undefined;

    if (shouldRetrieve(input)) {
      const city = extractCityFromQuery(input);
      ragContext = await retrieveKnowledge(input, { city });
    }

    const agent = await createTravelAgent(ragContext);
    const historyMessages = convertToLangChainMessages(history);
    const messages = [...historyMessages, new HumanMessage(input)];

    const result = await agent.invoke({ messages });

    // 提取最后一条 AI 消息的内容
    const lastMessage = result.messages[result.messages.length - 1];
    const content =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return { content, success: true };
  } catch (error) {
    console.error('Agent 执行错误:', error);
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    };
  }
}
