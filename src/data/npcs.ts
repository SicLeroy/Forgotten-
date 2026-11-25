import { NpcDefinition } from '../types/game';

export const NPCS: NpcDefinition[] = [
  {
    id: 'npc_merchant_caravan',
    role: 'merchant',
    name: { uk: 'Гаред із Золотого Обозу', en: 'Gared of the Golden Convoy' },
    title: { uk: 'Торговець караванів', en: 'Caravan Merchant' },
    description: {
      uk: 'Досвідчений купець, що постачає припаси вздовж головних трактів.',
      en: 'Seasoned merchant hauling supplies along the main frontier roads.',
    },
    locationIds: ['loc_08', 'loc_09', 'loc_14', 'loc_15', 'loc_31'],
    terrains: ['village'],
    quest: {
      id: 'quest_caravan_gold',
      title: { uk: 'Охорона торгових шляхів', en: 'Securing Trade Roads' },
      description: {
        uk: 'Знищіть 1 ворога або допоможіть стримати світову кризу на трактах.',
        en: 'Slay 1 enemy or help push back an active world crisis along the roads.',
      },
      objectiveType: 'slay_enemies',
      targetCount: 1,
      rewardGold: 14,
      rewardXp: 2,
      rewardFate: 0,
      rewardCard: true,
    },
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Вітаю, мандрівнику! Мої вози скриплять під вагою спорядження, хоч дороги нині неспокійні. Що тебе цікавить?»',
          en: '"Well met, traveler! My wagons groan with supplies, though the roads grow restless. What brings you to my stall?"',
        },
        options: [
          {
            id: 'opt_bargain',
            label: { uk: 'Домовитись про вигідну поставку (8 з. → карта)', en: 'Strike supply bargain (8g → draw card)' },
            action: 'merchant_bargain',
            goldCost: 8,
            nextNodeId: 'after_bargain',
          },
          {
            id: 'opt_accept_quest',
            label: { uk: 'Взяти доручення: очистити шлях від розбійників', en: 'Accept task: clear raiders from the road' },
            action: 'accept_quest',
            requiresQuestAvailable: true,
            nextNodeId: 'quest_taken',
          },
          {
            id: 'opt_complete_quest',
            label: { uk: 'Доповісти про безпечний шлях і забрати платню', en: 'Report cleared roads and claim pay' },
            action: 'complete_quest',
            requiresQuestReady: true,
            nextNodeId: 'quest_done',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Спорядити розвідку для світової події (6 з.)', en: 'Fund convoy aid for active crisis (6g)' },
            action: 'assist_major_event',
            goldCost: 6,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Рушати далі', en: 'Take your leave' },
            action: 'close',
          },
        ],
      },
      after_bargain: {
        id: 'after_bargain',
        text: {
          uk: '«Тримай добротний пакунок із резерву. Нехай служить вірно в бою!»',
          en: '"Take this prime parcel from my reserve chest. May it serve you well!"',
        },
        options: [
          { id: 'opt_back', label: { uk: 'Повернутися до розмови', en: 'Back to topics' }, action: 'goto', nextNodeId: 'root' },
          { id: 'opt_close', label: { uk: 'Дякую, бувай', en: 'Farewell' }, action: 'close' },
        ],
      },
      quest_taken: {
        id: 'quest_taken',
        text: {
          uk: '«Добре! Здолай хоча б одного нападника на шляху — і я щедро віддячу золотом та картою.»',
          en: '"Splendid! Defeat at least one threat along the roads and I will pay gold and wares."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Вирушаю', en: 'On my way' }, action: 'close' }],
      },
      quest_done: {
        id: 'quest_done',
        text: {
          uk: '«Каравани вже повідомляють про чисту дорогу! Ось твоя чесна нагорода.»',
          en: '"My scouts already report safer passage! Here is your promised reward."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Прийняти нагороду', en: 'Accept reward' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Твої монети й сміливість підняли наші обози. Місцеві вже бачать зміни на краще!»',
          en: '"Your coin and courage rallied our escorts. Folks can already feel the tide turning!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Гарної дороги', en: 'Safe travels' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_merchant_runes',
    role: 'merchant',
    name: { uk: 'Івора Рунна Лавка', en: 'Ivora the Rune Quartermaster' },
    title: { uk: 'Торговиця реліквіями', en: 'Relic Merchant' },
    description: {
      uk: 'Збирачка магічних сувоїв, амулетів і польових реліквій.',
      en: 'Collector of arcane scrolls, charms, and frontier relics.',
    },
    locationIds: ['loc_01', 'loc_02', 'loc_13', 'loc_27'],
    terrains: ['sanctuary'],
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Кристали тремтять у такт бурям світу. Можу поділитися припасами чи рунічною порадою.»',
          en: '"Crystals hum with the tremors of the realm. Care for rare stock or rune counsel?"',
        },
        options: [
          {
            id: 'opt_bargain',
            label: { uk: 'Придбати рунічний згорток (9 з. → карта)', en: 'Purchase rune satchel (9g → draw card)' },
            action: 'merchant_bargain',
            goldCost: 9,
            nextNodeId: 'after_bargain',
          },
          {
            id: 'opt_rumor',
            label: { uk: 'Розпитати про стан неба й світові знамення', en: 'Ask about celestial omens & world crises' },
            action: 'traveler_rumor',
            nextNodeId: 'rumor_reply',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Передати рунний заряд для стабілізації події (5 з.)', en: 'Channel rune charge into active crisis (5g)' },
            action: 'assist_major_event',
            goldCost: 5,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Завершити розмову', en: 'Step away' },
            action: 'close',
          },
        ],
      },
      after_bargain: {
        id: 'after_bargain',
        text: {
          uk: '«Обережно розгортай стрічки — магія всередині ще тепла.»',
          en: '"Unwrap the bindings gently—the enchantment inside is still warm."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Дякую', en: 'Thank you' }, action: 'close' }],
      },
      rumor_reply: {
        id: 'rumor_reply',
        text: {
          uk: '«Дивись на погоду та цикл дня і ночі: кожна буря підказує, де затаїлась сила.»',
          en: '"Watch the weather and the Day/Night turn: every storm hints where power gathers."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Запам’ятаю', en: 'Noted' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Руни спалахнули — хвиля кризи трохи відступила!»',
          en: '"The runes flare bright—the surge of crisis recedes a step!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Хай світло тримається', en: 'Hold the light' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_traveler_scout',
    role: 'traveler',
    name: { uk: 'Ліра Слідопитка', en: 'Lyra the Border Scout' },
    title: { uk: 'Мандрівниця стежок', en: 'Wayfarer Traveler' },
    description: {
      uk: 'Швидконога розвідниця, що знає таємні нічні броди й прикмети негоди.',
      en: 'Fleet-footed scout who tracks hidden night passages and storm fronts.',
    },
    locationIds: ['loc_03', 'loc_16', 'loc_18', 'loc_29', 'loc_37'],
    terrains: ['wilds', 'pass'],
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Тихо! Земля говорить через сліди. Поділимося новинами біля вогнища?»',
          en: '"Quiet now—the dirt speaks in footprints. Share news beside a banked fire?"',
        },
        options: [
          {
            id: 'opt_rumor',
            label: { uk: 'Обмінятися картами стежок і чутками', en: 'Exchange trail maps and rumors' },
            action: 'traveler_rumor',
            nextNodeId: 'after_rumor',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Скоординувати засідку на вогнище світової події (4 з.)', en: 'Scout out an active world event (4g)' },
            action: 'assist_major_event',
            goldCost: 4,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Прощавай, стежки кличуть', en: 'Move on down the trail' },
            action: 'close',
          },
        ],
      },
      after_rumor: {
        id: 'after_rumor',
        text: {
          uk: '«Тримай кілька знайдених монет і знай: уночі на курганах і бродах відкриваються потаємні переходи!»',
          en: '"Take a few stray coins I found, and remember: hidden night shortcuts open at Dusk & Night!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Корисна звістка', en: 'Useful word' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Ми перекрили їм обхідні стежки. Світ уже реагує на наш удар!»',
          en: '"We cut off their flanking paths. The realm already feels the shift!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Рушаємо далі', en: 'Press on' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_traveler_pilgrim',
    role: 'traveler',
    name: { uk: 'Орін Сірий Паломник', en: 'Orin the Gray Pilgrim' },
    title: { uk: 'Мандрівник руїн', en: 'Ruins Traveler' },
    description: {
      uk: 'Сивий мандрівник, який обійшов усі три регіони в пошуках забутих легенд.',
      en: 'Weathered wanderer who has walked all three regions seeking forgotten lore.',
    },
    locationIds: ['loc_23', 'loc_25', 'loc_30', 'loc_45', 'loc_74'],
    terrains: ['ruins', 'pass'],
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Руїни пам’ятають імена героїв. Кожен твій вчинок залишає відлуння у літописі.»',
          en: '"These ruins remember every hero’s stride. Your deeds reshape the living world."',
        },
        options: [
          {
            id: 'opt_rumor',
            label: { uk: 'Вислухати оповідь про стародавні землі', en: 'Listen to tales of ancient routes' },
            action: 'traveler_rumor',
            nextNodeId: 'after_rumor',
          },
          {
            id: 'opt_blessing',
            label: { uk: 'Поділитися водою й перепочити разом', en: 'Share water and recover breath' },
            action: 'special_blessing',
            nextNodeId: 'after_rest',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Поклонитись і йти далі', en: 'Bow and depart' },
            action: 'close',
          },
        ],
      },
      after_rumor: {
        id: 'after_rumor',
        text: {
          uk: '«Навіть якщо велика подія здається грізною, Печатки та Брама Цитаделі завжди чекають на сміливого.»',
          en: '"Even in dark crises, the Three Seals and Citadel Gates never close to a resolute soul."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Спасибі за мудрість', en: 'Thank you' }, action: 'close' }],
      },
      after_rest: {
        id: 'after_rest',
        text: {
          uk: '«Нехай дорожній спокій додасть тобі сил і ясності розуму.»',
          en: '"May quiet fellowship restore your vigor and steadiness."',
        },
        options: [{ id: 'opt_close', label: { uk: 'До зустрічі', en: 'Until we meet again' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_quest_archivist',
    role: 'quest_giver',
    name: { uk: 'Селеста з Ордену Рун', en: 'Celesta of the Rune Order' },
    title: { uk: 'Квестодавиця · Архіваріус', en: 'Quest Giver · Archivist' },
    description: {
      uk: 'Збирає хроніки досліджених локацій і фінансує сміливі експедиції.',
      en: 'Records newly explored territories and sponsors brave expeditions.',
    },
    locationIds: ['loc_01', 'loc_02', 'loc_22', 'loc_28', 'loc_34'],
    terrains: ['sanctuary', 'shrine'],
    quest: {
      id: 'quest_archivist_explore',
      title: { uk: 'Картографія Забутих Земель', en: 'Cartography of Forgotten Lands' },
      description: {
        uk: 'Відвідайте щонайменше 2 нові локації після прийняття завдання.',
        en: 'Explore at least 2 new locations after accepting this charter.',
      },
      objectiveType: 'explore_locations',
      targetCount: 2,
      rewardGold: 16,
      rewardXp: 2,
      rewardFate: 1,
      rewardCard: true,
    },
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Хроніки потребують точних записів! Коли світ трясуть великі події, знання — найміцніший щит.»',
          en: '"The chronicles demand true witnesses! Amid world crises, knowledge is our strongest shield."',
        },
        options: [
          {
            id: 'opt_accept_quest',
            label: { uk: 'Прийняти хартію розвідника (відкрити 2 локації)', en: 'Accept scout charter (visit 2 new locations)' },
            action: 'accept_quest',
            requiresQuestAvailable: true,
            nextNodeId: 'quest_taken',
          },
          {
            id: 'opt_complete_quest',
            label: { uk: 'Передати записи нових земель і забрати нагороду', en: 'Deliver survey notes & claim reward' },
            action: 'complete_quest',
            requiresQuestReady: true,
            nextNodeId: 'quest_done',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Використати архівні нотатки проти поточної кризи (4 з.)', en: 'Apply archive notes against active crisis (4g)' },
            action: 'assist_major_event',
            goldCost: 4,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Залишити архів', en: 'Leave the archive' },
            action: 'close',
          },
        ],
      },
      quest_taken: {
        id: 'quest_taken',
        text: {
          uk: '«Чудово! Відкрий дві нові локації та повертайся — нагорода чекає.»',
          en: '"Excellent! Chart two new locations and report back—a fine stipend awaits."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Буде виконано', en: 'Consider it done' }, action: 'close' }],
      },
      quest_done: {
        id: 'quest_done',
        text: {
          uk: '«Які бездоганні мапи! Орден щедро дякує тобі золотом, Долею та рідкісною картою.»',
          en: '"Impeccable charts! The Order rewards you with gold, Fate, and a prized card."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Слава Ордену', en: 'For the Order' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Знання спрацювали бездоганно — загрозу світової події зменшено!»',
          en: '"The archival lore held true—the active world crisis has weakened!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'До зустрічі', en: 'Farewell' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_quest_captain',
    role: 'quest_giver',
    name: { uk: 'Капітан Бран', en: 'Captain Bran of the Vigil' },
    title: { uk: 'Квестодавець · Командир варти', en: 'Quest Giver · Vigil Captain' },
    description: {
      uk: 'Очолює прикордонні гарнізони та виплачує нагороди за знищених потвор.',
      en: 'Commands frontier garrisons and pays bounties for slain monsters.',
    },
    locationIds: ['loc_41', 'loc_42', 'loc_07', 'loc_15', 'loc_73'],
    terrains: ['fortress', 'pass'],
    quest: {
      id: 'quest_captain_bounty',
      title: { uk: 'Зачистка прикордоння', en: 'Frontier Purge' },
      description: {
        uk: 'Переможіть 2 ворогів у бою, щоб послабити загрозу на рубежах.',
        en: 'Defeat 2 enemies in combat to relieve frontier pressure.',
      },
      objectiveType: 'slay_enemies',
      targetCount: 2,
      rewardGold: 20,
      rewardXp: 3,
      rewardFate: 0,
      rewardCard: true,
    },
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Тримай клинок гострим! Гарнізон ледь встигає рахувати нові напади.»',
          en: '"Keep your blade keen! The garrison barely keeps up with fresh incursions."',
        },
        options: [
          {
            id: 'opt_accept_quest',
            label: { uk: 'Взяти бойовий контракт (2 перемоги)', en: 'Accept bounty contract (slay 2 enemies)' },
            action: 'accept_quest',
            requiresQuestAvailable: true,
            nextNodeId: 'quest_taken',
          },
          {
            id: 'opt_complete_quest',
            label: { uk: 'Пред’явити трофеї й забрати нагороду', en: 'Claim monster bounty' },
            action: 'complete_quest',
            requiresQuestReady: true,
            nextNodeId: 'quest_done',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Підтримати вилазку варти проти світової події (5 з.)', en: 'Back garrison sortie against active event (5g)' },
            action: 'assist_major_event',
            goldCost: 5,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Повернутися на пост', en: 'Back to duty' },
            action: 'close',
          },
        ],
      },
      quest_taken: {
        id: 'quest_taken',
        text: {
          uk: '«Повертайся, щойно покладеш двох ворогів — золото буде твоїм!»',
          en: '"Return once two foes fall by your hand—the bounty is yours!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'До бою', en: 'To battle' }, action: 'close' }],
      },
      quest_done: {
        id: 'quest_done',
        text: {
          uk: '«Славна робота, воїне! Забирай монети й спорядження зі зброярні.»',
          en: '"Fine work, soldier! Take this coin and armory draw."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Дякую, капітане', en: 'Thank you, Captain' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Варта прорвала кільце ворогів — тиск кризи спадає!»',
          en: '"The garrison broke their vanguard—crisis pressure drops!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Так тримати', en: 'Hold the line' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_special_seer',
    role: 'special',
    name: { uk: 'Сліпа провидиця Вейла', en: 'Blind Seer Veyla' },
    title: { uk: 'Особливий персонаж · Оракул Долі', en: 'Special Character · Fate Oracle' },
    description: {
      uk: 'Бачить нитки Долі, Печатки героїв та пророкує наслідки великих світових подій.',
      en: 'Perceives threads of Fate, Hero Seals, and the unfolding omens of great crises.',
    },
    locationIds: ['loc_06', 'loc_26', 'loc_34', 'loc_36', 'loc_84'],
    terrains: ['shrine', 'void_throne'],
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Я бачу не очима, а відблиском Печаток на твоїй душі. Чи шукаєш благословення Долі?»',
          en: '"I see not with eyes, but by the glow of Seals upon your spirit. Do you seek Fate’s blessing?"',
        },
        options: [
          {
            id: 'opt_blessing',
            label: { uk: 'Прийняти передбачення Долі (+1 Доля, +1 HP)', en: 'Receive Oracle blessing (+1 Fate, +1 HP)' },
            action: 'special_blessing',
            nextNodeId: 'after_blessing',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Спрямувати видіння на послаблення світової події', en: 'Channel omen to weaken active crisis' },
            action: 'assist_major_event',
            goldCost: 0,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Відступити в тиші', en: 'Withdraw in silence' },
            action: 'close',
          },
        ],
      },
      after_blessing: {
        id: 'after_blessing',
        text: {
          uk: '«Нитка Долі подовжилась. Пам’ятай: повторний кидок кубика змінює сам плин бою чи мандрівки.»',
          en: '"Your thread of Fate lengthens. Remember: one Fate reroll can turn journey or battle."',
        },
        options: [{ id: 'opt_close', label: { uk: 'Прийняти дар', en: 'Accept gift' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Завіса майбутнього прояснилась — темна хвиля події втратила частину своєї сили!»',
          en: '"The veil parts—the active world crisis loses momentum!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Дякую, провидице', en: 'Thank you, Seer' }, action: 'close' }],
      },
    },
  },
  {
    id: 'npc_special_purifier',
    role: 'special',
    name: { uk: 'Мудрець Талґор', en: 'Purifier Sage Talgor' },
    title: { uk: 'Особливий персонаж · Хранитель Очищення', en: 'Special Character · Purifier Sage' },
    description: {
      uk: 'Знімає тяжкі прокляття дешевше за звичайні вівтарі та гасить світову скверну.',
      en: 'Dispels heavy curses at half shrine cost and counters spreading world blight.',
    },
    locationIds: ['loc_22', 'loc_24', 'loc_01', 'loc_13', 'loc_34'],
    terrains: ['shrine', 'sanctuary'],
    entryNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: {
          uk: '«Тіні проклять липнуть до необережних. Підійди до світла свічки, коли потребуєш очищення.»',
          en: '"Curses cling fast to the unwary. Step into the vigil flame if you need purification."',
        },
        options: [
          {
            id: 'opt_cleanse',
            label: { uk: 'Зняти прокляття за пільговим обрядом (6 з.)', en: 'Purify active curse via half-cost rite (6g)' },
            action: 'special_cleanse',
            goldCost: 6,
            requiresCurse: true,
            nextNodeId: 'after_cleanse',
          },
          {
            id: 'opt_assist_event',
            label: { uk: 'Провести очисний ритуал проти світової події (4 з.)', en: 'Perform purification against active crisis (4g)' },
            action: 'assist_major_event',
            goldCost: 4,
            requiresActiveMajorEvent: true,
            nextNodeId: 'after_aid',
          },
          {
            id: 'opt_blessing',
            label: { uk: 'Отримати зцілення вогнем свічки (+1 HP, +1 Доля)', en: 'Receive vigil healing (+1 HP, +1 Fate)' },
            action: 'special_blessing',
            nextNodeId: 'after_cleanse',
          },
          {
            id: 'opt_leave',
            label: { uk: 'Залишити святилище', en: 'Depart' },
            action: 'close',
          },
        ],
      },
      after_cleanse: {
        id: 'after_cleanse',
        text: {
          uk: '«Чисте полум’я зробило свою справу. Іди з легким серцем!»',
          en: '"The pure flame has done its work. Walk with a lighter heart!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Щиро дякую', en: 'Many thanks' }, action: 'close' }],
      },
      after_aid: {
        id: 'after_aid',
        text: {
          uk: '«Хвиля світового зла відступила перед давнім очисним словом!»',
          en: '"The global blight retreats before the ancient word of cleansing!"',
        },
        options: [{ id: 'opt_close', label: { uk: 'Мир тобі, мудрецю', en: 'Peace, Sage' }, action: 'close' }],
      },
    },
  },
];

export const NPC_MAP = new Map<string, NpcDefinition>(NPCS.map((n) => [n.id, n]));
