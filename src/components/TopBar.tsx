import React from 'react';
import { Music, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useAudio } from '../App';
import { t } from '../i18n/translations';
import { OnlineConnectionStatus } from '../online/OnlineClient';
import { GamePhase, Language } from '../types/game';

export type ActiveView = 'table' | 'map' | 'inventory' | 'saves';

interface TopBarProps {
  lang: Language;
  onToggleLang: () => void;
  gamePhase: GamePhase;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onReturnToTitle: () => void;
  onlineBadge?: { roomCode: string; status: OnlineConnectionStatus } | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onToggleLang,
  gamePhase,
  activeView,
  onChangeView,
  onReturnToTitle,
  onlineBadge = null,
}) => {
  const { musicEnabled, sfxEnabled, volume, toggleMusic, toggleSfx, setVolume } = useAudio();
  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'table', label: t(lang, 'navTable') },
    { id: 'map', label: t(lang, 'navMap') },
    { id: 'inventory', label: t(lang, 'navInventory') },
    { id: 'saves', label: t(lang, 'navSaves') },
  ];

  return (
    <header className="border-b border-stone-800 bg-[#14171d]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 sm:gap-6 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onReturnToTitle}
            className="font-display text-left text-base sm:text-xl font-bold tracking-wide text-stone-100 hover:text-amber-300 transition-colors min-w-0 truncate focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {t(lang, 'appTitle')}
          </button>
          {onlineBadge && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-mono font-semibold shrink-0 ${
                onlineBadge.status === 'connected'
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-amber-700/60 bg-amber-950/40 text-amber-300'
              }`}
            >
              {onlineBadge.status === 'connected' ? (
                <Wifi className="h-3 w-3" aria-hidden="true" />
              ) : (
                <WifiOff className="h-3 w-3" aria-hidden="true" />
              )}
              {onlineBadge.roomCode}
            </span>
          )}
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const disabled =
              gamePhase === 'TITLE_MENU' && (item.id === 'table' || item.id === 'map');
            const isActive =
              (gamePhase !== 'TITLE_MENU' && activeView === item.id) ||
              (gamePhase === 'TITLE_MENU' && (item.id === 'inventory' || item.id === 'saves') && activeView === item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeView(item.id)}
                className={`whitespace-nowrap shrink-0 pb-0.5 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  disabled
                    ? 'border-transparent text-stone-600 cursor-not-allowed'
                    : isActive
                      ? 'border-amber-500 text-amber-300'
                      : 'border-transparent text-stone-300 hover:text-stone-100 hover:border-stone-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMusic}
            aria-pressed={musicEnabled}
            title={t(lang, 'musicToggleLabel')}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-amber-400 ${
              musicEnabled
                ? 'border-amber-500/70 bg-amber-950/40 text-amber-200'
                : 'border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t(lang, 'musicToggleLabel')}</span>
          </button>

          <button
            type="button"
            onClick={toggleSfx}
            aria-pressed={sfxEnabled}
            title={t(lang, 'sfxToggleLabel')}
            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-amber-400 ${
              sfxEnabled
                ? 'border-emerald-600/70 bg-emerald-950/30 text-emerald-200'
                : 'border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            {sfxEnabled ? (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{t(lang, 'sfxToggleLabel')}</span>
          </button>

          <label className="hidden lg:inline-flex items-center gap-1.5 rounded border border-stone-800 bg-stone-900 px-2.5 py-1.5 min-h-[40px]">
            <span className="sr-only">{t(lang, 'volumeLabel')}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              aria-label={t(lang, 'volumeLabel')}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-16 accent-amber-500 cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onToggleLang}
            className="rounded border border-stone-700 bg-stone-900 px-3.5 py-2 text-xs font-semibold tracking-wide text-stone-200 hover:border-amber-500/60 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {lang === 'uk' ? 'EN' : 'UA'}
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden flex-wrap items-center justify-around border-t border-stone-800/80 px-2 py-1.5"
      >
        {navItems.map((item) => {
          const disabled =
            gamePhase === 'TITLE_MENU' && (item.id === 'table' || item.id === 'map');
          const isActive =
            (gamePhase !== 'TITLE_MENU' && activeView === item.id) ||
            (gamePhase === 'TITLE_MENU' && (item.id === 'inventory' || item.id === 'saves') && activeView === item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChangeView(item.id)}
              className={`whitespace-nowrap shrink-0 px-2.5 py-2 text-xs font-medium min-h-[40px] border-b-2 transition-colors ${
                disabled
                  ? 'border-transparent text-stone-600 cursor-not-allowed'
                  : isActive
                    ? 'border-amber-500 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
