import { ENEMY_MAP } from '../data/enemies';
import {
  CombatType,
  EnemyDefinition,
  EnemySpecialEffectType,
  LocalizedText,
} from '../types/game';

export interface EnemyBestiaryIntel {
  enemyId: string;
  name: LocalizedText;
  description: LocalizedText;
  tier: EnemyDefinition['tier'] | 'pvp';
  maxHp: number;
  attack: number;
  intellect: number;
  defense: number;
  specialEffect: EnemySpecialEffectType;
  specialTrait: LocalizedText | null;
  strengths: LocalizedText[];
  weaknesses: LocalizedText[];
  recommendedApproach: CombatType | 'balanced';
}

export interface EnemyBestiaryOverrides {
  name?: LocalizedText;
  tier?: EnemyDefinition['tier'] | 'pvp';
  maxHp?: number;
  attack?: number;
  intellect?: number;
  defense?: number;
  specialEffect?: EnemySpecialEffectType;
  specialTrait?: LocalizedText;
}

export function getEnemyBestiaryIntel(
  enemyId: string,
  overrides?: EnemyBestiaryOverrides
): EnemyBestiaryIntel | null {
  const base = ENEMY_MAP.get(enemyId);
  if (!base && !overrides?.name) return null;

  const name = overrides?.name ?? base!.name;
  const description = base?.description ?? {
    uk: 'Ворожа істота, породжена аномаліями Забутих Земель.',
    en: 'Hostile creature spawned by anomalies of the Forgotten Realms.',
  };
  const tier = overrides?.tier ?? base?.tier ?? 'minion';
  const maxHp = overrides?.maxHp ?? base?.maxHp ?? 10;
  const attack = overrides?.attack ?? base?.attack ?? 3;
  const intellect =
    overrides?.intellect ?? base?.intellect ?? Math.max(1, attack - 1);
  const defense = overrides?.defense ?? base?.defense ?? 1;
  const specialEffect =
    overrides?.specialEffect ?? base?.specialEffectType ?? 'none';
  const specialTrait = overrides?.specialTrait ?? base?.specialTrait ?? null;

  const strengths: LocalizedText[] = [];
  const weaknesses: LocalizedText[] = [];

  if (attack >= 6 || attack >= intellect + 2) {
    strengths.push({
      uk: `Висока фізична міць (Атака ${attack})`,
      en: `High physical might (Attack ${attack})`,
    });
  }
  if (intellect >= 5 || intellect >= attack + 2) {
    strengths.push({
      uk: `Сильний магічний інтелект (${intellect})`,
      en: `Strong arcane intellect (${intellect})`,
    });
  }
  if (defense >= 3) {
    strengths.push({
      uk: `Міцна броня та стійкість (Захист ${defense})`,
      en: `Heavy armor & resilience (Defense ${defense})`,
    });
  }
  if (maxHp >= 20) {
    strengths.push({
      uk: `Великий запас здоров’я (${maxHp} HP)`,
      en: `High health pool (${maxHp} HP)`,
    });
  }

  switch (specialEffect) {
    case 'stone_armor':
      strengths.push({
        uk: 'Кам’яний панцир (-1 до фізичних атак героя)',
        en: 'Stone Armor (-1 to hero physical attacks)',
      });
      weaknesses.push({
        uk: 'Вразливий до магії — магічні удари обходять кам’яний панцир',
        en: 'Weak to Magic — arcane strikes bypass stone armor',
      });
      break;
    case 'arcane_ward':
      strengths.push({
        uk: 'Магічний бар’єр (-1 до магічних атак героя)',
        en: 'Arcane Ward (-1 to hero magic attacks)',
      });
      weaknesses.push({
        uk: 'Вразливий до фізичної зброї — сталь пробиває магічний бар’єр',
        en: 'Weak to Physical weapons — steel pierces arcane wards',
      });
      break;
    case 'first_strike':
      strengths.push({
        uk: 'Перший удар (+1 до атаки в 1-му раунді бою)',
        en: 'First Strike (+1 attack in Round 1)',
      });
      weaknesses.push({
        uk: 'Втрачає перевагу натиску після 1-го раунду',
        en: 'Opening surge fades after Round 1',
      });
      break;
    case 'burn_aura':
      strengths.push({
        uk: 'Вогняна аура випалює золото при поразці героя в раунді',
        en: 'Burn Aura scorches gold when hero loses a clash',
      });
      break;
    case 'curse_strike':
      strengths.push({
        uk: 'Проклятий удар руйнує тимчасовий захист героя',
        en: 'Curse Strike erodes hero temporary defense on hit',
      });
      break;
    case 'void_oblivion':
      strengths.push({
        uk: 'Натиск Порожнечі (+1 до атаки ворога з 2-го раунду)',
        en: 'Void Oblivion (+1 enemy attack from Round 2 onward)',
      });
      weaknesses.push({
        uk: 'Вразливий до швидкої перемоги в першому раунді до ескалації',
        en: 'Vulnerable to burst damage in Round 1 before escalation',
      });
      break;
    case 'none':
      break;
  }

  if (intellect <= attack - 2 && specialEffect !== 'arcane_ward') {
    const alreadyMagicWeak = weaknesses.some((w) => w.en.includes('Magic'));
    if (!alreadyMagicWeak) {
      weaknesses.push({
        uk: `Слабкий опір магії (Інтелект ${intellect} проти Атаки ${attack})`,
        en: `Low magic resistance (INT ${intellect} vs ATK ${attack})`,
      });
    }
  } else if (attack <= intellect - 2 && specialEffect !== 'stone_armor') {
    const alreadyPhysWeak = weaknesses.some((w) => w.en.includes('Physical'));
    if (!alreadyPhysWeak) {
      weaknesses.push({
        uk: `Слабкий у ближньому бою (Атака ${attack} проти Інтелекту ${intellect})`,
        en: `Weak in melee combat (ATK ${attack} vs INT ${intellect})`,
      });
    }
  }

  if (defense <= 1) {
    weaknesses.push({
      uk: `Низький захист (${defense}) — швидко втрачає HP`,
      en: `Low Defense (${defense}) — loses HP rapidly`,
    });
  }

  if (strengths.length === 0) {
    strengths.push({
      uk: `Збалансовані показники для свого рівня (Атака ${attack}, Інтелект ${intellect})`,
      en: `Balanced stats for its tier (ATK ${attack}, INT ${intellect})`,
    });
  }

  if (weaknesses.length === 0) {
    weaknesses.push({
      uk: 'Без елементальних щитів — піддається бонусам спорядження й заклять',
      en: 'No elemental shields — susceptible to gear & spell modifiers',
    });
  }

  // Compute recommended combat type factoring stone_armor / arcane_ward effective penalty
  const effectivePhysResist = attack + (specialEffect === 'stone_armor' ? 1 : 0);
  const effectiveMagResist = intellect + (specialEffect === 'arcane_ward' ? 1 : 0);
  let recommendedApproach: CombatType | 'balanced' = 'balanced';
  if (effectiveMagResist + 1 <= effectivePhysResist) {
    recommendedApproach = 'magic';
  } else if (effectivePhysResist + 1 <= effectiveMagResist) {
    recommendedApproach = 'physical';
  }

  return {
    enemyId,
    name,
    description,
    tier,
    maxHp,
    attack,
    intellect,
    defense,
    specialEffect,
    specialTrait,
    strengths,
    weaknesses,
    recommendedApproach,
  };
}
