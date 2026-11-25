import { SaveManager } from '../storage/SaveManager';
import {
  CombatType,
  EngineResult,
  EquipSlot,
  GameState,
  MajorWorldEventId,
  NewGameConfig,
} from '../types/game';
import { RulesEngine } from './RulesEngine';

export type GameAction =
  | { type: 'ROLL_MOVEMENT' }
  | { type: 'REROLL_MOVEMENT_DICE' }
  | { type: 'STEP_MOVE'; locationId: string }
  | { type: 'STOP_MOVEMENT_EARLY' }
  | { type: 'MOVE'; locationId: string }
  | { type: 'EXPLORE' }
  | { type: 'ROLL_ENCOUNTER_CHECK' }
  | { type: 'REROLL_ENCOUNTER_CHECK' }
  | { type: 'REST' }
  | { type: 'DRAW_CARD' }
  | { type: 'BUY_SUPPLY' }
  | { type: 'BUY_MARKET_CARD'; cardId: string }
  | { type: 'SELL_CARD'; source: 'hand' | 'inventory'; cardId: string }
  | { type: 'REFRESH_MARKET' }
  | { type: 'HEAL_AT_SANCTUARY' }
  | { type: 'CLEANSE_CURSE'; curseCardId?: string }
  | { type: 'USE_ABILITY' }
  | { type: 'UPGRADE_STAT'; stat: 'strength' | 'intellect' }
  | { type: 'PLAY_CARD'; cardId: string }
  | { type: 'STORE_INVENTORY'; cardId: string }
  | { type: 'USE_INVENTORY_ITEM'; cardId: string }
  | { type: 'DISCARD_HAND_CARD'; cardId: string }
  | { type: 'DISCARD_INVENTORY_CARD'; cardId: string }
  | { type: 'DISMISS_COMPANION'; cardId: string }
  | { type: 'EQUIP_INVENTORY'; cardId: string }
  | { type: 'UNEQUIP_SLOT'; slot: EquipSlot }
  | { type: 'CHALLENGE_GATE_GUARDIAN' }
  | { type: 'CHALLENGE_SEAL' }
  | { type: 'ATTEMPT_TRIAL' }
  | { type: 'CHALLENGE_CITADEL' }
  | { type: 'CHALLENGE_VOID_LORD' }
  | { type: 'CHALLENGE_PLAYER'; targetPlayerId: string }
  | { type: 'COMBAT_ATTACK'; combatType?: CombatType }
  | { type: 'COMBAT_DEFEND' }
  | { type: 'COMBAT_FLEE' }
  | { type: 'RESOLVE_ENCOUNTER' }
  | { type: 'INTERVENE_WORLD_EVENT'; eventId: MajorWorldEventId }
  | { type: 'TALK_NPC'; npcId: string }
  | { type: 'SELECT_NPC_OPTION'; optionId: string }
  | { type: 'CLOSE_NPC_DIALOG' }
  | { type: 'END_TURN' };

export const GameManager = {
  startNewGame(config: NewGameConfig): GameState {
    return RulesEngine.createNewGame(config);
  },

  dispatch(state: GameState, action: GameAction): EngineResult {
    switch (action.type) {
      case 'ROLL_MOVEMENT':
        return RulesEngine.rollMovement(state);
      case 'REROLL_MOVEMENT_DICE':
        return RulesEngine.rerollMovementDice(state);
      case 'STEP_MOVE':
        return RulesEngine.stepMove(state, action.locationId);
      case 'STOP_MOVEMENT_EARLY':
        return RulesEngine.stopMovementEarly(state);
      case 'MOVE':
        return RulesEngine.moveToLocation(state, action.locationId);
      case 'EXPLORE':
        return RulesEngine.exploreLocation(state);
      case 'ROLL_ENCOUNTER_CHECK':
        return RulesEngine.rollEncounterCheck(state);
      case 'REROLL_ENCOUNTER_CHECK':
        return RulesEngine.rerollEncounterCheck(state);
      case 'REST':
        return RulesEngine.restAtLocation(state);
      case 'DRAW_CARD':
        return RulesEngine.drawCardAction(state);
      case 'BUY_SUPPLY':
        return RulesEngine.buySupplyCard(state);
      case 'BUY_MARKET_CARD':
        return RulesEngine.buyMarketCard(state, action.cardId);
      case 'SELL_CARD':
        return RulesEngine.sellCard(state, action.source, action.cardId);
      case 'REFRESH_MARKET':
        return RulesEngine.refreshMarket(state);
      case 'HEAL_AT_SANCTUARY':
        return RulesEngine.healAtSanctuary(state);
      case 'CLEANSE_CURSE':
        return RulesEngine.cleanseCurseAtShrine(state, action.curseCardId);
      case 'USE_ABILITY':
        return RulesEngine.useHeroAbility(state);
      case 'UPGRADE_STAT':
        return RulesEngine.upgradeStat(state, action.stat);
      case 'PLAY_CARD':
        return RulesEngine.playCard(state, action.cardId);
      case 'STORE_INVENTORY':
        return RulesEngine.storeCardInInventory(state, action.cardId);
      case 'USE_INVENTORY_ITEM':
        return RulesEngine.useInventoryItem(state, action.cardId);
      case 'DISCARD_HAND_CARD':
        return RulesEngine.discardHandCard(state, action.cardId);
      case 'DISCARD_INVENTORY_CARD':
        return RulesEngine.discardInventoryItem(state, action.cardId);
      case 'DISMISS_COMPANION':
        return RulesEngine.dismissCompanion(state, action.cardId);
      case 'EQUIP_INVENTORY':
        return RulesEngine.equipFromInventory(state, action.cardId);
      case 'UNEQUIP_SLOT':
        return RulesEngine.unequipSlot(state, action.slot);
      case 'CHALLENGE_GATE_GUARDIAN':
        return RulesEngine.challengeGateGuardian(state);
      case 'CHALLENGE_SEAL':
        return RulesEngine.challengeSealGuardian(state);
      case 'ATTEMPT_TRIAL':
        return RulesEngine.attemptFinalTrial(state);
      case 'CHALLENGE_CITADEL':
        return RulesEngine.challengeCitadelGuardian(state);
      case 'CHALLENGE_VOID_LORD':
        return RulesEngine.challengeVoidLord(state);
      case 'CHALLENGE_PLAYER':
        return RulesEngine.challengePlayer(state, action.targetPlayerId);
      case 'COMBAT_ATTACK':
        return RulesEngine.combatAttack(state, action.combatType ?? 'physical');
      case 'COMBAT_DEFEND':
        return RulesEngine.combatDefend(state);
      case 'COMBAT_FLEE':
        return RulesEngine.combatFlee(state);
      case 'RESOLVE_ENCOUNTER':
        return RulesEngine.resolveEncounter(state);
      case 'INTERVENE_WORLD_EVENT':
        return RulesEngine.interveneWorldEvent(state, action.eventId);
      case 'TALK_NPC':
        return RulesEngine.talkToNpc(state, action.npcId);
      case 'SELECT_NPC_OPTION':
        return RulesEngine.chooseNpcDialogOption(state, action.optionId);
      case 'CLOSE_NPC_DIALOG':
        return RulesEngine.closeNpcDialog(state);
      case 'END_TURN':
        return RulesEngine.endTurn(state);
    }
  },

  runAiTurn(state: GameState): GameState {
    return RulesEngine.runAiTurn(state);
  },

  async saveCurrentGame(state: GameState, label?: string): Promise<void> {
    await SaveManager.saveGame(state, label);
  },

  async saveManualGame(state: GameState, label?: string): Promise<void> {
    if (label?.trim()) {
      await SaveManager.saveNewManualSlot(state, label);
    } else {
      await SaveManager.saveGame(state);
    }
  },

  async saveAutoGame(state: GameState): Promise<void> {
    await SaveManager.saveAuto(state);
  },

  async continueSavedGame(saveId: string): Promise<GameState | null> {
    return SaveManager.loadGame(saveId);
  },

  async continueSavedGameWithReport(saveId: string) {
    return SaveManager.loadGameWithReport(saveId);
  },
};
