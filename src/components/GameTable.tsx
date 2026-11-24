import React from 'react';
import {
  BookOpen,
  CloudFog,
  CloudRain,
  Coins,
  Compass,
  Dices,
  Heart,
  Lock,
  Moon,
  MoonStar,
  Shield,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Sword,
  Wind,
  Zap,
} from 'lucide-react';
import { CARD_MAP } from '../data/cards';
import { ENEMY_MAP } from '../data/enemies';
import { HERO_MAP } from '../data/heroes';
import { LOCATION_MAP } from '../data/locations';
import { REGION_MAP } from '../data/regions';
import { WORLD_EVENT_MAP } from '../data/world';
import { NavigationGraph } from '../engine/NavigationGraph';
import { getActivePlayer, getPlayerEffectiveStats } from '../engine/RulesEngine';
import { LocalizationManager } from '../i18n/LocalizationManager';
import {
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  Language,
  SealType,
  TimeOfDay,
  TurnCycleStep,
  WeatherType,
} from '../types/game';
import { CardTile, CardTileAction } from './CardTile';
import { DiceDieSvg, DiceRollerPanel } from './DiceRollerPanel';
import { HeroAvatar } from './HeroAvatar';
import { OrnamentalDivider, SealSigil } from './OrnamentalSymbols';

const {
  formatSealName,
  formatTimeOfDay,
  formatWeather,
  pickText,
  t,
} = LocalizationManager;

function renderTimeIcon(time: TimeOfDay) {
  switch (time) {
    case 'dawn':
      return <Sunrise className="h-4 w-4 text-amber-300" aria-hidden="true" />;
    case 'day':
      return <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />;
    case 'dusk':
      return <Sunset className="h-4 w-4 text-orange-400" aria-hidden="true" />;
    case 'night':
      return <Moon className="h-4 w-4 text-sky-300" aria-hidden="true" />;
  }
}

function renderWeatherIcon(weather: WeatherType) {
  switch (weather) {
    case 'clear':
      return <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />;
    case 'mist':
      return <CloudFog className="h-4 w-4 text-stone-300" aria-hidden="true" />;
    case 'rain':
      return <CloudRain className="h-4 w-4 text-sky-400" aria-hidden="true" />;
    case 'ash_storm':
      return <Wind className="h-4 w-4 text-orange-400" aria-hidden="true" />;
    case 'frost_wind':
      return <Snowflake className="h-4 w-4 text-cyan-300" aria-hidden="true" />;
    case 'void_eclipse':
      return <MoonStar className="h-4 w-4 text-rose-400" aria-hidden="true" />;
  }
}

interface GameTableProps {
  lang: Language;
  state: GameState;
  errorBanner: string | null;
  onRollMovement: () => void;
  onRerollMovementDice: () => void;
  onStepMove: (locationId: string) => void;
  onStopMovementEarly: () => void;
  onMove: (locationId: string) => void;
  onExplore: () => void;
  onRollEncounterCheck: () => void;
  onRerollEncounterCheck: () => void;
  onRest: () => void;
  onDrawCard: () => void;
  onBuySupply: () => void;
  onUseAbility: () => void;
  onUpgradeStat: (stat: 'strength' | 'intellect') => void;
  onPlayCard: (cardId: string) => void;
  onStoreInventory: (cardId: string) => void;
  onDiscardHandCard: (cardId: string) => void;
  onDismissCompanion: (cardId: string) => void;
  onBuyMarketCard: (cardId: string) => void;
  onSellCard: (source: 'hand' | 'inventory', cardId: string) => void;
  onRefreshMarket: () => void;
  onHealAtSanctuary: () => void;
  onCleanseCurse: (curseCardId?: string) => void;
  onChallengeGateGuardian: () => void;
  onChallengeSeal: () => void;
  onAttemptTrial: () => void;
  onChallengeCitadel: () => void;
  onChallengeVoidLord: () => void;
  onCombatAttack: () => void;
  onCombatDefend: () => void;
  onCombatFlee: () => void;
  onResolveEncounter: () => void;
  onEndTurn: () => void;
  onQuickSave: () => void;
}

const SEALS_ORDER: SealType[] = ['seal_power', 'seal_wisdom', 'seal_fate'];

const TURN_CYCLE_STEPS: Array<{ step: TurnCycleStep; labelKey: Parameters<typeof t>[1] }> = [
  { step: 'turn_start', labelKey: 'stepTurnStart' },
  { step: 'apply_effects', labelKey: 'stepApplyEffects' },
  { step: 'dice_roll', labelKey: 'stepDiceRoll' },
  { step: 'movement', labelKey: 'stepMovement' },
  { step: 'destination_activation', labelKey: 'stepDestination' },
  { step: 'encounter', labelKey: 'stepEncounter' },
  { step: 'turn_end', labelKey: 'stepTurnEnd' },
  { step: 'turn_handoff', labelKey: 'stepTurnHandoff' },
];

export const GameTable: React.FC<GameTableProps> = ({
  lang,
  state,
  errorBanner,
  onRollMovement,
  onRerollMovementDice,
  onStepMove,
  onStopMovementEarly,
  onMove,
  onExplore,
  onRollEncounterCheck,
  onRerollEncounterCheck,
  onRest,
  onDrawCard,
  onBuySupply,
  onUseAbility,
  onUpgradeStat,
  onPlayCard,
  onStoreInventory,
  onDiscardHandCard,
  onDismissCompanion,
  onBuyMarketCard,
  onSellCard,
  onRefreshMarket,
  onHealAtSanctuary,
  onCleanseCurse,
  onChallengeGateGuardian,
  onChallengeSeal,
  onAttemptTrial,
  onChallengeCitadel,
  onChallengeVoidLord,
  onCombatAttack,
  onCombatDefend,
  onCombatFlee,
  onResolveEncounter,
  onEndTurn,
  onQuickSave,
}) => {
  const activePlayer = getActivePlayer(state);
  const hero = HERO_MAP.get(activePlayer.heroId)!;
  const effStats = getPlayerEffectiveStats(activePlayer);
  const currentLocation = LOCATION_MAP.get(activePlayer.locationId)!;
  const currentRegion = REGION_MAP.get(currentLocation.regionId)!;
  const worldEvent = state.activeWorldEventId
    ? WORLD_EVENT_MAP.get(state.activeWorldEventId)
    : null;
  const activeEnemy = state.combat ? ENEMY_MAP.get(state.combat.enemyId) : null;
  const combatEnemyCard = state.combat?.enemyCardId ? CARD_MAP.get(state.combat.enemyCardId) : null;
  const combatEnemyName = state.combat?.enemyNameOverride ?? activeEnemy?.name ?? null;
  const combatEnemyTrait = state.combat?.enemyTraitOverride ?? activeEnemy?.specialTrait ?? null;
  const combatEnemyDesc = combatEnemyCard?.description ?? activeEnemy?.description ?? null;
  const combatEnemyAttack = state.combat?.enemyAttackOverride ?? activeEnemy?.attack ?? 0;
  const combatEnemyDefense = state.combat?.enemyDefenseOverride ?? activeEnemy?.defense ?? 0;
  const companions = activePlayer.companions ?? [];
  const curses = activePlayer.curses ?? [];
  const marketCards = (state.marketCardIds ?? [])
    .map((id) => CARD_MAP.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const isAtMarketSettlement =
    state.turnPhase === 'ACTION' &&
    (currentLocation.terrain === 'village' || currentLocation.terrain === 'sanctuary');
  const isAtCleanseSite =
    state.turnPhase === 'ACTION' &&
    (currentLocation.terrain === 'village' ||
      currentLocation.terrain === 'sanctuary' ||
      currentLocation.terrain === 'shrine');

  const neighborStatuses = NavigationGraph.getNeighborStatuses(activePlayer, currentLocation.id);

  const canChallengeGateGuardian =
    state.turnPhase === 'ACTION' &&
    Boolean(currentLocation.isGateGuardianLair) &&
    !activePlayer.gateGuardianDefeated;

  const canChallengeSeal =
    state.turnPhase === 'ACTION' &&
    Boolean(currentLocation.sealGuardianId && currentLocation.sealReward) &&
    !activePlayer.seals.includes(currentLocation.sealReward!);

  const canAttemptTrial =
    state.turnPhase === 'ACTION' &&
    activePlayer.seals.length === 3 &&
    activePlayer.finalTrialsPassed < 3 &&
    (currentLocation.regionId === 'reg_abyssal_citadel' || currentLocation.terrain === 'shrine');

  const citadelEnemyId =
    currentLocation.id === 'loc_80'
      ? 'enemy_citadel_sentinel'
      : currentLocation.id === 'loc_81'
        ? 'enemy_citadel_inquisitor'
        : null;

  const canChallengeCitadel =
    state.turnPhase === 'ACTION' &&
    Boolean(citadelEnemyId) &&
    activePlayer.seals.length === 3 &&
    activePlayer.finalTrialsPassed >= 3 &&
    activePlayer.citadelGuardiansDefeated < 2 &&
    !(activePlayer.defeatedCitadelGuardianIds ?? []).includes(citadelEnemyId!);

  const canChallengeVoidLord =
    state.turnPhase === 'ACTION' &&
    Boolean(currentLocation.isFinalBossLair) &&
    activePlayer.seals.length === 3 &&
    activePlayer.finalTrialsPassed >= 3 &&
    activePlayer.citadelGuardiansDefeated >= 2;

  const canBuySupply =
    state.turnPhase === 'ACTION' &&
    (currentLocation.terrain === 'village' || currentLocation.terrain === 'sanctuary');

  const isObjectiveNode = Boolean(
    currentLocation.isGateGuardianLair ||
      currentLocation.sealGuardianId ||
      currentLocation.isFinalBossLair ||
      currentLocation.id === 'loc_80' ||
      currentLocation.id === 'loc_81'
  );
  const canStopMovementEarly = Boolean(hero.canTriggerMidwayEvents || isObjectiveNode);

  const isNightWindow = state.timeOfDay === 'night' || state.timeOfDay === 'dusk';
  const activeTimeEffect = isNightWindow ? currentLocation.nightEffect : currentLocation.dayEffect;
  const activeWeatherEffect = currentLocation.weatherModifiers[state.weather];

  const hpPct =
    activePlayer.maxHp > 0
      ? Math.max(0, Math.min(100, Math.round((activePlayer.hp / activePlayer.maxHp) * 100)))
      : 0;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
      {/* Workspace World Toolbar with Day/Night & Weather Indicator */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg ornate-frame bg-[#15181f] px-4 py-3 text-xs text-stone-300">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 tabular-nums">
          <span className="font-semibold text-stone-100">
            {t(lang, 'roundLabel')} {state.round}
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-100">
            {renderTimeIcon(state.timeOfDay)}
            {formatTimeOfDay(lang, state.timeOfDay)}
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-100">
            {renderWeatherIcon(state.weather)}
            {formatWeather(lang, state.weather)}
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            {t(lang, 'deckRemaining')}: {state.deck.length}/{state.discardPile.length}
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            {t(lang, 'adventureDeckLabel')}: {state.adventureDeck?.length ?? 0}/
            {state.adventureDiscardPile?.length ?? 0}
          </span>
          {state.lastDiceRoll !== null && (
            <>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="font-mono font-semibold text-amber-300">
                {t(lang, 'lastRoll')}: {state.lastDiceRoll}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {worldEvent && (
            <span className="text-amber-300/90">
              {t(lang, 'activeEventLabel')}: {pickText(lang, worldEvent.name)} (
              {pickText(lang, worldEvent.effectSummary)})
            </span>
          )}
          <button
            type="button"
            onClick={onQuickSave}
            className="rounded border border-stone-700 bg-stone-900 px-3.5 py-2 text-xs font-semibold text-stone-200 hover:border-amber-500/60 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
          >
            {t(lang, 'saveNow')}
          </button>
        </div>
      </div>

      {errorBanner && (
        <div
          role="alert"
          className="mb-4 rounded border border-amber-700/70 bg-amber-950/50 px-4 py-2.5 text-xs font-medium text-amber-200"
        >
          {errorBanner}
        </div>
      )}

      {/* 8-Step Turn Cycle Stepper & Clear Player Guidance */}
      <section
        aria-label={t(lang, 'turnCycleTitle')}
        className="mb-5 rounded-lg border border-stone-800 bg-[#14171d] px-4 py-3 space-y-2.5"
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
          {TURN_CYCLE_STEPS.map((item, idx) => {
            const currentStep = state.turnCycleStep ?? 'dice_roll';
            const activeIdx = TURN_CYCLE_STEPS.findIndex((s) => s.step === currentStep);
            const isCurrent = item.step === currentStep;
            const isPast = activeIdx > idx;
            return (
              <div
                key={item.step}
                className={`rounded border px-2 py-1.5 text-[11px] font-medium truncate transition-colors ${
                  isCurrent
                    ? 'border-amber-500/80 bg-amber-950/50 text-amber-200 font-semibold'
                    : isPast
                      ? 'border-emerald-800/50 bg-[#121a17] text-emerald-300/80'
                      : 'border-stone-800/80 bg-[#111419] text-stone-400'
                }`}
              >
                {t(lang, item.labelKey)}
              </div>
            );
          })}
        </div>
        {state.turnGuidance && (
          <p className="text-xs text-stone-200">{pickText(lang, state.turnGuidance)}</p>
        )}
      </section>

      {/* 3-Column Tabletop Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[275px_1fr] xl:grid-cols-[290px_1fr_320px]">
        {/* Left Column: Active Hero, Three Seals, Party */}
        <aside className="space-y-5">
          <section className="rounded-lg ornate-frame bg-[#15181f] p-4 space-y-4">
            <div className="flex items-start gap-3 border-b border-stone-800 pb-3">
              <HeroAvatar
                src={hero.portraitPath}
                alt={pickText(lang, hero.name)}
                className="h-16 w-16 shrink-0 rounded-md border border-amber-600/50 object-cover"
                fallbackLabel={pickText(lang, hero.className)}
              />
              <div className="min-w-0">
                <div className="text-xs text-amber-400 font-medium truncate">
                  {t(lang, 'turnOf')} {activePlayer.name}
                  {activePlayer.isAI ? ` (${t(lang, 'aiLabel')})` : ''}
                </div>
                <h2 className="font-display text-xl font-bold text-stone-100 leading-tight mt-0.5 truncate">
                  {pickText(lang, hero.name)}
                </h2>
                <p className="text-xs text-stone-400 truncate">
                  {pickText(lang, hero.className)} · {pickText(lang, hero.title)}
                </p>
              </div>
            </div>

            {/* HP Meter */}
            <div className="space-y-1.5" title={t(lang, 'hpLabel')} aria-label={t(lang, 'hpLabel')}>
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="inline-flex items-center gap-1.5 text-stone-300">
                  <Heart className="h-4 w-4 text-rose-400" aria-hidden="true" />
                </span>
                <span className="font-semibold text-stone-100">
                  {activePlayer.hp} / {activePlayer.maxHp}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-sm bg-stone-900">
                <div
                  className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                  style={{ transform: `scaleX(${hpPct / 100})` }}
                />
              </div>
            </div>

            {/* Core Stats Icons */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
              <div
                title={`${t(lang, 'strengthLabel')} (${effStats.strength}/${HERO_STAT_LIMITS.maxStrength})`}
                aria-label={`${t(lang, 'strengthLabel')}: ${effStats.strength}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <Sword className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <div className="text-sm font-semibold text-stone-100">
                  {effStats.strength}
                  {activePlayer.tempAttackBonus > 0 ? `+${activePlayer.tempAttackBonus}` : ''}
                </div>
              </div>
              <div
                title={`${t(lang, 'intellectLabel')} (${effStats.intellect}/${HERO_STAT_LIMITS.maxIntellect})`}
                aria-label={`${t(lang, 'intellectLabel')}: ${effStats.intellect}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <BookOpen className="h-4 w-4 text-sky-400" aria-hidden="true" />
                <div className="text-sm font-semibold text-stone-100">{effStats.intellect}</div>
              </div>
              <div
                title={`${t(lang, 'fateLabel')} (${effStats.fate}/${HERO_STAT_LIMITS.maxFate})`}
                aria-label={`${t(lang, 'fateLabel')}: ${effStats.fate}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <Compass className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <div className="text-sm font-semibold text-stone-100">{effStats.fate}</div>
              </div>
              <div
                title={t(lang, 'armorLabel')}
                aria-label={`${t(lang, 'armorLabel')}: ${effStats.armor}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <Shield className="h-4 w-4 text-stone-300" aria-hidden="true" />
                <div className="text-sm font-semibold text-stone-100">
                  {effStats.armor}
                  {activePlayer.tempDefenseBonus > 0 ? `+${activePlayer.tempDefenseBonus}` : ''}
                </div>
              </div>
              <div
                title={t(lang, 'goldLabel')}
                aria-label={`${t(lang, 'goldLabel')}: ${activePlayer.gold}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
                <div className="text-sm font-semibold text-amber-300">{activePlayer.gold}</div>
              </div>
              <div
                title={t(lang, 'experienceLabel')}
                aria-label={`${t(lang, 'experienceLabel')}: ${activePlayer.experience}`}
                className="flex flex-col items-center justify-center gap-1 rounded border border-stone-800/80 bg-[#12151b] px-2 py-2"
              >
                <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
                <div className="text-sm font-semibold text-violet-200">{activePlayer.experience}</div>
              </div>
            </div>

            {/* XP Upgrade Controls (3 XP -> +1 Strength or +1 Intellect up to 12) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={
                  activePlayer.isAI ||
                  activePlayer.experience < HERO_STAT_LIMITS.xpPerStatUpgrade ||
                  activePlayer.strength >= HERO_STAT_LIMITS.maxStrength
                }
                onClick={() => onUpgradeStat('strength')}
                className="rounded border border-stone-700 bg-stone-900 px-2 py-2 text-[11px] font-semibold text-amber-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[38px]"
              >
                {t(lang, 'upgradeStrengthAction')}
              </button>
              <button
                type="button"
                disabled={
                  activePlayer.isAI ||
                  activePlayer.experience < HERO_STAT_LIMITS.xpPerStatUpgrade ||
                  activePlayer.intellect >= HERO_STAT_LIMITS.maxIntellect
                }
                onClick={() => onUpgradeStat('intellect')}
                className="rounded border border-stone-700 bg-stone-900 px-2 py-2 text-[11px] font-semibold text-sky-200 hover:border-sky-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[38px]"
              >
                {t(lang, 'upgradeIntellectAction')}
              </button>
            </div>

            {/* Actions Remaining & Hero Ability */}
            <div className="border-t border-stone-800 pt-3 space-y-2.5">
              <div
                className="flex items-center justify-between text-xs font-mono tabular-nums"
                title={t(lang, 'actionsLabel')}
                aria-label={`${t(lang, 'actionsLabel')}: ${activePlayer.actionsRemaining}`}
              >
                <span className="inline-flex items-center gap-1.5 text-stone-300">
                  <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
                </span>
                <span className="font-bold text-amber-300">{activePlayer.actionsRemaining}</span>
              </div>
              <button
                type="button"
                disabled={activePlayer.isAI || activePlayer.abilityUsedThisTurn}
                onClick={onUseAbility}
                className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2.5 text-left text-xs transition-colors hover:border-amber-500/60 disabled:opacity-45 disabled:cursor-not-allowed min-h-[44px]"
              >
                <div className="font-semibold text-amber-300">
                  {t(lang, 'useAbilityAction')}: {pickText(lang, hero.abilityName)}
                </div>
                <div className="text-stone-400 mt-0.5">
                  {pickText(lang, hero.abilityDescription)}
                </div>
              </button>
            </div>
          </section>

          {/* Active Companions (0/3) & Curses */}
          <section className="rounded-lg border border-stone-800 bg-[#171b22] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="font-display text-base font-bold text-stone-100">
                {t(lang, 'companionsTitle')}
              </h3>
              <span className="font-mono tabular-nums text-xs text-stone-400">
                {companions.length}/{HERO_INVENTORY_LIMITS.maxCompanions}
              </span>
            </div>
            {companions.length === 0 ? (
              <p className="text-xs text-stone-400">{t(lang, 'noCompanions')}</p>
            ) : (
              <div className="space-y-2">
                {companions.map((cid, idx) => {
                  const comp = CARD_MAP.get(cid);
                  if (!comp) return null;
                  return (
                    <div
                      key={`${cid}_${idx}`}
                      className="rounded border border-stone-800 bg-[#12151b] p-2.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-emerald-300 leading-snug">
                          {pickText(lang, comp.name)}
                        </div>
                        {!activePlayer.isAI && (
                          <button
                            type="button"
                            onClick={() => onDismissCompanion(comp.id)}
                            className="rounded border border-stone-700 bg-stone-900 px-2 py-1 text-[11px] font-medium text-stone-300 hover:border-rose-600/60 hover:text-rose-200 shrink-0 min-h-[32px]"
                          >
                            {t(lang, 'dismissCompanionAction')}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        {pickText(lang, comp.description)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-stone-800 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-bold text-stone-100">
                  {t(lang, 'cursesTitle')}
                </h4>
                <span className="font-mono tabular-nums text-xs text-rose-300">
                  {curses.length}
                </span>
              </div>
              {curses.length === 0 ? (
                <p className="text-xs text-stone-400">{t(lang, 'noCurses')}</p>
              ) : (
                <div className="space-y-2">
                  {curses.map((cid, idx) => {
                    const curse = CARD_MAP.get(cid);
                    if (!curse) return null;
                    return (
                      <div
                        key={`${cid}_${idx}`}
                        className="rounded border border-rose-900/60 bg-[#181216] p-2.5 text-xs space-y-1"
                      >
                        <div className="font-semibold text-rose-300">
                          {pickText(lang, curse.name)}
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          {pickText(lang, curse.description)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Three Seals & Citadel Progress */}
          <section className="rounded-lg ornate-frame bg-[#15181f] p-4 space-y-3">
            <h3 className="font-display text-lg font-bold text-stone-100">
              {t(lang, 'sealsTitle')}
            </h3>
            <div className="space-y-2 text-xs">
              {SEALS_ORDER.map((seal) => {
                const owned = activePlayer.seals.includes(seal);
                return (
                  <div
                    key={seal}
                    className={`flex items-center justify-between rounded border px-3 py-2 ${
                      owned
                        ? 'border-amber-600/60 bg-amber-950/30 text-amber-200'
                        : 'border-stone-800 bg-[#12151b] text-stone-400'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <SealSigil seal={seal} active={owned} />
                      {formatSealName(lang, seal)}
                    </span>
                    <span className="font-mono font-semibold">{owned ? '✓' : '—'}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-stone-800 pt-3 space-y-1.5 text-xs font-mono tabular-nums text-stone-300">
              <div className="flex justify-between">
                <span className="text-stone-400">{t(lang, 'gateDefeatedLabel')}</span>
                <span>{activePlayer.gateGuardianDefeated ? '✓' : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">{t(lang, 'trialsPassed')}</span>
                <span>{activePlayer.finalTrialsPassed} / 3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">{t(lang, 'guardiansDefeated')}</span>
                <span>{activePlayer.citadelGuardiansDefeated} / 2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">{t(lang, 'voidLordStatus')}</span>
                <span>
                  {activePlayer.voidLordDefeated
                    ? t(lang, 'defeatedLabel')
                    : t(lang, 'undefeatedLabel')}
                </span>
              </div>
            </div>
          </section>

          {/* Party & Rivals */}
          <section className="rounded-lg border border-stone-800 bg-[#171b22] p-4 space-y-2.5">
            <h3 className="font-display text-lg font-bold text-stone-100">
              {t(lang, 'partyTitle')}
            </h3>
            <div className="space-y-2">
              {state.players.map((p, idx) => {
                const loc = LOCATION_MAP.get(p.locationId);
                const pHero = HERO_MAP.get(p.heroId);
                const isTurn = idx === state.activePlayerIndex;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2.5 rounded border px-3 py-2 text-xs ${
                      isTurn
                        ? 'border-amber-500/60 bg-amber-950/20'
                        : 'border-stone-800 bg-[#12151b]'
                    }`}
                  >
                    {pHero && (
                      <HeroAvatar
                        src={pHero.portraitPath}
                        alt={p.name}
                        className="h-9 w-9 shrink-0 rounded border border-stone-700 object-cover"
                        fallbackLabel={pickText(lang, pHero.className)}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between font-semibold text-stone-200">
                        <span className="truncate">
                          {p.name} {p.isAI ? `(${t(lang, 'aiLabel')})` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-stone-300 shrink-0 ml-1">
                          <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                          {p.hp}/{p.maxHp}
                        </span>
                      </div>
                      <div className="mt-0.5 text-stone-400 truncate">
                        {loc ? pickText(lang, loc.name) : p.locationId} · {p.seals.length}/3
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Center Column: Location Card, Active Stage, Action Controls, Player Hand */}
        <section className="space-y-5">
          {/* Location Banner */}
          <div className="overflow-hidden rounded-lg border border-stone-800 bg-[#171b22]">
            <div className="relative h-40 sm:h-48 bg-stone-900">
              <img
                src={currentRegion.imagePath}
                alt={pickText(lang, currentRegion.name)}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 sm:left-6 sm:right-6">
                <div className="text-xs text-amber-300/90 tabular-nums">
                  {pickText(lang, currentRegion.name)} · {pickText(lang, currentLocation.sectorName)} ·{' '}
                  {currentLocation.id.toUpperCase()} · {t(lang, 'dangerLevel')}{' '}
                  {currentLocation.dangerLevel}/6
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
                  {pickText(lang, currentLocation.name)}
                </h1>
              </div>
            </div>
            <div className="p-4 sm:px-6 space-y-3">
              <p className="text-sm text-stone-300 leading-relaxed">
                {pickText(lang, currentLocation.description)}
              </p>
              <div className="grid grid-cols-1 gap-2 border-t border-stone-800 pt-3 text-xs text-stone-400 sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-stone-200">
                    {t(lang, 'accessConditionLabel')}:{' '}
                  </span>
                  <span>{pickText(lang, currentLocation.accessCondition.description)}</span>
                </div>
                <div>
                  <span className="font-semibold text-stone-200">
                    {isNightWindow ? t(lang, 'nightEffectLabel') : t(lang, 'dayEffectLabel')}:{' '}
                  </span>
                  <span>{pickText(lang, activeTimeEffect.description)}</span>
                </div>
                <div>
                  <span className="font-semibold text-stone-200">
                    {t(lang, 'weatherModLabel')}:{' '}
                  </span>
                  <span>{pickText(lang, activeWeatherEffect.description)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dice Roller & Roll History Panel */}
          <DiceRollerPanel
            lang={lang}
            state={state}
            onRerollMovementDice={onRerollMovementDice}
            onRerollEncounterCheck={onRerollEncounterCheck}
          />

          {/* Active Stage: AI Waiting / Combat / Encounter / Action Controls */}
          {activePlayer.isAI ? (
            <section className="rounded-lg border border-stone-800 bg-[#171b22] p-6 text-center">
              <p className="font-display text-xl text-amber-300">{t(lang, 'aiThinking')}</p>
            </section>
          ) : state.turnPhase === 'COMBAT' && state.combat && activeEnemy && combatEnemyName && combatEnemyTrait && combatEnemyDesc ? (
            <section className="rounded-lg border border-rose-800/70 bg-[#1a161b] p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800 pb-3">
                <div>
                  <p className="text-xs font-semibold text-rose-400">
                    {t(lang, 'roundLabel')} {state.combat.roundCount} ·{' '}
                    {pickText(lang, combatEnemyTrait)}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-stone-100">
                    {pickText(lang, combatEnemyName)}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {pickText(lang, combatEnemyDesc)}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums text-xs">
                  <div className="text-lg font-bold text-rose-300">
                    HP {state.combat.enemyCurrentHp} / {state.combat.enemyMaxHp}
                  </div>
                  <div className="text-stone-400">
                    ATK {combatEnemyAttack} · DEF {combatEnemyDefense}
                  </div>
                </div>
              </div>

              {(state.combat.lastPlayerRoll !== null || state.combat.lastEnemyRoll !== null) && (
                <div className="flex flex-wrap gap-4 text-xs font-mono tabular-nums text-stone-300">
                  {state.combat.lastPlayerRoll !== null && (
                    <span>Hero d6: {state.combat.lastPlayerRoll}</span>
                  )}
                  {state.combat.lastEnemyRoll !== null && (
                    <span>Enemy d6: {state.combat.lastEnemyRoll}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onCombatAttack}
                  className="rounded bg-rose-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition-colors min-h-[44px]"
                >
                  {t(lang, 'attackAction')}
                </button>
                <button
                  type="button"
                  onClick={onCombatDefend}
                  className="rounded border border-stone-700 bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-100 hover:border-stone-500 transition-colors min-h-[44px]"
                >
                  {t(lang, 'defendAction')}
                </button>
                {state.combat.combatPurpose !== 'void_lord' && (
                  <button
                    type="button"
                    onClick={onCombatFlee}
                    className="rounded border border-stone-700 bg-stone-900 px-5 py-2.5 text-sm font-semibold text-stone-300 hover:border-amber-500/60 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'fleeAction')}
                  </button>
                )}
              </div>
            </section>
          ) : state.turnPhase === 'ENCOUNTER' && state.encounter ? (
            <section className="rounded-lg border border-amber-700/60 bg-[#171b22] p-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-amber-200">
                  {pickText(lang, state.encounter.title)}
                </h2>
                <p className="text-sm text-stone-300 mt-1">
                  {pickText(lang, state.encounter.description)}
                </p>
                <p className="mt-2 font-mono text-xs text-stone-400 tabular-nums">
                  {state.encounter.statCheck.toUpperCase()} (+{effStats[state.encounter.statCheck]}) + d6 ≥{' '}
                  {state.encounter.difficulty} · +{state.encounter.rewardGold}g
                </p>
              </div>

              {typeof state.encounter.rollResult === 'number' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 rounded border border-stone-800 bg-[#12151b] p-3">
                    <DiceDieSvg
                      value={state.encounter.rollResult}
                      animKey={`enc_${state.encounter.id}_${state.encounter.fateRerollUsed ? 'r' : 'i'}_${state.encounter.rollResult}`}
                    />
                    <div className="text-xs font-mono tabular-nums space-y-1">
                      <div className="text-sm font-bold text-amber-300">
                        d6 = {state.encounter.rollResult} + {effStats[state.encounter.statCheck]} ={' '}
                        {state.encounter.rollResult + effStats[state.encounter.statCheck]} (vs{' '}
                        {state.encounter.difficulty})
                      </div>
                      {state.encounter.fateRerollUsed && (
                        <div className="text-emerald-300">{t(lang, 'fateRerollLocked')}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {!state.encounter.fateRerollUsed && activePlayer.fate >= 1 && (
                      <button
                        type="button"
                        onClick={onRerollEncounterCheck}
                        className="rounded border border-emerald-500/70 bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-colors min-h-[44px]"
                      >
                        {t(lang, 'fateRerollAction')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onResolveEncounter}
                      className="rounded bg-amber-600 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-500 transition-colors min-h-[44px]"
                    >
                      {t(lang, 'confirmCheckAction')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={onRollEncounterCheck}
                    className="inline-flex items-center gap-2 rounded bg-amber-600 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-500 transition-colors min-h-[44px]"
                  >
                    <Dices className="h-4 w-4" aria-hidden="true" />
                    {t(lang, 'rollCheckDiceAction')}
                  </button>
                </div>
              )}
            </section>
          ) : state.turnPhase === 'MOVING' && state.movement ? (
            <section className="rounded-lg border border-amber-600/70 bg-[#171b22] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Dices className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-xl font-bold text-amber-200">
                      {t(lang, 'chooseBranch')}
                    </h2>
                    <p className="text-xs text-stone-400 font-mono tabular-nums">
                      {t(lang, 'stepsRemainingLabel')}:{' '}
                      <strong className="text-amber-300">{state.movement.stepsRemaining}</strong> /{' '}
                      {state.movement.totalRoll} ·{' '}
                      {state.movement.pathTaken
                        .map((id) => LOCATION_MAP.get(id)?.index ?? id)
                        .join(' → ')}
                    </p>
                  </div>
                </div>

                {canStopMovementEarly && (
                  <button
                    type="button"
                    onClick={onStopMovementEarly}
                    className="rounded border border-amber-500/70 bg-amber-950/50 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'stopAtLocation')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {neighborStatuses.map(({ location: neighbor, allowed, reason }) => (
                  <button
                    key={neighbor.id}
                    type="button"
                    disabled={!allowed}
                    onClick={() => onStepMove(neighbor.id)}
                    title={!allowed && reason ? pickText(lang, reason) : undefined}
                    className={`flex items-center justify-between gap-2 rounded border px-3.5 py-2.5 text-left text-xs transition-colors min-h-[44px] ${
                      allowed
                        ? 'border-emerald-700/70 bg-[#121917] hover:border-amber-500/80 text-stone-100'
                        : 'border-rose-900/60 bg-[#191215] text-stone-500 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {neighbor.index}. {pickText(lang, neighbor.name)}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        {allowed
                          ? pickText(lang, neighbor.sectorName)
                          : reason
                            ? pickText(lang, reason)
                            : t(lang, 'lockedRoute')}
                      </div>
                    </div>
                    <span className="font-mono tabular-nums shrink-0 inline-flex items-center gap-1">
                      {!allowed ? (
                        <Lock className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                      ) : neighbor.sealReward ? (
                        '★'
                      ) : neighbor.isGateGuardianLair ||
                        neighbor.isFinalBossLair ||
                        neighbor.id === 'loc_80' ||
                        neighbor.id === 'loc_81' ? (
                        '⚔'
                      ) : (
                        `D${neighbor.dangerLevel}`
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-5">
              {/* Primary Action Controls */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={activePlayer.actionsRemaining <= 0}
                  onClick={onRollMovement}
                  className="inline-flex items-center gap-1.5 rounded bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  <Dices className="h-4 w-4" aria-hidden="true" />
                  {t(lang, 'rollMoveAction')}
                </button>
                <button
                  type="button"
                  disabled={activePlayer.actionsRemaining <= 0}
                  onClick={onExplore}
                  className="rounded bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {t(lang, 'exploreAction')}
                </button>
                <button
                  type="button"
                  disabled={activePlayer.actionsRemaining <= 0}
                  onClick={onRest}
                  className="rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-200 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {t(lang, 'restAction')}
                </button>
                <button
                  type="button"
                  disabled={activePlayer.actionsRemaining <= 0 || activePlayer.hand.length >= 7}
                  onClick={onDrawCard}
                  className="rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-200 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {t(lang, 'drawCardAction')}
                </button>
                {canBuySupply && (
                  <button
                    type="button"
                    disabled={activePlayer.gold < 15 || activePlayer.hand.length >= 7}
                    onClick={onBuySupply}
                    className="rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-semibold text-amber-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {t(lang, 'buyGearAction')}
                  </button>
                )}
                {canChallengeGateGuardian && (
                  <button
                    type="button"
                    onClick={onChallengeGateGuardian}
                    className="rounded bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'challengeGateGuardian')}
                  </button>
                )}
                {canChallengeSeal && (
                  <button
                    type="button"
                    onClick={onChallengeSeal}
                    className="rounded bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'challengeSealAction')}
                  </button>
                )}
                {canAttemptTrial && (
                  <button
                    type="button"
                    disabled={activePlayer.actionsRemaining <= 0}
                    onClick={onAttemptTrial}
                    className="rounded bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'finalTrialAction')}
                  </button>
                )}
                {canChallengeCitadel && (
                  <button
                    type="button"
                    onClick={onChallengeCitadel}
                    className="rounded bg-rose-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'challengeCitadelAction')}
                  </button>
                )}
                {canChallengeVoidLord && (
                  <button
                    type="button"
                    onClick={onChallengeVoidLord}
                    className="rounded bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'challengeVoidLordAction')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onEndTurn}
                  className="sm:ml-auto rounded border border-amber-500/60 bg-amber-950/40 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[44px]"
                >
                  {t(lang, 'endTurn')}
                </button>
              </div>

              {/* Connected Neighbors Movement */}
              <div className="border-t border-stone-800 pt-4">
                <h3 className="text-xs font-semibold text-stone-400 mb-2.5">
                  {t(lang, 'connectedLocations')} ({neighborStatuses.length})
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {neighborStatuses.map(({ location: neighbor, allowed, reason }) => (
                    <button
                      key={neighbor.id}
                      type="button"
                      disabled={activePlayer.actionsRemaining <= 0 || !allowed}
                      onClick={() => onMove(neighbor.id)}
                      title={!allowed && reason ? pickText(lang, reason) : undefined}
                      className={`flex items-center justify-between gap-2 rounded border px-3.5 py-2.5 text-left text-xs transition-colors min-h-[44px] ${
                        allowed
                          ? 'border-stone-800 bg-[#12151b] hover:border-amber-500/60 disabled:opacity-45 disabled:cursor-not-allowed'
                          : 'border-rose-900/60 bg-[#181215] text-stone-500 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-stone-200 truncate">
                          {neighbor.index}. {pickText(lang, neighbor.name)}
                        </div>
                        {!allowed && reason && (
                          <div className="text-[11px] text-rose-300/90 truncate">
                            {pickText(lang, reason)}
                          </div>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-stone-400 shrink-0">
                        {!allowed ? (
                          <Lock className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                        ) : neighbor.sealReward ? (
                          '★'
                        ) : neighbor.isGateGuardianLair ||
                          neighbor.isFinalBossLair ||
                          neighbor.id === 'loc_80' ||
                          neighbor.id === 'loc_81' ? (
                          '⚔'
                        ) : (
                          `D${neighbor.dangerLevel}`
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Settlement Trade, Healing & Curse Purification */}
          {!activePlayer.isAI && isAtCleanseSite && (
            <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                <h3 className="font-display text-xl font-bold text-stone-100">
                  {t(lang, 'marketTitle')}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {isAtMarketSettlement && (
                    <>
                      <button
                        type="button"
                        disabled={activePlayer.gold < 8 || activePlayer.hp >= activePlayer.maxHp}
                        onClick={onHealAtSanctuary}
                        className="rounded border border-emerald-700/70 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                      >
                        {t(lang, 'healServiceAction')}
                      </button>
                      <button
                        type="button"
                        disabled={activePlayer.gold < 5}
                        onClick={onRefreshMarket}
                        className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                      >
                        {t(lang, 'refreshMarketAction')}
                      </button>
                    </>
                  )}
                  {curses.length > 0 && (
                    <button
                      type="button"
                      disabled={activePlayer.gold < 12}
                      onClick={() => onCleanseCurse(curses[0])}
                      className="rounded border border-amber-600/70 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-200 hover:border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                    >
                      {t(lang, 'cleanseServiceAction')}
                    </button>
                  )}
                </div>
              </div>

              {isAtMarketSettlement && marketCards.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {marketCards.map((mCard) => {
                    const cost = Math.max(4, mCard.goldCost);
                    const noSpace =
                      mCard.category === 'companion'
                        ? companions.length >= HERO_INVENTORY_LIMITS.maxCompanions
                        : activePlayer.hand.length >= HERO_INVENTORY_LIMITS.maxHandSize &&
                          (mCard.category === 'spell' ||
                            activePlayer.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems);
                    return (
                      <CardTile
                        key={mCard.id}
                        lang={lang}
                        card={mCard}
                        priceGold={cost}
                        actions={[
                          {
                            label: `${t(lang, 'buyCard')} (${cost}g)`,
                            onClick: () => onBuyMarketCard(mCard.id),
                            disabled: activePlayer.gold < cost || noSpace,
                            tone: 'primary',
                          },
                        ]}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Player Hand of Cards */}
          <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-xl font-bold text-stone-100">
                {t(lang, 'handTitle')} ({activePlayer.hand.length}/{HERO_INVENTORY_LIMITS.maxHandSize})
              </h3>
              <span className="text-xs text-stone-400">
                {t(lang, 'inventoryLimitsNote')}
              </span>
            </div>

            {activePlayer.hand.length === 0 ? (
              <p className="text-xs text-stone-400">{t(lang, 'emptyHand')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {activePlayer.hand.map((cardId, idx) => {
                  const card = CARD_MAP.get(cardId);
                  if (!card) return null;
                  const playableNow = !card.combatOnly || state.turnPhase === 'COMBAT';
                  const sellPrice = Math.max(2, Math.floor(card.goldCost * 0.5));
                  const canStore = card.category !== 'spell' && card.category !== 'companion';

                  const primaryLabel = card.equipSlot
                    ? t(lang, 'equipCard')
                    : card.category === 'companion'
                      ? t(lang, 'recruitAction')
                      : t(lang, 'useItemAction');

                  const primaryDisabled =
                    activePlayer.isAI ||
                    !playableNow ||
                    (card.category === 'companion' &&
                      companions.length >= HERO_INVENTORY_LIMITS.maxCompanions);

                  const cardActions: CardTileAction[] = [
                    {
                      label: primaryLabel,
                      onClick: () => onPlayCard(card.id),
                      disabled: primaryDisabled,
                      tone: 'primary',
                    },
                  ];

                  if (canStore) {
                    cardActions.push({
                      label: `${lang === 'uk' ? 'У сумку' : 'Store'} (${activePlayer.inventory.length}/${HERO_INVENTORY_LIMITS.maxOtherItems})`,
                      onClick: () => onStoreInventory(card.id),
                      disabled:
                        activePlayer.isAI ||
                        activePlayer.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems,
                      tone: 'secondary',
                    });
                  }

                  if (isAtMarketSettlement && !activePlayer.isAI) {
                    cardActions.push({
                      label: `${t(lang, 'sellCard')} (+${sellPrice}g)`,
                      onClick: () => onSellCard('hand', card.id),
                      tone: 'secondary',
                    });
                  }

                  if (!activePlayer.isAI) {
                    cardActions.push({
                      label: t(lang, 'discardAction'),
                      onClick: () => onDiscardHandCard(card.id),
                      tone: 'danger',
                    });
                  }

                  return (
                    <CardTile
                      key={`${card.id}_${idx}`}
                      lang={lang}
                      card={card}
                      dimmed={!playableNow}
                      actions={cardActions}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </section>

        {/* Right Column: Aged Parchment Chronicle Log */}
        <aside className="parchment-panel rounded-lg p-5 flex flex-col max-h-[760px] lg:col-span-2 xl:col-span-1">
          <h3 className="font-display text-2xl font-bold text-[#241b11]">
            {t(lang, 'chronicleTitle')}
          </h3>
          <OrnamentalDivider darkInk />
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {state.chronicle.map((entry) => (
              <div
                key={entry.id}
                className="border-b border-[#9d7f4e]/35 pb-2 text-xs leading-relaxed"
              >
                <div className="font-mono text-[11px] text-[#6d5637] tabular-nums">
                  {t(lang, 'roundLabel')} {entry.round} · {formatTimeOfDay(lang, entry.timeOfDay)}
                </div>
                <div
                  className={
                    entry.type === 'seal'
                      ? 'text-[#7c2d12] font-semibold'
                      : entry.type === 'combat'
                        ? 'text-[#7f1d1d] font-medium'
                        : 'text-[#241b11]'
                  }
                >
                  {pickText(lang, entry.text)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
};
