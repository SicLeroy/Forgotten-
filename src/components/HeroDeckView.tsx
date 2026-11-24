import React, { useMemo, useState } from 'react';
import { BookOpen, Coins, Compass, Heart, Shield, Sparkles, Sword } from 'lucide-react';
import { CARD_CATEGORY_COUNTS, CARD_MAP, CARDS } from '../data/cards';
import { HEROES, HERO_MAP } from '../data/heroes';
import { LOCATION_MAP } from '../data/locations';
import { getActivePlayer, getPlayerEffectiveStats } from '../engine/RulesEngine';
import {
  formatCardCategory,
  formatEquipSlot,
  pickText,
  t,
} from '../i18n/translations';
import {
  CardCategory,
  EquipSlot,
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  Language,
} from '../types/game';
import { CardTile, CardTileAction } from './CardTile';
import { HeroAvatar } from './HeroAvatar';

interface HeroDeckViewProps {
  lang: Language;
  state: GameState | null;
  onEquipFromInventory: (cardId: string) => void;
  onUnequipSlot: (slot: EquipSlot) => void;
  onUseInventoryItem?: (cardId: string) => void;
  onDiscardInventoryCard?: (cardId: string) => void;
  onDismissCompanion?: (cardId: string) => void;
  onSellCard?: (source: 'hand' | 'inventory', cardId: string) => void;
  onCleanseCurse?: (curseCardId?: string) => void;
  onUpgradeStat?: (stat: 'strength' | 'intellect') => void;
}

const SLOTS: EquipSlot[] = ['weapon', 'armor'];
const CATEGORIES: Array<CardCategory | 'all'> = [
  'all',
  'adventure',
  'enemy',
  'item',
  'weapon',
  'armor',
  'spell',
  'companion',
  'event',
  'curse',
  'legendary_artifact',
];

export const HeroDeckView: React.FC<HeroDeckViewProps> = ({
  lang,
  state,
  onEquipFromInventory,
  onUnequipSlot,
  onUseInventoryItem,
  onDiscardInventoryCard,
  onDismissCompanion,
  onSellCard,
  onCleanseCurse,
  onUpgradeStat,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all');

  const activePlayer = state ? getActivePlayer(state) : null;
  const hero = activePlayer ? HERO_MAP.get(activePlayer.heroId) : null;
  const effStats = activePlayer ? getPlayerEffectiveStats(activePlayer) : null;
  const currentLoc = activePlayer ? LOCATION_MAP.get(activePlayer.locationId) : null;
  const canTradeHere = Boolean(
    state &&
      state.turnPhase === 'ACTION' &&
      currentLoc &&
      (currentLoc.terrain === 'village' || currentLoc.terrain === 'sanctuary')
  );
  const canCleanseHere = Boolean(
    state &&
      state.turnPhase === 'ACTION' &&
      currentLoc &&
      (currentLoc.terrain === 'village' ||
        currentLoc.terrain === 'sanctuary' ||
        currentLoc.terrain === 'shrine')
  );

  const visibleSlots: EquipSlot[] =
    activePlayer && activePlayer.equipment.talisman ? [...SLOTS, 'talisman'] : SLOTS;

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CARDS.filter((card) => {
      if (categoryFilter !== 'all' && card.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        card.name.uk.toLowerCase().includes(q) ||
        card.name.en.toLowerCase().includes(q) ||
        card.description.uk.toLowerCase().includes(q) ||
        card.description.en.toLowerCase().includes(q) ||
        card.id.toLowerCase().includes(q)
      );
    });
  }, [search, categoryFilter]);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 space-y-8">
      {activePlayer && hero && effStats && (
        <>
          {/* Active Hero Dossier & Progression */}
          <section className="rounded-lg ornate-frame bg-[#15181f] p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              <div className="lg:col-span-5 flex items-start gap-4">
                <HeroAvatar
                  src={hero.portraitPath}
                  alt={pickText(lang, hero.name)}
                  className="h-28 w-28 shrink-0 rounded-md border border-amber-600/50 object-cover"
                  fallbackLabel={pickText(lang, hero.className)}
                />
                <div className="space-y-1.5 min-w-0">
                  <div className="text-xs font-semibold text-amber-400">
                    {pickText(lang, hero.className)} · {activePlayer.name}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-stone-100 leading-tight">
                    {pickText(lang, hero.name)}
                  </h2>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {pickText(lang, hero.description)}
                  </p>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {pickText(lang, hero.lore)}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 text-xs font-mono tabular-nums">
                  <div
                    title={t(lang, 'hpLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Heart className="h-4 w-4 text-rose-400" aria-hidden="true" />
                    <span className="font-semibold text-stone-100">
                      {activePlayer.hp}/{activePlayer.maxHp}
                    </span>
                  </div>
                  <div
                    title={t(lang, 'strengthLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Sword className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    <span className="font-semibold text-stone-100">
                      {effStats.strength}/{HERO_STAT_LIMITS.maxStrength}
                    </span>
                  </div>
                  <div
                    title={t(lang, 'intellectLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <BookOpen className="h-4 w-4 text-sky-400" aria-hidden="true" />
                    <span className="font-semibold text-stone-100">
                      {effStats.intellect}/{HERO_STAT_LIMITS.maxIntellect}
                    </span>
                  </div>
                  <div
                    title={t(lang, 'fateLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Compass className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    <span className="font-semibold text-stone-100">
                      {effStats.fate}/{HERO_STAT_LIMITS.maxFate}
                    </span>
                  </div>
                  <div
                    title={t(lang, 'armorLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Shield className="h-4 w-4 text-stone-300" aria-hidden="true" />
                    <span className="font-semibold text-stone-100">{effStats.armor}</span>
                  </div>
                  <div
                    title={t(lang, 'goldLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
                    <span className="font-semibold text-amber-300">{activePlayer.gold}</span>
                  </div>
                  <div
                    title={t(lang, 'experienceLabel')}
                    className="flex flex-col items-center gap-1 rounded border border-stone-800 bg-[#12151b] p-2.5"
                  >
                    <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
                    <span className="font-semibold text-violet-200">{activePlayer.experience}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-800 bg-[#12151b] p-3 text-xs">
                  <div>
                    <span className="font-semibold text-amber-300">
                      {pickText(lang, hero.abilityName)}:
                    </span>{' '}
                    <span className="text-stone-300">{pickText(lang, hero.abilityDescription)}</span>
                  </div>

                  {onUpgradeStat && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          activePlayer.isAI ||
                          activePlayer.experience < HERO_STAT_LIMITS.xpPerStatUpgrade ||
                          activePlayer.strength >= HERO_STAT_LIMITS.maxStrength
                        }
                        onClick={() => onUpgradeStat('strength')}
                        className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed min-h-[38px]"
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
                        className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-sky-200 hover:border-sky-500/60 disabled:opacity-40 disabled:cursor-not-allowed min-h-[38px]"
                      >
                        {t(lang, 'upgradeIntellectAction')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Equipment Slots (1 Weapon + 1 Armor) & Companions (up to 3) & Curses */}
            <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-5">
              <div className="border-b border-stone-800 pb-3">
                <h2 className="font-display text-2xl font-bold text-stone-100">
                  {t(lang, 'equipmentTitle')} — {activePlayer.name}
                </h2>
                <p className="text-xs text-stone-400">{t(lang, 'inventoryLimitsNote')}</p>
              </div>

              <div className="space-y-3">
                {visibleSlots.map((slot) => {
                  const cardId = activePlayer.equipment[slot];
                  const card = cardId ? CARD_MAP.get(cardId) : null;
                  return (
                    <div
                      key={slot}
                      className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-800 bg-[#12151b] p-3.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-stone-400">{formatEquipSlot(lang, slot)}</div>
                        {card ? (
                          <>
                            <div className="font-semibold text-sm text-amber-200 mt-0.5">
                              {pickText(lang, card.name)}
                            </div>
                            <div className="text-stone-400 mt-0.5">
                              {pickText(lang, card.description)}
                            </div>
                          </>
                        ) : (
                          <div className="text-stone-500 mt-0.5">{t(lang, 'emptySlot')}</div>
                        )}
                      </div>
                      {card && !activePlayer.isAI && (
                        <button
                          type="button"
                          disabled={
                            activePlayer.inventory.length >= HERO_INVENTORY_LIMITS.maxOtherItems
                          }
                          onClick={() => onUnequipSlot(slot)}
                          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-200 hover:border-amber-500/60 disabled:opacity-40 disabled:cursor-not-allowed min-h-[38px]"
                        >
                          {t(lang, 'unequipCard')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Companions (0/3) */}
              <div className="border-t border-stone-800 pt-4 space-y-2.5">
                <h3 className="font-display text-lg font-bold text-stone-100">
                  {t(lang, 'companionsTitle')} ({(activePlayer.companions ?? []).length}/
                  {HERO_INVENTORY_LIMITS.maxCompanions})
                </h3>
                {(activePlayer.companions ?? []).length === 0 ? (
                  <p className="text-xs text-stone-400">{t(lang, 'noCompanions')}</p>
                ) : (
                  <div className="space-y-2">
                    {(activePlayer.companions ?? []).map((cid, idx) => {
                      const comp = CARD_MAP.get(cid);
                      if (!comp) return null;
                      return (
                        <CardTile
                          key={`${cid}_${idx}`}
                          lang={lang}
                          card={comp}
                          showRulesDetail
                          actions={
                            !activePlayer.isAI && onDismissCompanion
                              ? [
                                  {
                                    label: t(lang, 'dismissCompanionAction'),
                                    onClick: () => onDismissCompanion(comp.id),
                                    tone: 'danger',
                                  },
                                ]
                              : []
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Curses */}
              <div className="border-t border-stone-800 pt-4 space-y-2.5">
                <h3 className="font-display text-lg font-bold text-stone-100">
                  {t(lang, 'cursesTitle')} ({(activePlayer.curses ?? []).length})
                </h3>
                {(activePlayer.curses ?? []).length === 0 ? (
                  <p className="text-xs text-stone-400">{t(lang, 'noCurses')}</p>
                ) : (
                  <div className="space-y-2">
                    {(activePlayer.curses ?? []).map((cid, idx) => {
                      const curse = CARD_MAP.get(cid);
                      if (!curse) return null;
                      return (
                        <CardTile
                          key={`${cid}_${idx}`}
                          lang={lang}
                          card={curse}
                          showRulesDetail
                          actions={
                            canCleanseHere && !activePlayer.isAI && onCleanseCurse
                              ? [
                                  {
                                    label: t(lang, 'cleanseServiceAction'),
                                    onClick: () => onCleanseCurse(curse.id),
                                    disabled: activePlayer.gold < 12,
                                    tone: 'primary',
                                  },
                                ]
                              : []
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Other Items Bag (0/6) */}
            <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-4">
              <div className="border-b border-stone-800 pb-3">
                <h2 className="font-display text-2xl font-bold text-stone-100">
                  {t(lang, 'inventoryTitle')} ({activePlayer.inventory.length}/
                  {HERO_INVENTORY_LIMITS.maxOtherItems})
                </h2>
                <p className="text-xs text-stone-400">{t(lang, 'statCapsNote')}</p>
              </div>
              {activePlayer.inventory.length === 0 ? (
                <p className="text-xs text-stone-400">{t(lang, 'emptyInventory')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[580px] overflow-y-auto pr-1">
                  {activePlayer.inventory.map((cid, idx) => {
                    const card = CARD_MAP.get(cid);
                    if (!card) return null;
                    const actions: CardTileAction[] = [];
                    if (!activePlayer.isAI) {
                      if (card.equipSlot) {
                        actions.push({
                          label: t(lang, 'equipCard'),
                          onClick: () => onEquipFromInventory(card.id),
                          tone: 'primary',
                        });
                      } else if (onUseInventoryItem) {
                        const usableNow = !card.combatOnly || state?.turnPhase === 'COMBAT';
                        actions.push({
                          label: t(lang, 'useItemAction'),
                          onClick: () => onUseInventoryItem(card.id),
                          disabled: !usableNow,
                          tone: 'primary',
                        });
                      }
                      if (canTradeHere && onSellCard) {
                        const sellGold = Math.max(2, Math.floor(card.goldCost * 0.5));
                        actions.push({
                          label: `${t(lang, 'sellCard')} (+${sellGold}g)`,
                          onClick: () => onSellCard('inventory', card.id),
                          tone: 'secondary',
                        });
                      }
                      if (onDiscardInventoryCard) {
                        actions.push({
                          label: t(lang, 'discardAction'),
                          onClick: () => onDiscardInventoryCard(card.id),
                          tone: 'danger',
                        });
                      }
                    }

                    return (
                      <CardTile
                        key={`${cid}_${idx}`}
                        lang={lang}
                        card={card}
                        showRulesDetail
                        actions={actions}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Complete 12-Hero Roster Compendium */}
      <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-100">
              {t(lang, 'heroRosterTitle')}
            </h2>
            <p className="text-xs text-stone-400">{t(lang, 'statCapsNote')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HEROES.map((h) => {
            const gearNames = [
              h.startingEquipment.weapon,
              h.startingEquipment.armor,
              h.startingEquipment.talisman,
            ]
              .filter((id): id is string => Boolean(id))
              .map((id) => CARD_MAP.get(id))
              .filter((c): c is NonNullable<typeof c> => Boolean(c))
              .map((c) => pickText(lang, c.name));

            return (
              <article
                key={h.id}
                className="rounded-md border border-stone-800 bg-[#12151b] p-4 space-y-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <HeroAvatar
                    src={h.portraitPath}
                    alt={pickText(lang, h.name)}
                    className="h-20 w-20 shrink-0 rounded-md border border-amber-700/40 object-cover"
                    fallbackLabel={pickText(lang, h.className)}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-amber-400">
                      {pickText(lang, h.className)}
                    </div>
                    <h3 className="font-display text-lg font-bold text-stone-100 leading-snug">
                      {pickText(lang, h.name)}
                    </h3>
                    <p className="text-stone-400">{pickText(lang, h.title)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-800/80 bg-[#171b22] px-3 py-2 font-mono tabular-nums text-stone-200">
                  <span className="inline-flex items-center gap-1" title={t(lang, 'strengthLabel')}>
                    <Sword className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                    {h.baseStats.strength}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t(lang, 'intellectLabel')}>
                    <BookOpen className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                    {h.baseStats.intellect}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t(lang, 'hpLabel')}>
                    <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                    {h.baseStats.hp}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t(lang, 'fateLabel')}>
                    <Compass className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    {h.baseStats.fate}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t(lang, 'goldLabel')}>
                    <Coins className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                    {h.baseStats.gold}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t(lang, 'experienceLabel')}>
                    <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
                    {h.baseStats.experience}
                  </span>
                </div>

                <p className="text-stone-300 leading-relaxed">{pickText(lang, h.description)}</p>
                <p className="text-stone-400 leading-relaxed">{pickText(lang, h.lore)}</p>

                <div className="border-t border-stone-800 pt-2 space-y-1">
                  <div className="text-amber-300 font-semibold">
                    {pickText(lang, h.abilityName)}: {pickText(lang, h.abilityDescription)}
                  </div>
                  <div className="text-stone-400">
                    <span className="text-stone-200 font-medium">{t(lang, 'startingGearLabel')}:</span>{' '}
                    {gearNames.join(', ')}
                  </div>
                  <div className="text-stone-400">
                    <span className="text-stone-200 font-medium">
                      {t(lang, 'startingResourcesLabel')}:
                    </span>{' '}
                    {pickText(lang, h.startingResources.description)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Complete 300-Card Codex */}
      <section className="rounded-lg border border-stone-800 bg-[#171b22] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <h2 className="font-display text-2xl font-bold text-stone-100">
            {t(lang, 'cardCodexTitle')} ({filteredCards.length} / {CARDS.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, 'searchCards')}
              className="rounded border border-stone-800 bg-[#111317] px-3 py-2 text-xs text-stone-100 placeholder:text-stone-500 min-h-[38px] focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-md border border-stone-800 bg-[#12151b] p-1">
          {CATEGORIES.map((cat) => {
            const count = cat === 'all' ? CARDS.length : CARD_CATEGORY_COUNTS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] tabular-nums ${
                  categoryFilter === cat
                    ? 'bg-amber-600 text-stone-950 font-semibold'
                    : 'text-stone-300 hover:text-stone-100'
                }`}
              >
                {cat === 'all' ? (lang === 'uk' ? 'Усі' : 'All') : formatCardCategory(lang, cat)} (
                {count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 max-h-[640px] overflow-y-auto pr-1">
          {filteredCards.map((card) => (
            <CardTile key={card.id} lang={lang} card={card} showRulesDetail />
          ))}
        </div>
      </section>
    </main>
  );
};
