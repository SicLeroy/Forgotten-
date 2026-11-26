import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Coins, Compass, Heart, Shield, Sparkles, Sword } from 'lucide-react';
import { CARD_MAP } from '../data/cards';
import { HEROES, HERO_MAP } from '../data/heroes';
import { REGIONS } from '../data/regions';
import { TEST_SCENARIO_PRESETS } from '../data/testFixtures';
import { AiManager } from '../engine/AiManager';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { checkOnlineServerAvailable } from '../online/OnlineClient';
import {
  AiBehaviorStyle,
  AiDifficulty,
  GameMode,
  HERO_STAT_LIMITS,
  Language,
  NewGameConfig,
  SaveSlotSummary,
} from '../types/game';
import { resolveAssetUrl } from '../utils/assetUrl';
import { HeroAvatar } from './HeroAvatar';
import { OrnamentalDivider } from './OrnamentalSymbols';

const { pickText, t } = LocalizationManager;

interface TitleMenuProps {
  lang: Language;
  recentSave: SaveSlotSummary | null;
  initialRoomCode?: string;
  onlineError?: string | null;
  onlineBusy?: boolean;
  onStartGame: (config: NewGameConfig) => void;
  onLoadRecentSave: (saveId: string) => void;
  onCreateOnlineRoom: (payload: {
    hostName: string;
    heroId: string;
    maxPlayers: number;
    aiDifficulty: AiDifficulty;
  }) => Promise<void>;
  onJoinOnlineRoom: (payload: {
    roomCode: string;
    playerName: string;
    heroId: string;
    reconnectCode?: string;
  }) => Promise<void>;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  lang,
  recentSave,
  initialRoomCode = '',
  onlineError = null,
  onlineBusy = false,
  onStartGame,
  onLoadRecentSave,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
}) => {
  const [mode, setMode] = useState<GameMode>(initialRoomCode ? 'online' : 'solo_ai');
  const [onlineTab, setOnlineTab] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );
  const [onlineRoomCode, setOnlineRoomCode] = useState<string>(initialRoomCode);
  const [onlinePlayerName, setOnlinePlayerName] = useState<string>('');
  const [onlineReconnectCode, setOnlineReconnectCode] = useState<string>('');
  const [totalPlayers, setTotalPlayers] = useState<number>(initialRoomCode ? 4 : 2);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('normal');
  const [aiStyles, setAiStyles] = useState<AiBehaviorStyle[]>([
    'conqueror',
    'scholar',
    'merchant_tactician',
    'warden',
    'conqueror',
    'scholar',
  ]);
  const [seedInput, setSeedInput] = useState<string>('');
  const [selectedHeroes, setSelectedHeroes] = useState<string[]>([
    'hero_01',
    'hero_02',
    'hero_03',
    'hero_04',
    'hero_05',
    'hero_06',
  ]);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Кайрен',
    'Ліраель (ШІ)',
    'Аелар',
    'Торін',
    'Селена',
    'Рагнак',
  ]);
  const [focusedSlot, setFocusedSlot] = useState<number>(0);
  const [inspectedHeroId, setInspectedHeroId] = useState<string>('hero_01');
  const [emblemFailed, setEmblemFailed] = useState(false);
  const [onlineServerReachable, setOnlineServerReachable] = useState<boolean | null>(null);
  const setupFormRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mode !== 'online') return;
    let active = true;
    checkOnlineServerAvailable().then((ok) => {
      if (active) setOnlineServerReachable(ok);
    });
    return () => {
      active = false;
    };
  }, [mode]);

  const inspectedHero = HERO_MAP.get(inspectedHeroId) ?? HEROES[0];

  const handleModeChange = (nextMode: GameMode) => {
    setMode(nextMode);
    if (nextMode === 'solo_ai' && totalPlayers < 2) {
      setTotalPlayers(2);
    }
  };

  const handleHeroChange = (slotIdx: number, heroId: string) => {
    const updated = [...selectedHeroes];
    updated[slotIdx] = heroId;
    setSelectedHeroes(updated);
    setInspectedHeroId(heroId);

    const updatedStyles = [...aiStyles];
    updatedStyles[slotIdx] = AiManager.assignDefaultStyle(heroId, slotIdx);
    setAiStyles(updatedStyles);

    const hero = HERO_MAP.get(heroId);
    if (hero) {
      const updatedNames = [...playerNames];
      const suffix = mode === 'solo_ai' && slotIdx > 0 ? ` (${t(lang, 'aiLabel')})` : '';
      updatedNames[slotIdx] = `${hero.name[lang].split(' ')[0]}${suffix}`;
      setPlayerNames(updatedNames);
    }
  };

  const handleNameChange = (slotIdx: number, name: string) => {
    const updated = [...playerNames];
    updated[slotIdx] = name;
    setPlayerNames(updated);
  };

  const handleStyleChange = (slotIdx: number, style: AiBehaviorStyle) => {
    const updated = [...aiStyles];
    updated[slotIdx] = style;
    setAiStyles(updated);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'online') {
      const heroId = selectedHeroes[0] ?? HEROES[0].id;
      if (onlineTab === 'create') {
        void onCreateOnlineRoom({
          hostName: onlinePlayerName.trim() || playerNames[0]?.trim() || 'Hero',
          heroId,
          maxPlayers: totalPlayers,
          aiDifficulty,
        });
      } else {
        void onJoinOnlineRoom({
          roomCode: onlineRoomCode.trim(),
          playerName: onlinePlayerName.trim() || playerNames[0]?.trim() || 'Adventurer',
          heroId,
          reconnectCode: onlineReconnectCode.trim() || undefined,
        });
      }
      return;
    }

    const parsedSeed = seedInput.trim() ? Number(seedInput.trim()) : undefined;
    const playerConfigs = Array.from({ length: totalPlayers }, (_, idx) => {
      const heroId = selectedHeroes[idx] ?? HEROES[idx % HEROES.length].id;
      const isAI = mode === 'solo_ai' && idx > 0;
      const fallbackHero = HERO_MAP.get(heroId) ?? HEROES[0];
      return {
        name: playerNames[idx]?.trim() || fallbackHero.name[lang],
        heroId,
        isAI,
        aiDifficulty: isAI ? aiDifficulty : undefined,
        aiStyle: isAI ? aiStyles[idx] : undefined,
      };
    });

    onStartGame({
      mode,
      seed: parsedSeed,
      aiDifficulty,
      playerConfigs,
    });
  };

  const handleFocusNewGame = () => {
    setupFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const inspectedGear = [
    inspectedHero.startingEquipment.weapon,
    inspectedHero.startingEquipment.armor,
    inspectedHero.startingEquipment.talisman,
  ]
    .filter((id): id is string => Boolean(id))
    .map((id) => CARD_MAP.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const inspectedResourceCards = inspectedHero.startingResources.cards
    .map((id) => CARD_MAP.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10 space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
        {/* Left Main Menu & Parchment Chronicle Column */}
        <section className="lg:col-span-5 flex flex-col justify-between rounded-lg ornate-frame bg-[#15181f] p-6 sm:p-8">
          <div className="space-y-5">
            <p className="text-xs font-medium tracking-wide text-amber-400/90">
              {t(lang, 'appSubtitle')}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-stone-100 sm:text-5xl text-balance">
              {t(lang, 'appTitle')}
            </h1>

            <div className="parchment-panel rounded-md p-4">
              <div className="font-display text-lg font-bold text-[#241b11]">
                {t(lang, 'mainGoalTitle')}
              </div>
              <OrnamentalDivider darkInk />
              <p className="text-xs sm:text-sm leading-relaxed text-[#3a2c1c]">
                {t(lang, 'mainGoalText')}
              </p>
            </div>

            <div className="overflow-hidden rounded-md border border-amber-800/30 bg-[#111317]">
              {!emblemFailed ? (
                <img
                  src={resolveAssetUrl('/src/assets/images/emblem_three_seals_1795551918045.jpg')}
                  alt="Three Seals Medallion"
                  referrerPolicy="no-referrer"
                  onError={() => setEmblemFailed(true)}
                  className="h-48 w-full object-cover sm:h-56"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-stone-900 text-stone-400">
                  <span className="font-display text-lg">{t(lang, 'sealsTitle')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Main Menu Actions */}
          <div className="mt-6 border-t border-stone-800 pt-5 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleFocusNewGame}
                className="rounded bg-amber-600 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-amber-500 transition-colors whitespace-nowrap min-h-[44px]"
              >
                {t(lang, 'newGame')}
              </button>
              <button
                type="button"
                disabled={!recentSave}
                onClick={() => recentSave && onLoadRecentSave(recentSave.saveId)}
                className="rounded border border-amber-600/60 bg-amber-950/40 px-5 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-h-[44px]"
              >
                {t(lang, 'continueButton')}
              </button>
            </div>

            {recentSave && (
              <div className="text-xs text-stone-400 tabular-nums">
                {recentSave.label} · {t(lang, 'roundLabel')} {recentSave.round}
              </div>
            )}
          </div>
        </section>

        {/* Right Campaign Setup Form */}
        <section
          ref={setupFormRef}
          className="lg:col-span-7 rounded-lg ornate-frame bg-[#15181f] p-6 sm:p-8"
        >
          <form onSubmit={handleStart} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <h2 className="font-display text-2xl font-bold text-stone-100">
                {t(lang, 'newGame')}
              </h2>
              <div className="flex flex-wrap items-center gap-1 rounded-md bg-[#111317] p-1 border border-stone-800">
                <button
                  type="button"
                  onClick={() => handleModeChange('solo_ai')}
                  className={`rounded px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    mode === 'solo_ai'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-300 hover:text-stone-100'
                  }`}
                >
                  {t(lang, 'modeSoloAi')}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('local_hotseat')}
                  className={`rounded px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    mode === 'local_hotseat'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-300 hover:text-stone-100'
                  }`}
                >
                  {t(lang, 'modeHotseat')}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('online')}
                  className={`rounded px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                    mode === 'online'
                      ? 'bg-amber-600 text-stone-950'
                      : 'text-stone-300 hover:text-stone-100'
                  }`}
                >
                  {t(lang, 'modeOnline')}
                </button>
              </div>
            </div>

            {mode === 'online' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-1 rounded-md border border-stone-800 bg-[#111317] p-1">
                  <button
                    type="button"
                    onClick={() => setOnlineTab('create')}
                    className={`flex-1 rounded px-3 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                      onlineTab === 'create'
                        ? 'bg-amber-600 text-stone-950'
                        : 'text-stone-300 hover:text-stone-100'
                    }`}
                  >
                    {t(lang, 'onlineCreateRoomTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineTab('join')}
                    className={`flex-1 rounded px-3 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                      onlineTab === 'join'
                        ? 'bg-amber-600 text-stone-950'
                        : 'text-stone-300 hover:text-stone-100'
                    }`}
                  >
                    {t(lang, 'onlineJoinRoomTab')}
                  </button>
                </div>

                {onlineError && (
                  <div
                    role="alert"
                    className="rounded border border-rose-700/70 bg-rose-950/50 px-3 py-2 text-xs text-rose-200"
                  >
                    {onlineError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="online-player-name"
                      className="block text-xs font-medium text-stone-400 mb-1.5"
                    >
                      {t(lang, 'onlineYourNameLabel')}
                    </label>
                    <input
                      id="online-player-name"
                      type="text"
                      maxLength={32}
                      value={onlinePlayerName}
                      onChange={(e) => setOnlinePlayerName(e.target.value)}
                      placeholder={playerNames[0]}
                      className="w-full rounded border border-stone-800 bg-[#111317] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 min-h-[42px] focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1.5">
                      {t(lang, 'chooseHero')}
                    </label>
                    <select
                      value={selectedHeroes[0]}
                      onChange={(e) => handleHeroChange(0, e.target.value)}
                      className="w-full rounded border border-stone-800 bg-[#111317] px-3 py-2 text-sm text-stone-100 min-h-[42px] focus:border-amber-500 focus:outline-none"
                    >
                      {HEROES.map((h) => (
                        <option key={h.id} value={h.id}>
                          {pickText(lang, h.className)} — {pickText(lang, h.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {onlineTab === 'create' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">
                        {t(lang, 'playerCount')}
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setTotalPlayers(cnt)}
                            className={`flex-1 rounded border py-2 text-sm font-mono font-semibold tabular-nums transition-colors min-h-[42px] ${
                              totalPlayers === cnt
                                ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                                : 'border-stone-800 bg-[#111317] text-stone-300 hover:border-stone-600'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">
                        {t(lang, 'aiDifficultyLabel')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { id: 'easy', label: t(lang, 'aiEasyLabel') },
                          { id: 'normal', label: t(lang, 'aiNormalLabel') },
                          { id: 'hard', label: t(lang, 'aiHardLabel') },
                        ] as const).map((diff) => (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => setAiDifficulty(diff.id)}
                            className={`rounded border py-2 text-xs font-semibold transition-colors min-h-[42px] ${
                              aiDifficulty === diff.id
                                ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                                : 'border-stone-800 bg-[#111317] text-stone-300 hover:border-stone-600'
                            }`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="online-room-code"
                        className="block text-xs font-medium text-stone-400 mb-1.5"
                      >
                        {t(lang, 'onlineRoomCodeLabel')}
                      </label>
                      <input
                        id="online-room-code"
                        type="text"
                        required
                        maxLength={10}
                        value={onlineRoomCode}
                        onChange={(e) => setOnlineRoomCode(e.target.value.toUpperCase())}
                        placeholder="A7K9M2"
                        className="w-full rounded border border-stone-800 bg-[#111317] px-3 py-2 text-sm font-mono uppercase tracking-widest text-amber-300 placeholder:text-stone-600 min-h-[42px] focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="online-reconnect-code"
                        className="block text-xs font-medium text-stone-400 mb-1.5"
                      >
                        {t(lang, 'onlineReconnectCodeLabel')}
                      </label>
                      <input
                        id="online-reconnect-code"
                        type="text"
                        maxLength={12}
                        value={onlineReconnectCode}
                        onChange={(e) => setOnlineReconnectCode(e.target.value.toUpperCase())}
                        placeholder="4F9A1C2B"
                        className="w-full rounded border border-stone-800 bg-[#111317] px-3 py-2 text-sm font-mono uppercase tracking-wider text-emerald-300 placeholder:text-stone-600 min-h-[42px] focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-stone-400">{t(lang, 'onlineServerAuthoritativeNote')}</p>

                {onlineServerReachable === false && (
                  <div
                    role="status"
                    className="rounded border border-amber-700/70 bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-200 leading-relaxed"
                  >
                    {lang === 'uk'
                      ? 'Сервер онлайн-мультиплеєра не виявлено (на статичному хостингу GitHub Pages працює тільки одиночна гра проти ШІ та локальна гра на одному пристрої; для онлайну потрібен запущений server.ts).'
                      : 'Online multiplayer server was not detected (static GitHub Pages runs Solo vs AI and Local Hot-Seat only; online rooms require a running Node.js server.ts).'}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={onlineBusy || (onlineTab === 'join' && !onlineRoomCode.trim())}
                    className="w-full sm:w-auto rounded bg-amber-600 px-7 py-3 text-sm font-bold text-stone-950 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-h-[46px]"
                  >
                    {onlineTab === 'create'
                      ? t(lang, 'onlineCreateAction')
                      : onlineReconnectCode.trim()
                        ? t(lang, 'onlineReconnectAction')
                        : t(lang, 'onlineJoinAction')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1.5">
                      {t(lang, 'playerCount')}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setTotalPlayers(cnt);
                            if (focusedSlot >= cnt) setFocusedSlot(0);
                          }}
                          className={`flex-1 rounded border py-2 text-sm font-mono font-semibold tabular-nums transition-colors min-h-[42px] ${
                            totalPlayers === cnt
                              ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                              : 'border-stone-800 bg-[#111317] text-stone-300 hover:border-stone-600'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="rng-seed-input"
                      className="block text-xs font-medium text-stone-400 mb-1.5"
                    >
                      {t(lang, 'seedLabel')}
                    </label>
                    <input
                      id="rng-seed-input"
                      type="number"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      placeholder="20261124"
                      className="w-full rounded border border-stone-800 bg-[#111317] px-3 py-2 text-sm font-mono text-stone-100 placeholder:text-stone-600 min-h-[42px] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {mode === 'solo_ai' && totalPlayers >= 2 && (
                  <div>
                    <label className="block text-xs font-medium text-stone-400 mb-1.5">
                      {t(lang, 'aiDifficultyLabel')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'easy', label: t(lang, 'aiEasyLabel') },
                        { id: 'normal', label: t(lang, 'aiNormalLabel') },
                        { id: 'hard', label: t(lang, 'aiHardLabel') },
                      ] as const).map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setAiDifficulty(diff.id)}
                          className={`rounded border py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                            aiDifficulty === diff.id
                              ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                              : 'border-stone-800 bg-[#111317] text-stone-300 hover:border-stone-600'
                          }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Slots */}
                <div className="space-y-3">
                  {Array.from({ length: totalPlayers }, (_, idx) => {
                    const isAI = mode === 'solo_ai' && idx > 0;
                    const hero = HERO_MAP.get(selectedHeroes[idx]) ?? HEROES[idx];
                    const isFocused = focusedSlot === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setFocusedSlot(idx);
                          setInspectedHeroId(hero.id);
                        }}
                        className={`grid grid-cols-1 gap-3 rounded-md border p-3.5 sm:grid-cols-12 sm:items-center cursor-pointer transition-colors ${
                          isFocused
                            ? 'border-amber-500/70 bg-[#171b23]'
                            : 'border-stone-800/90 bg-[#12151b] hover:border-stone-700'
                        }`}
                      >
                        <div className="sm:col-span-4 flex items-center gap-3">
                          <HeroAvatar
                            src={hero.portraitPath}
                            alt={pickText(lang, hero.name)}
                            className="h-14 w-14 shrink-0 rounded-md border border-amber-700/40 object-cover"
                            fallbackLabel={pickText(lang, hero.className)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-stone-400 mb-1">
                              {t(lang, 'playerLabel')} {idx + 1} ·{' '}
                              <span className={isAI ? 'text-amber-400' : 'text-emerald-400'}>
                                {isAI ? t(lang, 'aiLabel') : t(lang, 'humanLabel')}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={playerNames[idx] ?? ''}
                              onChange={(e) => handleNameChange(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full rounded border border-stone-800 bg-[#171b22] px-2.5 py-1.5 text-sm text-stone-100 min-h-[38px] focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-4 space-y-2">
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">
                              {t(lang, 'chooseHero')}
                            </label>
                            <select
                              value={selectedHeroes[idx]}
                              onChange={(e) => handleHeroChange(idx, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full rounded border border-stone-800 bg-[#171b22] px-2.5 py-1.5 text-sm text-stone-100 min-h-[38px] focus:border-amber-500 focus:outline-none"
                            >
                              {HEROES.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {pickText(lang, h.className)} — {pickText(lang, h.name)}
                                </option>
                              ))}
                            </select>
                          </div>
                          {isAI && (
                            <div>
                              <label className="block text-[11px] text-stone-400 mb-1">
                                {t(lang, 'aiStyleLabel')}
                              </label>
                              <select
                                value={aiStyles[idx]}
                                onChange={(e) =>
                                  handleStyleChange(idx, e.target.value as AiBehaviorStyle)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-full rounded border border-stone-800 bg-[#12151b] px-2 py-1 text-xs text-amber-200 min-h-[34px] focus:border-amber-500 focus:outline-none"
                              >
                                <option value="conqueror">{t(lang, 'aiStyleConqueror')}</option>
                                <option value="scholar">{t(lang, 'aiStyleScholar')}</option>
                                <option value="merchant_tactician">{t(lang, 'aiStyleTactician')}</option>
                                <option value="warden">{t(lang, 'aiStyleWarden')}</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-4 text-xs text-stone-400 space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5 font-mono tabular-nums text-stone-200">
                            <span className="inline-flex items-center gap-1" title={t(lang, 'hpLabel')}>
                              <Heart className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                              {hero.baseStats.hp}
                            </span>
                            <span className="inline-flex items-center gap-1" title={t(lang, 'strengthLabel')}>
                              <Sword className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                              {hero.baseStats.strength}
                            </span>
                            <span className="inline-flex items-center gap-1" title={t(lang, 'intellectLabel')}>
                              <BookOpen className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                              {hero.baseStats.intellect}
                            </span>
                            <span className="inline-flex items-center gap-1" title={t(lang, 'fateLabel')}>
                              <Compass className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                              {hero.baseStats.fate}
                            </span>
                            <span className="inline-flex items-center gap-1" title={t(lang, 'goldLabel')}>
                              <Coins className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                              {hero.baseStats.gold}
                            </span>
                            <span className="inline-flex items-center gap-1" title={t(lang, 'experienceLabel')}>
                              <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden="true" />
                              {hero.baseStats.experience}
                            </span>
                          </div>
                          <div className="text-stone-400 line-clamp-1">
                            {pickText(lang, hero.abilityName)}: {pickText(lang, hero.abilityDescription)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onStartGame(TEST_SCENARIO_PRESETS[0].config)}
                    title={pickText(lang, TEST_SCENARIO_PRESETS[0].description)}
                    className="rounded border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-medium text-stone-300 hover:border-amber-500/60 hover:text-amber-200 transition-colors min-h-[44px]"
                  >
                    {t(lang, 'quickTestStart')}
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto rounded bg-amber-600 px-7 py-3 text-sm font-bold text-stone-950 hover:bg-amber-500 transition-colors whitespace-nowrap min-h-[46px] focus-visible:outline-2 focus-visible:outline-amber-300"
                  >
                    {t(lang, 'startGame')}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </div>

      {/* 12 Heroes Roster & Detailed Inspector */}
      <section className="rounded-lg ornate-frame bg-[#15181f] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
              {t(lang, 'heroRosterTitle')}
            </h2>
            <p className="text-xs text-stone-400 mt-1">{t(lang, 'statCapsNote')}</p>
          </div>
          <div className="text-xs text-amber-300 font-medium">
            {t(lang, 'playerLabel')} {focusedSlot + 1} · {t(lang, 'chooseHero')}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 12-Hero Portrait Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {HEROES.map((hero) => {
              const isInspected = hero.id === inspectedHero.id;
              const assignedSlots = Array.from({ length: totalPlayers }, (_, i) => i + 1).filter(
                (slotNum) => selectedHeroes[slotNum - 1] === hero.id
              );
              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => setInspectedHeroId(hero.id)}
                  className={`group flex flex-col overflow-hidden rounded-md border text-left transition-colors ${
                    isInspected
                      ? 'border-amber-500 bg-[#1b2029]'
                      : 'border-stone-800 bg-[#12151b] hover:border-stone-600'
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-900">
                    <HeroAvatar
                      src={hero.portraitPath}
                      alt={pickText(lang, hero.name)}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackLabel={pickText(lang, hero.className)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <div className="text-[11px] font-semibold text-amber-300 truncate">
                        {pickText(lang, hero.className)}
                      </div>
                      <div className="font-display text-sm font-bold text-stone-100 leading-tight truncate">
                        {pickText(lang, hero.name)}
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 space-y-1.5 text-[11px] font-mono tabular-nums text-stone-300">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1" title={t(lang, 'strengthLabel')}>
                        <Sword className="h-3 w-3 text-amber-400" aria-hidden="true" />
                        {hero.baseStats.strength}
                      </span>
                      <span className="inline-flex items-center gap-1" title={t(lang, 'intellectLabel')}>
                        <BookOpen className="h-3 w-3 text-sky-400" aria-hidden="true" />
                        {hero.baseStats.intellect}
                      </span>
                      <span className="inline-flex items-center gap-1" title={t(lang, 'hpLabel')}>
                        <Heart className="h-3 w-3 text-rose-400" aria-hidden="true" />
                        {hero.baseStats.hp}
                      </span>
                      <span className="inline-flex items-center gap-1" title={t(lang, 'fateLabel')}>
                        <Compass className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                        {hero.baseStats.fate}
                      </span>
                    </div>
                    {assignedSlots.length > 0 && (
                      <div className="text-[10px] font-sans font-semibold text-emerald-400 truncate">
                        {t(lang, 'playerLabel')} {assignedSlots.join(', ')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspected Hero Dossier */}
          <article className="lg:col-span-5 rounded-md border border-amber-800/40 bg-[#12151b] p-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start gap-4 border-b border-stone-800 pb-4">
                <HeroAvatar
                  src={inspectedHero.portraitPath}
                  alt={pickText(lang, inspectedHero.name)}
                  className="h-24 w-24 shrink-0 rounded-md border border-amber-600/50 object-cover"
                  fallbackLabel={pickText(lang, inspectedHero.className)}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-amber-400">
                    {pickText(lang, inspectedHero.className)}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-stone-100 leading-tight">
                    {pickText(lang, inspectedHero.name)}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">{pickText(lang, inspectedHero.title)}</p>
                </div>
              </div>

              {/* 6 Characteristics + Armor Icon Bar */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div
                  title={t(lang, 'strengthLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <Sword className="h-4 w-4 text-amber-400" aria-hidden="true" />
                  <span className="font-semibold text-stone-100">
                    {inspectedHero.baseStats.strength}/{HERO_STAT_LIMITS.maxStrength}
                  </span>
                </div>
                <div
                  title={t(lang, 'intellectLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <BookOpen className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  <span className="font-semibold text-stone-100">
                    {inspectedHero.baseStats.intellect}/{HERO_STAT_LIMITS.maxIntellect}
                  </span>
                </div>
                <div
                  title={t(lang, 'hpLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <Heart className="h-4 w-4 text-rose-400" aria-hidden="true" />
                  <span className="font-semibold text-stone-100">
                    {inspectedHero.baseStats.hp}/{HERO_STAT_LIMITS.maxHp}
                  </span>
                </div>
                <div
                  title={t(lang, 'fateLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <Compass className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span className="font-semibold text-stone-100">
                    {inspectedHero.baseStats.fate}/{HERO_STAT_LIMITS.maxFate}
                  </span>
                </div>
                <div
                  title={t(lang, 'goldLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <Coins className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <span className="font-semibold text-amber-300">{inspectedHero.baseStats.gold}</span>
                </div>
                <div
                  title={t(lang, 'experienceLabel')}
                  className="flex items-center justify-between rounded border border-stone-800 bg-[#171b22] px-2.5 py-2"
                >
                  <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
                  <span className="font-semibold text-violet-200">
                    {inspectedHero.baseStats.experience}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <p className="text-stone-200">{pickText(lang, inspectedHero.description)}</p>
                <div className="parchment-panel rounded p-3 text-[#2b2013]">
                  <div className="font-bold text-[#1e150b] mb-0.5">{t(lang, 'heroStoryLabel')}</div>
                  <p>{pickText(lang, inspectedHero.lore)}</p>
                </div>
              </div>

              <div className="rounded border border-amber-700/40 bg-[#171b22] p-3 text-xs space-y-1">
                <div className="font-semibold text-amber-300">
                  {t(lang, 'useAbilityAction')}: {pickText(lang, inspectedHero.abilityName)}
                </div>
                <p className="text-stone-300">{pickText(lang, inspectedHero.abilityDescription)}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded border border-stone-800 bg-[#171b22] p-3 space-y-1">
                  <div className="font-semibold text-stone-200 inline-flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-stone-300" aria-hidden="true" />
                    {t(lang, 'startingGearLabel')}
                  </div>
                  <ul className="space-y-0.5 text-stone-400">
                    {inspectedGear.map((card) => (
                      <li key={card.id}>· {pickText(lang, card.name)}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded border border-stone-800 bg-[#171b22] p-3 space-y-1">
                  <div className="font-semibold text-stone-200">{t(lang, 'startingResourcesLabel')}</div>
                  <p className="text-stone-400">
                    {pickText(lang, inspectedHero.startingResources.description)}
                  </p>
                  {inspectedResourceCards.length > 0 && (
                    <ul className="space-y-0.5 text-amber-200/90">
                      {inspectedResourceCards.map((card) => (
                        <li key={card.id}>· {pickText(lang, card.name)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-800 pt-4 flex flex-wrap gap-2">
              {Array.from({ length: totalPlayers }, (_, slotIdx) => {
                const isSelectedHere = selectedHeroes[slotIdx] === inspectedHero.id;
                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => {
                      setFocusedSlot(slotIdx);
                      handleHeroChange(slotIdx, inspectedHero.id);
                    }}
                    className={`rounded px-3 py-2 text-xs font-semibold transition-colors min-h-[40px] ${
                      isSelectedHere
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-stone-950 hover:bg-amber-500'
                    }`}
                  >
                    {t(lang, 'playerLabel')} {slotIdx + 1}: {isSelectedHere ? '✓' : t(lang, 'chooseHero')}
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      {/* Three Regions Showcase */}
      <section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {REGIONS.map((region) => (
            <article
              key={region.id}
              className="overflow-hidden rounded-lg ornate-frame bg-[#15181f]"
            >
              <div className="relative h-44 bg-stone-900">
                <img
                  src={resolveAssetUrl(region.imagePath)}
                  alt={pickText(lang, region.name)}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs text-amber-300/90">{pickText(lang, region.subtitle)}</p>
                  <h3 className="font-display text-xl font-bold text-stone-100">
                    {pickText(lang, region.name)}
                  </h3>
                </div>
              </div>
              <div className="p-4 text-sm leading-relaxed text-stone-300">
                {pickText(lang, region.description)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
