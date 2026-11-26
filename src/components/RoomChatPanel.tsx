import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { Language } from '../types/game';
import { OnlineChatMessage } from '../types/online';

const { t } = LocalizationManager;

interface RoomChatPanelProps {
  lang: Language;
  messages: OnlineChatMessage[];
  mySlotId: string | null;
  onSendMessage: (text: string) => void;
  compact?: boolean;
}

export const RoomChatPanel: React.FC<RoomChatPanelProps> = ({
  lang,
  messages,
  mySlotId,
  onSendMessage,
  compact = false,
}) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    onSendMessage(clean);
    setDraft('');
  };

  return (
    <section className="rounded-lg ornate-frame bg-[#15181f] p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-bold text-stone-100">
          <MessageSquare className="h-4 w-4 text-amber-400" aria-hidden="true" />
          {t(lang, 'onlineChatTitle')}
        </h3>
        <span className="font-mono text-xs text-stone-400 tabular-nums">{messages.length}</span>
      </div>

      <div
        ref={listRef}
        className={`${compact ? 'h-44' : 'h-64'} overflow-y-auto space-y-1.5 pr-1 text-xs`}
      >
        {messages.length === 0 ? (
          <p className="text-stone-500 py-4 text-center">{t(lang, 'onlineChatEmpty')}</p>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.kind === 'system';
            const isMine = msg.senderSlotId && msg.senderSlotId === mySlotId;
            return (
              <div
                key={msg.id}
                className={`rounded border px-2.5 py-1.5 ${
                  isSystem
                    ? 'border-stone-800/70 bg-[#101318] text-stone-400 italic'
                    : isMine
                      ? 'border-amber-700/40 bg-amber-950/20 text-stone-100'
                      : 'border-stone-800 bg-[#12151b] text-stone-200'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 text-[10px] text-stone-400 mb-0.5">
                  <span className={isMine ? 'font-semibold text-amber-300' : 'font-semibold text-stone-300'}>
                    {msg.senderName}
                  </span>
                  <span className="font-mono tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="break-words leading-snug">{msg.text}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          maxLength={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t(lang, 'onlineChatPlaceholder')}
          className="flex-1 min-w-0 rounded border border-stone-800 bg-[#111317] px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 min-h-[38px] focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label={t(lang, 'onlineChatSendAction')}
          className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[38px] shrink-0"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t(lang, 'onlineChatSendAction')}</span>
        </button>
      </form>
    </section>
  );
};
