import { HeroDefinition } from '../../types/game';
import { hero01 } from './hero_01';
import { hero02 } from './hero_02';
import { hero03 } from './hero_03';
import { hero04 } from './hero_04';
import { hero05 } from './hero_05';
import { hero06 } from './hero_06';
import { hero07 } from './hero_07';
import { hero08 } from './hero_08';
import { hero09 } from './hero_09';
import { hero10 } from './hero_10';
import { hero11 } from './hero_11';
import { hero12 } from './hero_12';

export const HEROES: HeroDefinition[] = [
  hero01,
  hero02,
  hero03,
  hero04,
  hero05,
  hero06,
  hero07,
  hero08,
  hero09,
  hero10,
  hero11,
  hero12,
];

export const HERO_MAP = new Map<string, HeroDefinition>(HEROES.map((h) => [h.id, h]));

export {
  hero01,
  hero02,
  hero03,
  hero04,
  hero05,
  hero06,
  hero07,
  hero08,
  hero09,
  hero10,
  hero11,
  hero12,
};
