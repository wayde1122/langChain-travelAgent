import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AuthProvider } from '@/components/auth';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '旅行助手 - AI 旅行规划',
  description: '基于 AI 的智能旅行助手，帮你规划完美旅程',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
