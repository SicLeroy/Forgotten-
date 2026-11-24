import React from 'react';
import { t } from '../i18n/translations';
import { GamePhase, Language } from '../types/game';

export type ActiveView = 'table' | 'map' | 'inventory' | 'saves';

interface TopBarProps {
  lang: Language;
  onToggleLang: () => void;
  gamePhase: GamePhase;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onReturnToTitle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onToggleLang,
  gamePhase,
  activeView,
  onChangeView,
  onReturnToTitle,
}) => {
  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'table', label: t(lang, 'navTable') },
    { id: 'map', label: t(lang, 'navMap') },
    { id: 'inventory', label: t(lang, 'navInventory') },
    { id: 'saves', label: t(lang, 'navSaves') },
  ];

  return (
    <header className="border-b border-stone-800 bg-[#14171d]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 sm:gap-8 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={onReturnToTitle}
          className="font-display text-left text-base sm:text-xl font-bold tracking-wide text-stone-100 hover:text-amber-300 transition-colors min-w-0 truncate focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {t(lang, 'appTitle')}
        </button>

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

        <div className="flex items-center shrink-0">
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
