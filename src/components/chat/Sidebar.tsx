'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Settings,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SidebarProps {
  conversations?: Conversation[];
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  conversations = [],
  currentConversationId,
  onNewChat,
  onSelectConversation,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 按日期分组会话
  const groupedConversations = conversations.reduce(
    (groups, conv) => {
      const today = new Date();
      const convDate = new Date(conv.updatedAt);
      const diffDays = Math.floor(
        (today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let group: string;
      if (diffDays === 0) {
        group = '今天';
      } else if (diffDays === 1) {
        group = '昨天';
      } else if (diffDays <= 7) {
        group = '最近 7 天';
      } else {
        group = '更早';
      }

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(conv);
      return groups;
    },
    {} as Record<string, Conversation[]>
  );

  if (collapsed) {
    return (
      <div className="flex h-full w-16 flex-col bg-neutral-900 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          onClick={onToggleCollapse}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mb-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          onClick={onNewChat}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Image
            src="/travel-icon.jpg"
            alt="Travel Assistant"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-semibold text-white">Travel Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          onClick={onToggleCollapse}
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          新建对话
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-neutral-700 bg-neutral-800 pl-8 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-neutral-600"
          />
        </div>
      </div>

      <Separator className="bg-neutral-800" />

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="py-2">
          {Object.entries(groupedConversations).map(([group, convs]) => (
            <div key={group} className="mb-4">
              <p className="mb-1 px-2 text-xs font-medium text-neutral-500">
                {group}
              </p>
              {convs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                    currentConversationId === conv.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">
              暂无对话记录
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-neutral-800" />

      {/* Footer */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          设置
        </Button>
      </div>
    </div>
  );
}
