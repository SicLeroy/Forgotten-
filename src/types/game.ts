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

export type DayNightCyclePhase = 'day' | 'night';

export type WeatherType =
  | 'clear'
  | 'rain'
  | 'heavy_rain'
  | 'mist'
  | 'magic_fog'
  | 'snow'
  | 'blizzard'
  | 'heat'
  | 'dry_wind'
  | 'thunderstorm'
  | 'ash_storm'
  | 'frost_wind'
  | 'void_eclipse';

export interface WeatherRegionalEffect {
  description: LocalizedText;
  moveMod: number;
  physicalMod: number;
  magicMod: number;
  defenseMod: number;
  dangerMod: number;
}

export interface WeatherProfile {
  id: WeatherType;
  name: LocalizedText;
  description: LocalizedText;
  minDuration: number;
  maxDuration: number;
  moveMod: number;
  physicalMod: number;
  magicMod: number;
  defenseMod: number;
  dangerMod: number;
  blocksMountainPass: boolean;
  concealsEncounter: boolean;
  triggersMagicEvent: boolean;
  regionEffects: Record<RegionId, WeatherRegionalEffect>;
}

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
  allowFlee?: boolean;
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

export type CombatType = 'physical' | 'magic';

export type EnemySpecialEffectType =
  | 'none'
  | 'stone_armor'
  | 'arcane_ward'
  | 'first_strike'
  | 'burn_aura'
  | 'curse_strike'
  | 'void_oblivion';

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
  intellect?: number;
  defense: number;
  goldReward: number;
  xpReward?: number;
  sealReward?: SealType;
  specialEffectType?: EnemySpecialEffectType;
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

export type AiDifficulty = 'easy' | 'normal' | 'hard';

export type AiBehaviorStyle =
  | 'conqueror'
  | 'scholar'
  | 'merchant_tactician'
  | 'warden';

export type AiDecisionCategory =
  | 'route'
  | 'risk'
  | 'combat'
  | 'item'
  | 'quest'
  | 'shop'
  | 'seal'
  | 'weather'
  | 'day_night'
  | 'world_event'
  | 'rival'
  | 'fate';

export interface AiDecisionLogEntry {
  id: string;
  round: number;
  playerId: string;
  playerName: string;
  difficulty: AiDifficulty;
  style: AiBehaviorStyle;
  category: AiDecisionCategory;
  chosenAction: string;
  evaluatedOptions: Array<{ option: string; score: number }>;
  reasoning: LocalizedText;
}

export interface PlayerState {
  id: string;
  name: string;
  isAI: boolean;
  aiDifficulty?: AiDifficulty;
  aiStyle?: AiBehaviorStyle;
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

export interface CombatRoundBreakdown {
  round: number;
  combatType: CombatType;
  defenderSide: 'player' | 'enemy';
  heroBaseStat: number;
  heroGearBonus: number;
  heroModifiers: number;
  heroRoll: number;
  heroTotal: number;
  enemyStat: number;
  enemyModifiers: number;
  enemyRoll: number;
  enemyTotal: number;
  winner: 'player' | 'enemy';
  wasTie: boolean;
  hpLostByHero: number;
  damageToEnemy: number;
  specialEffectNote?: LocalizedText;
  summary: LocalizedText;
}

export interface ActiveCombat {
  enemyId: string;
  enemyCardId?: string;
  enemyTier?: EnemyDefinition['tier'] | 'pvp';
  enemyNameOverride?: LocalizedText;
  enemyAttackOverride?: number;
  enemyIntellectOverride?: number;
  enemyDefenseOverride?: number;
  enemyGoldOverride?: number;
  enemyXpOverride?: number;
  enemyTraitOverride?: LocalizedText;
  enemySpecialEffect?: EnemySpecialEffectType;
  pvpDefenderId?: string;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  isDefending: boolean;
  fleeAllowedByCard?: boolean;
  fleeAllowedByAbility?: boolean;
  roundCount: number;
  lastPlayerRoll: number | null;
  lastEnemyRoll: number | null;
  lastBreakdown?: CombatRoundBreakdown | null;
  combatLog?: CombatRoundBreakdown[];
  combatPurpose:
    | 'roaming'
    | 'card_enemy'
    | 'gate_guardian'
    | 'seal_guardian'
    | 'citadel_guardian'
    | 'void_lord'
    | 'pvp';
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

export type ChronicleScope = 'global' | 'local';

export interface ChronicleEntry {
  id: string;
  round: number;
  timeOfDay: TimeOfDay;
  playerId: string | null;
  type: 'system' | 'move' | 'combat' | 'card' | 'seal' | 'world' | 'trial';
  scope?: ChronicleScope;
  text: LocalizedText;
}

export type MajorWorldEventId =
  | 'major_dragon_awakening'
  | 'major_demon_rift'
  | 'major_spreading_curse'
  | 'major_blood_eclipse'
  | 'major_black_plague'
  | 'major_undead_invasion'
  | 'major_arcane_storm'
  | 'major_vanishing_caravans'
  | 'major_monster_uprising'
  | 'major_ancient_temple';

export type MajorWorldEventStage = 1 | 2 | 3;

export type WorldReactionTrigger =
  | 'combat_victory'
  | 'explore'
  | 'cleanse_curse'
  | 'spell_cast'
  | 'heal_or_rest'
  | 'trade'
  | 'npc_aid';

export interface MajorWorldEventStageSpec {
  stage: MajorWorldEventStage;
  title: LocalizedText;
  description: LocalizedText;
  consequenceSummary: LocalizedText;
  enemyAttackMod: number;
  marketPriceDelta: number;
  healingDelta: number;
  spellAttackBonus: number;
  nightDangerMod: number;
  hpDrainOnEscalation: number;
  cursePressure: boolean;
}

export interface MajorWorldEventDefinition {
  id: MajorWorldEventId;
  name: LocalizedText;
  description: LocalizedText;
  startText: LocalizedText;
  minDuration: number;
  maxDuration: number;
  targetRegionId: RegionId | 'all';
  interventionLocationIds: string[];
  interventionTerrains: LocationTerrain[];
  weatherShift: WeatherType;
  weatherBias: WeatherType[];
  dayNightImpact: LocalizedText;
  locationImpact: LocalizedText;
  cardImpact: LocalizedText;
  questTitle: LocalizedText;
  questDescription: LocalizedText;
  requiredProgress: number;
  interventionGoldCost: number;
  interventionActionCost: number;
  stages: [MajorWorldEventStageSpec, MajorWorldEventStageSpec, MajorWorldEventStageSpec];
  rewards: {
    gold: number;
    xp: number;
    hp: number;
    fate: number;
    drawCards: number;
  };
  completionText: LocalizedText;
  ignoredOutcomeText: LocalizedText;
}

export interface ActiveMajorWorldEvent {
  id: MajorWorldEventId;
  stage: MajorWorldEventStage;
  startedRound: number;
  roundsRemaining: number;
  totalDuration: number;
  interventionProgress: number;
  requiredProgress: number;
  intervenedThisRound: boolean;
  ignoredRoundsCount: number;
  targetLocationId: string;
}

export type NpcRole = 'merchant' | 'traveler' | 'quest_giver' | 'special';

export type NpcOptionActionType =
  | 'goto'
  | 'close'
  | 'accept_quest'
  | 'complete_quest'
  | 'merchant_bargain'
  | 'traveler_rumor'
  | 'special_blessing'
  | 'special_cleanse'
  | 'assist_major_event';

export interface NpcQuestSpec {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  objectiveType: 'slay_enemies' | 'explore_locations' | 'intervene_event' | 'gather_gold';
  targetCount: number;
  rewardGold: number;
  rewardXp: number;
  rewardFate: number;
  rewardCard: boolean;
}

export interface NpcDialogOption {
  id: string;
  label: LocalizedText;
  action: NpcOptionActionType;
  nextNodeId?: string;
  goldCost?: number;
  requiresQuestAvailable?: boolean;
  requiresQuestReady?: boolean;
  requiresActiveMajorEvent?: boolean;
  requiresCurse?: boolean;
}

export interface NpcDialogNode {
  id: string;
  text: LocalizedText;
  options: NpcDialogOption[];
}

export interface NpcDefinition {
  id: string;
  role: NpcRole;
  name: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  locationIds: string[];
  terrains: LocationTerrain[];
  quest?: NpcQuestSpec;
  entryNodeId: string;
  nodes: Record<string, NpcDialogNode>;
}

export interface NpcDynamicState {
  npcId: string;
  timesSpoken: number;
  questStatus: 'available' | 'active' | 'completed';
  questBaselineCount: number;
  questProgress: number;
  blessingUsedRound?: number;
  bargainUsedRound?: number;
}

export interface ActiveNpcDialogState {
  npcId: string;
  nodeId: string;
  dynamicNote?: LocalizedText | null;
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
  dayNightCycleRound?: number;
  dayNightPhase?: DayNightCyclePhase;
  weather: WeatherType;
  weatherDurationRemaining?: number;
  weatherTotalDuration?: number;
  activeWorldEventId: string | null;
  activeMajorEvents?: ActiveMajorWorldEvent[];
  completedMajorEventIds?: MajorWorldEventId[];
  npcStates?: Record<string, NpcDynamicState>;
  activeNpcDialog?: ActiveNpcDialogState | null;
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
  aiDifficulty?: AiDifficulty;
  aiDecisionLog?: AiDecisionLogEntry[];
  updatedAt: number;
}

export interface NewGameConfig {
  mode: GameMode;
  seed?: number;
  aiDifficulty?: AiDifficulty;
  playerConfigs: Array<{
    name: string;
    heroId: string;
    isAI: boolean;
    aiDifficulty?: AiDifficulty;
    aiStyle?: AiBehaviorStyle;
  }>;
}

export interface EngineResult {
  state: GameState;
  error?: LocalizedText;
}

export type SaveSlotKind = 'manual' | 'autosave';

export interface SaveIntegrityReport {
  valid: boolean;
  checksumMatched: boolean;
  schemaVersion: number;
  migratedFromVersion?: number;
  repairedIssues: LocalizedText[];
  fatalErrors: LocalizedText[];
}

export interface SaveLoadResult {
  state: GameState | null;
  recovered: boolean;
  recoverySource: 'primary' | 'repaired' | 'backup' | 'none';
  report: SaveIntegrityReport;
  notice?: LocalizedText;
}

export interface SaveSlotSummary {
  saveId: string;
  label: string;
  saveKind?: SaveSlotKind;
  schemaVersion?: number;
  checksumValid?: boolean;
  hasBackup?: boolean;
  mode: GameMode;
  round: number;
  phase: GamePhase;
  playerCount: number;
  activeHeroName: LocalizedText;
  updatedAt: number;
}
