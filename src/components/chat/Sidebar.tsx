'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User as UserIcon,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/components/auth';
import { useChatStore } from '@/store';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SidebarProps {
  conversations?: Conversation[];
  currentConversationId?: string;
  isLoading?: boolean;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  conversations = [],
  currentConversationId,
  isLoading = false,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
      <TooltipProvider delayDuration={100}>
        <div className="flex h-full w-16 flex-col bg-neutral-900 p-2">
          {/* 展开按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mb-2 cursor-pointer text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={onToggleCollapse}
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">展开侧边栏</TooltipContent>
          </Tooltip>

          {/* 新建对话 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mb-2 cursor-pointer text-neutral-400 hover:bg-neutral-800 hover:text-white"
                onClick={onNewChat}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">新建对话</TooltipContent>
          </Tooltip>

          <Separator className="my-2 bg-neutral-800" />

          {/* 会话缩略图列表 */}
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {conversations.slice(0, 20).map((conv) => (
                <Tooltip key={conv.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'w-full cursor-pointer text-neutral-400 hover:bg-neutral-800 hover:text-white',
                        currentConversationId === conv.id &&
                          'bg-neutral-800 text-white'
                      )}
                      onClick={() => onSelectConversation(conv.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    {conv.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </ScrollArea>
        </div>
      </TooltipProvider>
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
          {/* 加载骨架屏 */}
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-2">
                  <div className="h-4 w-4 rounded bg-neutral-700" />
                  <div className="h-4 flex-1 rounded bg-neutral-700" />
                </div>
              ))}
            </div>
          )}

          {/* 会话列表 */}
          {!isLoading &&
            Object.entries(groupedConversations).map(
              ([group, convs], groupIndex) => (
                <div
                  key={group}
                  className="mb-4 animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${groupIndex * 50}ms` }}
                >
                  <p className="mb-1 px-2 text-xs font-medium text-neutral-500">
                    {group}
                  </p>
                  {convs.map((conv, convIndex) => (
                    <div
                      key={conv.id}
                      className="animate-in fade-in slide-in-from-left-1 duration-200"
                      style={{
                        animationDelay: `${groupIndex * 50 + convIndex * 30}ms`,
                      }}
                    >
                      <ConversationItem
                        conversation={conv}
                        isActive={currentConversationId === conv.id}
                        isEditing={editingId === conv.id}
                        editingTitle={editingTitle}
                        onSelect={() => onSelectConversation(conv.id)}
                        onDelete={() => onDeleteConversation?.(conv.id)}
                        onStartEdit={() => {
                          setEditingId(conv.id);
                          setEditingTitle(conv.title);
                        }}
                        onCancelEdit={() => {
                          setEditingId(null);
                          setEditingTitle('');
                        }}
                        onSaveEdit={() => {
                          if (editingTitle.trim()) {
                            onRenameConversation?.(
                              conv.id,
                              editingTitle.trim()
                            );
                          }
                          setEditingId(null);
                          setEditingTitle('');
                        }}
                        onEditingTitleChange={setEditingTitle}
                      />
                    </div>
                  ))}
                </div>
              )
            )}

          {!isLoading && conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-neutral-500 animate-in fade-in duration-300">
              暂无对话记录
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-neutral-800" />

      {/* Footer - User Menu */}
      <UserFooter />
    </div>
  );
}

/**
 * 单条会话项
 */
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onSelect: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditingTitleChange: (title: string) => void;
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editingTitle,
  onSelect,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditingTitleChange,
}: ConversationItemProps) {
  // 删除确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2 py-1.5">
        <Input
          value={editingTitle}
          onChange={(e) => onEditingTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          className="h-7 flex-1 border-neutral-600 bg-neutral-700 px-2 text-sm text-white"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveEdit}
          className="h-7 w-7 text-green-400 hover:bg-neutral-700 hover:text-green-300"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancelEdit}
          className="h-7 w-7 text-neutral-400 hover:bg-neutral-700 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors cursor-pointer',
          isActive
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
        )}
        onClick={onSelect}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="truncate">{conversation.title}</span>
        </div>
        <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            className="h-7 w-7 cursor-pointer text-neutral-400 hover:bg-neutral-700 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="h-7 w-7 cursor-pointer text-neutral-400 hover:bg-neutral-700 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="删除对话"
        description={`确定要删除「${conversation.title}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={onDelete}
        destructive
      />
    </>
  );
}

/**
 * 用户菜单底栏
 */
function UserFooter() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { clearMessages } = useChatStore();

  const handleSignOut = async () => {
    await signOut();
    clearMessages(); // 清除对话记录
    router.refresh();
  };

  if (loading) {
    return (
      <div className="p-3">
        <div className="h-10 rounded-lg bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-800 hover:text-white"
          asChild
        >
          <Link href="/auth/login">
            <UserIcon className="h-4 w-4" />
            登录 / 注册
          </Link>
        </Button>
      </div>
    );
  }

  const initial = user.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="p-3">
      <div className="flex items-center justify-between rounded-lg bg-neutral-800 p-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-neutral-300 truncate">
            {user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="登出"
          className="h-8 w-8 shrink-0 text-neutral-400 hover:bg-neutral-700 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
