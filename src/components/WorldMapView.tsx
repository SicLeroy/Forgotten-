import React, { useMemo, useState } from 'react';
import {
  Compass,
  Crown,
  Dices,
  DoorClosed,
  Lock,
  PackageOpen,
  ScrollText,
  ShieldAlert,
  Skull,
  Sparkles,
  Sword,
} from 'lucide-react';
import { HERO_MAP } from '../data/heroes';
import { LOCATIONS, LOCATION_MAP } from '../data/locations';
import { REGIONS } from '../data/regions';
import { NavigationGraph } from '../engine/NavigationGraph';
import { getActivePlayer } from '../engine/RulesEngine';
import { LocalizationManager } from '../i18n/LocalizationManager';
import { AdventureSymbol, GameState, Language, LocationDefinition, RegionId } from '../types/game';

const { pickText, t } = LocalizationManager;

interface WorldMapViewProps {
  lang: Language;
  state: GameState;
  onRollMovement: () => void;
  onRerollMovementDice?: () => void;
  onStepMove: (locationId: string) => void;
  onStopMovementEarly: () => void;
  onQuickMoveAndReturn: (locationId: string) => void;
  onReturnToTable: () => void;
}

type MapFocus = 'all' | RegionId;

function renderAdventureIcon(symbol: AdventureSymbol) {
  switch (symbol) {
    case 'sword':
      return <Sword className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />;
    case 'scroll':
      return <ScrollText className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />;
    case 'chest':
      return <PackageOpen className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />;
    case 'shrine':
      return <Compass className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />;
    case 'skull':
      return <Skull className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />;
    case 'gate':
      return <DoorClosed className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
    case 'crown':
      return <Crown className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />;
  }
}

function getSymbolGlyph(symbol: AdventureSymbol): string {
  switch (symbol) {
    case 'sword':
      return '⚔';
    case 'scroll':
      return '📜';
    case 'chest':
      return '◈';
    case 'shrine':
      return '✦';
    case 'skull':
      return '☠';
    case 'gate':
      return '⛩';
    case 'crown':
      return '♛';
  }
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({
  lang,
  state,
  onRollMovement,
  onRerollMovementDice,
  onStepMove,
  onStopMovementEarly,
  onQuickMoveAndReturn,
  onReturnToTable,
}) => {
  const activePlayer = getActivePlayer(state);
  const hero = HERO_MAP.get(activePlayer.heroId)!;
  const activeLoc = LOCATION_MAP.get(activePlayer.locationId)!;
  const [focus, setFocus] = useState<MapFocus>('all');
  const [inspectedId, setInspectedId] = useState<string>(activeLoc.id);

  const isObjectiveNode = Boolean(
    activeLoc.isGateGuardianLair ||
      activeLoc.sealGuardianId ||
      activeLoc.isFinalBossLair ||
      activeLoc.id === 'loc_80' ||
      activeLoc.id === 'loc_81'
  );
  const canStopEarly = Boolean(hero.canTriggerMidwayEvents || isObjectiveNode);

  const graphCheck = useMemo(() => NavigationGraph.validateGraph(), []);
  const inspectedLoc: LocationDefinition = LOCATION_MAP.get(inspectedId) ?? activeLoc;
  const inspectedAccess = NavigationGraph.canAccessLocation(activePlayer, inspectedLoc.id);

  const visibleLocations = useMemo(
    () => (focus === 'all' ? LOCATIONS : LOCATIONS.filter((l) => l.regionId === focus)),
    [focus]
  );

  // Build unique undirected edges across ALL 84 locations
  const allEdges = useMemo(() => {
    const edges: Array<{ from: LocationDefinition; to: LocationDefinition }> = [];
    const seen = new Set<string>();
    for (const loc of LOCATIONS) {
      for (const nId of loc.neighbors) {
        const key = loc.id < nId ? `${loc.id}-${nId}` : `${nId}-${loc.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const target = LOCATION_MAP.get(nId);
        if (target) edges.push({ from: loc, to: target });
      }
    }
    return edges;
  }, []);

  // ViewBox zooms cleanly by region or shows full concentric world
  const viewBox = useMemo(() => {
    if (focus === 'reg_abyssal_citadel') return '460 280 480 480';
    if (focus === 'reg_ashen_marches') return '330 150 740 740';
    return '0 0 1400 1040';
  }, [focus]);

  const isMovingPhase = state.turnPhase === 'MOVING' && state.movement !== null;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 space-y-6">
      {/* Header & Region Focus Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-100">
            {t(lang, 'navMap')}
          </h1>
          <p className="text-xs text-stone-400 tabular-nums mt-0.5">
            {t(lang, 'allLocationsCount')}: {activePlayer.visitedLocationIds.length} /{' '}
            {LOCATIONS.length} ·{' '}
            <span className={graphCheck.valid ? 'text-emerald-400' : 'text-rose-400'}>
              {graphCheck.valid ? t(lang, 'graphValidLabel') : graphCheck.errors[0]}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-md border border-stone-800 bg-[#14171d] p-1">
          <button
            type="button"
            onClick={() => setFocus('all')}
            className={`rounded px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[38px] ${
              focus === 'all' ? 'bg-amber-600 text-stone-950' : 'text-stone-300 hover:text-stone-100'
            }`}
          >
            {t(lang, 'allRegionsLabel')}
          </button>
          {REGIONS.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => setFocus(reg.id)}
              className={`rounded px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[38px] ${
                focus === reg.id
                  ? 'bg-amber-600 text-stone-950'
                  : 'text-stone-300 hover:text-stone-100'
              }`}
            >
              {pickText(lang, reg.name).split('·')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Movement Status Bar on Map */}
      {!activePlayer.isAI && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg ornate-frame bg-[#15181f] px-4 py-3 text-xs">
          {isMovingPhase && state.movement ? (
            <div className="flex flex-wrap items-center gap-3 text-amber-200 font-medium">
              <Dices className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>
                {t(lang, 'stepsRemainingLabel')}:{' '}
                <strong className="font-mono text-sm text-amber-300">
                  {state.movement.stepsRemaining}
                </strong>{' '}
                / {state.movement.totalRoll} · {t(lang, 'chooseBranch')}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 text-stone-300">
              <span>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 mr-1.5" />
                {t(lang, 'currentLocation')}: {activeLoc.index}. {pickText(lang, activeLoc.name)}
              </span>
              <span>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1.5" />
                {t(lang, 'openRoute')}
              </span>
              <span>
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 mr-1.5" />
                {t(lang, 'lockedRoute')}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {isMovingPhase &&
              onRerollMovementDice &&
              state.movement &&
              !state.movement.fateRerollUsed &&
              state.movement.pathTaken.length === 1 &&
              activePlayer.fate >= 1 && (
                <button
                  type="button"
                  onClick={onRerollMovementDice}
                  className="rounded border border-emerald-500/70 bg-emerald-950/50 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-colors min-h-[38px]"
                >
                  {t(lang, 'fateRerollAction')}
                </button>
              )}
            {isMovingPhase && canStopEarly && (
              <button
                type="button"
                onClick={onStopMovementEarly}
                className="rounded border border-amber-500/70 bg-amber-950/50 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors min-h-[38px]"
              >
                {t(lang, 'stopAtLocation')}
              </button>
            )}
            {(state.turnPhase === 'COMBAT' || state.turnPhase === 'ENCOUNTER') && (
              <button
                type="button"
                onClick={onReturnToTable}
                className="rounded bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors min-h-[38px]"
              >
                {t(lang, 'resolveOnTable')}
              </button>
            )}
            {state.turnPhase === 'ACTION' && activePlayer.actionsRemaining > 0 && (
              <button
                type="button"
                onClick={onRollMovement}
                className="inline-flex items-center gap-2 rounded bg-amber-600 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-500 transition-colors min-h-[38px]"
              >
                <Dices className="h-4 w-4" aria-hidden="true" />
                {t(lang, 'rollMoveAction')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map + Location Inspector Split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        {/* Interactive Concentric 84-Node SVG Map */}
        <section className="min-w-0 rounded-lg ornate-frame bg-[#15181f] p-3 sm:p-4">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={viewBox}
              className="w-full min-w-[640px] h-auto rounded bg-[#0c0e12] border border-stone-800/80"
              role="img"
              aria-label="84-Location Forgotten Realms Map"
            >
              {/* Concentric Region Boundary Guides */}
              <circle
                cx={700}
                cy={520}
                r={492}
                fill="none"
                stroke="#292524"
                strokeWidth="1.5"
                strokeDasharray="6 6"
              />
              <circle
                cx={700}
                cy={520}
                r={332}
                fill="none"
                stroke={activePlayer.gateGuardianDefeated ? '#065f46' : '#7f1d1d'}
                strokeWidth="2"
                strokeDasharray="8 5"
              />
              <circle
                cx={700}
                cy={520}
                r={182}
                fill="none"
                stroke={activePlayer.seals.length >= 3 ? '#065f46' : '#881337'}
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Region Ring Labels */}
              <text x={700} y={20} textAnchor="middle" fill="#a8a29e" fontSize="13" fontWeight="600">
                {pickText(lang, REGIONS[0].name)} (42)
              </text>
              <text x={700} y={178} textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="600">
                {pickText(lang, REGIONS[1].name)} (30)
              </text>
              <text x={700} y={329} textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="600">
                {pickText(lang, REGIONS[2].name)} (12)
              </text>

              {/* Edges */}
              {allEdges.map(({ from, to }) => {
                const touchesHere = from.id === activeLoc.id || to.id === activeLoc.id;
                const otherId = from.id === activeLoc.id ? to.id : from.id;
                const otherAccess = NavigationGraph.canAccessLocation(activePlayer, otherId);
                const bothAccessible =
                  NavigationGraph.canAccessLocation(activePlayer, from.id).allowed &&
                  NavigationGraph.canAccessLocation(activePlayer, to.id).allowed;

                let stroke = bothAccessible ? '#334155' : '#4c1d24';
                let strokeWidth = 1.6;
                let dash = bothAccessible ? undefined : '4 4';

                if (touchesHere) {
                  stroke = otherAccess.allowed ? '#10b981' : '#f43f5e';
                  strokeWidth = 3;
                  dash = otherAccess.allowed ? undefined : '5 4';
                }

                return (
                  <line
                    key={`${from.id}-${to.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dash}
                  />
                );
              })}

              {/* All 84 Nodes */}
              {LOCATIONS.map((loc) => {
                const isHere = activePlayer.locationId === loc.id;
                const isNeighbor = activeLoc.neighbors.includes(loc.id);
                const access = NavigationGraph.canAccessLocation(activePlayer, loc.id);
                const isVisited = activePlayer.visitedLocationIds.includes(loc.id);
                const isInspected = inspectedLoc.id === loc.id;
                const isGoal = Boolean(
                  loc.sealReward || loc.isGateGuardianLair || loc.isFinalBossLair || loc.id === 'loc_80' || loc.id === 'loc_81'
                );

                let fill = '#1e293b';
                if (!access.allowed) fill = '#3b151e';
                else if (isHere) fill = '#f59e0b';
                else if (isNeighbor) fill = '#059669';
                else if (isGoal) fill = '#9f1239';
                else if (isVisited) fill = '#475569';

                const stroke = isInspected
                  ? '#fde68a'
                  : isHere
                    ? '#fef3c7'
                    : isNeighbor
                      ? access.allowed
                        ? '#6ee7b7'
                        : '#fda4af'
                      : access.allowed
                        ? '#64748b'
                        : '#9f1239';

                const r = isHere ? 15 : isGoal ? 13 : 10.5;

                return (
                  <g
                    key={loc.id}
                    onClick={() => {
                      setInspectedId(loc.id);
                      if (isMovingPhase && isNeighbor && access.allowed && !activePlayer.isAI) {
                        onStepMove(loc.id);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {isHere && (
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={r + 5}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={1.8}
                        strokeDasharray="3 3"
                      />
                    )}
                    <circle
                      cx={loc.x}
                      cy={loc.y}
                      r={r}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isHere || isInspected || isNeighbor ? 2.5 : 1.4}
                    />
                    <text
                      x={loc.x}
                      y={loc.y + 3.5}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {loc.index}
                    </text>
                    {isGoal && (
                      <text
                        x={loc.x}
                        y={loc.y - 16}
                        textAnchor="middle"
                        fill="#fbbf24"
                        fontSize="11"
                      >
                        {getSymbolGlyph(loc.adventureSymbol)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Other Players' Markers */}
              {state.players.map((p, idx) => {
                if (idx === state.activePlayerIndex || p.isDefeated) return null;
                const pLoc = LOCATION_MAP.get(p.locationId);
                if (!pLoc) return null;
                return (
                  <circle
                    key={p.id}
                    cx={pLoc.x + 12}
                    cy={pLoc.y - 10}
                    r={5}
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                  />
                );
              })}
            </svg>
          </div>
        </section>

        {/* Location Details Inspector */}
        <aside className="parchment-panel rounded-lg p-5 space-y-4">
          <div className="border-b border-[#9d7f4e]/40 pb-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#6d5637]">
              <span>{inspectedLoc.id.toUpperCase()}</span>
              <span className="inline-flex items-center gap-1">
                {renderAdventureIcon(inspectedLoc.adventureSymbol)}
                {t(lang, 'dangerLevel')} {inspectedLoc.dangerLevel}/6
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#241b11] mt-1">
              {pickText(lang, inspectedLoc.name)}
            </h2>
            <p className="text-xs font-semibold text-[#6d421a] mt-0.5">
              {t(lang, 'sectorLabel')}: {pickText(lang, inspectedLoc.sectorName)}
            </p>
          </div>

          <p className="text-xs leading-relaxed text-[#2f2317]">
            {pickText(lang, inspectedLoc.description)}
          </p>

          <div className="space-y-2 text-xs border-t border-[#9d7f4e]/35 pt-3">
            <div className="flex items-start gap-2">
              {inspectedAccess.allowed ? (
                <Sparkles className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <Lock className="h-4 w-4 text-rose-800 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">{t(lang, 'accessConditionLabel')}: </span>
                <span>{pickText(lang, inspectedLoc.accessCondition.description)}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold">{t(lang, 'dayEffectLabel')}: </span>
              <span>{pickText(lang, inspectedLoc.dayEffect.description)}</span>
            </div>
            <div>
              <span className="font-semibold">{t(lang, 'nightEffectLabel')}: </span>
              <span>{pickText(lang, inspectedLoc.nightEffect.description)}</span>
            </div>
            <div>
              <span className="font-semibold">{t(lang, 'weatherModLabel')}: </span>
              <span>
                {pickText(lang, inspectedLoc.weatherModifiers[state.weather].description)}
              </span>
            </div>
          </div>

          {/* Neighbor Transitions from Inspected or Current Location */}
          <div className="border-t border-[#9d7f4e]/35 pt-3 space-y-2">
            <div className="text-xs font-semibold text-[#241b11]">
              {t(lang, 'connectedLocations')} ({inspectedLoc.neighbors.length})
            </div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {inspectedLoc.neighbors.map((nid) => {
                const nLoc = LOCATION_MAP.get(nid);
                if (!nLoc) return null;
                const access = NavigationGraph.canAccessLocation(activePlayer, nid);
                const isAdjacentToPlayer = activeLoc.neighbors.includes(nid);
                return (
                  <div
                    key={nid}
                    className="flex items-center justify-between gap-2 rounded border border-[#9d7f4e]/40 bg-[#f6eedb]/70 px-2.5 py-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setInspectedId(nid)}
                      className="text-left font-medium text-[#241b11] hover:underline truncate"
                    >
                      {nLoc.index}. {pickText(lang, nLoc.name)}
                    </button>

                    {!access.allowed ? (
                      <span
                        title={access.reason ? pickText(lang, access.reason) : ''}
                        className="inline-flex items-center gap-1 text-rose-800 font-semibold shrink-0"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    ) : isAdjacentToPlayer && !activePlayer.isAI ? (
                      isMovingPhase ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInspectedId(nid);
                            onStepMove(nid);
                          }}
                          className="rounded bg-emerald-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shrink-0"
                        >
                          {t(lang, 'moveAction')}
                        </button>
                      ) : activePlayer.actionsRemaining > 0 && state.turnPhase === 'ACTION' ? (
                        <button
                          type="button"
                          onClick={() => onQuickMoveAndReturn(nid)}
                          className="rounded bg-[#6d421a] px-2.5 py-1 text-[11px] font-semibold text-amber-50 hover:bg-[#523012] shrink-0"
                        >
                          {t(lang, 'moveAction')}
                        </button>
                      ) : null
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Complete 84-Location Sector Directory */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-stone-100">
            {focus === 'all'
              ? `${t(lang, 'allRegionsLabel')} (${visibleLocations.length})`
              : `${pickText(lang, REGIONS.find((r) => r.id === focus)!.name)} (${visibleLocations.length})`}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleLocations.map((loc) => {
            const isHere = activePlayer.locationId === loc.id;
            const access = NavigationGraph.canAccessLocation(activePlayer, loc.id);
            const isNeighbor = activeLoc.neighbors.includes(loc.id);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setInspectedId(loc.id)}
                className={`text-left rounded border p-3.5 text-xs space-y-1 transition-colors ${
                  isHere
                    ? 'border-amber-500 bg-amber-950/30'
                    : !access.allowed
                      ? 'border-rose-900/60 bg-[#161115]'
                      : isNeighbor
                        ? 'border-emerald-700/70 bg-[#151c1a]'
                        : 'border-stone-800 bg-[#14171d] hover:border-stone-600'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-stone-400 tabular-nums">
                  <span>
                    {loc.id.toUpperCase()} · {pickText(lang, loc.sectorName)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {!access.allowed && <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />}
                    {renderAdventureIcon(loc.adventureSymbol)}
                  </span>
                </div>
                <div className="font-semibold text-sm text-stone-100">
                  {pickText(lang, loc.name)}
                </div>
                <div className="text-[11px] text-stone-400">
                  {access.allowed
                    ? pickText(lang, loc.dayEffect.description)
                    : pickText(lang, loc.accessCondition.description)}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
};
