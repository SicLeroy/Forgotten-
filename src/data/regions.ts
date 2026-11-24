import { RegionDefinition } from '../types/game';

export const REGIONS: RegionDefinition[] = [
  {
    id: 'reg_sunspire_vale',
    tier: 'outer',
    name: {
      uk: 'Зовнішній регіон · Долина Сонячного Шпиля',
      en: 'Outer Region · Sunspire Vale',
    },
    subtitle: {
      uk: '42 локації · 6 секторів по 7 · Відкритий на старті',
      en: '42 Locations · 6 Sectors of 7 · Open from Start',
    },
    description: {
      uk: 'Ліси, села, гірські хребти, стародавні руїни, річки й прикордоння. Тут зберігається Печатка Сили та стоїть Охоронець Брами.',
      en: 'Forests, rural hamlets, mountains, ancient ruins, riverlands, and borderlands. Holds the Seal of Power and the Gate Guardian.',
    },
    threatLevel: 1,
    imagePath: '/src/assets/images/region_sunspire_vale_1795551916756.jpg',
    sealId: 'seal_power',
    startLocationId: 'loc_01',
  },
  {
    id: 'reg_ashen_marches',
    tier: 'middle',
    name: {
      uk: 'Середній регіон · Попелясті Межі',
      en: 'Middle Region · The Ashen Marches',
    },
    subtitle: {
      uk: '30 локацій · 5 секторів по 6 · Після перемоги над Охоронцем Брами',
      en: '30 Locations · 5 Sectors of 6 · Requires Defeating Gate Guardian',
    },
    description: {
      uk: 'Проклятий ліс, землі руїн, вулкани, землі демонів та стародавні храми. Тут сховані Печатка Долі та Печатка Мудрості.',
      en: 'Cursed woods, ruined wastes, volcanic fields, demon lands, and ancient temples. Holds the Seal of Fate and Seal of Wisdom.',
    },
    threatLevel: 2,
    imagePath: '/src/assets/images/region_ashen_marches_1795551917169.jpg',
    sealId: 'seal_wisdom',
    startLocationId: 'loc_43',
  },
  {
    id: 'reg_abyssal_citadel',
    tier: 'inner',
    name: {
      uk: 'Внутрішній регіон · Безодня Цитаделі',
      en: 'Inner Region · The Abyssal Citadel',
    },
    subtitle: {
      uk: '12 локацій · 4 сектори по 3 · Необхідні три Печатки',
      en: '12 Locations · 4 Sectors of 3 · Requires Three Seals',
    },
    description: {
      uk: 'Зруйновані брами, Шлях випробувань, Цитадель охоронців та Серце темряви з Троном Володаря Порожнечі.',
      en: 'Shattered Gates, Path of Trials, Citadel of Guardians, and the Heart of Darkness with the Throne of the Void.',
    },
    threatLevel: 3,
    imagePath: '/src/assets/images/region_abyssal_citadel_1795551917831.jpg',
    sealId: 'seal_fate',
    startLocationId: 'loc_73',
  },
];

export const REGION_MAP = new Map(REGIONS.map((r) => [r.id, r]));
