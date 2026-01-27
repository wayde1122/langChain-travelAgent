'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('该邮箱已被注册');
        } else {
          setError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 注册成功提示
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              注册成功！
            </h2>
            <p className="text-muted-foreground mb-6">
              请检查你的邮箱{' '}
              <span className="font-medium text-foreground">{email}</span>{' '}
              并点击验证链接完成注册。
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/auth/login">前往登录</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">返回首页</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/travel-icon.jpg"
              alt="Travel Assistant"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            创建账号
          </h1>
          <p className="text-muted-foreground mt-2">注册以保存你的旅行对话</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                邮箱
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              立即登录
            </Link>
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回首页（匿名使用）
          </Link>
        </div>
      </div>
    </div>
  );
}
