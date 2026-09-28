'use client';

import React from 'react';
import Image from 'next/image';
import { useChatWidget } from './ChatWidgetContext';

export default function ChatTeaser() {
  const { isTeaserOpen, closeTeaser, openChat, sendAction, config } = useChatWidget();

  if (!isTeaserOpen || !config?.enabled) {
    return null;
  }

  const avatarUrl = config.avatar_url || '/images/chatbot/cuu-hula-96.webp';
  const botName = config.short_name || 'Trợ lý';

  const handleStart = async (val: string) => {
    await openChat();
    await sendAction('start', val);
  };

  return (
    <div
      id="chat-teaser"
      className="fixed bottom-28 right-4 z-[89] w-[calc(100vw-32px)] sm:w-80 max-h-[35vh] bg-white rounded-2xl shadow-2xl border border-primary-200 overflow-hidden flex flex-col animate-slide-up"
      style={{ boxShadow: '0 10px 30px rgba(35, 167, 211, 0.25)' }}
    >
      {/* Header bar */}
      <div className="bg-primary-50 px-3 py-2 flex items-center justify-between border-b border-primary-100">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white shadow-sm">
            <Image
              src={avatarUrl}
              alt={botName}
              width={28}
              height={28}
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-800">{botName}</span>
              <span className="text-[10px] bg-primary-100 text-primary-700 font-semibold px-1.5 py-0.5 rounded-full">
                AI
              </span>
            </div>
            {config.widget?.subtitle && (
              <span className="text-[10px] text-gray-500 leading-tight line-clamp-1">
                {config.widget.subtitle}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={closeTeaser}
          className="text-gray-400 hover:text-gray-600 p-1 text-base leading-none rounded-md"
          aria-label="Đóng thông báo"
        >
          &times;
        </button>
      </div>

      {/* Body content */}
      <div className="p-3 flex-1 overflow-y-auto">
        {config.greeting && (
          <p
            onClick={openChat}
            className="text-xs text-gray-700 leading-relaxed cursor-pointer hover:text-primary-600 mb-2 font-medium"
          >
            {config.greeting}
          </p>
        )}

        {/* 4 Quick Start Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleStart('school')}
            className="text-[11px] font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 py-1.5 px-2 rounded-lg text-center transition-all truncate"
          >
            🏫 Đặt cho trường
          </button>
          <button
            onClick={() => handleStart('parent')}
            className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 py-1.5 px-2 rounded-lg text-center transition-all truncate"
          >
            👶 Chọn cho bé
          </button>
          <button
            onClick={() => handleStart('sample')}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-2 rounded-lg text-center transition-all truncate"
          >
            📦 Xem mẫu nệm
          </button>
          <button
            onClick={() => handleStart('support')}
            className="text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 py-1.5 px-2 rounded-lg text-center transition-all truncate"
          >
            💬 Hỗ trợ đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
