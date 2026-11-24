import React from 'react';
import { Heart } from 'lucide-react';
import { HERO_MAP } from '../data/heroes';
import { formatSealName, pickText, t } from '../i18n/translations';
import { GameState, Language } from '../types/game';

interface EndGameScreenProps {
  lang: Language;
  state: GameState;
  onPlayAgain: () => void;
}

export const EndGameScreen: React.FC<EndGameScreenProps> = ({ lang, state, onPlayAgain }) => {
  const isVictory = state.phase === 'VICTORY';
  const winner = state.players.find((p) => p.id === state.winnerPlayerId);
  const winnerHero = winner ? HERO_MAP.get(winner.heroId) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-lg border border-stone-800 bg-[#171b22] p-8 space-y-6">
        <div className="space-y-2 border-b border-stone-800 pb-5">
          <p className={`text-xs font-semibold ${isVictory ? 'text-emerald-400' : 'text-rose-400'}`}>
            {t(lang, 'roundLabel')} {state.round}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-100">
            {isVictory ? t(lang, 'victoryTitle') : t(lang, 'defeatTitle')}
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            {isVictory ? t(lang, 'victoryDesc') : t(lang, 'defeatDesc')}
          </p>
          {winner && winnerHero && (
            <p className="text-sm font-medium text-amber-300 pt-1">
              {winner.name} ({pickText(lang, winnerHero.name)})
            </p>
          )}
        </div>

        <div className="space-y-3">
          {state.players.map((p) => {
            const hero = HERO_MAP.get(p.heroId);
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-800 bg-[#12151b] px-4 py-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-100">{p.name}</span>
                  <span className="text-stone-400"> · {hero ? pickText(lang, hero.name) : ''}</span>
                </div>
                <div className="flex items-center gap-2 font-mono tabular-nums text-stone-300">
                  <span className="inline-flex items-center gap-1" title={t(lang, 'hpLabel')}>
                    <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                    {p.hp}/{p.maxHp}
                  </span>
                  <span>·</span>
                  <span>
                    {t(lang, 'sealsTitle')}:{' '}
                    {p.seals.length > 0
                      ? p.seals.map((s) => formatSealName(lang, s)).join(', ')
                      : '0/3'}{' '}
                    · {p.enemiesSlain} {lang === 'uk' ? 'ворогів переможено' : 'slain'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded bg-amber-600 px-6 py-3 text-sm font-bold text-stone-950 hover:bg-amber-500 transition-colors whitespace-nowrap min-h-[44px]"
          >
            {t(lang, 'playAgain')}
          </button>
        </div>
      </div>
    </main>
  );
};
