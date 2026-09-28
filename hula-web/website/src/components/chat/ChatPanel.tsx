'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useChatWidget } from './ChatWidgetContext';

export default function ChatPanel() {
  const {
    isOpen,
    closeChat,
    config,
    messages,
    brief,
    loading,
    sending,
    sendMessage,
    sendAction,
    updateBrief,
    submitRequest,
    requestHuman,
    conversation,
  } = useChatWidget();

  const [inputText, setInputText] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingBrief, setEditingBrief] = useState(false);

  // Edit brief form state
  const [briefQuantity, setBriefQuantity] = useState<number>(30);
  const [briefColors, setBriefColors] = useState<string>('');
  const [briefItems, setBriefItems] = useState<string>('nệm, gối');
  const [briefSchool, setBriefSchool] = useState<string>('');

  // Request form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'phone' | 'zalo' | 'email'>('phone');
  const [consentContact, setConsentContact] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync brief data to local edit form
  useEffect(() => {
    if (brief?.data) {
      if (brief.data.quantity) setBriefQuantity(brief.data.quantity);
      if (brief.data.colors) setBriefColors(brief.data.colors);
      if (brief.data.items) setBriefItems(brief.data.items.join(', '));
      if (brief.data.school_name) setBriefSchool(brief.data.school_name);
    }
  }, [brief]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Handle visualViewport on mobile for keyboard adjustment
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (panelRef.current && window.innerWidth < 768) {
        panelRef.current.style.height = `${window.visualViewport!.height}px`;
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const botName = config?.display_name || 'Trợ lý AI';
  const shortName = config?.short_name || 'Trợ lý';
  const avatarUrl = config?.avatar_url || '/images/chatbot/cuu-hula-96.webp';

  const handleSend = () => {
    if (!inputText.trim() || sending) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSaveBrief = async () => {
    const itemsArr = briefItems
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateBrief({
      quantity: Number(briefQuantity) || 30,
      colors: briefColors || undefined,
      items: itemsArr.length ? itemsArr : undefined,
      school_name: briefSchool || undefined,
    });
    setEditingBrief(false);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentContact) {
      setSubmitError('Vui lòng đồng ý để HULA liên hệ tư vấn.');
      return;
    }
    if (!contactPhone.trim()) {
      setSubmitError('Vui lòng nhập số điện thoại để nhân viên liên hệ.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const res = await submitRequest(
      {
        name: contactName.trim() || undefined,
        phone: contactPhone.trim(),
        preferred_channel: preferredChannel,
      },
      {
        contact: consentContact,
        marketing: consentMarketing,
        notice_version: 'v1',
      }
    );

    setSubmitting(false);
    if (res && res.code) {
      setSubmittedCode(res.code);
      setShowRequestForm(false);
    } else {
      setSubmitError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng kiểm tra lại thông tin và thử lại.');
    }
  };

  return (
    <div
      id="chat-panel"
      ref={panelRef}
      className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[90] w-full sm:w-[400px] sm:max-w-[calc(100vw-32px)] h-[100dvh] sm:h-[620px] sm:max-h-[calc(100vh-48px)] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
      style={{ boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)' }}
    >
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 shrink-0">
            <Image
              src={avatarUrl}
              alt={botName}
              width={36}
              height={36}
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">{shortName}</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                AI
              </span>
            </div>
            <p className="text-[11px] text-white/80 line-clamp-1">
              {conversation?.human_active ? 'Nhân viên đang hỗ trợ' : 'Tư vấn nệm chăn ga mầm non'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!conversation?.human_active && (
            <button
              onClick={requestHuman}
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-pill font-medium transition-all active:scale-95"
            >
              Gặp nhân viên
            </button>
          )}

          <button
            onClick={closeChat}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white text-lg transition-all"
            aria-label="Đóng cuộc trò chuyện"
          >
            &times;
          </button>
        </div>
      </div>

      {/* 2. Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
        {/* Welcome greeting if no messages */}
        {messages.length === 0 && (
          <div className="text-center py-6 px-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-primary-100 p-1 border-2 border-primary-200">
              <Image
                src={avatarUrl}
                alt={botName}
                width={64}
                height={64}
                className="object-cover rounded-full"
                unoptimized
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">{botName}</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
                {config?.welcome_message ||
                  'Chào anh/chị! Em là trợ lý AI chuyên tư vấn chăn ga gối nệm mầm non đạt chuẩn cho trường và gia đình.'}
              </p>
            </div>

            {/* 4 Start Options */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              <button
                onClick={() => sendAction('start', 'school')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-sm text-xs font-semibold text-gray-800 transition-all text-left"
              >
                🏫 <span className="block font-bold mt-1 text-primary-700">Đặt cho trường</span>
                <span className="text-[10px] text-gray-500 font-normal">Nệm, gối số lượng lớn</span>
              </button>

              <button
                onClick={() => sendAction('start', 'parent')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-sm text-xs font-semibold text-gray-800 transition-all text-left"
              >
                👶 <span className="block font-bold mt-1 text-amber-700">Chọn cho bé</span>
                <span className="text-[10px] text-gray-500 font-normal">Nệm ngủ trưa đi học</span>
              </button>

              <button
                onClick={() => sendAction('start', 'sample')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-sm text-xs font-semibold text-gray-800 transition-all text-left"
              >
                📦 <span className="block font-bold mt-1 text-emerald-700">Xem mẫu nệm</span>
                <span className="text-[10px] text-gray-500 font-normal">Xem chất liệu & độ dày</span>
              </button>

              <button
                onClick={() => sendAction('start', 'support')}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-sm text-xs font-semibold text-gray-800 transition-all text-left"
              >
                💬 <span className="block font-bold mt-1 text-purple-700">Hỗ trợ đơn hàng</span>
                <span className="text-[10px] text-gray-500 font-normal">Đơn đã đặt / bảo hành</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((m, idx) => {
          const isCustomer = m.role === 'customer';
          const isAi = m.role === 'ai';
          const isStaff = m.role === 'staff';
          const isSystem = m.role === 'system';

          if (isSystem) {
            return (
              <div key={m.id || idx} className="text-center my-2">
                <span className="inline-block bg-gray-200/80 text-gray-600 text-[11px] px-3 py-1 rounded-full leading-tight font-medium">
                  {m.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={m.id || idx}
              className={`flex items-start gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isCustomer && (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-100 shrink-0 mt-0.5 border border-primary-200">
                  <Image
                    src={avatarUrl}
                    alt={isStaff ? 'Nhân viên HULA' : shortName}
                    width={28}
                    height={28}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  isCustomer
                    ? 'bg-primary-500 text-white rounded-br-xs'
                    : isStaff
                    ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-bl-xs'
                    : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                }`}
              >
                {!isCustomer && (
                  <div className="text-[10px] font-bold text-gray-400 mb-1">
                    {isStaff ? 'Nhân viên HULA' : shortName}
                  </div>
                )}

                {/* Plain text message */}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                {/* Summary Card Payload */}
                {m.payload && m.payload.type === 'summary' && (
                  <div className="mt-3 p-3 bg-primary-50/70 border border-primary-200 rounded-xl space-y-2 text-gray-800">
                    <div className="flex items-center justify-between border-b border-primary-200 pb-1.5">
                      <span className="font-bold text-xs text-primary-900">
                        📋 Tóm tắt nhu cầu
                      </span>
                      <button
                        onClick={() => setEditingBrief(true)}
                        className="text-[11px] text-primary-600 hover:underline font-semibold"
                      >
                        Chỉnh sửa
                      </button>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <div>
                        <b>Số lượng:</b> {m.payload.fields?.quantity || briefQuantity} bộ
                      </div>
                      <div>
                        <b>Mặt hàng:</b>{' '}
                        {Array.isArray(m.payload.fields?.items)
                          ? m.payload.fields.items.join(', ')
                          : briefItems}
                      </div>
                      {m.payload.fields?.colors && (
                        <div>
                          <b>Màu sắc:</b> {m.payload.fields.colors}
                        </div>
                      )}
                      {m.payload.fields?.school_name && (
                        <div>
                          <b>Trường:</b> {m.payload.fields.school_name}
                        </div>
                      )}
                    </div>

                    {!submittedCode && (
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="w-full mt-2 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xs shadow-md transition-all active:scale-95"
                      >
                        Gửi yêu cầu báo giá ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic py-1">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping"></span>
            <span>{shortName} đang phản hồi...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Modal / Overlay: Edit Brief */}
      {editingBrief && (
        <div className="absolute inset-x-0 bottom-0 top-14 bg-white z-20 p-4 flex flex-col animate-slide-up border-t border-gray-200">
          <div className="flex items-center justify-between pb-3 border-b">
            <h4 className="font-bold text-sm text-gray-800">Chỉnh sửa thông tin nhu cầu</h4>
            <button
              onClick={() => setEditingBrief(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Số lượng bộ dự kiến:</label>
              <input
                type="number"
                min="1"
                max="100000"
                value={briefQuantity}
                onChange={(e) => setBriefQuantity(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mặt hàng cần mua:</label>
              <input
                type="text"
                placeholder="VD: nệm, gối, mền"
                value={briefItems}
                onChange={(e) => setBriefItems(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Màu sắc / họa tiết:</label>
              <input
                type="text"
                placeholder="VD: màu be, xanh mint"
                value={briefColors}
                onChange={(e) => setBriefColors(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tên trường mầm non:</label>
              <input
                type="text"
                placeholder="VD: Mầm non Hoa Sen"
                value={briefSchool}
                onChange={(e) => setBriefSchool(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t flex gap-2">
            <button
              onClick={() => setEditingBrief(false)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveBrief}
              className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal / Overlay: Submit Request Form */}
      {showRequestForm && (
        <div className="absolute inset-x-0 bottom-0 top-14 bg-white z-20 p-4 flex flex-col animate-slide-up border-t border-gray-200">
          <div className="flex items-center justify-between pb-3 border-b">
            <h4 className="font-bold text-sm text-gray-800">Thông tin liên hệ gửi báo giá</h4>
            <button
              onClick={() => setShowRequestForm(false)}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
            {submitError && (
              <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px]">
                {submitError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Họ tên của anh/chị:</label>
              <input
                type="text"
                placeholder="VD: Cô Mai, Thầy Tuấn..."
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Số điện thoại liên hệ <span className="text-red-500">*</span>:
              </label>
              <input
                type="tel"
                required
                placeholder="VD: 0987654321"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Kênh ưu tiên liên hệ:</label>
              <div className="flex gap-2">
                {(['phone', 'zalo', 'email'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setPreferredChannel(ch)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                      preferredChannel === ch
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {ch === 'phone' ? 'Điện thoại' : ch === 'zalo' ? 'Zalo' : 'Email'}
                  </button>
                ))}
              </div>
            </div>

            {/* Consent contact (NOT pre-checked) */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentContact}
                  onChange={(e) => setConsentContact(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                />
                <span className="text-[11px] text-gray-700 leading-tight">
                  <span className="font-semibold">Tôi đồng ý</span> để HULA liên hệ tư vấn và gửi báo giá qua số điện thoại/kênh đã cung cấp. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            {/* Consent marketing (separate & optional) */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentMarketing}
                  onChange={(e) => setConsentMarketing(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                />
                <span className="text-[11px] text-gray-500 leading-tight">
                  Nhận thông tin ưu đãi, khuyến mãi và bộ sưu tập mới từ HULA (không bắt buộc).
                </span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi yêu cầu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Footer / Composer */}
      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Nhập nội dung cần tư vấn..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            className="flex-1 bg-gray-50 border border-gray-300 rounded-pill px-4 py-2 text-xs focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all active:scale-95 shadow-sm"
            aria-label="Gửi tin nhắn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 px-1">
          <span>{botName}</span>
          {config?.contact_channels?.hotline && (
            <span>Hotline: {config.contact_channels.hotline}</span>
          )}
        </div>
      </div>
    </div>
  );
}
