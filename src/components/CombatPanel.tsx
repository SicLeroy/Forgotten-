import React from 'react';
import { BookOpen, Coins, Shield, Sparkles, Sword, Wind } from 'lucide-react';
import { ENEMY_MAP } from '../data/enemies';
import { canFleeCombat, computeCombatPreview } from '../engine/RulesEngine';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { CombatType, EnemyDefinition, GameState, Language } from '../types/game';
import { DiceDieSvg } from './DiceRollerPanel';
import { EnemyBestiaryTooltip } from './EnemyBestiaryTooltip';

const { pickText, t } = LocalizationManager;

interface CombatPanelProps {
  lang: Language;
  state: GameState;
  onCombatAttack: (combatType: CombatType) => void;
  onCombatDefend: () => void;
  onCombatFlee: () => void;
}

function formatEnemyTier(
  lang: Language,
  tier: EnemyDefinition['tier'] | 'pvp'
): string {
  if (tier === 'pvp') return t(lang, 'enemyTierPvp');
  if (tier === 'minion') return t(lang, 'enemyTierMinion');
  if (tier === 'elite') return t(lang, 'enemyTierElite');
  return t(lang, 'enemyTierBoss');
}

function formatSigned(val: number): string {
  return val >= 0 ? `+${val}` : `${val}`;
}

export const CombatPanel: React.FC<CombatPanelProps> = ({
  lang,
  state,
  onCombatAttack,
  onCombatDefend,
  onCombatFlee,
}) => {
  const combat = state.combat;
  if (!combat) return null;

  const physicalPreview = computeCombatPreview(state, 'physical');
  const magicPreview = computeCombatPreview(state, 'magic');
  const fleeCheck = canFleeCombat(state);
  const baseEnemy = ENEMY_MAP.get(combat.enemyId);

  if (!physicalPreview || !magicPreview) return null;

  const traitText = combat.enemyTraitOverride ?? baseEnemy?.specialTrait ?? null;
  const enemyHpPct =
    combat.enemyMaxHp > 0
      ? Math.max(0, Math.min(100, Math.round((combat.enemyCurrentHp / combat.enemyMaxHp) * 100)))
      : 0;
  const enemyDefense = combat.enemyDefenseOverride ?? baseEnemy?.defense ?? 0;
  const combatLog = combat.combatLog ?? [];
  const lastBreakdown = combat.lastBreakdown ?? null;

  return (
    <section className="rounded-lg border border-rose-800/70 bg-[#18141a] p-5 space-y-4">
      {/* Header: Enemy / PvP Opponent Name, Tier, HP Bar & Rewards */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800 pb-3.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-xs font-semibold text-rose-300 tabular-nums">
            {formatEnemyTier(lang, physicalPreview.enemyTier)} · {t(lang, 'roundLabel')}{' '}
            {combat.roundCount}
            {traitText ? ` · ${pickText(lang, traitText)}` : ''}
          </div>
          <h2 className="font-display text-2xl font-bold text-stone-100 leading-tight">
            <EnemyBestiaryTooltip
              lang={lang}
              enemyId={combat.enemyId}
              overrides={{
                name: physicalPreview.enemyName,
                tier: physicalPreview.enemyTier,
                maxHp: combat.enemyMaxHp,
                attack: physicalPreview.enemyStat,
                intellect: magicPreview.enemyStat,
                defense: enemyDefense,
                specialEffect: physicalPreview.enemySpecialEffect,
                specialTrait: traitText ?? undefined,
              }}
            >
              <span>{pickText(lang, physicalPreview.enemyName)}</span>
            </EnemyBestiaryTooltip>
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-300 font-mono tabular-nums pt-0.5">
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Sword className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'strengthLabel')}: {physicalPreview.enemyStat}
            </span>
            <span className="inline-flex items-center gap-1 text-sky-300">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'intellectLabel')}: {magicPreview.enemyStat}
            </span>
            <span className="inline-flex items-center gap-1 text-stone-300">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'armorLabel')}: {enemyDefense}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-200">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />+{physicalPreview.goldReward}g
            </span>
            <span className="inline-flex items-center gap-1 text-violet-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />+{physicalPreview.xpReward} XP
            </span>
          </div>
        </div>

        <div className="w-full sm:w-44 space-y-1.5 font-mono tabular-nums">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">{t(lang, 'hpLabel')}</span>
            <span className="text-base font-bold text-rose-300">
              {combat.enemyCurrentHp} / {combat.enemyMaxHp}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-sm bg-stone-900">
            <div
              className="h-full bg-rose-600 transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${enemyHpPct / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* Physical vs Magic Formula Previews + Tie Rule */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <h3 className="font-semibold text-stone-200">{t(lang, 'combatBreakdownTitle')}</h3>
          <span className="text-stone-400">{t(lang, 'tieRuleNote')}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Physical Clash Card */}
          <div className="rounded border border-stone-800 bg-[#12141a] p-3 text-xs space-y-1.5 font-mono tabular-nums">
            <div className="flex items-center justify-between font-sans font-semibold text-amber-300">
              <span className="inline-flex items-center gap-1.5">
                <Sword className="h-3.5 w-3.5" aria-hidden="true" />
                {t(lang, 'physicalAttackAction')}
              </span>
            </div>
            <div className="text-stone-200">
              {t(lang, 'heroFormulaLabel')}: {physicalPreview.heroBaseStat} ({t(lang, 'strengthLabel')})
              {' '}
              {formatSigned(physicalPreview.heroGearBonus)} ({t(lang, 'gearBonusLabel')})
              {' '}
              {formatSigned(physicalPreview.heroModifiers)} ({t(lang, 'modifiersLabel')}) + d6
              {' = '}
              <strong className="text-amber-200">
                {physicalPreview.heroBaseStat +
                  physicalPreview.heroGearBonus +
                  physicalPreview.heroModifiers}
                +d6
              </strong>
            </div>
            <div className="text-stone-400">
              {t(lang, 'enemyFormulaLabel')}: {physicalPreview.enemyStat}{' '}
              {formatSigned(physicalPreview.enemyModifiers)} ({t(lang, 'modifiersLabel')}) + d6
              {' = '}
              <strong className="text-rose-300">
                {physicalPreview.enemyStat + physicalPreview.enemyModifiers}+d6
              </strong>
            </div>
          </div>

          {/* Magic Clash Card */}
          <div className="rounded border border-stone-800 bg-[#12141a] p-3 text-xs space-y-1.5 font-mono tabular-nums">
            <div className="flex items-center justify-between font-sans font-semibold text-sky-300">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {t(lang, 'magicAttackAction')}
              </span>
            </div>
            <div className="text-stone-200">
              {t(lang, 'heroFormulaLabel')}: {magicPreview.heroBaseStat} ({t(lang, 'intellectLabel')})
              {' '}
              {formatSigned(magicPreview.heroGearBonus)} ({t(lang, 'gearBonusLabel')})
              {' '}
              {formatSigned(magicPreview.heroModifiers)} ({t(lang, 'modifiersLabel')}) + d6
              {' = '}
              <strong className="text-sky-200">
                {magicPreview.heroBaseStat + magicPreview.heroGearBonus + magicPreview.heroModifiers}
                +d6
              </strong>
            </div>
            <div className="text-stone-400">
              {t(lang, 'enemyFormulaLabel')}: {magicPreview.enemyStat}{' '}
              {formatSigned(magicPreview.enemyModifiers)} ({t(lang, 'modifiersLabel')}) + d6
              {' = '}
              <strong className="text-rose-300">
                {magicPreview.enemyStat + magicPreview.enemyModifiers}+d6
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Clash Dice & Exact Totals */}
      {lastBreakdown && (
        <div className="rounded border border-stone-800 bg-[#12141a] p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DiceDieSvg
                value={lastBreakdown.heroRoll}
                animKey={`cmb_h_${lastBreakdown.round}_${lastBreakdown.heroRoll}_${combatLog.length}`}
              />
              <div className="text-xs font-mono tabular-nums">
                <div className="text-stone-400">{t(lang, 'heroFormulaLabel')}</div>
                <div className="text-base font-bold text-amber-200">
                  {lastBreakdown.heroTotal}
                </div>
                <div className="text-[11px] text-stone-400">
                  {lastBreakdown.heroBaseStat}
                  {formatSigned(lastBreakdown.heroGearBonus)}
                  {formatSigned(lastBreakdown.heroModifiers)}+{lastBreakdown.heroRoll}
                </div>
              </div>
            </div>

            <div className="text-xs font-semibold text-center">
              <div
                className={
                  lastBreakdown.winner === 'player' ? 'text-emerald-300' : 'text-rose-300'
                }
              >
                {lastBreakdown.wasTie
                  ? t(lang, 'tieOutcomeLabel')
                  : lastBreakdown.winner === 'player'
                    ? t(lang, 'victoryOutcomeLabel')
                    : t(lang, 'defeatOutcomeLabel')}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {pickText(lang, lastBreakdown.summary)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs font-mono tabular-nums">
                <div className="text-stone-400">{t(lang, 'enemyFormulaLabel')}</div>
                <div className="text-base font-bold text-rose-300">
                  {lastBreakdown.enemyTotal}
                </div>
                <div className="text-[11px] text-stone-400">
                  {lastBreakdown.enemyStat}
                  {formatSigned(lastBreakdown.enemyModifiers)}+{lastBreakdown.enemyRoll}
                </div>
              </div>
              <DiceDieSvg
                value={lastBreakdown.enemyRoll}
                animKey={`cmb_e_${lastBreakdown.round}_${lastBreakdown.enemyRoll}_${combatLog.length}`}
              />
            </div>
          </div>

          {lastBreakdown.specialEffectNote && (
            <div className="border-t border-stone-800 pt-2 text-xs text-amber-300">
              {t(lang, 'specialEffectLabel')}: {pickText(lang, lastBreakdown.specialEffectNote)}
            </div>
          )}
        </div>
      )}

      {/* Combat Actions */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onCombatAttack('physical')}
            className="inline-flex items-center gap-2 rounded bg-rose-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-600 transition-colors min-h-[44px]"
          >
            <Sword className="h-4 w-4" aria-hidden="true" />
            {t(lang, 'physicalAttackAction')}
          </button>
          <button
            type="button"
            onClick={() => onCombatAttack('magic')}
            className="inline-flex items-center gap-2 rounded bg-indigo-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-600 transition-colors min-h-[44px]"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t(lang, 'magicAttackAction')}
          </button>
          <button
            type="button"
            onClick={onCombatDefend}
            className="inline-flex items-center gap-2 rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-100 hover:border-stone-500 transition-colors min-h-[44px]"
          >
            <Shield className="h-4 w-4 text-stone-300" aria-hidden="true" />
            {t(lang, 'defendAction')}
          </button>
          <button
            type="button"
            disabled={!fleeCheck.allowed}
            onClick={onCombatFlee}
            title={pickText(lang, fleeCheck.reason)}
            className="inline-flex items-center gap-2 rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            <Wind className="h-4 w-4 text-amber-300" aria-hidden="true" />
            {t(lang, 'fleeAction')}
          </button>
        </div>

        <p className={`text-xs ${fleeCheck.allowed ? 'text-emerald-300' : 'text-stone-400'}`}>
          {fleeCheck.allowed ? t(lang, 'fleeAllowedLabel') : t(lang, 'fleeLockedLabel')}:{' '}
          {pickText(lang, fleeCheck.reason)}
        </p>
      </div>

      {/* Scrollable Combat Log */}
      <div className="border-t border-stone-800 pt-3 space-y-2">
        <h3 className="text-xs font-semibold text-stone-300">{t(lang, 'combatLogTitle')}</h3>
        {combatLog.length === 0 ? (
          <p className="text-xs text-stone-500">{t(lang, 'noCombatLogsYet')}</p>
        ) : (
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {combatLog.map((entry, idx) => (
              <div
                key={`cl_${entry.round}_${idx}`}
                className="rounded border border-stone-800/80 bg-[#12141a] px-3 py-1.5 text-stone-300"
              >
                <span className="font-mono text-stone-400 mr-2">
                  #{entry.round}
                </span>
                <span>{pickText(lang, entry.summary)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
