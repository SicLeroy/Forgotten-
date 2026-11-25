import { CARD_MAP } from '../data/cards';
import { LOCATION_MAP } from '../data/locations';
import { NPC_MAP, NPCS } from '../data/npcs';
import { MAJOR_WORLD_EVENT_MAP } from '../data/worldEvents';
import {
  GameState,
  HERO_INVENTORY_LIMITS,
  HERO_STAT_LIMITS,
  LocalizedText,
  NpcDefinition,
  NpcDialogOption,
  NpcDynamicState,
  PlayerState,
} from '../types/game';
import { appendChronicleEntry } from './ChronicleHelper';
import { DayNightManager } from './DayNightManager';
import { getActivePlayerFromState } from './GameState';
import { RandomManager } from './RandomManager';
import { WeatherManager } from './WeatherManager';
import { WorldEventManager } from './WorldEventManager';

function drawSingleCardForNpcReward(state: GameState, player: PlayerState): string | null {
  if (player.hand.length >= HERO_INVENTORY_LIMITS.maxHandSize) return null;
  if (state.deck.length === 0) {
    if (state.discardPile.length === 0) return null;
    const reshuffled = RandomManager.shuffle(state.discardPile, state.rngState);
    state.deck = reshuffled.shuffled;
    state.rngState = reshuffled.nextState;
    state.discardPile = [];
  }
  const cardId = state.deck.shift();
  if (!cardId) return null;
  player.hand.push(cardId);
  return cardId;
}

function getQuestMetricValue(npc: NpcDefinition, player: PlayerState): number {
  if (!npc.quest) return 0;
  switch (npc.quest.objectiveType) {
    case 'slay_enemies':
      return player.enemiesSlain;
    case 'explore_locations':
      return player.visitedLocationIds.length;
    case 'gather_gold':
      return player.gold;
    case 'intervene_event':
      return player.enemiesSlain + player.visitedLocationIds.length;
  }
}

export const NpcManager = {
  getNpcsAtLocation(locationId: string): NpcDefinition[] {
    const loc = LOCATION_MAP.get(locationId);
    if (!loc) return [];
    const exact = NPCS.filter((n) => n.locationIds.includes(locationId));
    const terrainMatches = NPCS.filter(
      (n) => !n.locationIds.includes(locationId) && n.terrains.includes(loc.terrain)
    );
    return [...exact, ...terrainMatches].slice(0, 3);
  },

  ensureNpcState(state: GameState, npcId: string): NpcDynamicState {
    if (!state.npcStates) state.npcStates = {};
    if (!state.npcStates[npcId]) {
      state.npcStates[npcId] = {
        npcId,
        timesSpoken: 0,
        questStatus: 'available',
        questBaselineCount: 0,
        questProgress: 0,
      };
    }
    return state.npcStates[npcId];
  },

  syncQuestProgress(state: GameState, player: PlayerState): void {
    if (!state.npcStates) return;
    for (const [npcId, dyn] of Object.entries(state.npcStates)) {
      if (dyn.questStatus !== 'active') continue;
      const npc = NPC_MAP.get(npcId);
      if (!npc || !npc.quest) continue;
      const currentVal = getQuestMetricValue(npc, player);
      dyn.questProgress = Math.max(dyn.questProgress, Math.max(0, currentVal - dyn.questBaselineCount));
    }
  },

  getReactiveDialogNote(
    state: GameState,
    player: PlayerState,
    npc: NpcDefinition
  ): LocalizedText | null {
    const activeMajor = WorldEventManager.getActiveEvents(state);
    if (activeMajor.length > 0) {
      const first = activeMajor[0];
      const def = MAJOR_WORLD_EVENT_MAP.get(first.id);
      if (def) {
        if (npc.role === 'merchant' && first.id === 'major_vanishing_caravans') {
          return {
            uk: `Реакція NPC: «Через "${def.name.uk}" ціни на трактах злетіли, але мої резерви ще тримаються!»`,
            en: `NPC Reaction: "Because of '${def.name.en}', road prices spiked—yet my reserve chest holds!"`,
          };
        }
        return {
          uk: `Реакція на світ: «Світ відчуває "${def.name.uk}" (Стадія ${first.stage}/3). Дії героїв справді змінюють хід подій.»`,
          en: `World Reaction: "Everyone feels '${def.name.en}' (Stage ${first.stage}/3). Heroes' deeds truly shift the tide."`,
        };
      }
    }

    if (player.seals.length >= 3) {
      return {
        uk: `Реакція NPC: «У тебе вже всі 3 Печатки! Поспішай до Цитаделі — історія чекає.»`,
        en: `NPC Reaction: "You already bear all 3 Seals! Hasten toward the Citadel—history awaits."`,
      };
    }

    if ((player.curses ?? []).length > 0) {
      return {
        uk: `Реакція NPC: «Я відчуваю на тобі тінь прокляття — не зволікай із очищенням.»`,
        en: `NPC Reaction: "I sense a dark curse clinging to you—do not delay purification."`,
      };
    }

    const weatherProfile = WeatherManager.getProfile(state.weather);
    if (DayNightManager.isNight(state)) {
      return {
        uk: `Реакція на час доби: «Ніч (${weatherProfile.name.uk}) відкриває таємні проходи, але несе небезпеку.»`,
        en: `Time Reaction: "Night (${weatherProfile.name.en}) opens secret passages yet sharpens danger."`,
      };
    }

    return null;
  },

  getAvailableOptions(
    state: GameState,
    player: PlayerState,
    npc: NpcDefinition,
    nodeId: string
  ): NpcDialogOption[] {
    const node = npc.nodes[nodeId];
    if (!node) return [];
    const dyn = state.npcStates?.[npc.id];
    const questStatus = dyn?.questStatus ?? 'available';
    const questTarget = npc.quest?.targetCount ?? 1;
    const questProgress = dyn?.questProgress ?? 0;
    const activeMajorCount = WorldEventManager.getActiveEvents(state).length;
    const hasCurse = (player.curses ?? []).length > 0;

    return node.options.filter((opt) => {
      if (opt.requiresQuestAvailable && (!npc.quest || questStatus !== 'available')) {
        return false;
      }
      if (
        opt.requiresQuestReady &&
        (!npc.quest || questStatus !== 'active' || questProgress < questTarget)
      ) {
        return false;
      }
      if (opt.requiresActiveMajorEvent && activeMajorCount === 0) {
        return false;
      }
      if (opt.requiresCurse && !hasCurse) {
        return false;
      }
      return true;
    });
  },

  talkToNpc(state: GameState, npcId: string): { ok: boolean; error?: LocalizedText } {
    if (state.phase !== 'PLAYING' || state.turnPhase !== 'ACTION') {
      return {
        ok: false,
        error: { uk: 'Розмовляти з NPC можна лише у мирній фазі ходу.', en: 'Talk to NPCs only during ACTION phase.' },
      };
    }

    const player = getActivePlayerFromState(state);
    const npcsHere = NpcManager.getNpcsAtLocation(player.locationId);
    const npc = npcsHere.find((n) => n.id === npcId) ?? NPC_MAP.get(npcId);
    if (!npc || !npcsHere.some((n) => n.id === npc.id)) {
      return {
        ok: false,
        error: { uk: 'Цього персонажа немає на поточній локації.', en: 'This NPC is not at your current location.' },
      };
    }

    const dyn = NpcManager.ensureNpcState(state, npc.id);
    dyn.timesSpoken += 1;
    NpcManager.syncQuestProgress(state, player);

    const dynamicNote = NpcManager.getReactiveDialogNote(state, player, npc);
    state.activeNpcDialog = {
      npcId: npc.id,
      nodeId: npc.entryNodeId,
      dynamicNote,
    };

    appendChronicleEntry(
      state,
      'world',
      player.id,
      {
        uk: `${player.name} розпочинає діалог із "${npc.name.uk}" (${npc.title.uk}).`,
        en: `${player.name} speaks with "${npc.name.en}" (${npc.title.en}).`,
      },
      'local'
    );

    return { ok: true };
  },

  selectDialogOption(
    state: GameState,
    optionId: string
  ): { ok: boolean; error?: LocalizedText } {
    const dialog = state.activeNpcDialog;
    if (!dialog) {
      return { ok: false, error: { uk: 'Немає відкритого діалогу з NPC.', en: 'No active NPC dialogue.' } };
    }
    const npc = NPC_MAP.get(dialog.npcId);
    if (!npc) {
      state.activeNpcDialog = null;
      return { ok: false, error: { uk: 'Невідомий NPC.', en: 'Unknown NPC.' } };
    }
    const player = getActivePlayerFromState(state);
    NpcManager.syncQuestProgress(state, player);
    const options = NpcManager.getAvailableOptions(state, player, npc, dialog.nodeId);
    const option = options.find((o) => o.id === optionId);
    if (!option) {
      return { ok: false, error: { uk: 'Обрана відповідь зараз недоступна.', en: 'Selected dialogue option unavailable.' } };
    }

    const dyn = NpcManager.ensureNpcState(state, npc.id);

    if (option.goldCost && option.goldCost > 0 && player.gold < option.goldCost) {
      return {
        ok: false,
        error: {
          uk: `Недостатньо золота (потрібно ${option.goldCost} з.).`,
          en: `Not enough Gold (requires ${option.goldCost}g).`,
        },
      };
    }

    let note: LocalizedText | null = null;

    switch (option.action) {
      case 'close':
        state.activeNpcDialog = null;
        return { ok: true };

      case 'goto':
        break;

      case 'accept_quest': {
        if (!npc.quest) break;
        dyn.questStatus = 'active';
        dyn.questBaselineCount = getQuestMetricValue(npc, player);
        dyn.questProgress = 0;
        note = {
          uk: `Прийнято завдання: «${npc.quest.title.uk}».`,
          en: `Quest accepted: "${npc.quest.title.en}".`,
        };
        appendChronicleEntry(
          state,
          'world',
          player.id,
          {
            uk: `${player.name} приймає завдання «${npc.quest.title.uk}» від "${npc.name.uk}".`,
            en: `${player.name} accepts quest "${npc.quest.title.en}" from "${npc.name.en}".`,
          },
          'local'
        );
        break;
      }

      case 'complete_quest': {
        if (!npc.quest) break;
        dyn.questStatus = 'completed';
        player.gold += npc.quest.rewardGold;
        player.experience += npc.quest.rewardXp;
        player.fate = Math.min(HERO_STAT_LIMITS.maxFate, player.fate + npc.quest.rewardFate);
        const drawnId = npc.quest.rewardCard ? drawSingleCardForNpcReward(state, player) : null;
        const drawnCard = drawnId ? CARD_MAP.get(drawnId) : null;
        note = {
          uk: `Завдання виконано! +${npc.quest.rewardGold} з., +${npc.quest.rewardXp} XP${npc.quest.rewardFate ? `, +${npc.quest.rewardFate} Долі` : ''}${drawnCard ? `, +1 карта «${drawnCard.name.uk}»` : ''}.`,
          en: `Quest completed! +${npc.quest.rewardGold}g, +${npc.quest.rewardXp} XP${npc.quest.rewardFate ? `, +${npc.quest.rewardFate} Fate` : ''}${drawnCard ? `, +1 "${drawnCard.name.en}"` : ''}.`,
        };
        appendChronicleEntry(
          state,
          'card',
          player.id,
          {
            uk: `${player.name} виконує завдання «${npc.quest.title.uk}» (${note.uk})`,
            en: `${player.name} completes quest "${npc.quest.title.en}" (${note.en})`,
          },
          'local'
        );
        WorldEventManager.recordWorldReaction(state, 'npc_aid', player, player.locationId);
        break;
      }

      case 'merchant_bargain': {
        if (dyn.bargainUsedRound === state.round) {
          return {
            ok: false,
            error: {
              uk: 'Ви вже користувалися вигідною поставкою цього раунду.',
              en: 'You already struck a supply bargain this round.',
            },
          };
        }
        if (player.hand.length >= HERO_INVENTORY_LIMITS.maxHandSize) {
          return {
            ok: false,
            error: { uk: 'Рука заповнена (макс. 7 карт).', en: 'Hand is full (max 7 cards).' },
          };
        }
        const cost = option.goldCost ?? 8;
        player.gold -= cost;
        dyn.bargainUsedRound = state.round;
        const cardId = drawSingleCardForNpcReward(state, player);
        const card = cardId ? CARD_MAP.get(cardId) : null;
        note = card
          ? {
              uk: `Придбано «${card.name.uk}» за ${cost} з.`,
              en: `Acquired "${card.name.en}" for ${cost}g.`,
            }
          : { uk: `Сплачено ${cost} з.`, en: `Paid ${cost}g.` };
        appendChronicleEntry(
          state,
          'card',
          player.id,
          {
            uk: `${player.name} укладає угоду з "${npc.name.uk}": ${note.uk}`,
            en: `${player.name} strikes a deal with "${npc.name.en}": ${note.en}`,
          },
          'local'
        );
        WorldEventManager.recordWorldReaction(state, 'trade', player, player.locationId);
        break;
      }

      case 'traveler_rumor': {
        if (dyn.blessingUsedRound !== state.round) {
          dyn.blessingUsedRound = state.round;
          player.experience += 1;
          player.gold += 3;
          note = {
            uk: 'Підказка мандрівника принесла +1 XP та +3 золота!',
            en: 'Traveler’s tip granted +1 XP and +3 Gold!',
          };
          appendChronicleEntry(
            state,
            'move',
            player.id,
            {
              uk: `${player.name} отримує звістку від "${npc.name.uk}": +1 XP, +3 з.`,
              en: `${player.name} learns trail lore from "${npc.name.en}": +1 XP, +3g.`,
            },
            'local'
          );
        } else {
          note = {
            uk: 'Мандрівник уже поділився свіжими новинами в цьому раунді.',
            en: 'The traveler already shared today’s rumors this round.',
          };
        }
        break;
      }

      case 'special_blessing': {
        if (dyn.blessingUsedRound === state.round) {
          return {
            ok: false,
            error: {
              uk: 'Благословення цього персонажа вже отримано в поточному раунді.',
              en: 'Already received this character’s blessing this round.',
            },
          };
        }
        dyn.blessingUsedRound = state.round;
        const prevHp = player.hp;
        player.hp = Math.min(HERO_STAT_LIMITS.maxHp, player.maxHp, player.hp + 1);
        const prevFate = player.fate;
        player.fate = Math.min(HERO_STAT_LIMITS.maxFate, player.fate + 1);
        note = {
          uk: `Отримано благословення (+${player.hp - prevHp} HP, +${player.fate - prevFate} Долі).`,
          en: `Blessing received (+${player.hp - prevHp} HP, +${player.fate - prevFate} Fate).`,
        };
        appendChronicleEntry(
          state,
          'seal',
          player.id,
          {
            uk: `${player.name} отримує благословення від "${npc.name.uk}": ${note.uk}`,
            en: `${player.name} receives a blessing from "${npc.name.en}": ${note.en}`,
          },
          'local'
        );
        break;
      }

      case 'special_cleanse': {
        const curses = player.curses ?? [];
        if (curses.length === 0) {
          return {
            ok: false,
            error: { uk: 'На героєві немає проклять.', en: 'No active curses on hero.' },
          };
        }
        const cost = option.goldCost ?? 6;
        player.gold -= cost;
        const removedId = curses[0];
        player.curses = curses.slice(1);
        state.adventureDiscardPile = [...(state.adventureDiscardPile ?? []), removedId];
        const removedCard = CARD_MAP.get(removedId);
        note = {
          uk: `Знято прокляття ${removedCard ? `«${removedCard.name.uk}»` : ''} за ${cost} з.!`,
          en: `Purified ${removedCard ? `"${removedCard.name.en}"` : 'curse'} for ${cost}g!`,
        };
        appendChronicleEntry(
          state,
          'seal',
          player.id,
          {
            uk: `${player.name} проходить пільговий обряд очищення у "${npc.name.uk}": ${note.uk}`,
            en: `${player.name} completes purification with "${npc.name.en}": ${note.en}`,
          },
          'local'
        );
        WorldEventManager.recordWorldReaction(state, 'cleanse_curse', player, player.locationId);
        break;
      }

      case 'assist_major_event': {
        const activeEvents = WorldEventManager.getActiveEvents(state);
        if (activeEvents.length === 0) {
          return {
            ok: false,
            error: { uk: 'Зараз немає активних великих світових подій.', en: 'No active major world events right now.' },
          };
        }
        const cost = option.goldCost ?? 0;
        player.gold -= cost;
        WorldEventManager.recordWorldReaction(state, 'npc_aid', player, player.locationId);
        note = {
          uk: `Завдяки допомозі "${npc.name.uk}" криза світу послаблена!`,
          en: `With aid from "${npc.name.en}", the world crisis weakens!`,
        };
        break;
      }
    }

    if (option.nextNodeId && npc.nodes[option.nextNodeId]) {
      state.activeNpcDialog = {
        npcId: npc.id,
        nodeId: option.nextNodeId,
        dynamicNote: note,
      };
    } else {
      state.activeNpcDialog = null;
    }

    return { ok: true };
  },

  closeDialog(state: GameState): void {
    state.activeNpcDialog = null;
  },
};
