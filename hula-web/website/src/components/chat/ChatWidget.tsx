'use client';

import React from 'react';
import { useChatWidget } from './ChatWidgetContext';
import ChatTeaser from './ChatTeaser';
import ChatPanel from './ChatPanel';

export default function ChatWidget() {
  const { config } = useChatWidget();

  if (!config?.enabled) {
    return null;
  }

  return (
    <>
      <ChatTeaser />
      <ChatPanel />
    </>
  );
}
