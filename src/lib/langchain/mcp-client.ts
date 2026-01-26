/**
 * MCP 客户端配置
 * 管理多个 MCP 服务器连接
 */
import {
  MultiServerMCPClient,
  type ClientConfig,
  type StdioConnection,
} from '@langchain/mcp-adapters';

import type { StructuredToolInterface } from '@langchain/core/tools';

/**
 * MCP 工具显示名称映射
 */
export const MCP_TOOL_DISPLAY_NAMES: Record<string, string> = {
  // Amap MCP 工具
  amap_weather: '查询天气',
  amap_poi_search: '搜索地点',
  amap_geocode: '地理编码',
  amap_direction: '路线规划',
  // Variflight MCP 工具
  variflight_search_flights_by_dep_arr: '查询航班（按起降地）',
  variflight_search_flights_by_number: '查询航班（按航班号）',
  variflight_get_flight_transfer_info: '查询中转航班',
  variflight_flight_happiness_index: '航班舒适度',
  variflight_get_realtime_location_by_anum: '飞机实时位置',
  variflight_get_future_weather_by_airport: '机场天气预报',
  // 12306 MCP 工具
  train_search_tickets: '查询火车票',
  train_filter_trains: '过滤列车信息',
  train_query_station: '过站查询',
  train_query_transfer: '中转查询',
};

/**
 * MCP 客户端单例
 */
let mcpClient: MultiServerMCPClient | null = null;
let mcpTools: StructuredToolInterface[] = [];
let isInitialized = false;

/**
 * MCP 服务器配置类型
 */
type MCPServersConfig = NonNullable<ClientConfig['mcpServers']>;

/**
 * MCP 服务器配置
 */
function getMCPServerConfig(): MCPServersConfig {
  const servers: Record<string, StdioConnection> = {};

  // Amap MCP - 高德地图（天气、POI 搜索）
  if (process.env.AMAP_API_KEY) {
    servers.amap = {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@amap/amap-maps-mcp-server'],
      env: {
        AMAP_MAPS_API_KEY: process.env.AMAP_API_KEY,
      },
      restart: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
      },
    };
  }

  // Variflight MCP - 飞常准（航班查询）
  if (process.env.VARIFLIGHT_API_KEY) {
    servers.variflight = {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@variflight-ai/variflight-mcp'],
      env: {
        VARIFLIGHT_API_KEY: process.env.VARIFLIGHT_API_KEY,
      },
      restart: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 1000,
      },
    };
  }

  // 12306 MCP - 火车票查询
  // 使用本地 stdio 模式运行，参考：https://github.com/Joooook/12306-mcp
  servers.train = {
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '12306-mcp'],
    restart: {
      enabled: true,
      maxAttempts: 3,
      delayMs: 2000,
    },
  };

  return servers;
}

/**
 * 初始化 MCP 客户端
 */
export async function initializeMCPClient(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const servers = getMCPServerConfig();

  const serverNames = Object.keys(servers);
  if (serverNames.length === 0) {
    console.warn('⚠️ 没有配置任何 MCP 服务器，跳过 MCP 初始化');
    isInitialized = true;
    return;
  }

  console.log('\n========== 连接 MCP 服务器 ==========');
  console.log(`📡 准备连接 ${serverNames.length} 个 MCP 服务器:`);
  serverNames.forEach((name) => {
    const config = servers[name];
    if ('command' in config) {
      console.log(
        `   - ${name}: stdio (${config.command} ${config.args?.join(' ')})`
      );
    } else if ('url' in config) {
      console.log(`   - ${name}: http (${config.url})`);
    }
  });

  try {
    mcpClient = new MultiServerMCPClient({
      throwOnLoadError: false,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: '',
      mcpServers: servers,
    });

    // 获取所有 MCP 工具
    mcpTools = await mcpClient.getTools();
    isInitialized = true;

    console.log('\n========== MCP 客户端初始化 ==========');
    console.log(`✅ 成功加载 ${mcpTools.length} 个 MCP 工具:`);
    mcpTools.forEach((tool, index) => {
      console.log(
        `   ${index + 1}. ${tool.name} - ${tool.description?.slice(0, 50) ?? '无描述'}...`
      );
    });
    console.log('======================================\n');
  } catch (error) {
    console.error('\n❌ MCP 客户端初始化失败:');
    console.error(
      '   错误信息:',
      error instanceof Error ? error.message : error
    );
    console.error('   将使用本地工具继续运行\n');
    isInitialized = true; // 标记为已初始化，避免重复尝试
  }
}

/**
 * 获取 MCP 工具列表
 */
export function getMCPTools(): StructuredToolInterface[] {
  return mcpTools;
}

/**
 * 获取 MCP 客户端实例
 */
export function getMCPClient(): MultiServerMCPClient | null {
  return mcpClient;
}

/**
 * 关闭 MCP 客户端
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
    } catch (error) {
      console.error('关闭 MCP 客户端失败:', error);
    }
    mcpClient = null;
    mcpTools = [];
    isInitialized = false;
  }
}

/**
 * 获取工具的显示名称
 */
export function getToolDisplayName(toolName: string): string {
  return MCP_TOOL_DISPLAY_NAMES[toolName] ?? toolName;
}
