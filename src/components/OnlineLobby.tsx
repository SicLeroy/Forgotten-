import React, { useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  LogOut,
  Play,
  Shield,
  Trash2,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { HEROES, HERO_MAP } from '../data/heroes';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { OnlineConnectionStatus } from '../online/OnlineClient';
import { AiDifficulty, Language } from '../types/game';
import { OnlineChatMessage, PublicOnlineRoom } from '../types/online';
import { HeroAvatar } from './HeroAvatar';
import { RoomChatPanel } from './RoomChatPanel';

const { pickText, t } = LocalizationManager;

interface OnlineLobbyProps {
  lang: Language;
  room: PublicOnlineRoom;
  mySlotId: string;
  reconnectCode: string | null;
  connectionStatus: OnlineConnectionStatus;
  chatMessages: OnlineChatMessage[];
  errorBanner: string | null;
  onSelectHero: (heroId: string) => void;
  onUpdateName: (name: string) => void;
  onToggleReady: (ready: boolean) => void;
  onUpdateRoomConfig: (maxPlayers: number, aiDifficulty: AiDifficulty) => void;
  onAddAiBot: () => void;
  onRemoveSeat: (slotId: string) => void;
  onStartMatch: () => void;
  onSendChat: (text: string) => void;
  onLeaveRoom: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  lang,
  room,
  mySlotId,
  reconnectCode,
  connectionStatus,
  chatMessages,
  errorBanner,
  onSelectHero,
  onUpdateName,
  onToggleReady,
  onUpdateRoomConfig,
  onAddAiBot,
  onRemoveSeat,
  onStartMatch,
  onSendChat,
  onLeaveRoom,
}) => {
  const me = room.seats.find((s) => s.slotId === mySlotId) ?? null;
  const isHost = Boolean(me?.isHost);
  const [nameDraft, setNameDraft] = useState(me?.name ?? '');
  const [copiedType, setCopiedType] = useState<'code' | 'link' | 'reconnect' | null>(null);

  const copyText = (text: string, kind: 'code' | 'link' | 'reconnect') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedType(kind);
    window.setTimeout(() => setCopiedType((prev) => (prev === kind ? null : prev)), 1800);
  };

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`
      : `?room=${room.roomCode}`;

  const unreadyHumans = room.seats.filter((s) => !s.isAI && !s.isHost && !s.ready);
  const canStart = isHost && unreadyHumans.length === 0 && room.seats.length >= 1;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Invite Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
              {t(lang, 'onlineLobbyTitle')}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${
                connectionStatus === 'connected'
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                  : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
                    ? 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                    : 'border-rose-700/60 bg-rose-950/40 text-rose-300'
              }`}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {connectionStatus === 'connected'
                ? t(lang, 'onlineConnectedBadge')
                : connectionStatus === 'reconnecting'
                  ? t(lang, 'onlineReconnectingBadge')
                  : t(lang, 'onlineDisconnectedBadge')}
            </span>
          </div>
          <p className="text-xs text-stone-400">{t(lang, 'onlineServerAuthoritativeNote')}</p>
        </div>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 rounded border border-stone-700 bg-stone-900 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:border-rose-500/60 transition-colors min-h-[40px]"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t(lang, 'onlineLeaveRoomAction')}
        </button>
      </div>

      {errorBanner && (
        <div
          role="alert"
          className="rounded border border-rose-700/70 bg-rose-950/50 px-4 py-2.5 text-xs text-rose-200"
        >
          {errorBanner}
        </div>
      )}

      {/* Invite Code + Reconnect Key Strip */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg ornate-frame bg-[#15181f] p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-stone-400">{t(lang, 'onlineInviteCodeLabel')}</div>
            <div className="font-mono text-2xl font-bold tracking-widest text-amber-300 mt-0.5">
              {room.roomCode}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyText(room.roomCode, 'code')}
              className="inline-flex items-center gap-1.5 rounded border border-amber-600/60 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[38px]"
            >
              {copiedType === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedType === 'code' ? t(lang, 'onlineCopiedLabel') : room.roomCode}
            </button>
            <button
              type="button"
              onClick={() => copyText(inviteUrl, 'link')}
              className="inline-flex items-center gap-1.5 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-200 hover:border-amber-500/60 transition-colors min-h-[38px]"
            >
              {copiedType === 'link' ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {copiedType === 'link' ? t(lang, 'onlineCopiedLabel') : t(lang, 'onlineCopyInviteLink')}
            </button>
          </div>
        </div>

        {reconnectCode && (
          <div className="rounded-lg ornate-frame bg-[#15181f] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                <KeyRound className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {t(lang, 'onlineYourReconnectKey')}
              </div>
              <div className="font-mono text-lg font-bold tracking-wider text-emerald-300 mt-0.5">
                {reconnectCode}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">{t(lang, 'onlineReconnectKeyHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(reconnectCode, 'reconnect')}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-700/60 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/50 transition-colors min-h-[38px]"
            >
              {copiedType === 'reconnect' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedType === 'reconnect' ? t(lang, 'onlineCopiedLabel') : reconnectCode}
            </button>
          </div>
        )}
      </section>

      {/* Main Split: Seats & Config + Chat */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-5">
          {/* Room Settings (Host Controls) */}
          <section className="rounded-lg ornate-frame bg-[#15181f] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="text-sm font-semibold text-stone-200">
                {t(lang, 'playerCount')}:{' '}
                <span className="font-mono text-amber-300">
                  {room.seats.length} / {room.maxPlayers}
                </span>
              </div>

              {isHost && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        disabled={cnt < room.seats.length}
                        onClick={() => onUpdateRoomConfig(cnt, room.aiDifficulty)}
                        className={`rounded border px-2.5 py-1 text-xs font-mono font-semibold transition-colors min-h-[34px] disabled:opacity-35 ${
                          room.maxPlayers === cnt
                            ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                            : 'border-stone-800 bg-[#111317] text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>

                  <select
                    value={room.aiDifficulty}
                    onChange={(e) =>
                      onUpdateRoomConfig(room.maxPlayers, e.target.value as AiDifficulty)
                    }
                    className="rounded border border-stone-800 bg-[#111317] px-2.5 py-1.5 text-xs text-stone-200 min-h-[34px]"
                  >
                    <option value="easy">{t(lang, 'aiEasyLabel')}</option>
                    <option value="normal">{t(lang, 'aiNormalLabel')}</option>
                    <option value="hard">{t(lang, 'aiHardLabel')}</option>
                  </select>

                  {room.seats.length < room.maxPlayers && (
                    <button
                      type="button"
                      onClick={onAddAiBot}
                      className="inline-flex items-center gap-1.5 rounded border border-sky-700/60 bg-sky-950/40 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900/50 transition-colors min-h-[34px]"
                    >
                      <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(lang, 'onlineAddBotAction')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 1–6 Seat List */}
            <div className="space-y-3">
              {room.seats.map((seat) => {
                const hero = HERO_MAP.get(seat.heroId) ?? HEROES[0];
                const isMine = seat.slotId === mySlotId;
                return (
                  <article
                    key={seat.slotId}
                    className={`rounded-md border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                      isMine
                        ? 'border-amber-500/70 bg-[#171c24]'
                        : 'border-stone-800 bg-[#12151b]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HeroAvatar
                        src={hero.portraitPath}
                        alt={pickText(lang, hero.name)}
                        className="h-12 w-12 rounded-md border border-amber-700/40 object-cover shrink-0"
                        fallbackLabel={pickText(lang, hero.className)}
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-stone-100 truncate">
                            {seat.name}
                          </span>
                          {seat.isHost && (
                            <span className="inline-flex items-center gap-1 rounded border border-amber-600/50 bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                              <Shield className="h-2.5 w-2.5" aria-hidden="true" />
                              {t(lang, 'onlineHostBadge')}
                            </span>
                          )}
                          {seat.isAI && (
                            <span className="inline-flex items-center gap-1 rounded border border-sky-700/50 bg-sky-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">
                              <Bot className="h-2.5 w-2.5" aria-hidden="true" />
                              {t(lang, 'aiLabel')}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                              seat.connected ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                seat.connected ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            {seat.connected
                              ? t(lang, 'onlineConnectedBadge')
                              : t(lang, 'onlineDisconnectedBadge')}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400">
                          {pickText(lang, hero.className)} — {pickText(lang, hero.name)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isMine ? (
                        <>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              onUpdateName(nameDraft);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input
                              type="text"
                              maxLength={32}
                              value={nameDraft}
                              onChange={(e) => setNameDraft(e.target.value)}
                              onBlur={() => onUpdateName(nameDraft)}
                              aria-label={t(lang, 'onlineYourNameLabel')}
                              className="w-28 sm:w-32 rounded border border-stone-700 bg-[#101318] px-2 py-1 text-xs text-stone-100 min-h-[34px]"
                            />
                          </form>
                          <select
                            value={seat.heroId}
                            onChange={(e) => onSelectHero(e.target.value)}
                            className="rounded border border-stone-700 bg-[#101318] px-2 py-1 text-xs text-stone-100 min-h-[34px] max-w-[180px]"
                          >
                            {HEROES.map((h) => (
                              <option key={h.id} value={h.id}>
                                {pickText(lang, h.className)} — {pickText(lang, h.name)}
                              </option>
                            ))}
                          </select>
                          {!seat.isHost && (
                            <button
                              type="button"
                              onClick={() => onToggleReady(!seat.ready)}
                              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors min-h-[34px] ${
                                seat.ready
                                  ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                                  : 'border border-amber-500/70 bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {seat.ready ? t(lang, 'onlineCancelReady') : t(lang, 'onlineReadyToggle')}
                            </button>
                          )}
                        </>
                      ) : (
                        <span
                          className={`rounded px-2.5 py-1 text-xs font-semibold ${
                            seat.ready
                              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50'
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                          }`}
                        >
                          {seat.ready ? t(lang, 'onlineReadyBadge') : t(lang, 'onlineNotReadyBadge')}
                        </span>
                      )}

                      {isHost && !seat.isHost && (
                        <button
                          type="button"
                          onClick={() => onRemoveSeat(seat.slotId)}
                          title={t(lang, 'onlineRemoveSeatAction')}
                          className="rounded border border-stone-700 bg-stone-900 p-2 text-rose-300 hover:border-rose-500/60 transition-colors min-h-[34px]"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {isHost && (
              <div className="border-t border-stone-800 pt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-stone-400">
                  {unreadyHumans.length > 0
                    ? `${t(lang, 'onlineNotReadyBadge')}: ${unreadyHumans.map((u) => u.name).join(', ')}`
                    : `${room.seats.length} / ${room.maxPlayers}`}
                </span>
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={onStartMatch}
                  className="inline-flex items-center gap-2 rounded bg-amber-600 px-6 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t(lang, 'onlineStartMatchAction')}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right: Lobby Chat */}
        <div className="lg:col-span-4">
          <RoomChatPanel
            lang={lang}
            messages={chatMessages}
            mySlotId={mySlotId}
            onSendMessage={onSendChat}
          />
        </div>
      </div>
    </main>
  );
};
