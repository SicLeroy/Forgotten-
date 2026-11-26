import React from 'react';
import { BookOpen, Info, Shield, Sparkles, Sword, Zap } from 'lucide-react';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { Language } from '../types/game';
import { EnemyBestiaryOverrides, getEnemyBestiaryIntel } from '../utils/bestiary';

const { pickText, t } = LocalizationManager;

interface EnemyBestiaryTooltipProps {
  lang: Language;
  enemyId: string;
  overrides?: EnemyBestiaryOverrides;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export const EnemyBestiaryTooltip: React.FC<EnemyBestiaryTooltipProps> = ({
  lang,
  enemyId,
  overrides,
  children,
  align = 'left',
}) => {
  const intel = getEnemyBestiaryIntel(enemyId, overrides);

  if (!intel) {
    return <>{children}</>;
  }

  const posClass = align === 'right' ? 'right-0' : 'left-0';

  const approachLabel =
    intel.recommendedApproach === 'magic'
      ? t(lang, 'magicAttackAction')
      : intel.recommendedApproach === 'physical'
        ? t(lang, 'physicalAttackAction')
        : `${t(lang, 'strengthLabel')} / ${t(lang, 'intellectLabel')}`;

  return (
    <span className="group relative inline-flex items-center gap-1.5 align-middle">
      <span
        tabIndex={0}
        aria-label={`${pickText(lang, intel.name)} — ${t(lang, 'bestiaryLabel')}`}
        className="inline-flex items-center gap-1.5 cursor-help border-b border-dotted border-amber-400/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded-sm"
      >
        {children}
        <Info className="h-3.5 w-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
      </span>

      <div
        role="tooltip"
        data-testid={`bestiary-tooltip-${enemyId}`}
        className={`pointer-events-none opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 absolute top-full ${posClass} z-40 mt-2 w-80 sm:w-96 rounded-md border border-amber-600/60 bg-[#101319]/95 p-3.5 text-left text-xs text-stone-200 shadow-2xl backdrop-blur-sm space-y-2.5`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              {t(lang, 'bestiaryLabel')}
            </div>
            <div className="font-display text-sm font-bold text-stone-100 truncate">
              {pickText(lang, intel.name)}
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-stone-300 shrink-0">
            <span>HP {intel.maxHp}</span>
            <span className="inline-flex items-center gap-0.5 text-amber-300">
              <Sword className="h-3 w-3" aria-hidden="true" />
              {intel.attack}
            </span>
            <span className="inline-flex items-center gap-0.5 text-sky-300">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {intel.intellect}
            </span>
            <span className="inline-flex items-center gap-0.5 text-stone-300">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {intel.defense}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          {pickText(lang, intel.description)}
        </p>

        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {t(lang, 'strengthsLabel')}
          </div>
          <ul className="space-y-0.5 text-[11px] text-stone-200 pl-1">
            {intel.strengths.map((s, i) => (
              <li key={`str_${i}`}>• {pickText(lang, s)}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {t(lang, 'weaknessesLabel')}
          </div>
          <ul className="space-y-0.5 text-[11px] text-emerald-100/90 pl-1">
            {intel.weaknesses.map((w, i) => (
              <li key={`wk_${i}`}>• {pickText(lang, w)}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-stone-800 pt-2 text-[11px] text-amber-200/90">
          <span className="font-semibold">{t(lang, 'recommendedTacticLabel')}: </span>
          <span>{approachLabel}</span>
        </div>
      </div>
    </span>
  );
};
