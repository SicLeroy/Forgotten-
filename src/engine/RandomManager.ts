import {
  nextRandom,
  normalizeSeed,
  randomInt,
  rollD6,
  rollMultipleD6,
  shuffleWithState,
} from './rng';

export const RandomManager = {
  normalizeSeed,
  nextRandom,
  rollD6,
  rollMultipleD6,
  randomInt,
  shuffle: shuffleWithState,
};
