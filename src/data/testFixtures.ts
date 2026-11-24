import { NewGameConfig } from '../types/game';

/**
 * Clearly separated test/sandbox presets kept isolated from canonical world content
 * in regions.ts, locations.ts, heroes.ts, cards.ts, enemies.ts, and world.ts.
 */
export interface TestScenarioPreset {
  id: string;
  label: { uk: string; en: string };
  description: { uk: string; en: string };
  config: NewGameConfig;
}

export const TEST_SCENARIO_PRESETS: TestScenarioPreset[] = [
  {
    id: 'test_preset_solo_dawn',
    label: {
      uk: 'Тестовий сценарій: Соло проти ШІ',
      en: 'Test Scenario: Solo vs AI',
    },
    description: {
      uk: 'Відтворювана стартова партія з фіксованим зерном #20261124 (1 гравець + 1 ШІ).',
      en: 'Reproducible starter match with fixed seed #20261124 (1 Human + 1 AI).',
    },
    config: {
      mode: 'solo_ai',
      seed: 20261124,
      playerConfigs: [
        { name: 'Kaelen', heroId: 'hero_01', isAI: false },
        { name: 'Lyrael (AI)', heroId: 'hero_02', isAI: true },
      ],
    },
  },
  {
    id: 'test_preset_party_four',
    label: {
      uk: 'Тестовий сценарій: Загін із 4 героїв',
      en: 'Test Scenario: 4-Hero Party',
    },
    description: {
      uk: 'Локальна гра на 4 гравців із фіксованим зерном #404040 для перевірки ротації ходів.',
      en: 'Local 4-player hot-seat match with fixed seed #404040 for turn rotation testing.',
    },
    config: {
      mode: 'local_hotseat',
      seed: 404040,
      playerConfigs: [
        { name: 'Kaelen', heroId: 'hero_01', isAI: false },
        { name: 'Lyrael', heroId: 'hero_02', isAI: false },
        { name: 'Vane', heroId: 'hero_03', isAI: false },
        { name: 'Torgar', heroId: 'hero_04', isAI: false },
      ],
    },
  },
];
