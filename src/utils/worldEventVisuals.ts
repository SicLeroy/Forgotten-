import { ActiveMajorWorldEvent, MajorWorldEventId } from '../types/game';

export interface WorldEventVisualSpec {
  id: MajorWorldEventId;
  containerClass: string;
  overlayClass: string;
  cardAccentClass: string;
}

export const WORLD_EVENT_VISUAL_MAP: Record<MajorWorldEventId, WorldEventVisualSpec> = {
  major_dragon_awakening: {
    id: 'major_dragon_awakening',
    containerClass: 'world-fx-dragon-awakening',
    overlayClass: 'world-overlay-dragon-awakening',
    cardAccentClass: 'border-orange-500/70 shadow-[0_0_18px_-6px_rgba(249,115,22,0.45)]',
  },
  major_demon_rift: {
    id: 'major_demon_rift',
    containerClass: 'world-fx-demon-rift',
    overlayClass: 'world-overlay-demon-rift',
    cardAccentClass: 'border-fuchsia-600/70 shadow-[0_0_18px_-6px_rgba(192,38,211,0.45)]',
  },
  major_spreading_curse: {
    id: 'major_spreading_curse',
    containerClass: 'world-fx-spreading-curse',
    overlayClass: 'world-overlay-spreading-curse',
    cardAccentClass: 'border-violet-500/70 shadow-[0_0_18px_-6px_rgba(139,92,246,0.45)]',
  },
  major_blood_eclipse: {
    id: 'major_blood_eclipse',
    containerClass: 'world-fx-blood-eclipse',
    overlayClass: 'world-overlay-blood-eclipse',
    cardAccentClass: 'border-rose-600/80 shadow-[0_0_20px_-6px_rgba(225,29,72,0.55)]',
  },
  major_black_plague: {
    id: 'major_black_plague',
    containerClass: 'world-fx-black-plague',
    overlayClass: 'world-overlay-black-plague',
    cardAccentClass: 'border-lime-700/70 shadow-[0_0_18px_-6px_rgba(101,163,13,0.35)]',
  },
  major_undead_invasion: {
    id: 'major_undead_invasion',
    containerClass: 'world-fx-undead-invasion',
    overlayClass: 'world-overlay-undead-invasion',
    cardAccentClass: 'border-cyan-600/70 shadow-[0_0_18px_-6px_rgba(8,145,178,0.45)]',
  },
  major_arcane_storm: {
    id: 'major_arcane_storm',
    containerClass: 'world-fx-arcane-storm',
    overlayClass: 'world-overlay-arcane-storm',
    cardAccentClass: 'border-sky-500/80 shadow-[0_0_20px_-6px_rgba(56,189,248,0.55)]',
  },
  major_vanishing_caravans: {
    id: 'major_vanishing_caravans',
    containerClass: 'world-fx-vanishing-caravans',
    overlayClass: 'world-overlay-vanishing-caravans',
    cardAccentClass: 'border-amber-600/70 shadow-[0_0_18px_-6px_rgba(217,119,6,0.4)]',
  },
  major_monster_uprising: {
    id: 'major_monster_uprising',
    containerClass: 'world-fx-monster-uprising',
    overlayClass: 'world-overlay-monster-uprising',
    cardAccentClass: 'border-red-600/75 shadow-[0_0_18px_-6px_rgba(220,38,38,0.45)]',
  },
  major_ancient_temple: {
    id: 'major_ancient_temple',
    containerClass: 'world-fx-ancient-temple',
    overlayClass: 'world-overlay-ancient-temple',
    cardAccentClass: 'border-emerald-500/70 shadow-[0_0_18px_-6px_rgba(16,185,129,0.45)]',
  },
};

export interface ResolvedWorldEventVisuals {
  active: boolean;
  primaryEffectKey: MajorWorldEventId | 'calm';
  highestStage: 0 | 1 | 2 | 3;
  containerClassName: string;
  overlayClasses: string[];
  transitionKey: string;
}

export function resolveWorldEventVisuals(
  activeEvents: ActiveMajorWorldEvent[]
): ResolvedWorldEventVisuals {
  if (!activeEvents || activeEvents.length === 0) {
    return {
      active: false,
      primaryEffectKey: 'calm',
      highestStage: 0,
      containerClassName: '',
      overlayClasses: [],
      transitionKey: 'calm',
    };
  }

  const bounded = activeEvents.slice(0, 2);
  // Prioritize highest stage, breaking ties in favor of the most recently spawned event
  const primary = bounded.reduce((best, candidate) =>
    candidate.stage >= best.stage ? candidate : best
  );
  const primarySpec = WORLD_EVENT_VISUAL_MAP[primary.id];
  const highestStage = Math.max(...bounded.map((e) => e.stage)) as 1 | 2 | 3;

  const containerClasses = [
    primarySpec.containerClass,
    `world-stage-${highestStage}`,
  ];

  // Combine distinct filter/shake if 2 different events are active
  for (const evt of bounded) {
    if (evt.id !== primary.id) {
      containerClasses.push(WORLD_EVENT_VISUAL_MAP[evt.id].containerClass);
    }
  }

  return {
    active: true,
    primaryEffectKey: primary.id,
    highestStage,
    containerClassName: containerClasses.join(' '),
    overlayClasses: bounded.map((e) => `${WORLD_EVENT_VISUAL_MAP[e.id].overlayClass} world-stage-${e.stage}`),
    transitionKey: bounded.map((e) => `${e.id}:${e.stage}`).join('|'),
  };
}
