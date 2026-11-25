import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SfxKind, soundEngine } from './audio/SoundEngine';
import { EndGameScreen } from './components/EndGameScreen';
import { GameTable } from './components/GameTable';
import { HeroDeckView } from './components/HeroDeckView';
import { SavesView } from './components/SavesView';
import { TitleMenu } from './components/TitleMenu';
import { ActiveView, TopBar } from './components/TopBar';
import { WorldMapView } from './components/WorldMapView';
import { GameAction, GameManager } from './engine/GameManager';
import { getActivePlayer } from './engine/RulesEngine';
import { LocalizationManager } from './i18n/LocalizationManager';
import { SaveManager } from './storage/SaveManager';
import {
  EquipSlot,
  GameState,
  Language,
  MajorWorldEventId,
  NewGameConfig,
  SaveSlotSummary,
} from './types/game';

const { t } = LocalizationManager;

const AUDIO_STORAGE_KEY = 'cfr_audio_settings_v1';

export interface GlobalAudioContextValue {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
  toggleMusic: () => void;
  toggleSfx: () => void;
  setVolume: (nextVolume: number) => void;
  playSfx: (kind: SfxKind) => void;
}

const DEFAULT_AUDIO_STATE: GlobalAudioContextValue = {
  musicEnabled: false,
  sfxEnabled: true,
  volume: 0.6,
  toggleMusic: () => {},
  toggleSfx: () => {},
  setVolume: () => {},
  playSfx: () => {},
};

export const AudioContext = createContext<GlobalAudioContextValue>(DEFAULT_AUDIO_STATE);

export function useAudio(): GlobalAudioContextValue {
  return useContext(AudioContext);
}

interface StoredAudioPrefs {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number;
}

function loadAudioPrefs(): StoredAudioPrefs {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return { musicEnabled: false, sfxEnabled: true, volume: 0.6 };
  }
  try {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { musicEnabled: false, sfxEnabled: true, volume: 0.6 };
    const parsed = JSON.parse(raw) as Partial<StoredAudioPrefs>;
    return {
      musicEnabled: Boolean(parsed.musicEnabled),
      sfxEnabled: typeof parsed.sfxEnabled === 'boolean' ? parsed.sfxEnabled : true,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.6,
    };
  } catch {
    return { musicEnabled: false, sfxEnabled: true, volume: 0.6 };
  }
}

function AppContent() {
  const { playSfx } = useAudio();
  const [lang, setLang] = useState<Language>('uk');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('table');
  const [saves, setSaves] = useState<SaveSlotSummary[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const prevActiveMajorIdsRef = useRef<MajorWorldEventId[]>([]);

  const refreshSaves = useCallback(async () => {
    try {
      const list = await SaveManager.listSaves();
      setSaves(list);
    } catch {
      setSaves([]);
    }
  }, []);

  useEffect(() => {
    SaveManager.loadLanguage()
      .then((savedLang) => {
        if (savedLang === 'uk' || savedLang === 'en') {
          setLang(savedLang);
        }
      })
      .catch(() => {});
    refreshSaves();
  }, [refreshSaves]);

  const activeMajorEventIdsKey = (gameState?.activeMajorEvents ?? []).map((e) => e.id).join(',');
  const activeLegacyWorldEventId = gameState?.activeWorldEventId ?? null;

  useEffect(() => {
    if (!gameState || gameState.phase !== 'PLAYING') {
      soundEngine.setActiveWorldEvents([], null);
      prevActiveMajorIdsRef.current = [];
      return;
    }

    const currentIds = (gameState.activeMajorEvents ?? []).map((e) => e.id);
    soundEngine.setActiveWorldEvents(currentIds, activeLegacyWorldEventId);

    const prevSet = new Set(prevActiveMajorIdsRef.current);
    const newlySpawned = currentIds.find((id) => !prevSet.has(id));
    if (newlySpawned) {
      soundEngine.playWorldEventSting(newlySpawned);
    }
    prevActiveMajorIdsRef.current = currentIds;
  }, [gameState, activeMajorEventIdsKey, activeLegacyWorldEventId]);

  const handleToggleLang = () => {
    playSfx('click');
    const nextLang: Language = lang === 'uk' ? 'en' : 'uk';
    setLang(nextLang);
    SaveManager.saveLanguage(nextLang).catch(() => {});
  };

  const dispatchAction = (action: GameAction) => {
    if (!gameState) return;
    soundEngine.unlock();
    const result = GameManager.dispatch(gameState, action);
    if (result.error) {
      setErrorBanner(result.error[lang]);
      return;
    }

    if (result.state.phase === 'VICTORY') {
      playSfx('victory');
    } else if (result.state.phase === 'DEFEAT') {
      playSfx('defeat');
    } else if (action.type === 'COMBAT_ATTACK') {
      playSfx(action.combatType === 'magic' ? 'magic' : 'hit');
    } else if (
      action.type === 'ROLL_MOVEMENT' ||
      action.type === 'REROLL_MOVEMENT_DICE' ||
      action.type === 'ROLL_ENCOUNTER_CHECK' ||
      action.type === 'REROLL_ENCOUNTER_CHECK' ||
      action.type === 'COMBAT_DEFEND' ||
      action.type === 'COMBAT_FLEE' ||
      action.type === 'ATTEMPT_TRIAL'
    ) {
      playSfx('dice');
    } else if (
      action.type === 'BUY_MARKET_CARD' ||
      action.type === 'SELL_CARD' ||
      action.type === 'BUY_SUPPLY' ||
      action.type === 'REFRESH_MARKET'
    ) {
      playSfx('coin');
    } else {
      playSfx('click');
    }

    setErrorBanner(null);
    setGameState(result.state);
  };

  const handleStartGame = async (config: NewGameConfig) => {
    soundEngine.unlock();
    playSfx('victory');
    const fresh = GameManager.startNewGame(config);
    setErrorBanner(null);
    setGameState(fresh);
    setActiveView('table');
    await GameManager.saveCurrentGame(fresh).catch(() => {});
    refreshSaves();
  };

  const handleEndTurn = async () => {
    if (!gameState) return;
    playSfx('click');
    const res = GameManager.dispatch(gameState, { type: 'END_TURN' });
    if (res.error) {
      setErrorBanner(res.error[lang]);
      return;
    }
    setErrorBanner(null);
    setGameState(res.state);
    await GameManager.saveCurrentGame(res.state).catch(() => {});
    refreshSaves();
  };

  useEffect(() => {
    if (!gameState || gameState.phase !== 'PLAYING') return;
    const active = getActivePlayer(gameState);
    if (!active.isAI) return;

    const timer = window.setTimeout(() => {
      const afterAi = GameManager.runAiTurn(gameState);
      setGameState(afterAi);
      GameManager.saveCurrentGame(afterAi)
        .then(() => refreshSaves())
        .catch(() => {});
    }, 600);

    return () => window.clearTimeout(timer);
  }, [gameState, refreshSaves]);

  const handleSaveCurrent = async (label?: string) => {
    if (!gameState) return;
    await GameManager.saveCurrentGame(gameState, label);
    await refreshSaves();
  };

  const handleLoadSave = async (saveId: string) => {
    playSfx('click');
    const loaded = await GameManager.continueSavedGame(saveId);
    if (loaded) {
      setErrorBanner(null);
      setGameState(loaded);
      setActiveView('table');
    }
  };

  const handleDeleteSave = async (saveId: string) => {
    playSfx('click');
    await SaveManager.deleteSave(saveId);
    await refreshSaves();
  };

  const currentPhase = gameState ? gameState.phase : 'TITLE_MENU';

  return (
    <div className="min-h-screen bg-[#0e1014] text-stone-100">
      <TopBar
        lang={lang}
        onToggleLang={handleToggleLang}
        gamePhase={currentPhase}
        activeView={activeView}
        onChangeView={(view) => {
          playSfx('click');
          setActiveView(view);
        }}
        onReturnToTitle={() => {
          playSfx('click');
          setGameState(null);
          setActiveView('table');
          setErrorBanner(null);
        }}
      />

      {!gameState ? (
        activeView === 'inventory' ? (
          <HeroDeckView
            lang={lang}
            state={null}
            onEquipFromInventory={() => {}}
            onUnequipSlot={() => {}}
          />
        ) : activeView === 'saves' ? (
          <SavesView
            lang={lang}
            currentState={null}
            saves={saves}
            onSaveCurrent={handleSaveCurrent}
            onLoadSave={handleLoadSave}
            onDeleteSave={handleDeleteSave}
          />
        ) : (
          <TitleMenu
            lang={lang}
            recentSave={saves[0] ?? null}
            onStartGame={handleStartGame}
            onLoadRecentSave={handleLoadSave}
          />
        )
      ) : gameState.phase === 'VICTORY' || gameState.phase === 'DEFEAT' ? (
        <EndGameScreen
          lang={lang}
          state={gameState}
          onPlayAgain={() => {
            playSfx('click');
            setGameState(null);
            setActiveView('table');
            setErrorBanner(null);
          }}
        />
      ) : activeView === 'map' ? (
        <WorldMapView
          lang={lang}
          state={gameState}
          onRollMovement={() => dispatchAction({ type: 'ROLL_MOVEMENT' })}
          onRerollMovementDice={() => dispatchAction({ type: 'REROLL_MOVEMENT_DICE' })}
          onStepMove={(locId) => dispatchAction({ type: 'STEP_MOVE', locationId: locId })}
          onStopMovementEarly={() => dispatchAction({ type: 'STOP_MOVEMENT_EARLY' })}
          onQuickMoveAndReturn={(locId) => {
            dispatchAction({ type: 'MOVE', locationId: locId });
            setActiveView('table');
          }}
          onReturnToTable={() => setActiveView('table')}
        />
      ) : activeView === 'inventory' ? (
        <HeroDeckView
          lang={lang}
          state={gameState}
          onEquipFromInventory={(cardId) =>
            dispatchAction({ type: 'EQUIP_INVENTORY', cardId })
          }
          onUnequipSlot={(slot: EquipSlot) =>
            dispatchAction({ type: 'UNEQUIP_SLOT', slot })
          }
          onUseInventoryItem={(cardId) =>
            dispatchAction({ type: 'USE_INVENTORY_ITEM', cardId })
          }
          onDiscardInventoryCard={(cardId) =>
            dispatchAction({ type: 'DISCARD_INVENTORY_CARD', cardId })
          }
          onDismissCompanion={(cardId) =>
            dispatchAction({ type: 'DISMISS_COMPANION', cardId })
          }
          onSellCard={(source, cardId) =>
            dispatchAction({ type: 'SELL_CARD', source, cardId })
          }
          onCleanseCurse={(curseCardId) =>
            dispatchAction({ type: 'CLEANSE_CURSE', curseCardId })
          }
          onUpgradeStat={(stat) => dispatchAction({ type: 'UPGRADE_STAT', stat })}
        />
      ) : activeView === 'saves' ? (
        <SavesView
          lang={lang}
          currentState={gameState}
          saves={saves}
          onSaveCurrent={handleSaveCurrent}
          onLoadSave={handleLoadSave}
          onDeleteSave={handleDeleteSave}
        />
      ) : (
        <GameTable
          lang={lang}
          state={gameState}
          errorBanner={errorBanner}
          onRollMovement={() => dispatchAction({ type: 'ROLL_MOVEMENT' })}
          onRerollMovementDice={() => dispatchAction({ type: 'REROLL_MOVEMENT_DICE' })}
          onStepMove={(locationId) => dispatchAction({ type: 'STEP_MOVE', locationId })}
          onStopMovementEarly={() => dispatchAction({ type: 'STOP_MOVEMENT_EARLY' })}
          onMove={(locationId) => dispatchAction({ type: 'MOVE', locationId })}
          onExplore={() => dispatchAction({ type: 'EXPLORE' })}
          onRollEncounterCheck={() => dispatchAction({ type: 'ROLL_ENCOUNTER_CHECK' })}
          onRerollEncounterCheck={() => dispatchAction({ type: 'REROLL_ENCOUNTER_CHECK' })}
          onRest={() => dispatchAction({ type: 'REST' })}
          onDrawCard={() => dispatchAction({ type: 'DRAW_CARD' })}
          onBuySupply={() => dispatchAction({ type: 'BUY_SUPPLY' })}
          onUseAbility={() => dispatchAction({ type: 'USE_ABILITY' })}
          onUpgradeStat={(stat) => dispatchAction({ type: 'UPGRADE_STAT', stat })}
          onPlayCard={(cardId) => dispatchAction({ type: 'PLAY_CARD', cardId })}
          onStoreInventory={(cardId) => dispatchAction({ type: 'STORE_INVENTORY', cardId })}
          onDiscardHandCard={(cardId) => dispatchAction({ type: 'DISCARD_HAND_CARD', cardId })}
          onDismissCompanion={(cardId) => dispatchAction({ type: 'DISMISS_COMPANION', cardId })}
          onBuyMarketCard={(cardId) => dispatchAction({ type: 'BUY_MARKET_CARD', cardId })}
          onSellCard={(source, cardId) => dispatchAction({ type: 'SELL_CARD', source, cardId })}
          onRefreshMarket={() => dispatchAction({ type: 'REFRESH_MARKET' })}
          onHealAtSanctuary={() => dispatchAction({ type: 'HEAL_AT_SANCTUARY' })}
          onCleanseCurse={(curseCardId) => dispatchAction({ type: 'CLEANSE_CURSE', curseCardId })}
          onChallengeGateGuardian={() => dispatchAction({ type: 'CHALLENGE_GATE_GUARDIAN' })}
          onChallengeSeal={() => dispatchAction({ type: 'CHALLENGE_SEAL' })}
          onAttemptTrial={() => dispatchAction({ type: 'ATTEMPT_TRIAL' })}
          onChallengeCitadel={() => dispatchAction({ type: 'CHALLENGE_CITADEL' })}
          onChallengeVoidLord={() => dispatchAction({ type: 'CHALLENGE_VOID_LORD' })}
          onChallengePlayer={(targetPlayerId) =>
            dispatchAction({ type: 'CHALLENGE_PLAYER', targetPlayerId })
          }
          onCombatAttack={(combatType) =>
            dispatchAction({ type: 'COMBAT_ATTACK', combatType })
          }
          onCombatDefend={() => dispatchAction({ type: 'COMBAT_DEFEND' })}
          onCombatFlee={() => dispatchAction({ type: 'COMBAT_FLEE' })}
          onResolveEncounter={() => dispatchAction({ type: 'RESOLVE_ENCOUNTER' })}
          onInterveneWorldEvent={(eventId) =>
            dispatchAction({ type: 'INTERVENE_WORLD_EVENT', eventId })
          }
          onTalkToNpc={(npcId) => dispatchAction({ type: 'TALK_NPC', npcId })}
          onSelectNpcOption={(optionId) =>
            dispatchAction({ type: 'SELECT_NPC_OPTION', optionId })
          }
          onCloseNpcDialog={() => dispatchAction({ type: 'CLOSE_NPC_DIALOG' })}
          onEndTurn={handleEndTurn}
          onQuickSave={() => {
            playSfx('click');
            handleSaveCurrent()
              .then(() => setErrorBanner(t(lang, 'savedToast')))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const [audioPrefs, setAudioPrefs] = useState<StoredAudioPrefs>(() => loadAudioPrefs());

  useEffect(() => {
    soundEngine.configure({
      musicEnabled: audioPrefs.musicEnabled,
      sfxEnabled: audioPrefs.sfxEnabled,
      musicVolume: audioPrefs.volume * 0.7,
      sfxVolume: audioPrefs.volume,
    });
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioPrefs));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [audioPrefs]);

  const toggleMusic = useCallback(() => {
    soundEngine.unlock();
    setAudioPrefs((prev) => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  const toggleSfx = useCallback(() => {
    soundEngine.unlock();
    setAudioPrefs((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const clamped = Math.max(0, Math.min(1, nextVolume));
    setAudioPrefs((prev) => ({ ...prev, volume: clamped }));
  }, []);

  const playSfx = useCallback(
    (kind: SfxKind) => {
      if (!audioPrefs.sfxEnabled) return;
      soundEngine.playSfx(kind);
    },
    [audioPrefs.sfxEnabled]
  );

  return (
    <AudioContext.Provider
      value={{
        musicEnabled: audioPrefs.musicEnabled,
        sfxEnabled: audioPrefs.sfxEnabled,
        volume: audioPrefs.volume,
        toggleMusic,
        toggleSfx,
        setVolume,
        playSfx,
      }}
    >
      <AppContent />
    </AudioContext.Provider>
  );
}
