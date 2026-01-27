'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthProvider';

/**
 * 用户菜单组件
 * 已登录显示头像和登出按钮，未登录显示登录按钮
 */
export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/auth/login">登录</Link>
      </Button>
    );
  }

  // 获取用户名首字母作为头像
  const initial = user.email?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {initial}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground hidden sm:inline max-w-[120px] truncate">
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        title="登出"
        className="h-8 w-8"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
