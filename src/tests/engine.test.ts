import assert from 'node:assert/strict';
import {
  resolveAmbientProfileKey,
  soundEngine,
  WORLD_EVENT_AMBIENT_PROFILES,
} from '../audio/SoundEngine';
import {
  ADVENTURE_DECK_CARD_IDS,
  CARD_CATEGORY_COUNTS,
  CARD_MAP,
  CARDS,
  HERO_DECK_CARD_IDS,
} from '../data/cards';
import { ENEMIES, ENEMY_MAP } from '../data/enemies';
import { HEROES } from '../data/heroes';
import { LOCATION_MAP, LOCATIONS } from '../data/locations';
import { NPCS } from '../data/npcs';
import { REGIONS } from '../data/regions';
import { TEST_SCENARIO_PRESETS } from '../data/testFixtures';
import { MAJOR_WORLD_EVENTS } from '../data/worldEvents';
import { AiManager } from '../engine/AiManager';
import { inferChronicleScope } from '../engine/ChronicleHelper';
import { DayNightManager, HIDDEN_NIGHT_PASSAGES } from '../engine/DayNightManager';
import { GameManager } from '../engine/GameManager';
import { NavigationGraph } from '../engine/NavigationGraph';
import { NpcManager } from '../engine/NpcManager';
import { RandomManager } from '../engine/RandomManager';
import {
  canFleeCombat,
  computeCombatPreview,
  getActivePlayer,
  getPlayerEffectiveStats,
  RulesEngine,
} from '../engine/RulesEngine';
import { TurnManager } from '../engine/TurnManager';
import {
  CORE_WEATHER_TYPES,
  WEATHER_PROFILES,
  WeatherManager,
} from '../engine/WeatherManager';
import { MAX_ACTIVE_MAJOR_EVENTS, WorldEventManager } from '../engine/WorldEventManager';
import { rollD6 } from '../engine/rng';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { SaveManager } from '../storage/SaveManager';
import {
  AiBehaviorStyle,
  AiDifficulty,
  CardCategory,
  GameState,
  HERO_INVENTORY_LIMITS,
  MajorWorldEventId,
  NpcRole,
  SectorId,
} from '../types/game';
import { getEnemyBestiaryIntel } from '../utils/bestiary';
import { resolveWorldEventVisuals, WORLD_EVENT_VISUAL_MAP } from '../utils/worldEventVisuals';

function runTest(name: string, fn: () => void): void {
  fn();
  console.log(`PASS: ${name}`);
}

runTest('World data contains 3 regions, 84 connected locations, 12 heroes, and 300 unique cards', () => {
  assert.equal(REGIONS.length, 3, 'Expected 3 regions');
  assert.equal(LOCATIONS.length, 84, 'Expected 84 locations');
  assert.equal(HEROES.length, 12, 'Expected 12 heroes');
  assert.equal(CARDS.length, 300, 'Expected 300 cards');

  // Unique stable IDs & bilingual strings
  const locIds = new Set(LOCATIONS.map((l) => l.id));
  assert.equal(locIds.size, 84, 'Location IDs must be unique');
  for (const loc of LOCATIONS) {
    assert.ok(loc.name.uk.length > 0 && loc.name.en.length > 0, `Location ${loc.id} needs UA/EN names`);
    assert.ok(loc.neighbors.length > 0, `Location ${loc.id} must have neighbors`);
    for (const n of loc.neighbors) {
      const neighbor = LOCATION_MAP.get(n);
      assert.ok(neighbor, `Neighbor ${n} must exist`);
      assert.ok(neighbor.neighbors.includes(loc.id), `Edge ${loc.id}<->${n} must be bidirectional`);
    }
  }

  // Verify full graph connectivity across all 84 locations via BFS from loc_01
  const visited = new Set<string>(['loc_01']);
  const queue = ['loc_01'];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const loc = LOCATION_MAP.get(curr)!;
    for (const n of loc.neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  assert.equal(visited.size, 84, 'All 84 locations must be reachable from loc_01');
  assert.ok(visited.has('loc_84'), 'Throne of the Void (loc_84) must be reachable');

  const cardIds = new Set(CARDS.map((c) => c.id));
  const cardNamesUk = new Set(CARDS.map((c) => c.name.uk));
  const cardNamesEn = new Set(CARDS.map((c) => c.name.en));
  assert.equal(cardIds.size, 300, 'All 300 card IDs must be unique');
  assert.equal(cardNamesUk.size, 300, 'All 300 Ukrainian card names must be unique');
  assert.equal(cardNamesEn.size, 300, 'All 300 English card names must be unique');
});

runTest('SeededRNG d6 rolls are deterministic and unrigged', () => {
  let s1 = 424242;
  let s2 = 424242;
  for (let i = 0; i < 50; i++) {
    const r1 = rollD6(s1);
    const r2 = rollD6(s2);
    assert.equal(r1.roll, r2.roll, 'Identical seeds must yield identical d6 rolls');
    s1 = r1.nextState;
    s2 = r2.nextState;
  }

  const counts = [0, 0, 0, 0, 0, 0];
  let rng = 987654321;
  for (let i = 0; i < 6000; i++) {
    const res = rollD6(rng);
    assert.ok(res.roll >= 1 && res.roll <= 6, 'd6 must be between 1 and 6');
    counts[res.roll - 1] += 1;
    rng = res.nextState;
  }
  for (let face = 0; face < 6; face++) {
    assert.ok(
      counts[face] >= 850 && counts[face] <= 1150,
      `Face ${face + 1} count ${counts[face]} should be close to uniform 1000`
    );
  }
});

runTest('RulesEngine enforces valid movement, turn cycling, and reproducible state', () => {
  const cfg = {
    mode: 'solo_ai' as const,
    seed: 123456,
    playerConfigs: [
      { name: 'Kaelen', heroId: 'hero_01', isAI: false },
      { name: 'Lyrael', heroId: 'hero_02', isAI: true },
    ],
  };

  const g1 = RulesEngine.createNewGame(cfg);
  const g2 = RulesEngine.createNewGame(cfg);
  assert.equal(g1.rngState, g2.rngState);
  assert.deepEqual(g1.players[0].hand, g2.players[0].hand, 'Starting hands must be deterministic');

  // Invalid non-adjacent move rejected
  const invalidMove = RulesEngine.moveToLocation(g1, 'loc_84');
  assert.ok(invalidMove.error, 'Non-adjacent move must return an error');
  assert.equal(invalidMove.state.players[0].locationId, 'loc_01');

  // Valid move to adjacent neighbor
  const neighborId = LOCATION_MAP.get('loc_01')!.neighbors[0];
  const validMove = RulesEngine.moveToLocation(g1, neighborId);
  assert.equal(validMove.error, undefined);
  assert.equal(validMove.state.players[0].locationId, neighborId);
  assert.equal(validMove.state.players[0].actionsRemaining, 1);

  // End player 1 turn -> AI runs -> wraps round 2 and shifts timeOfDay from dawn to day
  const afterP1End = RulesEngine.endTurn(validMove.state).state;
  assert.equal(afterP1End.activePlayerIndex, 1);
  const afterAi = RulesEngine.runAiTurn(afterP1End);
  assert.equal(afterAi.round, 2);
  assert.equal(afterAi.timeOfDay, 'day');
  assert.equal(afterAi.activePlayerIndex, 0);
});

runTest('RulesEngine handles equipment stats, Seal combat, and Victory at Throne of the Void', () => {
  let state: GameState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 77777,
    playerConfigs: [{ name: 'Eldrin', heroId: 'hero_12', isAI: false }],
  });

  // Equip a weapon card via inventory
  const weaponCard = CARDS.find((c) => c.equipSlot === 'weapon' && c.rarity === 'legendary')!;
  state.players[0].inventory.push(weaponCard.id);
  state = RulesEngine.equipFromInventory(state, weaponCard.id).state;
  const effBefore = getPlayerEffectiveStats(getActivePlayer(state));
  assert.ok(effBefore.strength > state.players[0].strength, 'Equipped weapon must boost Strength');

  // Move to Thunderpeak Sanctum (loc_28) and challenge Seal of Power Guardian
  state.players[0].locationId = 'loc_28';
  state.players[0].strength = 12;
  state.players[0].tempAttackBonus = 8;
  state.players[0].hp = 10;
  state = RulesEngine.challengeSealGuardian(state).state;
  assert.equal(state.turnPhase, 'COMBAT');
  assert.ok(state.combat);

  let guardLoops = 0;
  while (state.turnPhase === 'COMBAT' && guardLoops < 20) {
    state = RulesEngine.combatAttack(state).state;
    guardLoops++;
  }
  assert.equal(state.turnPhase, 'ACTION');
  assert.ok(state.players[0].seals.includes('seal_power'), 'Must earn Seal of Power');

  // Grant remaining Seals, Trials, and Guardians to verify Throne of the Void final victory path
  state.players[0].seals = ['seal_power', 'seal_wisdom', 'seal_fate'];
  state.players[0].finalTrialsPassed = 2;
  state.players[0].locationId = 'loc_84';
  state.players[0].actionsRemaining = 2;
  state.players[0].tempAttackBonus = 12;
  state.players[0].hp = 10;
  state = RulesEngine.attemptFinalTrial(state).state;
  assert.equal(state.players[0].finalTrialsPassed, 3);

  state.players[0].citadelGuardiansDefeated = 2;
  state = RulesEngine.challengeVoidLord(state).state;
  assert.equal(state.turnPhase, 'COMBAT');
  assert.equal(state.combat?.enemyId, ENEMY_MAP.get('enemy_void_lord')!.id);

  let bossLoops = 0;
  while (state.phase === 'PLAYING' && bossLoops < 20) {
    state = RulesEngine.combatAttack(state).state;
    bossLoops++;
  }
  assert.equal(state.phase, 'VICTORY', 'Defeating Lord of the Void must trigger VICTORY');
  assert.equal(state.winnerPlayerId, state.players[0].id);
});

runTest('GameManager, TurnManager, RandomManager, LocalizationManager, SaveManager, and testFixtures integrate cleanly', () => {
  assert.ok(TEST_SCENARIO_PRESETS.length >= 2);
  let state = GameManager.startNewGame(TEST_SCENARIO_PRESETS[1].config);
  assert.equal(state.players.length, 4);
  assert.equal(state.timeOfDay, 'dawn');

  // Verify LocalizationManager returns distinct UK and EN strings
  assert.notEqual(LocalizationManager.t('uk', 'newGame'), LocalizationManager.t('en', 'newGame'));
  assert.ok(typeof SaveManager.saveGame === 'function');
  assert.ok(typeof RandomManager.rollD6 === 'function');

  // Rotate through 4 players via GameManager.dispatch END_TURN and verify TurnManager advances day/night
  for (let i = 0; i < 4; i++) {
    const res = GameManager.dispatch(state, { type: 'END_TURN' });
    assert.equal(res.error, undefined);
    state = res.state;
  }
  assert.equal(state.round, 2);
  assert.equal(state.timeOfDay, 'day');

  // Verify TurnManager direct call advances turn safely
  TurnManager.advanceTurn(state);
  assert.equal(state.activePlayerIndex, 1);
});

runTest('NavigationGraph validates all 84 locations, 15 sectors, and mandatory goals', () => {
  const report = NavigationGraph.validateGraph();
  assert.equal(report.valid, true, `Graph validation failed: ${report.errors.join('; ')}`);
  assert.equal(report.totalLocations, 84);
  assert.equal(report.isolatedLocationIds.length, 0);
  assert.equal(report.unreachableFromStart.length, 0);
  assert.equal(report.unreachableMiddleWithoutGate, 0);
  assert.equal(report.reachableMiddleWithGate, 30);
  assert.equal(report.unreachableInnerWithoutSeals, 0);
  assert.equal(report.reachableInnerWithSeals, 12);
  assert.equal(report.missingMandatoryGoals.length, 0);

  // Verify exact sector counts: 6x7 (42) + 5x6 (30) + 4x3 (12) = 84
  const expectedSectors: Record<SectorId, number> = {
    sec_forest: 7,
    sec_rural: 7,
    sec_mountain: 7,
    sec_ancient_ruins: 7,
    sec_river: 7,
    sec_borderlands: 7,
    sec_cursed_forest: 6,
    sec_ruined_lands: 6,
    sec_volcanic: 6,
    sec_demon_lands: 6,
    sec_ancient_temples: 6,
    sec_shattered_gates: 3,
    sec_path_of_trials: 3,
    sec_guardian_citadel: 3,
    sec_heart_of_darkness: 3,
  };

  const counts = new Map<SectorId, number>();
  for (const loc of LOCATIONS) {
    assert.ok(loc.description.uk.length > 0 && loc.description.en.length > 0);
    assert.ok(loc.sectorName.uk.length > 0 && loc.sectorName.en.length > 0);
    assert.ok(loc.dayEffect.description.uk.length > 0);
    assert.ok(loc.nightEffect.description.uk.length > 0);
    assert.ok(loc.weatherModifiers.clear.description.uk.length > 0);
    counts.set(loc.sectorId, (counts.get(loc.sectorId) ?? 0) + 1);
  }
  for (const [sectorId, expectedCount] of Object.entries(expectedSectors) as Array<[SectorId, number]>) {
    assert.equal(counts.get(sectorId), expectedCount, `Sector ${sectorId} must have ${expectedCount} locations`);
  }
});

runTest('Gate Guardian and Three Seals progression locks work and d6 branching delays events to destination', () => {
  // Use seed where first d6 roll >= 2 so we can test intermediate step behavior reliably
  let state: GameState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 55555,
    playerConfigs: [
      { name: 'Kaelen', heroId: 'hero_01', isAI: false },
      { name: 'Selene', heroId: 'hero_05', isAI: false },
    ],
  });

  // 1. Cannot cross from loc_42 to loc_43 without defeating Gate Guardian
  state.players[0].locationId = 'loc_42';
  state.players[0].actionsRemaining = 2;
  const blockedMiddle = RulesEngine.moveToLocation(state, 'loc_43');
  assert.ok(blockedMiddle.error, 'Middle Region must stay locked until Gate Guardian is defeated');

  // Defeat Gate Guardian at loc_42
  state.players[0].strength = 12;
  state.players[0].tempAttackBonus = 10;
  state.players[0].hp = 10;
  state = RulesEngine.challengeGateGuardian(state).state;
  assert.equal(state.turnPhase, 'COMBAT');
  let loops = 0;
  while (state.turnPhase === 'COMBAT' && loops < 15) {
    state = RulesEngine.combatAttack(state).state;
    loops++;
  }
  assert.equal(state.players[0].gateGuardianDefeated, true, 'Gate Guardian defeat flag must be set');

  const enteredMiddle = RulesEngine.moveToLocation(state, 'loc_43');
  assert.equal(enteredMiddle.error, undefined, 'Middle Region must unlock after defeating Gate Guardian');
  state = enteredMiddle.state;
  assert.equal(state.players[0].locationId, 'loc_43');

  // 2. Cannot cross from loc_72 to loc_73 without all 3 Seals
  state.turnPhase = 'ACTION';
  state.combat = null;
  state.players[0].locationId = 'loc_72';
  state.players[0].actionsRemaining = 2;
  state.players[0].seals = ['seal_power', 'seal_fate'];
  const blockedInner = RulesEngine.moveToLocation(state, 'loc_73');
  assert.ok(blockedInner.error, 'Inner Region must require all 3 Seals');

  state.players[0].seals = ['seal_power', 'seal_fate', 'seal_wisdom'];
  const enteredInner = RulesEngine.moveToLocation(state, 'loc_73');
  assert.equal(enteredInner.error, undefined, 'Inner Region must unlock with 3 Seals');
  state = enteredInner.state;

  // Test Citadel Guardian at loc_80
  state.turnPhase = 'ACTION';
  state.combat = null;
  state.players[0].finalTrialsPassed = 3;
  state.players[0].locationId = 'loc_80';
  state.players[0].tempAttackBonus = 12;
  state.players[0].hp = 10;
  state = RulesEngine.challengeCitadelGuardian(state).state;
  assert.equal(state.turnPhase, 'COMBAT');
  assert.equal(state.combat?.enemyId, 'enemy_citadel_sentinel');
  while (state.turnPhase === 'COMBAT') {
    state = RulesEngine.combatAttack(state).state;
  }
  assert.equal(state.players[0].citadelGuardiansDefeated, 1);

  // 3. Test d6 rollMovement + branching stepMove + destination-only event rule
  state.players[0].locationId = 'loc_01';
  state.players[0].actionsRemaining = 2;
  // Find a seed that rolls >= 2 on rollMovement
  let moveTestState = { ...state, rngState: 12345 };
  moveTestState = RulesEngine.rollMovement(moveTestState).state;
  if ((moveTestState.movement?.totalRoll ?? 1) === 1) {
    moveTestState = RulesEngine.stepMove(moveTestState, LOCATION_MAP.get('loc_01')!.neighbors[0]).state;
    moveTestState.players[0].actionsRemaining = 2;
    moveTestState = RulesEngine.rollMovement(moveTestState).state;
  }
  assert.equal(moveTestState.turnPhase, 'MOVING');
  const initialSteps = moveTestState.movement!.stepsRemaining;
  assert.ok(initialSteps >= 2, 'Expected multi-step d6 movement for branch test');

  const step1Target = LOCATION_MAP.get(moveTestState.players[0].locationId)!.neighbors[0];
  moveTestState = RulesEngine.stepMove(moveTestState, step1Target).state;
  assert.equal(moveTestState.turnPhase, 'MOVING', 'Intermediate step must not end movement or trigger events');
  assert.equal(moveTestState.movement?.stepsRemaining, initialSteps - 1);

  // Hero 01 cannot stop early on non-objective node
  const deniedStop = RulesEngine.stopMovementEarly(moveTestState);
  assert.ok(deniedStop.error, 'Standard hero cannot stop early on non-objective node');

  // Complete remaining steps to trigger destination outcome
  while (moveTestState.turnPhase === 'MOVING') {
    const currId = moveTestState.players[0].locationId;
    const nextOpen = NavigationGraph.getNeighborStatuses(moveTestState.players[0], currId).find(
      (n) => n.allowed
    )!;
    moveTestState = RulesEngine.stepMove(moveTestState, nextOpen.location.id).state;
  }
  assert.equal(moveTestState.movement, null);
  assert.ok(moveTestState.turnPhase === 'ACTION' || moveTestState.turnPhase === 'COMBAT');

  // Hero 05 (Selene Shadowstep) CAN stop early due to canTriggerMidwayEvents ability
  let seleneState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 99999,
    playerConfigs: [{ name: 'Selene', heroId: 'hero_05', isAI: false }],
  });
  seleneState = RulesEngine.rollMovement(seleneState).state;
  if ((seleneState.movement?.stepsRemaining ?? 0) >= 2) {
    const nextNeighbor = LOCATION_MAP.get(seleneState.players[0].locationId)!.neighbors[0];
    seleneState = RulesEngine.stepMove(seleneState, nextNeighbor).state;
    const stopRes = RulesEngine.stopMovementEarly(seleneState);
    assert.equal(stopRes.error, undefined, 'Selene must be allowed to stop early and trigger event');
    assert.equal(stopRes.state.movement, null);
  }
});

runTest('12 heroes have approved attributes, unique portraits, valid gear, stat caps, XP upgrades, and working abilities', () => {
  const expectedStats: Array<{ id: string; str: number; int: number; hp: number; fate: number }> = [
    { id: 'hero_01', str: 5, int: 2, hp: 6, fate: 2 },
    { id: 'hero_02', str: 2, int: 5, hp: 4, fate: 4 },
    { id: 'hero_03', str: 4, int: 3, hp: 5, fate: 3 },
    { id: 'hero_04', str: 4, int: 3, hp: 6, fate: 2 },
    { id: 'hero_05', str: 3, int: 4, hp: 4, fate: 4 },
    { id: 'hero_06', str: 5, int: 2, hp: 6, fate: 2 },
    { id: 'hero_07', str: 3, int: 4, hp: 5, fate: 3 },
    { id: 'hero_08', str: 2, int: 5, hp: 4, fate: 3 },
    { id: 'hero_09', str: 4, int: 3, hp: 5, fate: 3 },
    { id: 'hero_10', str: 4, int: 4, hp: 5, fate: 2 },
    { id: 'hero_11', str: 2, int: 5, hp: 4, fate: 4 },
    { id: 'hero_12', str: 3, int: 4, hp: 5, fate: 3 },
  ];

  const portraits = new Set<string>();
  const cardById = new Map(CARDS.map((c) => [c.id, c]));

  for (const exp of expectedStats) {
    const hero = HEROES.find((h) => h.id === exp.id)!;
    assert.ok(hero, `Missing ${exp.id}`);
    assert.equal(hero.baseStats.strength, exp.str, `${exp.id} strength mismatch`);
    assert.equal(hero.baseStats.intellect, exp.int, `${exp.id} intellect mismatch`);
    assert.equal(hero.baseStats.hp, exp.hp, `${exp.id} hp mismatch`);
    assert.equal(hero.baseStats.fate, exp.fate, `${exp.id} fate mismatch`);
    assert.equal(hero.baseStats.maxHp, 10, `${exp.id} maxHp must be 10`);
    assert.ok(hero.description.uk.length > 10 && hero.lore.uk.length > 10);
    assert.ok(hero.portraitPath.startsWith('/src/assets/images/'));
    portraits.add(hero.portraitPath);

    if (hero.startingEquipment.weapon) {
      assert.equal(cardById.get(hero.startingEquipment.weapon)?.equipSlot, 'weapon');
    }
    if (hero.startingEquipment.armor) {
      assert.equal(cardById.get(hero.startingEquipment.armor)?.equipSlot, 'armor');
    }
    if (hero.startingEquipment.talisman) {
      assert.equal(cardById.get(hero.startingEquipment.talisman)?.equipSlot, 'talisman');
    }
    for (const cid of hero.startingResources.cards) {
      assert.ok(cardById.has(cid), `Resource card ${cid} must exist for ${exp.id}`);
    }
  }
  assert.equal(portraits.size, 12, 'All 12 heroes must have distinct portrait paths');

  // Verify XP upgrade rules (3 XP -> +1 stat up to cap 12) and HP/Fate caps
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 10101,
    playerConfigs: [{ name: 'Kaelen', heroId: 'hero_01', isAI: false }],
  });
  assert.equal(state.players[0].hp, 6);
  assert.equal(state.players[0].maxHp, 10);
  assert.ok(state.players[0].equipment.weapon === 'card_001');
  assert.ok(state.players[0].equipment.armor === 'card_027');

  state.players[0].experience = 2;
  const tooLowXp = RulesEngine.upgradeStat(state, 'strength');
  assert.ok(tooLowXp.error, 'Upgrade must fail when XP < 3');

  state.players[0].experience = 3;
  const upgradedStr = RulesEngine.upgradeStat(state, 'strength');
  assert.equal(upgradedStr.error, undefined);
  assert.equal(upgradedStr.state.players[0].strength, 6);
  assert.equal(upgradedStr.state.players[0].experience, 0);

  const atCap = {
    ...upgradedStr.state,
    players: [{ ...upgradedStr.state.players[0], strength: 12, experience: 6 }],
  };
  const rejectedCap = RulesEngine.upgradeStat(atCap, 'strength');
  assert.ok(rejectedCap.error, 'Strength upgrade must fail at max cap 12');

  const healed = RulesEngine.restAtLocation({
    ...upgradedStr.state,
    players: [{ ...upgradedStr.state.players[0], hp: 9 }],
  });
  assert.equal(healed.state.players[0].hp, 10, 'Rest healing must not exceed maxHp 10');

  const effFate = getPlayerEffectiveStats({
    ...upgradedStr.state.players[0],
    fate: 5,
    seals: ['seal_fate'],
  });
  assert.equal(effFate.fate, 5, 'Effective Fate must be capped at 5');

  // Verify all 12 hero abilities execute and mutate state via RulesEngine
  for (const hero of HEROES) {
    let hState = RulesEngine.createNewGame({
      mode: 'local_hotseat',
      seed: 20202,
      playerConfigs: [{ name: hero.name.en, heroId: hero.id, isAI: false }],
    });
    hState.players[0].hp = 3; // allow healing abilities to show effect
    hState.turnPhase = 'COMBAT';
    hState.combat = {
      enemyId: 'enemy_r1_wolf',
      enemyCurrentHp: 9,
      enemyMaxHp: 9,
      isDefending: false,
      roundCount: 1,
      lastPlayerRoll: null,
      lastEnemyRoll: null,
      combatPurpose: 'roaming',
    };

    const beforePlayer = hState.players[0];
    const beforeEnemyHp = hState.combat.enemyCurrentHp;
    const res = RulesEngine.useHeroAbility(hState);
    assert.equal(res.error, undefined, `Ability failed for ${hero.id}`);
    const afterPlayer = res.state.players[0];
    assert.equal(afterPlayer.abilityUsedThisTurn, true, `${hero.id} must mark ability used`);

    const changed =
      afterPlayer.tempAttackBonus !== beforePlayer.tempAttackBonus ||
      afterPlayer.tempDefenseBonus !== beforePlayer.tempDefenseBonus ||
      afterPlayer.hp !== beforePlayer.hp ||
      afterPlayer.gold !== beforePlayer.gold ||
      afterPlayer.actionsRemaining !== beforePlayer.actionsRemaining ||
      afterPlayer.hand.length !== beforePlayer.hand.length ||
      (res.state.combat?.enemyCurrentHp ?? 0) !== beforeEnemyHp;

    assert.ok(changed, `Ability for ${hero.id} (${hero.abilityType}) must have a measurable gameplay effect`);
  }
});

runTest('Multi-player defeat advances turn without soft-lock, Citadel Guardians are unique, and BFS finds routes', () => {
  // 1. Player 1 falls in combat while Player 2 is alive -> turn advances cleanly to Player 2
  let mpState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 30303,
    playerConfigs: [
      { name: 'Fallen Hero', heroId: 'hero_02', isAI: false },
      { name: 'Survivor', heroId: 'hero_01', isAI: false },
    ],
  });
  mpState.players[0].hp = 1;
  mpState.players[0].strength = 0;
  mpState.players[0].intellect = 0;
  mpState.turnPhase = 'COMBAT';
  mpState.combat = {
    enemyId: 'enemy_void_lord',
    enemyCurrentHp: 40,
    enemyMaxHp: 40,
    isDefending: false,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatPurpose: 'roaming',
  };
  let defeatLoop = 0;
  while (!mpState.players[0].isDefeated && defeatLoop < 10) {
    mpState = RulesEngine.combatAttack(mpState).state;
    defeatLoop++;
  }
  assert.equal(mpState.players[0].isDefeated, true, 'Player 1 must be marked defeated');
  assert.equal(mpState.phase, 'PLAYING', 'Game continues while Player 2 is alive');
  assert.equal(mpState.activePlayerIndex, 1, 'Active turn must advance to living Player 2');
  assert.equal(mpState.combat, null, 'Fallen player combat must be cleared');
  assert.equal(mpState.turnPhase, 'ACTION', 'Living player must start in ACTION phase');

  // 2. Same Citadel Guardian at loc_80 cannot be farmed twice
  let citState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 40404,
    playerConfigs: [{ name: 'Challenger', heroId: 'hero_01', isAI: false }],
  });
  citState.players[0].seals = ['seal_power', 'seal_wisdom', 'seal_fate'];
  citState.players[0].finalTrialsPassed = 3;
  citState.players[0].locationId = 'loc_80';
  citState.players[0].tempAttackBonus = 15;
  citState.players[0].hp = 10;
  citState = RulesEngine.challengeCitadelGuardian(citState).state;
  while (citState.turnPhase === 'COMBAT') {
    citState = RulesEngine.combatAttack(citState).state;
  }
  assert.equal(citState.players[0].citadelGuardiansDefeated, 1);
  const repeatGuardian = RulesEngine.challengeCitadelGuardian(citState);
  assert.ok(repeatGuardian.error, 'Fighting the same Citadel Guardian twice must be rejected');

  // 3. BFS shortest path respects access locks
  const fresh = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 50505,
    playerConfigs: [{ name: 'Pathfinder', heroId: 'hero_03', isAI: false }],
  });
  const stepToSeal = NavigationGraph.findNextStepToward(fresh.players[0], 'loc_01', 'loc_28');
  assert.ok(stepToSeal && LOCATION_MAP.get('loc_01')!.neighbors.includes(stepToSeal));
  const blockedStep = NavigationGraph.findNextStepToward(fresh.players[0], 'loc_01', 'loc_84');
  assert.equal(blockedStep, null, 'Path to loc_84 must be blocked before Gate Guardian and 3 Seals');

  // 4. Chronicle entry IDs must stay unique even when >80 entries occur at the same round and rngState
  let logState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 60606,
    playerConfigs: [{ name: 'Chronicler', heroId: 'hero_01', isAI: false }],
  });
  for (let i = 0; i < 95; i++) {
    logState.players[0].actionsRemaining = 2;
    logState.players[0].hp = 4;
    logState = RulesEngine.restAtLocation(logState).state;
  }
  const uniqueIds = new Set(logState.chronicle.map((e) => e.id));
  assert.equal(
    uniqueIds.size,
    logState.chronicle.length,
    'All chronicle entry IDs must remain strictly unique'
  );
});

runTest('Full 8-step turn cycle, diceHistory RNG audit, and Fate reroll anti-double-spend rules', () => {
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 70707,
    playerConfigs: [
      { name: 'Kaelen', heroId: 'hero_01', isAI: false },
      { name: 'Lyrael', heroId: 'hero_02', isAI: false },
    ],
  });

  // Steps 1 & 2 ran at game creation -> ready at Step 3 (dice_roll)
  assert.equal(state.turnCycleStep, 'dice_roll');
  assert.ok(state.chronicle.some((e) => e.text.uk.includes('1. Початок ходу')));
  assert.ok(state.chronicle.some((e) => e.text.uk.includes('2. Застосування ефектів')));

  // Step 3 -> Step 4: Roll movement d6
  const rollRes = RulesEngine.rollMovement(state);
  assert.equal(rollRes.error, undefined);
  state = rollRes.state;
  assert.equal(state.turnPhase, 'MOVING');
  assert.equal(state.turnCycleStep, 'movement');
  assert.ok((state.diceHistory?.length ?? 0) >= 1);

  const initialRecord = state.diceHistory![0];
  assert.equal(initialRecord.purpose, 'movement');
  assert.equal(initialRecord.fateSpent, 0);
  assert.equal(initialRecord.rerolled, false);
  // Verify rngBefore -> roll matches Mulberry32 rollD6
  const verifiedInitial = rollD6(initialRecord.rngBefore);
  assert.equal(verifiedInitial.roll, initialRecord.roll);
  assert.equal(verifiedInitial.nextState, initialRecord.rngAfter);

  const fateBefore = state.players[0].fate;
  assert.ok(fateBefore >= 1);

  // Spend 1 Fate -> single reroll allowed, second result mandatory
  const rerollRes = RulesEngine.rerollMovementDice(state);
  assert.equal(rerollRes.error, undefined);
  state = rerollRes.state;
  assert.equal(state.players[0].fate, fateBefore - 1);
  assert.equal(state.movement?.fateRerollUsed, true);
  const rerolledRecord = state.diceHistory![0];
  assert.equal(rerolledRecord.rerolled, true);
  assert.equal(rerolledRecord.previousRoll, initialRecord.roll);
  assert.equal(rerolledRecord.fateSpent, 1);

  // Attempt to spend Fate a SECOND time on the same roll -> MUST be rejected
  const doubleSpend = RulesEngine.rerollMovementDice(state);
  assert.ok(doubleSpend.error, 'Double-spending Fate on the same roll must be rejected');
  assert.equal(doubleSpend.state.players[0].fate, fateBefore - 1, 'Fate must not be deducted on rejected reroll');

  // Cannot reroll with 0 Fate points
  let zeroFateState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 71717,
    playerConfigs: [{ name: 'Unlucky', heroId: 'hero_01', isAI: false }],
  });
  zeroFateState.players[0].fate = 0;
  zeroFateState = RulesEngine.rollMovement(zeroFateState).state;
  const zeroFateReroll = RulesEngine.rerollMovementDice(zeroFateState);
  assert.ok(zeroFateReroll.error, 'Reroll with 0 Fate must be rejected');

  // Cannot reroll after taking a step along route
  let steppedState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 72727,
    playerConfigs: [{ name: 'Walker', heroId: 'hero_02', isAI: false }],
  });
  steppedState = RulesEngine.rollMovement(steppedState).state;
  while ((steppedState.movement?.totalRoll ?? 0) < 2) {
    steppedState = RulesEngine.createNewGame({
      mode: 'local_hotseat',
      seed: steppedState.rngState,
      playerConfigs: [{ name: 'Walker', heroId: 'hero_02', isAI: false }],
    });
    steppedState = RulesEngine.rollMovement(steppedState).state;
  }
  const adjOpen = NavigationGraph.getNeighborStatuses(steppedState.players[0], steppedState.players[0].locationId).find((n) => n.allowed)!;
  steppedState = RulesEngine.stepMove(steppedState, adjOpen.location.id).state;
  const rerollAfterStep = RulesEngine.rerollMovementDice(steppedState);
  assert.ok(rerollAfterStep.error, 'Reroll must be blocked after starting movement along route');

  // Encounter roll + Fate reroll + Confirm mandatory second result
  let encState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 73737,
    playerConfigs: [
      { name: 'Scholar', heroId: 'hero_02', isAI: false },
      { name: 'Guardian', heroId: 'hero_01', isAI: false },
    ],
  });
  encState.turnPhase = 'ENCOUNTER';
  encState.turnCycleStep = 'encounter';
  encState.encounter = {
    id: 'test_enc_1',
    title: { uk: 'Таємний вівтар', en: 'Secret Altar' },
    description: { uk: 'Перевірка інтелекту', en: 'Intellect check' },
    statCheck: 'intellect',
    difficulty: 7,
    rewardGold: 12,
    rewardCard: false,
    penaltyHp: 1,
    resolved: false,
    fateRerollUsed: false,
  };
  encState = RulesEngine.rollEncounterCheck(encState).state;
  const firstEncRoll = encState.encounter!.rollResult!;
  assert.ok(firstEncRoll >= 1 && firstEncRoll <= 6);

  const encFateBefore = encState.players[0].fate;
  encState = RulesEngine.rerollEncounterCheck(encState).state;
  assert.equal(encState.players[0].fate, encFateBefore - 1);
  assert.equal(encState.encounter!.fateRerollUsed, true);

  const doubleEncReroll = RulesEngine.rerollEncounterCheck(encState);
  assert.ok(doubleEncReroll.error, 'Double Fate reroll on encounter check must be rejected');

  const rngBeforeConfirm = encState.rngState;
  encState = RulesEngine.resolveEncounter(encState).state;
  assert.equal(encState.rngState, rngBeforeConfirm, 'Confirming rolled encounter check must use the mandatory roll without extra RNG roll');
  assert.equal(encState.encounter, null);
  assert.equal(encState.turnPhase, 'ACTION');

  // Step 7 & Step 8 -> Player 2 Step 1 & Step 2
  const afterEndTurn = RulesEngine.endTurn(encState).state;
  assert.equal(afterEndTurn.activePlayerIndex, 1);
  assert.equal(afterEndTurn.turnCycleStep, 'dice_roll');
  assert.ok(afterEndTurn.chronicle.some((e) => e.text.uk.includes('7. Завершення ходу')));
  assert.ok(afterEndTurn.chronicle.some((e) => e.text.uk.includes('8. Передача ходу')));
});

runTest('All movement variants: single-step, multi-step branching, weather modifiers, early stop rules, and lock gates', () => {
  // Variant 1: Single-step moveToLocation + non-adjacent rejection + 0-actions rejection
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 80808,
    playerConfigs: [{ name: 'Ranger', heroId: 'hero_03', isAI: false }],
  });
  const startId = state.players[0].locationId;
  const openNeighbors = NavigationGraph.getNeighborStatuses(state.players[0], startId).filter((n) => n.allowed);
  assert.ok(openNeighbors.length >= 1);

  const badTarget = LOCATIONS.find((l) => l.id !== startId && !LOCATION_MAP.get(startId)!.neighbors.includes(l.id))!;
  assert.ok(RulesEngine.moveToLocation(state, badTarget.id).error, 'Non-adjacent moveToLocation must fail');

  state.players[0].actionsRemaining = 0;
  assert.ok(RulesEngine.moveToLocation(state, openNeighbors[0].location.id).error, 'Move with 0 actions must fail');
  assert.ok(RulesEngine.rollMovement(state).error, 'rollMovement with 0 actions must fail');

  state.players[0].actionsRemaining = 2;
  const singleMove = RulesEngine.moveToLocation(state, openNeighbors[0].location.id);
  assert.equal(singleMove.error, undefined);
  assert.equal(singleMove.state.players[0].locationId, openNeighbors[0].location.id);
  assert.equal(singleMove.state.players[0].actionsRemaining, 1);

  // Variant 2: Weather moveMod adjusts totalRoll while clamping minimum to 1 step
  let weatherState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 81818,
    playerConfigs: [{ name: 'Warden', heroId: 'hero_01', isAI: false }],
  });
  weatherState.weather = 'frost_wind';
  const locWMod = LOCATION_MAP.get(weatherState.players[0].locationId)!.weatherModifiers.frost_wind.moveMod;
  const wRoll = RulesEngine.rollMovement(weatherState);
  assert.equal(wRoll.error, undefined);
  assert.equal(wRoll.state.movement!.weatherMod, locWMod);
  assert.equal(
    wRoll.state.movement!.totalRoll,
    Math.max(1, (wRoll.state.movement!.rawRoll ?? 1) + locWMod)
  );

  // Variant 3: Non-adjacent stepMove rejected; objective node stopMovementEarly allowed for standard hero
  let objStopState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 82828,
    playerConfigs: [{ name: 'Knight', heroId: 'hero_01', isAI: false }],
  });
  // Place Knight adjacent to loc_28 (Thunderpeak Sanctum - Seal of Power objective)
  const neighborOf28 = LOCATION_MAP.get('loc_28')!.neighbors[0];
  objStopState.players[0].locationId = neighborOf28;
  objStopState.turnPhase = 'MOVING';
  objStopState.movement = {
    totalRoll: 4,
    stepsRemaining: 4,
    pathTaken: [neighborOf28],
    rawRoll: 4,
    weatherMod: 0,
    fateRerollUsed: false,
  };
  assert.ok(RulesEngine.stepMove(objStopState, 'loc_01').error, 'Non-adjacent stepMove must fail');
  objStopState = RulesEngine.stepMove(objStopState, 'loc_28').state;
  assert.equal(objStopState.turnPhase, 'MOVING');
  const stopAtObj = RulesEngine.stopMovementEarly(objStopState);
  assert.equal(stopAtObj.error, undefined, 'Stopping early on objective node loc_28 must be allowed for any hero');
  assert.equal(stopAtObj.state.movement, null);

  // Variant 4: stepMove respects Gate Guardian (loc_42 -> loc_43) and Three Seals (loc_72 -> loc_73) locks
  let lockStepState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 83838,
    playerConfigs: [{ name: 'Breaker', heroId: 'hero_01', isAI: false }],
  });
  lockStepState.turnPhase = 'MOVING';
  lockStepState.players[0].locationId = 'loc_42';
  lockStepState.movement = { totalRoll: 3, stepsRemaining: 3, pathTaken: ['loc_42'], rawRoll: 3, weatherMod: 0 };
  assert.ok(RulesEngine.stepMove(lockStepState, 'loc_43').error, 'stepMove into Middle Region must be blocked without Gate Guardian defeat');

  lockStepState.players[0].gateGuardianDefeated = true;
  const openGateStep = RulesEngine.stepMove(lockStepState, 'loc_43');
  assert.equal(openGateStep.error, undefined, 'stepMove into loc_43 must succeed after Gate Guardian defeat');

  lockStepState = openGateStep.state;
  lockStepState.players[0].locationId = 'loc_72';
  lockStepState.players[0].seals = ['seal_power', 'seal_wisdom'];
  assert.ok(RulesEngine.stepMove(lockStepState, 'loc_73').error, 'stepMove into Inner Region must require all 3 Seals');

  lockStepState.players[0].seals = ['seal_power', 'seal_wisdom', 'seal_fate'];
  const openInnerStep = RulesEngine.stepMove(lockStepState, 'loc_73');
  assert.equal(openInnerStep.error, undefined, 'stepMove into loc_73 must succeed with 3 Seals');
});

runTest('300 unique cards distribution, metadata uniqueness, mechanical effects, and dual-deck separation', () => {
  const expectedCounts: Record<CardCategory, number> = {
    adventure: 100,
    enemy: 50,
    item: 45,
    weapon: 25,
    armor: 20,
    spell: 20,
    companion: 15,
    event: 10,
    curse: 10,
    legendary_artifact: 5,
  };

  assert.equal(CARDS.length, 300, 'Must have exactly 300 cards');
  for (const [cat, expected] of Object.entries(expectedCounts) as Array<[CardCategory, number]>) {
    assert.equal(
      CARD_CATEGORY_COUNTS[cat],
      expected,
      `Category ${cat} count must be ${expected}, got ${CARD_CATEGORY_COUNTS[cat]}`
    );
  }

  assert.equal(HERO_DECK_CARD_IDS.length, 130, 'Hero deck pool must have 130 cards');
  assert.equal(ADVENTURE_DECK_CARD_IDS.length, 170, 'Adventure deck pool must have 170 cards');

  const descUkSet = new Set<string>();
  const descEnSet = new Set<string>();

  for (const card of CARDS) {
    assert.ok(card.name.uk.length > 0 && card.name.en.length > 0, `${card.id} needs UA/EN name`);
    assert.ok(card.description.uk.length > 0 && card.description.en.length > 0, `${card.id} needs UA/EN description`);
    assert.ok(
      card.activationCondition.description.uk.length > 0 &&
        card.activationCondition.description.en.length > 0,
      `${card.id} needs activationCondition`
    );
    assert.ok(
      card.duration.description.uk.length > 0 && card.duration.description.en.length > 0,
      `${card.id} needs duration`
    );
    assert.ok(
      card.discardCondition.description.uk.length > 0 &&
        card.discardCondition.description.en.length > 0,
      `${card.id} needs discardCondition`
    );
    assert.ok(card.logText.uk.length > 0 && card.logText.en.length > 0, `${card.id} needs logText`);
    assert.ok(Object.keys(card.effect).length > 0, `${card.id} must have a real mechanical effect object`);
    descUkSet.add(card.description.uk);
    descEnSet.add(card.description.en);
  }

  assert.equal(descUkSet.size, 300, 'All 300 Ukrainian card descriptions must be unique');
  assert.equal(descEnSet.size, 300, 'All 300 English card descriptions must be unique');
});

runTest('Inventory limits (1 weapon, 1 armor, 3 companions, 6 items), trade, healing, and curses', () => {
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 91919,
    playerConfigs: [{ name: 'Talia', heroId: 'hero_01', isAI: false }],
  });

  // Check dual decks & initial market stock (4 hero cards)
  assert.equal(state.adventureDeck?.length, 170, 'Initial adventureDeck must contain all 170 world cards');
  assert.equal(state.marketCardIds?.length, 4, 'Initial market stock must contain 4 cards');

  // 1. Companion limit (max 3)
  state.players[0].hand = ['card_111', 'card_112', 'card_113', 'card_114'];
  for (const cid of ['card_111', 'card_112', 'card_113']) {
    const rec = RulesEngine.playCard(state, cid);
    assert.equal(rec.error, undefined, `Recruiting ${cid} should succeed`);
    state = rec.state;
  }
  assert.equal(state.players[0].companions?.length, HERO_INVENTORY_LIMITS.maxCompanions);
  const blocked4thCompanion = RulesEngine.playCard(state, 'card_114');
  assert.ok(blocked4thCompanion.error, '4th companion must be rejected');

  // Dismiss 1 companion -> can recruit 4th
  state = RulesEngine.dismissCompanion(state, 'card_111').state;
  assert.equal(state.players[0].companions?.length, 2);
  state = RulesEngine.playCard(state, 'card_114').state;
  assert.equal(state.players[0].companions?.length, 3);

  // 2. Inventory bag limit (max 6 other items) & swap protection
  state.players[0].inventory = ['card_046', 'card_047', 'card_048', 'card_049', 'card_050', 'card_051'];
  state.players[0].hand = ['card_052', 'card_002'];
  const blocked7thItem = RulesEngine.storeCardInInventory(state, 'card_052');
  assert.ok(blocked7thItem.error, '7th item in bag must be rejected');

  // Unequipping or swapping weapon while bag is 6/6 must fail safely
  const blockedUnequip = RulesEngine.unequipSlot(state, 'weapon');
  assert.ok(blockedUnequip.error, 'Unequipping into full 6/6 bag must be rejected');
  const blockedSwap = RulesEngine.playCard(state, 'card_002');
  assert.ok(blockedSwap.error, 'Swapping weapon when old weapon cannot fit in full 6/6 bag must be rejected');

  // Free 1 bag slot by using healing potion from bag
  state.players[0].hp = 2;
  const usedPotion = RulesEngine.useInventoryItem(state, 'card_046');
  assert.equal(usedPotion.error, undefined);
  state = usedPotion.state;
  assert.ok(state.players[0].hp > 2, 'Healing potion must restore HP');
  assert.equal(state.players[0].inventory.length, 5);

  // Now weapon swap succeeds (1 primary weapon rule)
  state = RulesEngine.playCard(state, 'card_002').state;
  assert.equal(state.players[0].equipment.weapon, 'card_002');
  assert.ok(state.players[0].inventory.includes('card_001'), 'Previous weapon moved to bag');
  assert.equal(state.players[0].inventory.length, 6);

  // 3. Trade (buy from market, sell for 50% gold, refresh wares) & Healer at Sanctuary/Village (loc_01 is village)
  state.players[0].locationId = 'loc_01';
  state.players[0].gold = 120;
  state.players[0].hp = 4;
  state = RulesEngine.healAtSanctuary(state).state;
  assert.equal(state.players[0].hp, 8, 'Sanctuary healer restores +4 HP for 8 gold');
  assert.equal(state.players[0].gold, 112);

  // If market has a companion while at 3/3, buying it is rejected; dismiss 1 companion to allow buying any market card
  state = RulesEngine.dismissCompanion(state, 'card_114').state;
  const marketId = state.marketCardIds![0];
  const marketCard = CARD_MAP.get(marketId)!;
  const expectedCost = Math.max(4, marketCard.goldCost);
  state.players[0].hand = ['card_053'];
  const bought = RulesEngine.buyMarketCard(state, marketId);
  assert.equal(bought.error, undefined, 'Buying market card in village should succeed');
  state = bought.state;
  assert.equal(state.players[0].gold, 112 - expectedCost);
  assert.equal(state.marketCardIds?.length, 4, 'Market stock must refill to 4 cards');

  const sold = RulesEngine.sellCard(state, 'hand', 'card_053');
  assert.equal(sold.error, undefined);
  state = sold.state;
  const card53 = CARD_MAP.get('card_053')!;
  assert.equal(
    state.players[0].gold,
    112 - expectedCost + Math.max(2, Math.floor(card53.goldCost * 0.5))
  );

  // 4. Curses: attach penalty, per-turn drain, and remove via item or shrine/village purification
  const curseCard = CARD_MAP.get('card_136')!; // stat penalty + drain curse
  state.players[0].curses = [curseCard.id];
  const cursedStats = getPlayerEffectiveStats(state.players[0]);
  const cleanPlayer = { ...state.players[0], curses: [] };
  const uncursedStats = getPlayerEffectiveStats(cleanPlayer);
  assert.ok(
    cursedStats.strength <= uncursedStats.strength &&
      cursedStats.intellect <= uncursedStats.intellect &&
      cursedStats.fate <= uncursedStats.fate,
    'Curse must reduce hero stats or apply drain'
  );

  state = RulesEngine.cleanseCurseAtShrine(state, curseCard.id).state;
  assert.equal(state.players[0].curses?.length, 0, 'Curse must be removed after purification');
  assert.ok((state.adventureDiscardPile ?? []).includes(curseCard.id), 'Cleansed curse must move to adventureDiscardPile');

  // 5. Explore draws from adventureDeck and cycles cleanly across enemy/adventure/event/curse cards
  let expState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 95959,
    playerConfigs: [{ name: 'Scout', heroId: 'hero_03', isAI: false }],
  });
  let advDraws = 0;
  for (let i = 0; i < 6; i++) {
    expState.players[0].actionsRemaining = 2;
    expState.turnPhase = 'ACTION';
    expState.combat = null;
    expState.encounter = null;
    expState = RulesEngine.exploreLocation(expState).state;
    advDraws += 1;
    if (expState.turnPhase === 'COMBAT' && expState.combat) {
      assert.ok(expState.combat.enemyCardId, 'Explored combat should reference drawn enemy card');
      // Force flee test on card enemy -> returns enemyCardId to adventureDiscardPile
      expState.players[0].fate = 5;
      expState = RulesEngine.combatFlee(expState).state;
    } else if (expState.turnPhase === 'ENCOUNTER' && expState.encounter) {
      expState = RulesEngine.rollEncounterCheck(expState).state;
      expState = RulesEngine.resolveEncounter(expState).state;
    }
  }
  assert.equal(
    (expState.adventureDeck?.length ?? 0) + (expState.adventureDiscardPile?.length ?? 0),
    170,
    `Adventure cards must remain conserved across ${advDraws} explorations`
  );
});

runTest('Full combat system: physical & magic formulas, defender tie-breaks, strict flee rules, special effects, PvP, and hero defeat', () => {
  // 1. Physical vs Magic Combat Previews & Special Effects (stone_armor & arcane_ward)
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 112233,
    playerConfigs: [{ name: 'Arcanist', heroId: 'hero_02', isAI: false }],
  });
  state.weather = 'clear';
  state.timeOfDay = 'day';
  state.turnPhase = 'COMBAT';
  state.combat = {
    enemyId: 'enemy_r1_golem', // has specialEffectType: 'stone_armor', attack: 4, intellect: 1
    enemyCurrentHp: 15,
    enemyMaxHp: 15,
    isDefending: false,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatLog: [],
    combatPurpose: 'roaming',
  };

  const physPrev = computeCombatPreview(state, 'physical')!;
  const magPrev = computeCombatPreview(state, 'magic')!;
  assert.equal(physPrev.enemySpecialEffect, 'stone_armor');
  assert.ok(
    physPrev.heroModifiers < magPrev.heroModifiers,
    'Stone Armor must penalize physical combat relative to magic combat'
  );
  assert.equal(physPrev.enemyStat, 4, 'Physical combat matches enemy attack/STR stat');
  assert.equal(magPrev.enemyStat, 1, 'Magic combat matches enemy intellect stat');

  // Execute magic attack & verify CombatRoundBreakdown & combatLog populated
  const afterMagic = RulesEngine.combatAttack(state, 'magic');
  assert.equal(afterMagic.error, undefined);
  state = afterMagic.state;
  const logAfterMagic = state.combat?.combatLog ?? [];
  assert.equal(logAfterMagic.length, 1);
  assert.equal(logAfterMagic[0].combatType, 'magic');
  assert.equal(
    logAfterMagic[0].heroTotal,
    logAfterMagic[0].heroBaseStat +
      logAfterMagic[0].heroGearBonus +
      logAfterMagic[0].heroModifiers +
      logAfterMagic[0].heroRoll
  );
  assert.equal(
    logAfterMagic[0].enemyTotal,
    logAfterMagic[0].enemyStat + logAfterMagic[0].enemyModifiers + logAfterMagic[0].enemyRoll
  );

  // 2. Deterministic Tie-Break Rule: Defender wins ties
  // Find a seed where player d6 === enemy d6 so we force heroTotal === enemyTotal
  let tieSeed = 1;
  while (tieSeed < 500) {
    const r1 = rollD6(tieSeed);
    const r2 = rollD6(r1.nextState);
    if (r1.roll === r2.roll) break;
    tieSeed++;
  }
  let tieState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 334455,
    playerConfigs: [{ name: 'TieTester', heroId: 'hero_01', isAI: false }],
  });
  tieState.weather = 'clear';
  tieState.timeOfDay = 'day';
  tieState.activeWorldEventId = null;
  tieState.rngState = tieSeed;
  tieState.players[0].hp = 6;
  tieState.players[0].equipment = { weapon: null, armor: null, talisman: null };
  tieState.players[0].strength = 5;
  tieState.players[0].tempAttackBonus = 0;
  tieState.turnPhase = 'COMBAT';
  tieState.combat = {
    enemyId: 'enemy_r1_bandit',
    enemyNameOverride: { uk: 'Дуелянт-тренер', en: 'Sparring Duelist' },
    enemyAttackOverride: 5,
    enemyIntellectOverride: 5,
    enemyDefenseOverride: 1,
    enemySpecialEffect: 'none',
    enemyCurrentHp: 6,
    enemyMaxHp: 6,
    isDefending: false,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatLog: [],
    combatPurpose: 'roaming',
  };
  const tieAttackRes = RulesEngine.combatAttack(tieState, 'physical').state;
  const tieBreakdown = tieAttackRes.combat?.lastBreakdown;
  assert.ok(tieBreakdown, 'Must record tie breakdown');
  assert.equal(tieBreakdown.heroTotal, tieBreakdown.enemyTotal, 'Constructed totals must be equal');
  assert.equal(tieBreakdown.wasTie, true);
  assert.equal(tieBreakdown.winner, 'enemy', 'Defender (Enemy) must win ties on hero attack');
  assert.equal(tieAttackRes.players[0].hp, 5, 'Hero must lose exactly 1 HP on lost/tied clash');

  // Verify Defend stance tie favors Hero (Hero IS Defender)
  let defendTieSeed = 1;
  while (defendTieSeed < 500) {
    const r1 = rollD6(defendTieSeed);
    const r2 = rollD6(r1.nextState);
    if (r1.roll === r2.roll) break;
    defendTieSeed++;
  }
  let defState = { ...tieState, rngState: defendTieSeed };
  defState.players = [{ ...tieState.players[0], hp: 5, armor: 1, strength: 4, tempDefenseBonus: 0 }]; // guard = 1 + 0 + 2 + 2 = 5
  defState.combat = { ...tieState.combat, enemyAttackOverride: 5 };
  const afterDefend = RulesEngine.combatDefend(defState).state;
  const defBrk = afterDefend.combat?.lastBreakdown;
  assert.ok(defBrk);
  assert.equal(defBrk.wasTie, true);
  assert.equal(defBrk.winner, 'player', 'Hero as Defender in Defend stance must win ties');
  assert.equal(afterDefend.players[0].hp, 6, 'Successful defend grants 0 damage and +1 HP');

  // 3. Strict Flee Rules: blocked by default for Warrior (hero_01), unlocked by escape card, Mist weather, or Rogue/Ranger
  let fleeState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 445566,
    playerConfigs: [{ name: 'Shieldbearer', heroId: 'hero_01', isAI: false }],
  });
  fleeState.weather = 'clear';
  fleeState.turnPhase = 'COMBAT';
  fleeState.combat = {
    enemyId: 'enemy_r1_wolf',
    enemyCurrentHp: 6,
    enemyMaxHp: 6,
    isDefending: false,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatPurpose: 'roaming',
  };
  assert.equal(canFleeCombat(fleeState).allowed, false);
  const blockedFlee = RulesEngine.combatFlee(fleeState);
  assert.ok(blockedFlee.error, 'Warrior without card/ability/mist must be blocked from fleeing');

  // Mist weather allows fleeing non-bosses
  fleeState.weather = 'mist';
  assert.equal(canFleeCombat(fleeState).allowed, true, 'Mist weather rule unlocks flee');

  // Escape card (card_053 Smoke Bomb) sets fleeAllowedByCard
  fleeState.weather = 'clear';
  fleeState.players[0].hand = ['card_053'];
  fleeState = RulesEngine.playCard(fleeState, 'card_053').state;
  assert.equal(fleeState.combat?.fleeAllowedByCard, true);
  assert.equal(canFleeCombat(fleeState).allowed, true, 'Escape card unlocks flee');
  fleeState.players[0].fate = 5;
  const escaped = RulesEngine.combatFlee(fleeState);
  assert.equal(escaped.error, undefined);
  assert.equal(escaped.state.combat, null, 'Successful flee clears combat');
  assert.equal(escaped.state.turnPhase, 'ACTION');

  // Void Lord flee ALWAYS blocked even in Mist or with Rogue
  let voidState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 445577,
    playerConfigs: [{ name: 'Selene', heroId: 'hero_05', isAI: false }],
  });
  voidState.weather = 'mist';
  voidState.turnPhase = 'COMBAT';
  voidState.combat = {
    enemyId: 'enemy_void_lord',
    enemyCurrentHp: 22,
    enemyMaxHp: 22,
    isDefending: false,
    fleeAllowedByCard: true,
    fleeAllowedByAbility: true,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatPurpose: 'void_lord',
  };
  assert.equal(canFleeCombat(voidState).allowed, false, 'Cannot flee from Lord of the Void');
  assert.ok(RulesEngine.combatFlee(voidState).error);

  // 4. PvP Duel (challengePlayer) + Winner spoils + All-heroes-dead DEFEAT check
  let pvpState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 556677,
    playerConfigs: [
      { name: 'Champion', heroId: 'hero_01', isAI: false },
      { name: 'Challenger', heroId: 'hero_02', isAI: false },
    ],
  });
  pvpState.players[0].locationId = 'loc_01';
  pvpState.players[1].locationId = 'loc_01';
  pvpState.players[0].strength = 12;
  pvpState.players[0].tempAttackBonus = 10;
  pvpState.players[1].gold = 15;
  pvpState.players[1].hp = 1;

  const pvpStart = RulesEngine.challengePlayer(pvpState, pvpState.players[1].id);
  assert.equal(pvpStart.error, undefined);
  pvpState = pvpStart.state;
  assert.equal(pvpState.turnPhase, 'COMBAT');
  assert.equal(pvpState.combat?.combatPurpose, 'pvp');
  assert.equal(pvpState.combat?.enemyTier, 'pvp');

  const goldBeforePvp = pvpState.players[0].gold;
  const pvpResolved = RulesEngine.combatAttack(pvpState, 'physical').state;
  assert.equal(pvpResolved.combat, null, 'PvP duel resolves cleanly');
  assert.equal(pvpResolved.turnPhase, 'ACTION');
  assert.ok(pvpResolved.players[0].gold > goldBeforePvp, 'Winner collects PvP gold spoils');
  assert.equal(pvpResolved.players[1].isDefeated, true, 'Defender reduced to 0 HP is defeated');

  // Solo player at 1 HP losing combat triggers DEFEAT phase
  let soloDefeat = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 667788,
    playerConfigs: [{ name: 'Doomed', heroId: 'hero_02', isAI: false }],
  });
  soloDefeat.players[0].hp = 1;
  soloDefeat.players[0].strength = 0;
  soloDefeat.turnPhase = 'COMBAT';
  soloDefeat.combat = {
    enemyId: 'enemy_void_lord',
    enemyAttackOverride: 25,
    enemyCurrentHp: 22,
    enemyMaxHp: 22,
    isDefending: false,
    roundCount: 1,
    lastPlayerRoll: null,
    lastEnemyRoll: null,
    combatPurpose: 'void_lord',
  };
  soloDefeat = RulesEngine.combatAttack(soloDefeat, 'physical').state;
  assert.equal(soloDefeat.players[0].isDefeated, true);
  assert.equal(soloDefeat.phase, 'DEFEAT', 'Last living hero falling to 0 HP must end game in DEFEAT');
});

runTest('DayNightManager (6-round cycle, active-player round completion, bonuses, night passages) & WeatherManager (10 types, 3 regions, events, immutable dice)', () => {
  // 1. Verify 6-round Day/Night cycle across Rounds 1..12 (1-3 Day, 4-6 Night)
  for (let r = 1; r <= 12; r++) {
    const info = DayNightManager.getCycleInfo(r);
    const expectedNight = ((r - 1) % 6) + 1 >= 4;
    assert.equal(info.isNight, expectedNight, `Round ${r} night check mismatch`);
    assert.equal(info.phase, expectedNight ? 'night' : 'day');
  }

  // 2. Round advances ONLY after ALL active (living) players complete their turns
  let cycleState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 112233,
    playerConfigs: [
      { name: 'P1', heroId: 'hero_01', isAI: false },
      { name: 'P2', heroId: 'hero_02', isAI: false },
      { name: 'P3', heroId: 'hero_05', isAI: false },
    ],
  });
  cycleState.players[1].isDefeated = true; // P2 defeated; active living players = P1 and P3
  cycleState.players[1].hp = 0;

  assert.equal(cycleState.round, 1);
  assert.equal(cycleState.dayNightPhase, 'day');

  // End P1 -> skips defeated P2, lands on P3, STILL Round 1
  cycleState = RulesEngine.endTurn(cycleState).state;
  assert.equal(cycleState.activePlayerIndex, 2, 'Should skip defeated P2 and hand off to living P3');
  assert.equal(cycleState.round, 1, 'Round must not increment until all living players finish');

  // End P3 -> completes Round 1 -> starts Round 2
  cycleState = RulesEngine.endTurn(cycleState).state;
  assert.equal(cycleState.activePlayerIndex, 0);
  assert.equal(cycleState.round, 2);
  assert.equal(cycleState.dayNightPhase, 'day');

  // Advance Rounds 2 and 3 (2 turns each) -> reaches Round 4 (Night!)
  for (let i = 0; i < 4; i++) {
    cycleState = RulesEngine.endTurn(cycleState).state;
  }
  assert.equal(cycleState.round, 4);
  assert.equal(cycleState.dayNightPhase, 'night', 'Round 4 must transition to Night phase');
  assert.equal(cycleState.timeOfDay, 'night');

  // Advance Rounds 4, 5, 6 (6 turns total) -> reaches Round 7 (back to Day!)
  for (let i = 0; i < 6; i++) {
    cycleState = RulesEngine.endTurn(cycleState).state;
  }
  assert.equal(cycleState.round, 7);
  assert.equal(cycleState.dayNightPhase, 'day', 'Round 7 must cycle back to Day phase');

  // 3. All 10 core weather types exist with profiles and regional effects across all 3 regions
  assert.equal(CORE_WEATHER_TYPES.length, 10, 'Must have 10 core weather types');
  const regions = ['reg_sunspire_vale', 'reg_ashen_marches', 'reg_abyssal_citadel'] as const;
  for (const w of CORE_WEATHER_TYPES) {
    const profile = WEATHER_PROFILES[w];
    assert.ok(profile, `Missing weather profile for ${w}`);
    assert.ok(profile.name.uk.length > 0 && profile.name.en.length > 0);
    for (const regId of regions) {
      const regEff = WeatherManager.getRegionWeatherEffect(w, regId);
      assert.ok(regEff.description.uk.length > 0 && regEff.description.en.length > 0);
    }
  }

  // Regional weather probabilities depend on region
  const outerPool = new Map(
    WeatherManager.getWeightedWeatherPool('reg_sunspire_vale', false).map((i) => [i.weather, i.weight])
  );
  const innerPool = new Map(
    WeatherManager.getWeightedWeatherPool('reg_abyssal_citadel', true).map((i) => [i.weather, i.weight])
  );
  assert.ok((outerPool.get('clear') ?? 0) > (innerPool.get('clear') ?? 0), 'Outer Vale favors clear weather more than Inner Citadel');
  assert.ok((innerPool.get('magic_fog') ?? 0) > (outerPool.get('magic_fog') ?? 0), 'Inner Citadel favors arcane fog more than Outer Vale');

  // Weather duration countdown & automatic weather transition
  let durState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 223344,
    playerConfigs: [{ name: 'WeatherWatch', heroId: 'hero_07', isAI: false }],
  });
  WeatherManager.shiftWeather(durState, 'rain', 2);
  assert.equal(durState.weatherDurationRemaining, 2);
  const r1 = WeatherManager.advanceRoundWeather(durState);
  assert.equal(r1.changed, false);
  assert.equal(r1.durationRemaining, 1);
  const r2 = WeatherManager.advanceRoundWeather(durState);
  assert.equal(r2.changed, true);
  assert.ok(CORE_WEATHER_TYPES.includes(r2.weather));

  // 4. Blizzard closes mountain pass transitions ('pass' terrain)
  const passLoc = LOCATIONS.find((l) => l.terrain === 'pass')!;
  const nonPassNeighbor = LOCATIONS.find(
    (l) => l.terrain !== 'pass' && l.neighbors.includes(passLoc.id) && l.accessCondition.type === 'open'
  )!;
  let blizState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 334466,
    playerConfigs: [{ name: 'Mountaineer', heroId: 'hero_01', isAI: false }],
  });
  blizState.players[0].gateGuardianDefeated = true;
  blizState.players[0].seals = ['seal_power', 'seal_wisdom', 'seal_fate'];
  blizState.players[0].locationId = nonPassNeighbor.id;
  WeatherManager.shiftWeather(blizState, 'blizzard', 2);

  const passAccess = NavigationGraph.canAccessLocation(
    blizState.players[0],
    passLoc.id,
    blizState,
    nonPassNeighbor.id
  );
  assert.equal(passAccess.allowed, false, 'Blizzard must block mountain pass entry');
  const blockedPassMove = RulesEngine.moveToLocation(blizState, passLoc.id);
  assert.ok(blockedPassMove.error, 'moveToLocation into mountain pass must fail in Blizzard');

  WeatherManager.shiftWeather(blizState, 'clear', 2);
  const openPassMove = RulesEngine.moveToLocation(blizState, passLoc.id);
  assert.equal(openPassMove.error, undefined, 'Mountain pass must reopen when Blizzard clears');

  // 5. Night opens HIDDEN_NIGHT_PASSAGES (closed during Day, open Rounds 4-6)
  const samplePassage = HIDDEN_NIGHT_PASSAGES[0]; // loc_06 <-> loc_25
  let nightMoveState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 445588,
    playerConfigs: [{ name: 'Shadow', heroId: 'hero_05', isAI: false }],
  });
  nightMoveState.players[0].locationId = samplePassage.from;
  nightMoveState.weather = 'clear';
  // Round 1 = Day -> hidden night passage closed
  assert.equal(DayNightManager.isNight(nightMoveState), false);
  const dayPassageAttempt = RulesEngine.moveToLocation(nightMoveState, samplePassage.to);
  assert.ok(dayPassageAttempt.error, 'Hidden night passage must be closed during Day rounds 1-3');

  // Round 4 = Night -> hidden night passage open!
  nightMoveState.round = 4;
  DayNightManager.syncState(nightMoveState);
  assert.equal(DayNightManager.isNight(nightMoveState), true);
  const nightNeighbors = NavigationGraph.getNeighborStatuses(
    nightMoveState.players[0],
    samplePassage.from,
    nightMoveState
  );
  assert.ok(
    nightNeighbors.some((n) => n.location.id === samplePassage.to && n.isNightPassage && n.allowed),
    'Hidden night passage must appear as open neighbor during Night'
  );
  const nightPassageAttempt = RulesEngine.moveToLocation(nightMoveState, samplePassage.to);
  assert.equal(nightPassageAttempt.error, undefined, 'Hidden night passage must be traversable at Night');
  assert.equal(nightPassageAttempt.state.players[0].locationId, samplePassage.to);

  // 6. Mist / Arcane Fog conceals arrival combat encounters and unlocks combat flee
  let ambushRng = 1;
  while (ambushRng < 200) {
    if (rollD6(ambushRng).roll <= 2) break;
    ambushRng++;
  }
  const highDangerWild = LOCATIONS.find(
    (l) => l.dangerLevel >= 4 && l.terrain !== 'village' && l.terrain !== 'sanctuary' && l.accessCondition.type === 'open'
  ) ?? LOCATIONS.find((l) => l.dangerLevel >= 4 && l.terrain !== 'village' && l.terrain !== 'sanctuary')!;
  const adjToDanger = LOCATION_MAP.get(highDangerWild.neighbors[0])!;

  let fogState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 556688,
    playerConfigs: [{ name: 'Scout', heroId: 'hero_01', isAI: false }],
  });
  fogState.players[0].gateGuardianDefeated = true;
  fogState.players[0].seals = ['seal_power', 'seal_wisdom', 'seal_fate'];
  fogState.players[0].locationId = adjToDanger.id;
  fogState.rngState = ambushRng;
  WeatherManager.shiftWeather(fogState, 'mist', 2);
  fogState = RulesEngine.moveToLocation(fogState, highDangerWild.id).state;
  assert.notEqual(
    fogState.turnPhase,
    'COMBAT',
    'Mist weather must conceal arrival ambush encounters'
  );

  // 7. Thunderstorm activates magic weather events on shrine/ruins and round storm event
  const shrineLoc = LOCATIONS.find((l) => l.terrain === 'shrine')!;
  let stormState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 667799,
    playerConfigs: [{ name: 'Stormcaster', heroId: 'hero_02', isAI: false }],
  });
  stormState.players[0].locationId = shrineLoc.id;
  WeatherManager.shiftWeather(stormState, 'thunderstorm', 2);
  const xpBeforeStorm = stormState.players[0].experience;
  stormState = RulesEngine.exploreLocation(stormState).state;
  assert.ok(
    stormState.players[0].experience > xpBeforeStorm,
    'Thunderstorm at a shrine must trigger magic weather event (+XP / +Attack)'
  );

  // 8. Locked Dice Rule: shifting weather/time MUST NEVER alter an already-determined dice roll
  let lockedDiceState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 778899,
    playerConfigs: [{ name: 'FairRoller', heroId: 'hero_01', isAI: false }],
  });
  lockedDiceState = RulesEngine.rollMovement(lockedDiceState).state;
  const lockedRaw = lockedDiceState.movement!.rawRoll;
  const lockedTotal = lockedDiceState.movement!.totalRoll;
  const lockedSteps = lockedDiceState.movement!.stepsRemaining;
  const lockedLastDice = lockedDiceState.lastDiceRoll;
  const lockedHistoryRoll = lockedDiceState.diceHistory![0].roll;

  WeatherManager.shiftWeather(lockedDiceState, 'blizzard', 2);
  lockedDiceState.round = 4;
  DayNightManager.syncState(lockedDiceState);

  assert.equal(lockedDiceState.movement!.rawRoll, lockedRaw, 'rawRoll must stay immutable after weather/time change');
  assert.equal(lockedDiceState.movement!.totalRoll, lockedTotal, 'totalRoll must stay immutable after weather/time change');
  assert.equal(lockedDiceState.movement!.stepsRemaining, lockedSteps, 'stepsRemaining must stay immutable');
  assert.equal(lockedDiceState.lastDiceRoll, lockedLastDice, 'lastDiceRoll must stay immutable');
  assert.equal(lockedDiceState.diceHistory![0].roll, lockedHistoryRoll, 'diceHistory record must stay immutable');
});

runTest('WorldEventManager enforces 10 events, max 2 concurrent, escalation, non-blocking gates, and cross-system modifiers', () => {
  // 1. All 10 required Major World Events exist with 3 stages and bilingual strings
  assert.equal(MAJOR_WORLD_EVENTS.length, 10, 'Must have exactly 10 Major World Events');
  const requiredIds: MajorWorldEventId[] = [
    'major_dragon_awakening',
    'major_demon_rift',
    'major_spreading_curse',
    'major_blood_eclipse',
    'major_black_plague',
    'major_undead_invasion',
    'major_arcane_storm',
    'major_vanishing_caravans',
    'major_monster_uprising',
    'major_ancient_temple',
  ];
  for (const id of requiredIds) {
    const def = MAJOR_WORLD_EVENTS.find((e) => e.id === id);
    assert.ok(def, `Missing Major World Event ${id}`);
    assert.equal(def!.stages.length, 3, `Event ${id} must have 3 stages`);
    assert.ok(def!.name.uk.length > 0 && def!.name.en.length > 0);
    assert.ok(def!.questTitle.uk.length > 0 && def!.questTitle.en.length > 0);
  }

  // 2. Maximum 2 concurrent active major events enforced
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 901122,
    playerConfigs: [{ name: 'ChronicleHero', heroId: 'hero_01', isAI: false }],
  });
  const s1 = WorldEventManager.spawnMajorEvent(state, 'major_black_plague');
  assert.equal(s1.spawned, true);
  assert.equal(state.weather, 'heavy_rain', 'Spawning Black Plague must shift weather');

  const s2 = WorldEventManager.spawnMajorEvent(state, 'major_undead_invasion');
  assert.equal(s2.spawned, true);
  assert.equal(WorldEventManager.getActiveEvents(state).length, MAX_ACTIVE_MAJOR_EVENTS);

  const s3 = WorldEventManager.spawnMajorEvent(state, 'major_dragon_awakening');
  assert.equal(s3.spawned, false, 'Must not exceed MAX_ACTIVE_MAJOR_EVENTS = 2');
  assert.equal(WorldEventManager.getActiveEvents(state).length, 2);

  // 3. Cross-system modifiers reflect active events and escalation worsens when ignored
  const modBeforeEscalation = WorldEventManager.getEnemyAttackModifier(state);
  WorldEventManager.advanceRoundEvents(state); // Ignored round -> escalates to Stage 2
  assert.equal(state.activeMajorEvents![0].stage, 2, 'Ignored event should escalate to Stage 2');
  assert.ok(
    WorldEventManager.getEnemyAttackModifier(state) >= modBeforeEscalation,
    'Escalating events must increase or maintain pressure'
  );
  // Main progression gate access must NEVER be blocked by world events
  state.players[0].gateGuardianDefeated = true;
  const midGate = NavigationGraph.canAccessLocation(state.players[0], 'loc_43');
  assert.equal(midGate.allowed, true, 'World events must never block main progression routes');

  // 4. Hero intervention advances progress, applies world reaction & grants rewards on completion
  let interventionState = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 903344,
    playerConfigs: [{ name: 'EventHero', heroId: 'hero_01', isAI: false }],
  });
  WorldEventManager.spawnMajorEvent(interventionState, 'major_vanishing_caravans');
  const activeEvt = interventionState.activeMajorEvents![0];
  const eventDef = WorldEventManager.getDefinition(activeEvt.id);
  interventionState.players[0].locationId = activeEvt.targetLocationId;
  interventionState.players[0].gold = 50;
  interventionState.players[0].actionsRemaining = 4;

  // Market price modifier active during Vanishing Caravans
  assert.ok(
    WorldEventManager.getMarketPriceModifier(interventionState) > 0,
    'Vanishing Caravans must raise market prices'
  );

  // Intervene via RulesEngine until resolved
  let safety = 0;
  while ((interventionState.activeMajorEvents ?? []).length > 0 && safety < 5) {
    interventionState.players[0].actionsRemaining = 3;
    const res = RulesEngine.interveneWorldEvent(interventionState, 'major_vanishing_caravans');
    assert.equal(res.error, undefined, res.error?.en);
    interventionState = res.state;
    safety++;
  }
  assert.equal(interventionState.activeMajorEvents!.length, 0, 'Event must complete and clear');
  assert.ok(
    interventionState.completedMajorEventIds!.includes('major_vanishing_caravans'),
    'Completed event ID must be recorded'
  );
  assert.ok(
    interventionState.players[0].experience >= eventDef.rewards.xp,
    'Completing major event must grant XP reward'
  );

  // Chronicle scoping checks: global vs local
  const hasGlobalWorldEntry = interventionState.chronicle.some(
    (c) => (c.scope ?? inferChronicleScope(c.type, c.playerId)) === 'global'
  );
  const hasLocalAdventureEntry = interventionState.chronicle.some(
    (c) => (c.scope ?? inferChronicleScope(c.type, c.playerId)) === 'local'
  );
  assert.equal(hasGlobalWorldEntry, true, 'Chronicle must record global world events');
  assert.equal(hasLocalAdventureEntry, true, 'Chronicle must record local hero adventures');
});

runTest('NpcManager supports all 4 roles, reactive world dialogue, quests, and services', () => {
  const rolesCovered = new Set<NpcRole>(NPCS.map((n) => n.role));
  assert.equal(rolesCovered.has('merchant'), true);
  assert.equal(rolesCovered.has('traveler'), true);
  assert.equal(rolesCovered.has('quest_giver'), true);
  assert.equal(rolesCovered.has('special'), true);

  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 912233,
    playerConfigs: [{ name: 'Diplomat', heroId: 'hero_04', isAI: false }],
  });
  WorldEventManager.spawnMajorEvent(state, 'major_black_plague');

  // Talk to an NPC present at the active hero's location
  const npcsHere = NpcManager.getNpcsAtLocation(state.players[0].locationId);
  assert.ok(npcsHere.length > 0, 'Hero starting location must have NPCs available');
  const questNpc = npcsHere.find((n) => Boolean(n.quest)) ?? npcsHere[0];

  const talkRes = RulesEngine.talkToNpc(state, questNpc.id);
  assert.equal(talkRes.error, undefined, talkRes.error?.en);
  state = talkRes.state;
  assert.equal(state.activeNpcDialog?.npcId, questNpc.id);
  assert.ok(
    state.activeNpcDialog?.dynamicNote,
    'NPC dialogue must react dynamically to active major world events'
  );

  if (questNpc.quest) {
    const acceptOpt = NpcManager.getAvailableOptions(
      state,
      state.players[0],
      questNpc,
      state.activeNpcDialog!.nodeId
    ).find((o) => o.action === 'accept_quest');
    if (acceptOpt) {
      state = RulesEngine.chooseNpcDialogOption(state, acceptOpt.id).state;
      assert.equal(state.npcStates?.[questNpc.id]?.questStatus, 'active');

      // Satisfy quest progress & turn in
      state.npcStates![questNpc.id].questProgress = questNpc.quest.targetCount;
      state = RulesEngine.talkToNpc(state, questNpc.id).state;
      const turnInOpt = NpcManager.getAvailableOptions(
        state,
        state.players[0],
        questNpc,
        state.activeNpcDialog!.nodeId
      ).find((o) => o.action === 'complete_quest');
      assert.ok(turnInOpt, 'Quest turn-in option should appear once targetCount is met');
      const xpBefore = state.players[0].experience;
      state = RulesEngine.chooseNpcDialogOption(state, turnInOpt!.id).state;
      assert.equal(state.npcStates?.[questNpc.id]?.questStatus, 'completed');
      assert.ok(state.players[0].experience > xpBefore, 'Quest completion must grant XP');
    }
  }

  state = RulesEngine.closeNpcDialog(state).state;
  assert.equal(state.activeNpcDialog, null);
});

runTest('SoundEngine dynamically selects ambient profiles for all 10 world events including Black Plague wind and Undead Invasion drums', () => {
  // Verify every major world event has a distinct ambient profile
  assert.equal(resolveAmbientProfileKey([], null), 'calm');

  const plagueKey = soundEngine.setActiveWorldEvents(['major_black_plague'], null);
  assert.equal(plagueKey, 'major_black_plague');
  const plagueProfile = soundEngine.getActiveAmbientProfile();
  assert.equal(plagueProfile.layerType, 'plague_wind', 'Black Plague must trigger ominous wind layer');
  assert.ok((plagueProfile.windBandpassFreq ?? 0) > 0, 'Black Plague profile must configure wind filter');

  const undeadKey = soundEngine.setActiveWorldEvents(['major_undead_invasion'], null);
  assert.equal(undeadKey, 'major_undead_invasion');
  const undeadProfile = soundEngine.getActiveAmbientProfile();
  assert.equal(undeadProfile.layerType, 'battle_drums', 'Undead Invasion must trigger battle drums layer');
  assert.ok((undeadProfile.drumPattern?.length ?? 0) >= 4, 'Undead Invasion profile must define battle drum beats');

  // Verify all 10 MajorWorldEventIds resolve cleanly and reset to calm
  for (const def of MAJOR_WORLD_EVENTS) {
    assert.ok(WORLD_EVENT_AMBIENT_PROFILES[def.id], `Missing ambient profile for ${def.id}`);
    const resolved = soundEngine.setActiveWorldEvents([def.id], null);
    assert.equal(resolved, def.id);
    assert.equal(soundEngine.getActiveAmbientProfile().key, def.id);
  }

  // Priority uses latest active major event when 2 are active simultaneously
  assert.equal(
    resolveAmbientProfileKey(['major_black_plague', 'major_undead_invasion'], null),
    'major_undead_invasion'
  );

  // Resets cleanly back to calm
  assert.equal(soundEngine.setActiveWorldEvents([], null), 'calm');
  assert.equal(soundEngine.getActiveAmbientProfile().layerType, 'lute_calm');
});

runTest('resolveWorldEventVisuals maps all 10 world events to CSS animations and filters cleanly', () => {
  const calm = resolveWorldEventVisuals([]);
  assert.equal(calm.active, false);
  assert.equal(calm.primaryEffectKey, 'calm');
  assert.equal(calm.containerClassName, '');
  assert.equal(calm.overlayClasses.length, 0);

  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 951122,
    playerConfigs: [{ name: 'VisualHero', heroId: 'hero_02', isAI: false }],
  });

  // Magical Storm -> screen shake class + storm overlay
  WorldEventManager.spawnMajorEvent(state, 'major_arcane_storm');
  const stormFx = resolveWorldEventVisuals(WorldEventManager.getActiveEvents(state));
  assert.equal(stormFx.active, true);
  assert.equal(stormFx.primaryEffectKey, 'major_arcane_storm');
  assert.ok(stormFx.containerClassName.includes('world-fx-arcane-storm'));
  assert.ok(stormFx.overlayClasses[0].includes('world-overlay-arcane-storm'));

  // Bloody Eclipse escalated to Stage 2 -> takes priority over Stage 1 storm
  WorldEventManager.spawnMajorEvent(state, 'major_blood_eclipse');
  state.activeMajorEvents![1].stage = 2;
  const dualFx = resolveWorldEventVisuals(WorldEventManager.getActiveEvents(state));
  assert.equal(dualFx.active, true);
  assert.equal(dualFx.primaryEffectKey, 'major_blood_eclipse');
  assert.equal(dualFx.highestStage, 2);
  assert.equal(dualFx.overlayClasses.length, 2);
  assert.ok(dualFx.containerClassName.includes('world-fx-blood-eclipse'));
  assert.ok(dualFx.containerClassName.includes('world-stage-2'));

  // All 10 major world events have distinct visual specs
  for (const def of MAJOR_WORLD_EVENTS) {
    const spec = WORLD_EVENT_VISUAL_MAP[def.id];
    assert.ok(spec, `Missing visual spec for ${def.id}`);
    assert.ok(spec.containerClass.startsWith('world-fx-'));
    assert.ok(spec.overlayClass.startsWith('world-overlay-'));
    assert.ok(spec.cardAccentClass.length > 0);
  }
});

runTest('AI system supports 1-6 participants, fair dice across difficulties, distinct styles, and decision logging', () => {
  // 1. Supports 1-6 participants with per-bot styles and difficulties
  for (const count of [1, 2, 4, 6]) {
    const styles: AiBehaviorStyle[] = [
      'conqueror',
      'scholar',
      'merchant_tactician',
      'warden',
      'conqueror',
      'scholar',
    ];
    const diffs: AiDifficulty[] = ['easy', 'normal', 'hard', 'normal', 'hard', 'easy'];
    const configs = Array.from({ length: count }, (_, idx) => ({
      name: `Participant_${idx + 1}`,
      heroId: HEROES[idx % HEROES.length].id,
      isAI: idx > 0 || count === 1,
      aiDifficulty: diffs[idx],
      aiStyle: styles[idx],
    }));
    const game = RulesEngine.createNewGame({
      mode: 'solo_ai',
      seed: 1000 + count,
      aiDifficulty: 'hard',
      playerConfigs: configs,
    });
    assert.equal(game.players.length, count, `Must support ${count} participants`);
    assert.equal(game.aiDifficulty, 'hard');
    assert.ok(Array.isArray(game.aiDecisionLog));
  }

  // 2. Difficulty never alters dice RNG fairness (identical initial movement roll on same rngState)
  const makeSoloBot = (diff: AiDifficulty, heroId: string, style: AiBehaviorStyle, seed = 424242) =>
    RulesEngine.createNewGame({
      mode: 'solo_ai',
      seed,
      aiDifficulty: diff,
      playerConfigs: [
        {
          name: `${diff}_${style}`,
          heroId,
          isAI: true,
          aiDifficulty: diff,
          aiStyle: style,
        },
      ],
    });

  const easyBotState = makeSoloBot('easy', 'hero_01', 'conqueror', 515151);
  const hardBotState = makeSoloBot('hard', 'hero_01', 'conqueror', 515151);
  assert.equal(easyBotState.rngState, hardBotState.rngState, 'Identical seeds yield identical initial RNG');
  const easyRoll = RulesEngine.rollMovement(easyBotState);
  const hardRoll = RulesEngine.rollMovement(hardBotState);
  assert.equal(
    easyRoll.state.movement?.rawRoll,
    hardRoll.state.movement?.rawRoll,
    'Difficulty must never rig or alter raw d6 dice rolls'
  );

  // 3. Hard bot makes smarter decisions than Easy bot (equips stronger weapon, uses smart market purchase, uses magic stance when intellect dominates)
  let smartGearState = makeSoloBot('hard', 'hero_02', 'scholar', 616161);
  smartGearState.players[0].gold = 60;
  smartGearState.players[0].locationId = 'loc_01'; // Village with market
  // Put a strong weapon in hand & market
  smartGearState.players[0].hand = ['card_025']; // high-tier weapon
  smartGearState.players[0].intellect = 7;
  smartGearState.players[0].strength = 2;
  smartGearState = RulesEngine.runAiTurn(smartGearState);

  const smartLogs = AiManager.getDecisionLog(smartGearState, smartGearState.players[0].id);
  assert.ok(smartLogs.length > 0, 'Internal AI decision log must record decisions');
  assert.ok(
    smartLogs.some((l) => l.category === 'item' && l.chosenAction.startsWith('equip:')),
    'Hard bot should equip stronger gear from hand'
  );
  assert.ok(
    smartLogs.every((l) => l.reasoning.uk.length > 0 && l.reasoning.en.length > 0 && l.evaluatedOptions.length > 0),
    'All AI decision log entries must store evaluated options and bilingual reasoning'
  );

  // Scholar / Hard bot chooses magic combat when intellect > strength (against Stone Armor enemy_r1_golem)
  const mageCandidate = {
    ...smartGearState.players[0],
    strength: 2,
    intellect: 7,
    equipment: { ...smartGearState.players[0].equipment, weapon: null },
  };
  const scholarRisk = AiManager.evaluateChallengeRisk(
    smartGearState,
    mageCandidate,
    'enemy_r1_golem'
  );
  assert.equal(scholarRisk.preferredType, 'magic', 'High-intellect hero should prefer magic combat');

  // 4. Hard bot reacts to World Events, Night Passages, Rivals, and Quests
  let reactiveState = RulesEngine.createNewGame({
    mode: 'solo_ai',
    seed: 717171,
    aiDifficulty: 'hard',
    playerConfigs: [
      { name: 'WardenBot', heroId: 'hero_01', isAI: true, aiDifficulty: 'hard', aiStyle: 'warden' },
      { name: 'WeakRival', heroId: 'hero_05', isAI: false },
    ],
  });
  WorldEventManager.spawnMajorEvent(reactiveState, 'major_black_plague');
  const plagueTarget = reactiveState.activeMajorEvents![0].targetLocationId;
  reactiveState.players[0].locationId = plagueTarget;
  reactiveState.players[0].gold = 40;
  reactiveState.players[0].hp = 9;
  reactiveState.players[0].strength = 7;
  reactiveState = RulesEngine.runAiTurn(reactiveState);
  const wardenLogs = AiManager.getDecisionLog(reactiveState, reactiveState.players[0].id);
  assert.ok(
    wardenLogs.some((l) => l.category === 'world_event' && l.chosenAction.startsWith('intervene:')),
    'Warden/Hard bot at event location should intervene in Major World Event'
  );

  // Conqueror PvP rival awareness when stronger on the same non-sanctuary tile
  let pvpBotState = RulesEngine.createNewGame({
    mode: 'solo_ai',
    seed: 727272,
    aiDifficulty: 'hard',
    playerConfigs: [
      { name: 'ConquerorBot', heroId: 'hero_01', isAI: true, aiDifficulty: 'hard', aiStyle: 'conqueror' },
      { name: 'RivalTarget', heroId: 'hero_05', isAI: false },
    ],
  });
  pvpBotState.players[0].locationId = 'loc_12';
  pvpBotState.players[1].locationId = 'loc_12';
  pvpBotState.players[0].strength = 8;
  pvpBotState.players[0].hp = 9;
  pvpBotState.players[1].strength = 2;
  pvpBotState.players[1].intellect = 2;
  pvpBotState.players[1].hp = 4;
  pvpBotState = RulesEngine.runAiTurn(pvpBotState);
  const conquerorLogs = AiManager.getDecisionLog(pvpBotState, pvpBotState.players[0].id);
  assert.ok(
    conquerorLogs.some((l) => l.category === 'rival' && l.chosenAction.startsWith('pvp:')),
    'Conqueror bot with clear stat advantage should challenge rival on same tile'
  );

  // 5. Equivalent strategy non-determinism: identical state with multiple equivalent seal/step strategies varies across seeds
  const chosenGoals = new Set<string>();
  const chosenSteps = new Set<string>();
  for (let s = 1; s <= 20; s++) {
    let eqState = makeSoloBot('normal', 'hero_03', 'scholar', 80000 + s * 137);
    eqState.players[0].gateGuardianDefeated = true;
    eqState.players[0].seals = ['seal_power'];
    // loc_43 opens routes toward both seal_fate (loc_66) and seal_wisdom (loc_71)
    eqState.players[0].locationId = 'loc_43';
    eqState = RulesEngine.runAiTurn(eqState);
    const logs = AiManager.getDecisionLog(eqState, eqState.players[0].id);
    for (const l of logs) {
      if (l.chosenAction.startsWith('goal:')) chosenGoals.add(l.chosenAction);
      if (l.chosenAction.startsWith('step:')) chosenSteps.add(l.chosenAction);
    }
  }
  assert.ok(
    chosenGoals.size >= 2 || chosenSteps.size >= 2,
    `Bots must avoid making identical choices across equivalent strategies (goals=${chosenGoals.size}, steps=${chosenSteps.size})`
  );

  // 6. Full automated 6-bot simulated match (24 AI turns across Easy/Normal/Hard & all 4 styles)
  let simState = RulesEngine.createNewGame({
    mode: 'solo_ai',
    seed: 991188,
    aiDifficulty: 'normal',
    playerConfigs: [
      { name: 'Bot1_Conq', heroId: 'hero_01', isAI: true, aiDifficulty: 'hard', aiStyle: 'conqueror' },
      { name: 'Bot2_Schol', heroId: 'hero_02', isAI: true, aiDifficulty: 'normal', aiStyle: 'scholar' },
      { name: 'Bot3_Tact', heroId: 'hero_03', isAI: true, aiDifficulty: 'hard', aiStyle: 'merchant_tactician' },
      { name: 'Bot4_Ward', heroId: 'hero_04', isAI: true, aiDifficulty: 'normal', aiStyle: 'warden' },
      { name: 'Bot5_Easy', heroId: 'hero_05', isAI: true, aiDifficulty: 'easy', aiStyle: 'conqueror' },
      { name: 'Bot6_Easy2', heroId: 'hero_06', isAI: true, aiDifficulty: 'easy', aiStyle: 'scholar' },
    ],
  });

  // Trigger a Major World Event and Thunderstorm during the test match
  WorldEventManager.spawnMajorEvent(simState, 'major_arcane_storm');
  WeatherManager.shiftWeather(simState, 'thunderstorm', 3);

  for (let turn = 0; turn < 24 && simState.phase === 'PLAYING'; turn++) {
    const active = getActivePlayer(simState);
    assert.equal(active.isAI, true);
    simState = RulesEngine.runAiTurn(simState);
    assert.equal(simState.turnPhase, 'ACTION', 'Turn must always return cleanly to ACTION phase');
    assert.equal(simState.movement, null, 'No dangling movement state after AI turn');
    assert.equal(simState.encounter, null, 'No dangling encounter state after AI turn');
  }

  assert.ok(simState.round >= 4, `6-bot simulation should advance rounds cleanly (round=${simState.round})`);
  assert.ok(
    (simState.aiDecisionLog?.length ?? 0) >= 24,
    'Simulated match must produce rich internal AI decision log'
  );
  const visitedTotal = simState.players.reduce((sum, pl) => sum + pl.visitedLocationIds.length, 0);
  assert.ok(visitedTotal > 6, 'Bots must actively traverse the world map across simulated turns');
  for (const pl of simState.players) {
    assert.ok(pl.hp >= 0 && pl.hp <= pl.maxHp, `${pl.name} HP stayed within valid bounds`);
  }
});

async function runAsyncTest(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
  console.log(`PASS: ${name}`);
}

runTest('Local hot-seat mode supports 1-6 human players, turn handoff sequence, and defeated player skipping', () => {
  for (const count of [1, 2, 3, 4, 5, 6]) {
    const hotseat = RulesEngine.createNewGame({
      mode: 'local_hotseat',
      seed: 3300 + count,
      playerConfigs: Array.from({ length: count }, (_, idx) => ({
        name: `LocalP_${idx + 1}`,
        heroId: HEROES[idx % HEROES.length].id,
        isAI: false,
      })),
    });
    assert.equal(hotseat.mode, 'local_hotseat');
    assert.equal(hotseat.players.length, count);
    assert.equal(hotseat.players.every((p) => !p.isAI), true);
  }

  // Verify 6-player full round turn handoff & defeated player skip
  let state = RulesEngine.createNewGame({
    mode: 'local_hotseat',
    seed: 445566,
    playerConfigs: Array.from({ length: 6 }, (_, idx) => ({
      name: `Hero_${idx + 1}`,
      heroId: HEROES[idx].id,
      isAI: false,
    })),
  });

  // Mark player #2 (index 1) as defeated
  state.players[1].isDefeated = true;
  state.players[1].hp = 0;

  const visitedOrder: number[] = [state.activePlayerIndex];
  for (let i = 0; i < 5; i++) {
    const res = GameManager.dispatch(state, { type: 'END_TURN' });
    assert.equal(res.error, undefined);
    state = res.state;
    visitedOrder.push(state.activePlayerIndex);
  }

  // Should skip index 1 and wrap back to index 0 on round 2
  assert.deepEqual(visitedOrder, [0, 2, 3, 4, 5, 0], 'Turn handoff queue must cycle 1-6 players skipping defeated');
  assert.equal(state.round, 2, 'Round increments once all living hot-seat players finish');
});

await runAsyncTest(
  'SaveManager handles autosave, manual slots, browser-close resume, 15-field integrity verification, v1->v3 versioning, and error recovery',
  async () => {
    const backend = SaveManager.createMemoryBackend();
    SaveManager.setStorageBackendForTests(backend);

    try {
      // Build rich 4-player game with all 15 required state dimensions populated
      let state = RulesEngine.createNewGame({
        mode: 'local_hotseat',
        seed: 771122,
        playerConfigs: [
          { name: 'Aria', heroId: 'hero_01', isAI: false },
          { name: 'Bram', heroId: 'hero_02', isAI: false },
          { name: 'Cora', heroId: 'hero_03', isAI: false },
          { name: 'Dain', heroId: 'hero_04', isAI: false },
        ],
      });

      state.round = 5;
      DayNightManager.syncState(state);
      WeatherManager.shiftWeather(state, 'thunderstorm', 2);
      WorldEventManager.spawnMajorEvent(state, 'major_arcane_storm');

      state.activePlayerIndex = 2;
      const p = state.players[2];
      p.locationId = 'loc_44';
      p.visitedLocationIds = ['loc_01', 'loc_42', 'loc_43', 'loc_44'];
      p.hp = 6;
      p.strength = 7;
      p.intellect = 6;
      p.fate = 3;
      p.gold = 95;
      p.experience = 8;
      p.seals = ['seal_power', 'seal_wisdom'];
      p.gateGuardianDefeated = true;
      p.equipment = { weapon: 'card_002', armor: 'card_026', talisman: null };
      p.inventory = ['card_046', 'card_047'];
      p.companions = ['card_111'];
      p.curses = ['card_136'];
      p.hand = ['card_048', 'card_053'];
      p.enemiesSlain = 4;

      // Active enemy state inside combat
      state = RulesEngine.challengeSealGuardian({
        ...state,
        players: state.players.map((pl, i) =>
          i === 2 ? { ...p, locationId: 'loc_66', actionsRemaining: 2 } : pl
        ),
      }).state;
      assert.equal(state.turnPhase, 'COMBAT');
      assert.ok(state.combat, 'Active combat enemy state must exist');

      // 1. Autosave & Manual Named Save Slot
      await SaveManager.saveAuto(state);
      const manualRec = await SaveManager.saveNewManualSlot(state, 'Before Seal Guardian');
      assert.equal(manualRec.saveKind, 'manual');
      assert.equal(manualRec.schemaVersion, SaveManager.SCHEMA_VERSION);

      const summaries = await SaveManager.listSaves();
      assert.equal(summaries.length, 2, 'Must list both autosave and manual slot');
      const autoSummary = summaries.find((s) => s.saveKind === 'autosave');
      const manualSummary = summaries.find((s) => s.saveKind === 'manual');
      assert.ok(autoSummary && autoSummary.checksumValid === true);
      assert.ok(manualSummary && manualSummary.checksumValid === true);

      // 2. Resume after simulated browser close (fresh call reading from backend)
      const resumed = await SaveManager.getResumableSession();
      assert.ok(resumed && resumed.state, 'Must resume active session after browser reopen');
      assert.equal(resumed.recovered, false);
      assert.equal(resumed.report.valid, true);
      assert.equal(resumed.report.checksumMatched, true);

      const rState = resumed.state;
      const rp = rState.players[2];
      assert.equal(rState.round, 5);
      assert.equal(rState.dayNightPhase, 'night');
      assert.equal(rState.weather, 'thunderstorm');
      assert.equal(rState.activeMajorEvents?.[0]?.id, 'major_arcane_storm');
      assert.equal(rState.activePlayerIndex, 2);
      assert.equal(rState.turnPhase, 'COMBAT');
      assert.equal(rState.combat?.enemyId, state.combat?.enemyId);
      assert.equal(rState.combat?.enemyCurrentHp, state.combat?.enemyCurrentHp);
      assert.ok(rState.chronicle.length > 0);
      assert.equal(rp.locationId, 'loc_66');
      assert.equal(rp.gold, 95);
      assert.equal(rp.experience, 8);
      assert.deepEqual(rp.seals, ['seal_power', 'seal_wisdom']);
      assert.equal(rp.equipment.weapon, 'card_002');
      assert.deepEqual(rp.companions, ['card_111']);
      assert.deepEqual(rp.curses, ['card_136']);
      assert.deepEqual(rp.hand, ['card_048', 'card_053']);

      // 3. Integrity tamper detection + automatic recovery from verified backup
      await SaveManager.saveGame(
        { ...state, players: state.players.map((pl, i) => (i === 2 ? { ...pl, gold: 120 } : pl)) },
        'Manual Check',
        { saveIdOverride: manualRec.saveId, saveKind: 'manual' }
      );
      await SaveManager.corruptSaveRecordForTests(manualRec.saveId, (rec) => ({
        ...rec,
        state: {
          ...rec.state,
          players: rec.state.players.map((pl, i) => (i === 2 ? { ...pl, gold: 999999 } : pl)),
        },
      }));

      const backupRecovered = await SaveManager.loadGameWithReport(manualRec.saveId);
      assert.ok(backupRecovered.state, 'Corrupted primary save must recover from backup');
      assert.equal(backupRecovered.recovered, true);
      assert.equal(backupRecovered.recoverySource, 'backup');
      assert.equal(backupRecovered.state.players[2].gold, 95, 'Backup snapshot preserves pre-tamper verified state');

      // 4. Structural corruption repair when no valid backup exists
      const orphanId = 'save_corrupt_orphan';
      await SaveManager.saveGame(state, 'Orphan', { saveIdOverride: orphanId, saveKind: 'manual' });
      await backend.deleteBackup(orphanId);
      await SaveManager.corruptSaveRecordForTests(orphanId, (rec) => ({
        ...rec,
        checksum: 'bad-checksum',
        state: {
          ...rec.state,
          weather: 'invalid_weather' as unknown as GameState['weather'],
          activePlayerIndex: 99,
          players: rec.state.players.map((pl, idx) =>
            idx === 0 ? { ...pl, locationId: 'loc_invalid', hp: -5 } : pl
          ),
        },
      }));

      const repairedLoad = await SaveManager.loadGameWithReport(orphanId);
      assert.ok(repairedLoad.state, 'Structural repair must salvage damaged save without backup');
      assert.equal(repairedLoad.recovered, true);
      assert.equal(repairedLoad.recoverySource, 'repaired');
      assert.equal(repairedLoad.state.weather, 'clear');
      assert.equal(repairedLoad.state.activePlayerIndex, 1, 'Repaired turn queue skips defeated player 0');
      assert.equal(repairedLoad.state.players[0].locationId, 'loc_01');
      assert.equal(repairedLoad.state.players[0].hp, 0);

      // 5. Versioning migration (legacy v1 state with `wisdom` -> v3 schema)
      const legacyBase = RulesEngine.createNewGame({
        mode: 'local_hotseat',
        seed: 889900,
        playerConfigs: [{ name: 'LegacyMage', heroId: 'hero_02', isAI: false }],
      });
      const legacyV1State = {
        ...legacyBase,
        saveId: 'save_legacy_v1',
        version: 1,
        adventureDeck: undefined,
        marketCardIds: undefined,
        dayNightCycleRound: undefined,
        activeMajorEvents: undefined,
        players: [
          {
            ...legacyBase.players[0],
            intellect: undefined as unknown as number,
            wisdom: 6,
            companions: undefined,
            curses: undefined,
          },
        ],
      } as unknown as GameState;

      await backend.putSave({
        saveId: 'save_legacy_v1',
        label: 'Legacy v1 Save',
        saveKind: 'manual',
        schemaVersion: 1,
        checksum: SaveManager.computeChecksum(legacyV1State),
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
        state: legacyV1State,
      });

      const migratedLoad = await SaveManager.loadGameWithReport('save_legacy_v1');
      assert.ok(migratedLoad.state, 'Legacy v1 save must migrate cleanly');
      assert.equal(migratedLoad.state.version, SaveManager.SCHEMA_VERSION);
      assert.equal(migratedLoad.report.migratedFromVersion, 1);
      assert.equal(migratedLoad.state.players[0].intellect, 6, 'Legacy wisdom must migrate to intellect');
      assert.ok((migratedLoad.state.adventureDeck?.length ?? 0) > 0, 'Migration must populate adventureDeck');

      // 6. Irrecoverable empty players fails cleanly without crashing
      await backend.putSave({
        saveId: 'save_fatal_broken',
        label: 'Broken',
        saveKind: 'manual',
        schemaVersion: 3,
        checksum: '00000000-00000000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        state: { saveId: 'save_fatal_broken', players: [] } as unknown as GameState,
      });
      const brokenLoad = await SaveManager.loadGameWithReport('save_fatal_broken');
      assert.equal(brokenLoad.state, null);
      assert.equal(brokenLoad.recoverySource, 'none');
      assert.ok(brokenLoad.report.fatalErrors.length > 0);
    } finally {
      SaveManager.setStorageBackendForTests(null);
    }
  }
);

runTest('Bestiary intel extracts strengths, weaknesses, and tactical recommendations for all enemies', () => {
  assert.ok(ENEMIES.length >= 15);
  for (const enemy of ENEMIES) {
    const intel = getEnemyBestiaryIntel(enemy.id);
    assert.ok(intel, `Missing bestiary intel for ${enemy.id}`);
    assert.ok(intel.strengths.length >= 1, `${enemy.id} must list strengths`);
    assert.ok(intel.weaknesses.length >= 1, `${enemy.id} must list weaknesses`);
    assert.ok(intel.description.uk.length > 0 && intel.description.en.length > 0);
  }

  const golemIntel = getEnemyBestiaryIntel('enemy_r1_golem')!;
  assert.equal(golemIntel.recommendedApproach, 'magic', 'Stone Armor golem should recommend magic');
  assert.ok(golemIntel.weaknesses.some((w) => w.en.includes('Magic')));

  const wraithIntel = getEnemyBestiaryIntel('enemy_r2_wraith')!;
  assert.equal(wraithIntel.recommendedApproach, 'physical', 'Arcane Ward wraith should recommend physical');
  assert.ok(wraithIntel.weaknesses.some((w) => w.en.includes('Physical')));

  const customIntel = getEnemyBestiaryIntel('card_enemy_custom', {
    name: { uk: 'Болотний троль', en: 'Bog Troll' },
    tier: 'minion',
    maxHp: 12,
    attack: 6,
    intellect: 1,
    defense: 1,
  });
  assert.ok(customIntel);
  assert.equal(customIntel.recommendedApproach, 'magic');
});

console.log('ALL TESTS PASSED SUCCESSFULLY.');

