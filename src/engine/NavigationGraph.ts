import { LOCATIONS, LOCATION_MAP } from '../data/locations';
import { LocalizedText, LocationDefinition, PlayerState } from '../types/game';

export interface GraphValidationResult {
  valid: boolean;
  totalLocations: number;
  isolatedLocationIds: string[];
  unreachableFromStart: string[];
  unreachableMiddleWithoutGate: number;
  reachableMiddleWithGate: number;
  unreachableInnerWithoutSeals: number;
  reachableInnerWithSeals: number;
  missingMandatoryGoals: string[];
  errors: string[];
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: LocalizedText;
}

export const NavigationGraph = {
  getLocation(locationId: string): LocationDefinition | undefined {
    return LOCATION_MAP.get(locationId);
  },

  canAccessLocation(player: PlayerState, targetLocationId: string): AccessCheckResult {
    const loc = LOCATION_MAP.get(targetLocationId);
    if (!loc) {
      return {
        allowed: false,
        reason: { uk: 'Локація не існує.', en: 'Location does not exist.' },
      };
    }

    if (loc.accessCondition.type === 'gate_guardian' && !player.gateGuardianDefeated) {
      return {
        allowed: false,
        reason: loc.accessCondition.description,
      };
    }

    if (loc.accessCondition.type === 'three_seals' && player.seals.length < 3) {
      return {
        allowed: false,
        reason: loc.accessCondition.description,
      };
    }

    return { allowed: true };
  },

  getNeighborStatuses(
    player: PlayerState,
    locationId: string
  ): Array<{
    location: LocationDefinition;
    allowed: boolean;
    reason?: LocalizedText;
  }> {
    const current = LOCATION_MAP.get(locationId);
    if (!current) return [];
    return current.neighbors
      .map((id) => LOCATION_MAP.get(id))
      .filter((loc): loc is LocationDefinition => Boolean(loc))
      .map((loc) => {
        const access = NavigationGraph.canAccessLocation(player, loc.id);
        return {
          location: loc,
          allowed: access.allowed,
          reason: access.reason,
        };
      });
  },

  /**
   * Computes all valid destinations reachable from `startId` in exactly `steps` moves
   * respecting current player access unlocks.
   */
  getReachableNodesAtSteps(player: PlayerState, startId: string, steps: number): string[] {
    if (steps <= 0) return [startId];
    let frontier = new Set<string>([startId]);
    for (let s = 0; s < steps; s++) {
      const nextFrontier = new Set<string>();
      for (const nodeId of frontier) {
        const loc = LOCATION_MAP.get(nodeId);
        if (!loc) continue;
        for (const neighborId of loc.neighbors) {
          if (NavigationGraph.canAccessLocation(player, neighborId).allowed) {
            nextFrontier.add(neighborId);
          }
        }
      }
      frontier = nextFrontier;
    }
    return Array.from(frontier);
  },

  /**
   * Finds the immediate accessible neighbor along a shortest path from `startId` to `targetId`.
   */
  findNextStepToward(player: PlayerState, startId: string, targetId: string): string | null {
    if (startId === targetId) return null;
    const startLoc = LOCATION_MAP.get(startId);
    if (!startLoc) return null;

    const visited = new Set<string>([startId]);
    const queue: Array<{ id: string; firstStep: string }> = [];

    for (const nId of startLoc.neighbors) {
      if (!NavigationGraph.canAccessLocation(player, nId).allowed) continue;
      if (nId === targetId) return nId;
      visited.add(nId);
      queue.push({ id: nId, firstStep: nId });
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const loc = LOCATION_MAP.get(curr.id);
      if (!loc) continue;
      for (const nId of loc.neighbors) {
        if (visited.has(nId) || !NavigationGraph.canAccessLocation(player, nId).allowed) continue;
        if (nId === targetId) return curr.firstStep;
        visited.add(nId);
        queue.push({ id: nId, firstStep: curr.firstStep });
      }
    }

    return null;
  },

  /**
   * Validates full structural & progression integrity across all 84 locations:
   * - Exact count = 84
   * - Zero isolated nodes
   * - Bidirectional edges
   * - Progression gating works properly (Outer open, Middle gated by Gate Guardian, Inner gated by 3 Seals)
   * - All mandatory targets (Seals, Gate Guardian, Citadel Guardians, Throne of the Void) reachable.
   */
  validateGraph(): GraphValidationResult {
    const errors: string[] = [];
    const isolatedLocationIds: string[] = [];

    if (LOCATIONS.length !== 84) {
      errors.push(`Expected 84 locations, found ${LOCATIONS.length}`);
    }

    for (const loc of LOCATIONS) {
      if (loc.neighbors.length === 0) {
        isolatedLocationIds.push(loc.id);
        errors.push(`Isolated location: ${loc.id}`);
      }
      for (const nId of loc.neighbors) {
        const n = LOCATION_MAP.get(nId);
        if (!n) {
          errors.push(`Missing neighbor ${nId} referenced by ${loc.id}`);
        } else if (!n.neighbors.includes(loc.id)) {
          errors.push(`Non-bidirectional edge between ${loc.id} and ${nId}`);
        }
      }
    }

    const bfs = (canEnter: (loc: LocationDefinition) => boolean): Set<string> => {
      const visited = new Set<string>();
      const start = LOCATION_MAP.get('loc_01');
      if (!start || !canEnter(start)) return visited;
      visited.add(start.id);
      const queue = [start.id];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currLoc = LOCATION_MAP.get(curr)!;
        for (const nId of currLoc.neighbors) {
          const nLoc = LOCATION_MAP.get(nId);
          if (nLoc && !visited.has(nId) && canEnter(nLoc)) {
            visited.add(nId);
            queue.push(nId);
          }
        }
      }
      return visited;
    };

    const outerOnly = bfs((l) => l.accessCondition.type === 'open');
    const withGate = bfs(
      (l) => l.accessCondition.type === 'open' || l.accessCondition.type === 'gate_guardian'
    );
    const fullAccess = bfs(() => true);

    const unreachableFromStart = LOCATIONS.filter((l) => !fullAccess.has(l.id)).map((l) => l.id);
    if (unreachableFromStart.length > 0) {
      errors.push(`Unreachable locations from loc_01: ${unreachableFromStart.join(', ')}`);
    }

    const middleLocations = LOCATIONS.filter((l) => l.regionId === 'reg_ashen_marches');
    const innerLocations = LOCATIONS.filter((l) => l.regionId === 'reg_abyssal_citadel');

    const unreachableMiddleWithoutGate = middleLocations.filter((l) => outerOnly.has(l.id)).length;
    const reachableMiddleWithGate = middleLocations.filter((l) => withGate.has(l.id)).length;
    const unreachableInnerWithoutSeals = innerLocations.filter((l) => withGate.has(l.id)).length;
    const reachableInnerWithSeals = innerLocations.filter((l) => fullAccess.has(l.id)).length;

    if (outerOnly.size !== 42) {
      errors.push(`Expected 42 open Outer Region locations, got ${outerOnly.size}`);
    }
    if (reachableMiddleWithGate !== 30) {
      errors.push(`Expected 30 reachable Middle Region locations after Gate, got ${reachableMiddleWithGate}`);
    }
    if (reachableInnerWithSeals !== 12) {
      errors.push(`Expected 12 reachable Inner Region locations with 3 Seals, got ${reachableInnerWithSeals}`);
    }

    const mandatoryIds = ['loc_28', 'loc_42', 'loc_66', 'loc_71', 'loc_80', 'loc_81', 'loc_84'];
    const missingMandatoryGoals = mandatoryIds.filter((id) => !fullAccess.has(id));
    if (missingMandatoryGoals.length > 0) {
      errors.push(`Missing mandatory goal nodes: ${missingMandatoryGoals.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      totalLocations: LOCATIONS.length,
      isolatedLocationIds,
      unreachableFromStart,
      unreachableMiddleWithoutGate,
      reachableMiddleWithGate,
      unreachableInnerWithoutSeals,
      reachableInnerWithSeals,
      missingMandatoryGoals,
      errors,
    };
  },
};
