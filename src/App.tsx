import { useCallback, useEffect, useState } from 'react';
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
import { EquipSlot, GameState, Language, NewGameConfig, SaveSlotSummary } from './types/game';

const { t } = LocalizationManager;

export default function App() {
  const [lang, setLang] = useState<Language>('uk');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('table');
  const [saves, setSaves] = useState<SaveSlotSummary[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

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

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'uk' ? 'en' : 'uk';
    setLang(nextLang);
    SaveManager.saveLanguage(nextLang).catch(() => {});
  };

  const dispatchAction = (action: GameAction) => {
    if (!gameState) return;
    const result = GameManager.dispatch(gameState, action);
    if (result.error) {
      setErrorBanner(result.error[lang]);
      return;
    }
    setErrorBanner(null);
    setGameState(result.state);
  };

  const handleStartGame = async (config: NewGameConfig) => {
    const fresh = GameManager.startNewGame(config);
    setErrorBanner(null);
    setGameState(fresh);
    setActiveView('table');
    await GameManager.saveCurrentGame(fresh).catch(() => {});
    refreshSaves();
  };

  const handleEndTurn = async () => {
    if (!gameState) return;
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
    const loaded = await GameManager.continueSavedGame(saveId);
    if (loaded) {
      setErrorBanner(null);
      setGameState(loaded);
      setActiveView('table');
    }
  };

  const handleDeleteSave = async (saveId: string) => {
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
        onChangeView={setActiveView}
        onReturnToTitle={() => {
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
          onCombatAttack={() => dispatchAction({ type: 'COMBAT_ATTACK' })}
          onCombatDefend={() => dispatchAction({ type: 'COMBAT_DEFEND' })}
          onCombatFlee={() => dispatchAction({ type: 'COMBAT_FLEE' })}
          onResolveEncounter={() => dispatchAction({ type: 'RESOLVE_ENCOUNTER' })}
          onEndTurn={handleEndTurn}
          onQuickSave={() => {
            handleSaveCurrent()
              .then(() => setErrorBanner(t(lang, 'savedToast')))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
