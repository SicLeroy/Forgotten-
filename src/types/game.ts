export type Language = 'uk' | 'en';

export interface LocalizedText {
  uk: string;
  en: string;
}

export type GameMode = 'solo_ai' | 'local_hotseat';

export type GamePhase =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'VICTORY'
  | 'DEFEAT';

export type TurnPhase =
  | 'ACTION'
  | 'MOVING'
  | 'COMBAT'
  | 'ENCOUNTER'
  | 'FINAL_TRIAL';

export type TurnCycleStep =
  | 'turn_start'
  | 'apply_effects'
  | 'dice_roll'
  | 'movement'
  | 'destination_activation'
  | 'encounter'
  | 'turn_end'
  | 'turn_handoff';

export type DiceRollPurpose =
  | 'movement'
  | 'encounter'
  | 'combat_attack'
  | 'combat_flee'
  | 'final_trial'
  | 'arrival_event';

export interface DiceRollRecord {
  id: string;
  round: number;
  timeOfDay: TimeOfDay;
  playerId: string;
  playerName: string;
  purpose: DiceRollPurpose;
  roll: number;
  modifier: number;
  total: number;
  rerolled: boolean;
  previousRoll: number | null;
  fateSpent: number;
  rngBefore: number;
  rngAfter: number;
  summary: LocalizedText;
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type WeatherType =
  | 'clear'
  | 'mist'
  | 'rain'
  | 'ash_storm'
  | 'frost_wind'
  | 'void_eclipse';

export type RegionId =
  | 'reg_sunspire_vale'
  | 'reg_ashen_marches'
  | 'reg_abyssal_citadel';

export type RegionTier = 'outer' | 'middle' | 'inner';

export type SectorId =
  // Outer Region (6 sectors x 7 = 42)
  | 'sec_forest'
  | 'sec_rural'
  | 'sec_mountain'
  | 'sec_ancient_ruins'
  | 'sec_river'
  | 'sec_borderlands'
  // Middle Region (5 sectors x 6 = 30)
  | 'sec_cursed_forest'
  | 'sec_ruined_lands'
  | 'sec_volcanic'
  | 'sec_demon_lands'
  | 'sec_ancient_temples'
  // Inner Region (4 sectors x 3 = 12)
  | 'sec_shattered_gates'
  | 'sec_path_of_trials'
  | 'sec_guardian_citadel'
  | 'sec_heart_of_darkness';

export type SealType = 'seal_power' | 'seal_wisdom' | 'seal_fate';

export type LocationTerrain =
  | 'sanctuary'
  | 'village'
  | 'wilds'
  | 'ruins'
  | 'shrine'
  | 'pass'
  | 'fortress'
  | 'void_throne';

export type AdventureSymbol =
  | 'sword'
  | 'scroll'
  | 'chest'
  | 'shrine'
  | 'skull'
  | 'gate'
  | 'crown';

export type AccessConditionType = 'open' | 'gate_guardian' | 'three_seals';

export interface LocationAccessCondition {
  type: AccessConditionType;
  description: LocalizedText;
}

export interface LocationTimeEffect {
  description: LocalizedText;
  attackMod: number;
  defenseMod: number;
  dangerMod: number;
}

export interface LocationWeatherEffect {
  description: LocalizedText;
  moveMod: number;
  combatMod: number;
}

export type CardCategory =
  | 'adventure'
  | 'enemy'
  | 'item'
  | 'weapon'
  | 'armor'
  | 'spell'
  | 'companion'
  | 'event'
  | 'curse'
  | 'legendary_artifact';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type EquipSlot = 'weapon' | 'armor' | 'talisman';

export type CardDurationType =
  | 'instant'
  | 'turn'
  | 'combat'
  | 'equipped'
  | 'until_cleansed'
  | 'permanent_companion';

export const HERO_STAT_LIMITS = {
  maxHp: 10,
  maxFate: 5,
  maxStrength: 12,
  maxIntellect: 12,
  xpPerStatUpgrade: 3,
} as const;

export const HERO_INVENTORY_LIMITS = {
  maxWeapons: 1,
  maxArmor: 1,
  maxCompanions: 3,
  maxOtherItems: 6,
  maxHandSize: 7,
} as const;

export interface CardEffect {
  healHp?: number;
  damageEnemy?: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusStrength?: number;
  bonusIntellect?: number;
  bonusWisdom?: number;
  bonusFate?: number;
  bonusGold?: number;
  bonusXp?: number;
  drawCards?: number;
  extraActions?: number;
  rerollFate?: boolean;
  removeCurse?: boolean;
  removeAllCurses?: boolean;
  statCheck?: {
    stat: 'strength' | 'intellect' | 'fate';
    difficulty: number;
    rewardGold?: number;
    rewardXp?: number;
    rewardCard?: boolean;
    healHp?: number;
    penaltyHp?: number;
    penaltyGold?: number;
    curseCardId?: string;
  };
  enemyProfile?: {
    name: LocalizedText;
    maxHp: number;
    attack: number;
    defense: number;
    goldReward: number;
    xpReward: number;
    trait: LocalizedText;
  };
  cursePenalty?: {
    strengthDelta?: number;
    intellectDelta?: number;
    fateDelta?: number;
    armorDelta?: number;
    hpDrainPerTurn?: number;
    goldDrainPerTurn?: number;
  };
  companionBonus?: {
    strength?: number;
    intellect?: number;
    fate?: number;
    armor?: number;
    attack?: number;
    goldPerTurn?: number;
    healPerTurn?: number;
  };
  weatherShift?: WeatherType;
}

export interface CardDefinition {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: CardCategory;
  rarity: CardRarity;
  activationCondition: {
    type: string;
    description: LocalizedText;
  };
  duration: {
    type: CardDurationType;
    description: LocalizedText;
  };
  discardCondition: {
    type: string;
    description: LocalizedText;
  };
  logText: LocalizedText;
  equipSlot: EquipSlot | null;
  goldCost: number;
  combatOnly: boolean;
  effect: CardEffect;
}

export interface RegionDefinition {
  id: RegionId;
  tier: RegionTier;
  name: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  threatLevel: number;
  imagePath: string;
  sealId: SealType;
  startLocationId: string;
}

export interface LocationDefinition {
  id: string; // loc_01 .. loc_84
  index: number;
  regionId: RegionId;
  sectorId: SectorId;
  sectorName: LocalizedText;
  name: LocalizedText;
  description: LocalizedText;
  terrain: LocationTerrain;
  dangerLevel: number; // 1..6
  x: number; // Deterministic map coordinate (0..1400)
  y: number; // Deterministic map coordinate (0..1040)
  neighbors: string[]; // bidirectional stable location IDs
  accessCondition: LocationAccessCondition;
  adventureSymbol: AdventureSymbol;
  dayEffect: LocationTimeEffect;
  nightEffect: LocationTimeEffect;
  weatherModifiers: Record<WeatherType, LocationWeatherEffect>;
  sealGuardianId?: string;
  sealReward?: SealType;
  isGateGuardianLair?: boolean;
  isFinalBossLair?: boolean;
  isInterRegionGate?: boolean;
}

export type HeroAbilityType =
  | 'warrior_surge'
  | 'mage_focus'
  | 'archer_precision'
  | 'paladin_bulwark'
  | 'rogue_shadow'
  | 'barbarian_rage'
  | 'druid_renewal'
  | 'necromancer_harvest'
  | 'demon_hunter_brand'
  | 'elven_blade_dance'
  | 'sorceress_starfire'
  | 'alchemist_brew';

export interface HeroDefinition {
  id: string;
  className: LocalizedText;
  name: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  lore: LocalizedText;
  portraitPath: string;
  startingRegionId: RegionId;
  startingLocationId: string;
  canTriggerMidwayEvents?: boolean;
  baseStats: {
    hp: number;
    maxHp: number;
    strength: number;
    intellect: number;
    fate: number;
    armor: number;
    gold: number;
    experience: number;
    actionsPerTurn: number;
  };
  startingEquipment: {
    weapon: string | null;
    armor: string | null;
    talisman: string | null;
  };
  startingResources: {
    gold: number;
    experience: number;
    cards: string[];
    description: LocalizedText;
  };
  abilityName: LocalizedText;
  abilityDescription: LocalizedText;
  abilityType: HeroAbilityType;
}

export interface EnemyDefinition {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  regionId: RegionId;
  tier:
    | 'minion'
    | 'elite'
    | 'gate_guardian'
    | 'seal_guardian'
    | 'citadel_guardian'
    | 'void_lord';
  maxHp: number;
  attack: number;
  defense: number;
  goldReward: number;
  sealReward?: SealType;
  specialTrait: LocalizedText;
}

export interface WorldEventDefinition {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  effectSummary: LocalizedText;
  type: 'blessing' | 'hazard' | 'omen' | 'market';
  hpDelta: number;
  goldDelta: number;
  fateDelta: number;
  enemyAttackMod: number;
}

export interface PlayerEquipment {
  weapon: string | null;
  armor: string | null;
  talisman: string | null;
}

export interface PlayerState {
  id: string;
  name: string;
  isAI: boolean;
  heroId: string;
  locationId: string;
  hp: number;
  maxHp: number;
  strength: number;
  intellect: number;
  fate: number;
  armor: number;
  gold: number;
  experience: number;
  hand: string[];
  inventory: string[];
  companions?: string[];
  curses?: string[];
  equipment: PlayerEquipment;
  seals: SealType[];
  gateGuardianDefeated: boolean;
  finalTrialsPassed: number;
  citadelGuardiansDefeated: number;
  defeatedCitadelGuardianIds?: string[];
  voidLordDefeated: boolean;
  actionsRemaining: number;
  tempAttackBonus: number;
  tempDefenseBonus: number;
  abilityUsedThisTurn: boolean;
  isDefeated: boolean;
  visitedLocationIds: string[];
  enemiesSlain: number;
}

export interface ActiveMovement {
  totalRoll: number;
  stepsRemaining: number;
  pathTaken: string[];
  rawRoll?: number;
  weatherMod?: number;
  fateRerollUsed?: boolean;
  rollRecordId?: string;
}

export interface ActiveCombat {
  enemyId: string;
  enemyCardId?: string;
  enemyNameOverride?: LocalizedText;
  enemyAttackOverride?: number;
  enemyDefenseOverride?: number;
  enemyGoldOverride?: number;
  enemyXpOverride?: number;
  enemyTraitOverride?: LocalizedText;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  isDefending: boolean;
  roundCount: number;
  lastPlayerRoll: number | null;
  lastEnemyRoll: number | null;
  combatPurpose:
    | 'roaming'
    | 'card_enemy'
    | 'gate_guardian'
    | 'seal_guardian'
    | 'citadel_guardian'
    | 'void_lord';
}

export interface ActiveEncounter {
  id: string;
  cardId?: string;
  title: LocalizedText;
  description: LocalizedText;
  statCheck: 'strength' | 'intellect' | 'fate';
  difficulty: number;
  rewardGold: number;
  rewardXp?: number;
  rewardHeal?: number;
  rewardCard: boolean;
  penaltyHp: number;
  penaltyGold?: number;
  curseCardId?: string;
  resolved: boolean;
  rollResult?: number;
  fateRerollUsed?: boolean;
  rollRecordId?: string;
  succeeded?: boolean;
}

export interface ChronicleEntry {
  id: string;
  round: number;
  timeOfDay: TimeOfDay;
  playerId: string | null;
  type: 'system' | 'move' | 'combat' | 'card' | 'seal' | 'world' | 'trial';
  text: LocalizedText;
}

export interface GameState {
  saveId: string;
  version: number;
  seed: number;
  rngState: number;
  mode: GameMode;
  phase: GamePhase;
  turnPhase: TurnPhase;
  turnCycleStep?: TurnCycleStep;
  turnGuidance?: LocalizedText | null;
  round: number;
  activePlayerIndex: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  activeWorldEventId: string | null;
  players: PlayerState[];
  deck: string[];
  discardPile: string[];
  adventureDeck?: string[];
  adventureDiscardPile?: string[];
  marketCardIds?: string[];
  movement: ActiveMovement | null;
  combat: ActiveCombat | null;
  encounter: ActiveEncounter | null;
  lastDiceRoll: number | null;
  diceHistory?: DiceRollRecord[];
  winnerPlayerId: string | null;
  chronicle: ChronicleEntry[];
  updatedAt: number;
}

export interface NewGameConfig {
  mode: GameMode;
  seed?: number;
  playerConfigs: Array<{
    name: string;
    heroId: string;
    isAI: boolean;
  }>;
}

export interface EngineResult {
  state: GameState;
  error?: LocalizedText;
}

export interface SaveSlotSummary {
  saveId: string;
  label: string;
  mode: GameMode;
  round: number;
  phase: GamePhase;
  playerCount: number;
  activeHeroName: LocalizedText;
  updatedAt: number;
}
