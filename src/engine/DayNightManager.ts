import { LOCATION_MAP } from '../data/locations';
import {
  DayNightCyclePhase,
  GameState,
  LocalizedText,
  LocationDefinition,
  PlayerState,
  TimeOfDay,
} from '../types/game';

export const DAY_NIGHT_CYCLE_LENGTH = 6;
export const DAY_PHASE_END_ROUND = 3;

export interface DayNightCycleInfo {
  cycleNumber: number;
  cycleRound: number; // 1..6 within current 6-round cycle
  phase: DayNightCyclePhase; // 'day' for rounds 1..3, 'night' for rounds 4..6
  phaseDayIndex: number; // 1..3 within current phase
  timeOfDay: TimeOfDay;
  isDay: boolean;
  isNight: boolean;
  label: LocalizedText;
}

export interface HiddenNightPassage {
  id: string;
  from: string;
  to: string;
  name: LocalizedText;
}

export const HIDDEN_NIGHT_PASSAGES: HiddenNightPassage[] = [
  {
    id: 'night_pass_1',
    from: 'loc_06',
    to: 'loc_25',
    name: {
      uk: 'Місячна стежка курганів (нічний прохід)',
      en: 'Moonlit Barrow Path (Night Passage)',
    },
  },
  {
    id: 'night_pass_2',
    from: 'loc_12',
    to: 'loc_34',
    name: {
      uk: 'Таємний брод тіней (нічний прохід)',
      en: 'Shadow Ford Shortcut (Night Passage)',
    },
  },
  {
    id: 'night_pass_3',
    from: 'loc_45',
    to: 'loc_68',
    name: {
      uk: 'Обсидіанова розщелина (нічний прохід)',
      en: 'Obsidian Cleft (Night Passage)',
    },
  },
  {
    id: 'night_pass_4',
    from: 'loc_76',
    to: 'loc_82',
    name: {
      uk: 'Забута тіньова галерея (нічний прохід)',
      en: 'Forgotten Shadow Gallery (Night Passage)',
    },
  },
];

export interface HeroTimeBonuses {
  physicalMod: number;
  magicMod: number;
  defenseMod: number;
  dangerMod: number;
  description: LocalizedText;
}

const NIGHT_ATTUNED_HEROES = new Set(['hero_03', 'hero_05', 'hero_08', 'hero_09']);
const DAY_ATTUNED_HEROES = new Set(['hero_04', 'hero_10', 'hero_01', 'hero_07']);

export const DayNightManager = {
  getCycleInfo(round: number): DayNightCycleInfo {
    const safeRound = Math.max(1, Math.floor(round));
    const cycleNumber = Math.floor((safeRound - 1) / DAY_NIGHT_CYCLE_LENGTH) + 1;
    const cycleRound = ((safeRound - 1) % DAY_NIGHT_CYCLE_LENGTH) + 1;
    const isDay = cycleRound <= DAY_PHASE_END_ROUND;
    const phase: DayNightCyclePhase = isDay ? 'day' : 'night';
    const phaseDayIndex = isDay ? cycleRound : cycleRound - DAY_PHASE_END_ROUND;
    const timeOfDay: TimeOfDay = !isDay ? 'night' : cycleRound === 1 ? 'dawn' : 'day';

    return {
      cycleNumber,
      cycleRound,
      phase,
      phaseDayIndex,
      timeOfDay,
      isDay,
      isNight: !isDay,
      label: isDay
        ? {
            uk: `День (${phaseDayIndex}/3 · цикл ${cycleRound}/6)`,
            en: `Day (${phaseDayIndex}/3 · cycle ${cycleRound}/6)`,
          }
        : {
            uk: `Ніч (${phaseDayIndex}/3 · цикл ${cycleRound}/6)`,
            en: `Night (${phaseDayIndex}/3 · cycle ${cycleRound}/6)`,
          },
    };
  },

  isNight(stateOrRound: Pick<GameState, 'round' | 'dayNightPhase' | 'timeOfDay'> | number): boolean {
    if (typeof stateOrRound === 'number') {
      return DayNightManager.getCycleInfo(stateOrRound).isNight;
    }
    if (stateOrRound.dayNightPhase) {
      return stateOrRound.dayNightPhase === 'night';
    }
    if (stateOrRound.timeOfDay === 'night' || stateOrRound.timeOfDay === 'dusk') {
      return true;
    }
    return DayNightManager.getCycleInfo(stateOrRound.round).isNight;
  },

  syncState(state: GameState): {
    info: DayNightCycleInfo;
    phaseChangedTo: DayNightCyclePhase | null;
  } {
    const prevPhase: DayNightCyclePhase =
      state.dayNightPhase ?? (state.timeOfDay === 'night' || state.timeOfDay === 'dusk' ? 'night' : 'day');
    const info = DayNightManager.getCycleInfo(state.round);
    state.dayNightCycleRound = info.cycleRound;
    state.dayNightPhase = info.phase;
    state.timeOfDay = info.timeOfDay;
    const phaseChangedTo = prevPhase !== info.phase ? info.phase : null;
    return { info, phaseChangedTo };
  },

  getHiddenPassagesForLocation(
    locationId: string,
    stateOrRound: Pick<GameState, 'round' | 'dayNightPhase' | 'timeOfDay'> | number
  ): Array<{ targetId: string; passage: HiddenNightPassage }> {
    if (!DayNightManager.isNight(stateOrRound)) return [];
    const results: Array<{ targetId: string; passage: HiddenNightPassage }> = [];
    for (const passage of HIDDEN_NIGHT_PASSAGES) {
      if (passage.from === locationId && LOCATION_MAP.has(passage.to)) {
        results.push({ targetId: passage.to, passage });
      } else if (passage.to === locationId && LOCATION_MAP.has(passage.from)) {
        results.push({ targetId: passage.from, passage });
      }
    }
    return results;
  },

  getHeroTimeBonuses(
    player: PlayerState,
    location: LocationDefinition,
    stateOrRound: Pick<GameState, 'round' | 'dayNightPhase' | 'timeOfDay'> | number
  ): HeroTimeBonuses {
    const night = DayNightManager.isNight(stateOrRound);
    const locEff = night ? location.nightEffect : location.dayEffect;

    let physicalMod = locEff.attackMod;
    let magicMod = 0;
    let defenseMod = locEff.defenseMod;
    const dangerMod = locEff.dangerMod;

    if (!night) {
      if (DAY_ATTUNED_HEROES.has(player.heroId)) {
        defenseMod += 1;
      }
      if (location.terrain === 'shrine') {
        magicMod += 1;
      }
      return {
        physicalMod,
        magicMod,
        defenseMod,
        dangerMod,
        description: {
          uk: `Денний бонус: ${locEff.description.uk}${DAY_ATTUNED_HEROES.has(player.heroId) ? ' · +1 денний захист героя' : ''}`,
          en: `Day bonus: ${locEff.description.en}${DAY_ATTUNED_HEROES.has(player.heroId) ? ' · +1 Day Guard' : ''}`,
        },
      };
    }

    if (NIGHT_ATTUNED_HEROES.has(player.heroId)) {
      physicalMod += 1;
      magicMod += 1;
    }
    if (location.terrain === 'ruins' || location.terrain === 'shrine') {
      magicMod += 1;
    }

    return {
      physicalMod,
      magicMod,
      defenseMod,
      dangerMod,
      description: {
        uk: `Нічний ефект: ${locEff.description.uk}${NIGHT_ATTUNED_HEROES.has(player.heroId) ? ' · +1 нічний хист героя' : ''} · приховані проходи відкриті`,
        en: `Night effect: ${locEff.description.en}${NIGHT_ATTUNED_HEROES.has(player.heroId) ? ' · +1 Night Stalker' : ''} · hidden passages open`,
      },
    };
  },

  applyTurnStartTimeBonus(state: GameState, player: PlayerState, isInitialTurn: boolean): LocalizedText | null {
    if (isInitialTurn) return null;
    const night = DayNightManager.isNight(state);
    const loc = LOCATION_MAP.get(player.locationId);
    if (!loc) return null;

    if (!night && DAY_ATTUNED_HEROES.has(player.heroId)) {
      player.tempDefenseBonus += 1;
      return {
        uk: 'Денний бонус героя: +1 до захисту на цей хід.',
        en: 'Daytime hero bonus: +1 Defense this turn.',
      };
    }
    if (night && NIGHT_ATTUNED_HEROES.has(player.heroId)) {
      player.tempAttackBonus += 1;
      return {
        uk: 'Нічний бонус героя: +1 до атаки в темряві на цей хід.',
        en: 'Nighttime hero bonus: +1 Attack in darkness this turn.',
      };
    }
    return null;
  },
};
