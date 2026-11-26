import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Compass, Dices, History, Lock, RotateCcw } from 'lucide-react';
import { getActivePlayer } from '../engine/RulesEngine';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { DiceRollPurpose, DiceRollRecord, GameState, Language } from '../types/game';

const { pickText, t } = LocalizationManager;

interface DiceRollerPanelProps {
  lang: Language;
  state: GameState;
  onRerollMovementDice: () => void;
  onRerollEncounterCheck: () => void;
  isMyTurn?: boolean;
}

const PIP_COORDS: Record<number, Array<[number, number]>> = {
  1: [[24, 24]],
  2: [
    [13, 13],
    [35, 35],
  ],
  3: [
    [13, 13],
    [24, 24],
    [35, 35],
  ],
  4: [
    [13, 13],
    [35, 13],
    [13, 35],
    [35, 35],
  ],
  5: [
    [13, 13],
    [35, 13],
    [24, 24],
    [13, 35],
    [35, 35],
  ],
  6: [
    [13, 12],
    [35, 12],
    [13, 24],
    [35, 24],
    [13, 36],
    [35, 36],
  ],
};

function formatPurpose(lang: Language, purpose: DiceRollPurpose): string {
  const map: Record<DiceRollPurpose, { uk: string; en: string }> = {
    movement: { uk: 'Рух (d6)', en: 'Movement (d6)' },
    encounter: { uk: 'Пригода / Перевірка', en: 'Encounter / Check' },
    combat_attack: { uk: 'Атака в бою', en: 'Combat Attack' },
    combat_flee: { uk: 'Відступ', en: 'Combat Flee' },
    final_trial: { uk: 'Фінальне випробування', en: 'Final Trial' },
    arrival_event: { uk: 'Подія локації', en: 'Destination Event' },
  };
  return map[purpose][lang];
}

export const DiceDieSvg: React.FC<{ value: number | null; animKey: string }> = ({
  value,
  animKey,
}) => {
  const face = value && value >= 1 && value <= 6 ? value : 1;
  const pips = PIP_COORDS[face];

  return (
    <div
      key={animKey}
      className="animate-dice-tumble flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-amber-500/60 bg-gradient-to-br from-[#231d14] to-[#12100d] shadow-md"
      aria-label={`d6: ${value ?? '—'}`}
    >
      {value === null ? (
        <Dices className="h-6 w-6 text-amber-400/70" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="6"
            fill="#1a1611"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          {pips.map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="3.6" fill="#fbbf24" />
          ))}
        </svg>
      )}
    </div>
  );
};

export const DiceRollerPanel: React.FC<DiceRollerPanelProps> = ({
  lang,
  state,
  onRerollMovementDice,
  onRerollEncounterCheck,
  isMyTurn = true,
}) => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const activePlayer = getActivePlayer(state);
  const history: DiceRollRecord[] = state.diceHistory ?? [];
  const latest: DiceRollRecord | null = history[0] ?? null;

  const displayedFace = latest ? latest.roll : state.lastDiceRoll;
  const animKey = `${latest?.id ?? 'init'}_${latest?.rerolled ? 'r' : 'n'}_${displayedFace ?? 0}`;

  const isMovementRerollContext =
    !activePlayer.isAI && isMyTurn && state.turnPhase === 'MOVING' && state.movement !== null;
  const movementMovedAlready =
    isMovementRerollContext &&
    (state.movement!.pathTaken.length > 1 ||
      state.movement!.stepsRemaining !== state.movement!.totalRoll);
  const canRerollMovement =
    isMovementRerollContext &&
    !movementMovedAlready &&
    !state.movement!.fateRerollUsed &&
    activePlayer.fate >= 1;

  const isEncounterRerollContext =
    !activePlayer.isAI &&
    isMyTurn &&
    state.turnPhase === 'ENCOUNTER' &&
    state.encounter !== null &&
    typeof state.encounter.rollResult === 'number';
  const canRerollEncounter =
    isEncounterRerollContext &&
    !state.encounter!.fateRerollUsed &&
    activePlayer.fate >= 1;

  let fateLockMessage: string | null = null;
  if (isMovementRerollContext) {
    if (state.movement!.fateRerollUsed) {
      fateLockMessage = t(lang, 'fateRerollLocked');
    } else if (movementMovedAlready) {
      fateLockMessage = t(lang, 'fateRerollUnavailableMoved');
    } else if (activePlayer.fate < 1) {
      fateLockMessage = t(lang, 'fateNoPoints');
    }
  } else if (isEncounterRerollContext) {
    if (state.encounter!.fateRerollUsed) {
      fateLockMessage = t(lang, 'fateRerollLocked');
    } else if (activePlayer.fate < 1) {
      fateLockMessage = t(lang, 'fateNoPoints');
    }
  }

  return (
    <section className="rounded-lg border border-stone-800 bg-[#15181f] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <DiceDieSvg value={displayedFace} animKey={animKey} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-semibold">
              <span>{t(lang, 'dicePanelTitle')}</span>
              {latest && (
                <span className="rounded border border-stone-700 bg-stone-900 px-2 py-0.5 font-mono text-[11px] text-stone-300">
                  {formatPurpose(lang, latest.purpose)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 font-mono text-emerald-300">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                {activePlayer.fate}
              </span>
            </div>
            {latest ? (
              <p className="mt-1 text-xs text-stone-200 leading-snug">
                {pickText(lang, latest.summary)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-stone-400">{t(lang, 'noDiceRollsYet')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRerollMovement && (
            <button
              type="button"
              onClick={onRerollMovementDice}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-500/70 bg-emerald-950/50 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-colors min-h-[38px]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'fateRerollAction')}
            </button>
          )}
          {canRerollEncounter && (
            <button
              type="button"
              onClick={onRerollEncounterCheck}
              className="inline-flex items-center gap-1.5 rounded border border-emerald-500/70 bg-emerald-950/50 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-colors min-h-[38px]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'fateRerollAction')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-300 hover:border-amber-500/60 hover:text-amber-200 transition-colors min-h-[38px]"
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            {t(lang, 'diceHistoryTitle')} ({history.length})
            {historyOpen ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {fateLockMessage && (
        <div className="flex items-center gap-2 rounded border border-stone-700/80 bg-[#12151b] px-3 py-2 text-xs text-stone-300">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          <span>{fateLockMessage}</span>
        </div>
      )}

      {historyOpen && (
        <div className="border-t border-stone-800 pt-3">
          {history.length === 0 ? (
            <p className="text-xs text-stone-400">{t(lang, 'noDiceRollsYet')}</p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {history.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-800 bg-[#12151b] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-400">
                      <span>R{rec.round}</span>
                      <span className="text-stone-200 font-sans font-semibold">{rec.playerName}</span>
                      <span>· {formatPurpose(lang, rec.purpose)}</span>
                      {rec.rerolled && (
                        <span className="rounded border border-emerald-700/60 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] text-emerald-300">
                          Fate: {rec.previousRoll} → {rec.roll}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-300 mt-0.5">{pickText(lang, rec.summary)}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-sm font-bold text-amber-300">
                      d6={rec.roll}
                      {rec.modifier !== 0
                        ? ` (${rec.modifier > 0 ? `+${rec.modifier}` : rec.modifier})`
                        : ''}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      RNG {rec.rngBefore.toString(16)}→{rec.rngAfter.toString(16)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
