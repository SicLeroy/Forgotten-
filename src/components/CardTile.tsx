import React from 'react';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { CardDefinition, Language } from '../types/game';

const { formatCardCategory, formatCardRarity, pickText, t } = LocalizationManager;

export interface CardTileAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
}

interface CardTileProps {
  lang: Language;
  card: CardDefinition;
  dimmed?: boolean;
  showRulesDetail?: boolean;
  priceGold?: number;
  sellGold?: number;
  actions?: CardTileAction[];
}

export const CardTile: React.FC<CardTileProps> = ({
  lang,
  card,
  dimmed = false,
  showRulesDetail = false,
  priceGold,
  sellGold,
  actions = [],
}) => {
  const categoryTone =
    card.category === 'curse'
      ? 'text-rose-400'
      : card.category === 'enemy'
        ? 'text-orange-400'
        : card.category === 'legendary_artifact'
          ? 'text-amber-300'
          : card.category === 'companion'
            ? 'text-emerald-400'
            : card.category === 'spell'
              ? 'text-sky-400'
              : 'text-amber-400/90';

  const borderTone =
    card.category === 'curse'
      ? 'border-rose-900/60 bg-[#181216]'
      : card.category === 'legendary_artifact'
        ? 'border-amber-600/60 bg-[#171512]'
        : dimmed
          ? 'border-stone-800/60 bg-[#12151b]/60 opacity-60'
          : 'border-stone-700/80 bg-[#12151b]';

  return (
    <article
      className={`flex flex-col justify-between rounded border p-3.5 text-xs transition-opacity ${borderTone}`}
    >
      <div className="space-y-1.5">
        {/* Clean unboxed typographic metadata kicker (no pills) */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] font-mono tabular-nums text-stone-400">
          <span className={categoryTone}>
            {formatCardCategory(lang, card.category)} · {formatCardRarity(lang, card.rarity)}
          </span>
          <span>
            {card.id.toUpperCase()}
            {typeof priceGold === 'number'
              ? ` · ${priceGold}g`
              : typeof sellGold === 'number'
                ? ` · +${sellGold}g`
                : card.goldCost > 0
                  ? ` · ${card.goldCost}g`
                  : ''}
          </span>
        </div>

        <h4 className="font-semibold text-sm text-stone-100 leading-snug">
          {pickText(lang, card.name)}
        </h4>

        <p className="text-xs text-stone-300 leading-relaxed">{pickText(lang, card.description)}</p>

        {showRulesDetail && (
          <dl className="mt-2 space-y-1 border-t border-stone-800/80 pt-2 text-[11px] text-stone-400">
            <div>
              <dt className="inline font-semibold text-stone-300">
                {t(lang, 'activationLabel')}:{' '}
              </dt>
              <dd className="inline">{pickText(lang, card.activationCondition.description)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-stone-300">{t(lang, 'durationLabel')}: </dt>
              <dd className="inline">{pickText(lang, card.duration.description)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-stone-300">
                {t(lang, 'discardRuleLabel')}:{' '}
              </dt>
              <dd className="inline">{pickText(lang, card.discardCondition.description)}</dd>
            </div>
          </dl>
        )}
      </div>

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {actions.map((act, idx) => (
            <button
              key={`${card.id}_act_${idx}`}
              type="button"
              disabled={act.disabled}
              onClick={act.onClick}
              className={`flex-1 min-w-[92px] rounded px-3 py-2 text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                act.tone === 'primary'
                  ? 'bg-amber-600 text-stone-950 hover:bg-amber-500'
                  : act.tone === 'danger'
                    ? 'border border-rose-800/70 bg-rose-950/40 text-rose-200 hover:border-rose-500/70'
                    : 'border border-stone-700 bg-stone-900 text-stone-200 hover:border-amber-500/60 hover:text-amber-300'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};
