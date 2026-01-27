'use client';

import Image from 'next/image';
import { MapPin, Compass, HelpCircle } from 'lucide-react';

const suggestions = [
  {
    icon: MapPin,
    text: '成都有哪些必吃的美食和小吃？',
  },
  {
    icon: Compass,
    text: '3000 元预算能去哪里玩一周？',
  },
  {
    icon: HelpCircle,
    text: '带孩子去三亚有什么推荐？',
  },
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="relative mb-8 h-16 w-16 overflow-hidden rounded-2xl">
        <Image
          src="/travel-icon.jpg"
          alt="Travel Assistant"
          fill
          className="object-cover"
          priority
        />
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        欢迎使用旅行助手
      </h1>
      <p className="mb-8 text-center text-neutral-500">
        我可以帮你规划行程、推荐景点、解答旅行问题
      </p>

      <div className="grid w-full max-w-md gap-3">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Icon className="h-5 w-5 shrink-0 text-neutral-400" />
              <span className="text-sm text-neutral-700">
                {suggestion.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
