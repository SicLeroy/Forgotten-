import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createGameServer } from '../../server';
import type { ClientWsMessage, RoomJoinResult, ServerWsMessage } from '../types/online';

interface TestClient {
  ws: WebSocket;
  messages: ServerWsMessage[];
  waitFor: <T extends ServerWsMessage['type']>(
    type: T,
    predicate?: (msg: Extract<ServerWsMessage, { type: T }>) => boolean,
    timeoutMs?: number
  ) => Promise<Extract<ServerWsMessage, { type: T }>>;
  send: (msg: ClientWsMessage) => void;
  close: () => Promise<void>;
}

async function connectWsClient(port: number): Promise<TestClient> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const messages: ServerWsMessage[] = [];
  const waiters: Array<{
    type: ServerWsMessage['type'];
    predicate?: (msg: ServerWsMessage) => boolean;
    resolve: (msg: ServerWsMessage) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS connect timeout')), 4000);
    ws.once('open', () => {
      clearTimeout(t);
      resolve();
    });
    ws.once('error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });

  ws.on('message', (raw) => {
    const parsed = JSON.parse(raw.toString()) as ServerWsMessage;
    messages.push(parsed);
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w.type === parsed.type && (!w.predicate || w.predicate(parsed))) {
        clearTimeout(w.timer);
        waiters.splice(i, 1);
        w.resolve(parsed);
      }
    }
  });

  return {
    ws,
    messages,
    waitFor(type, predicate, timeoutMs = 4000) {
      for (const existing of messages) {
        if (
          existing.type === type &&
          (!predicate || predicate(existing as Extract<ServerWsMessage, { type: typeof type }>))
        ) {
          return Promise.resolve(existing as Extract<ServerWsMessage, { type: typeof type }>);
        }
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timed out waiting for WS message "${type}"`));
        }, timeoutMs);
        waiters.push({
          type,
          predicate: predicate as ((msg: ServerWsMessage) => boolean) | undefined,
          resolve: resolve as (msg: ServerWsMessage) => void,
          reject,
          timer,
        });
      });
    },
    send(msg) {
      ws.send(JSON.stringify(msg));
    },
    async close() {
      if (ws.readyState === WebSocket.CLOSED) return;
      await new Promise<void>((resolve) => {
        ws.once('close', () => resolve());
        ws.close();
      });
    },
  };
}

async function httpJson<T>(url: string, method = 'GET', body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T;
  return { status: res.status, data };
}

async function runOnlineTests() {
  const srv = await createGameServer({
    port: 0,
    enableVite: false,
    snapshotPath: null,
  });

  const baseUrl = `http://127.0.0.1:${srv.port}`;

  try {
    // 1. Health endpoint
    const health = await httpJson<{ ok: boolean; mode: string }>(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal(health.data.ok, true);
    assert.equal(health.data.mode, 'authoritative-ws');

    // 2. Host creates room (1-6 players, e.g. 3 slots including AI bot later)
    const createRes = await httpJson<RoomJoinResult>(`${baseUrl}/api/online/rooms`, 'POST', {
      hostName: 'HostKairen',
      heroId: 'hero_01',
      maxPlayers: 3,
      aiDifficulty: 'normal',
      seed: 424242,
    });
    assert.equal(createRes.status, 201);
    const roomCode = createRes.data.room.roomCode;
    assert.ok(roomCode.length >= 4);
    assert.equal(createRes.data.room.seats.length, 1);
    assert.equal(createRes.data.room.seats[0].isHost, true);

    // Public room preview does NOT leak sessionToken or reconnectCode
    const previewRes = await httpJson<{ room: RoomJoinResult['room'] }>(
      `${baseUrl}/api/online/rooms/${roomCode}`
    );
    assert.equal(previewRes.status, 200);
    const previewSeat = previewRes.data.room.seats[0] as unknown as Record<string, unknown>;
    assert.equal(previewSeat.sessionToken, undefined);
    assert.equal(previewSeat.reconnectCode, undefined);

    // 3. Player 2 joins via invite code
    const joinRes = await httpJson<RoomJoinResult>(
      `${baseUrl}/api/online/rooms/${roomCode}/join`,
      'POST',
      {
        playerName: 'GuestLirael',
        heroId: 'hero_02',
      }
    );
    assert.equal(joinRes.status, 200);
    assert.equal(joinRes.data.room.seats.length, 2);

    // 4. Both connect over WebSocket & authenticate
    const hostWs = await connectWsClient(srv.port);
    const guestWs = await connectWsClient(srv.port);

    hostWs.send({
      type: 'AUTH_SESSION',
      roomCode,
      sessionToken: createRes.data.sessionToken,
    });
    const hostRoomSync = await hostWs.waitFor('ROOM_SYNC');
    assert.equal(hostRoomSync.yourSlotId, createRes.data.slotId);
    assert.equal(hostRoomSync.room.seats.find((s) => s.slotId === createRes.data.slotId)?.connected, true);

    guestWs.send({
      type: 'AUTH_SESSION',
      roomCode,
      sessionToken: joinRes.data.sessionToken,
    });
    const guestRoomSync = await guestWs.waitFor('ROOM_SYNC');
    assert.equal(guestRoomSync.yourSlotId, joinRes.data.slotId);

    // 5. Chat broadcast test
    guestWs.send({ type: 'CHAT_SEND', text: 'Ready for the Forgotten Realms!\u0007' });
    const hostChat = await hostWs.waitFor('CHAT_MESSAGE', (m) => m.message.kind === 'player');
    assert.equal(hostChat.message.senderName, 'GuestLirael');
    assert.equal(hostChat.message.text, 'Ready for the Forgotten Realms!');

    // 6. Host adds an AI bot (making 3/3 seats) and cannot start until guest is ready
    hostWs.send({ type: 'ADD_AI_BOT' });
    await hostWs.waitFor('PRESENCE_UPDATE', (m) => m.room.seats.length === 3);

    // Fourth human join rejected because room is full
    const overflowRes = await httpJson<{ errorCode: string }>(
      `${baseUrl}/api/online/rooms/${roomCode}/join`,
      'POST',
      { playerName: 'ExtraPlayer' }
    );
    assert.equal(overflowRes.status, 409);
    assert.equal(overflowRes.data.errorCode, 'ROOM_FULL');

    // Host trying to start before guest readies up receives PLAYERS_NOT_READY
    hostWs.send({ type: 'START_GAME' });
    const notReadyErr = await hostWs.waitFor('ERROR', (m) => m.code === 'PLAYERS_NOT_READY');
    assert.equal(notReadyErr.code, 'PLAYERS_NOT_READY');

    // Guest readies up & selects hero_03
    guestWs.send({ type: 'SELECT_HERO', heroId: 'hero_03' });
    guestWs.send({ type: 'SET_READY', ready: true });
    await hostWs.waitFor(
      'PRESENCE_UPDATE',
      (m) => Boolean(m.room.seats.find((s) => s.slotId === joinRes.data.slotId && s.ready && s.heroId === 'hero_03'))
    );

    // Host starts game -> authoritative STATE_SYNC sent to both clients
    hostWs.send({ type: 'START_GAME' });
    const hostStartState = await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === 1);
    const guestStartState = await guestWs.waitFor('STATE_SYNC', (m) => m.stateVersion === 1);

    assert.equal(hostStartState.gameState.mode, 'online');
    assert.equal(hostStartState.gameState.players.length, 3);
    assert.equal(guestStartState.gameState.players.length, 3);
    // Server strips RNG internals and deck order before broadcasting to clients
    assert.equal(hostStartState.gameState.seed, 0);
    assert.equal(hostStartState.gameState.rngState, 0);
    assert.ok(hostStartState.gameState.deck.every((id) => id.startsWith('__hidden_')));

    // 7. Authoritative validation: non-active player (guest) cannot act on host's turn
    guestWs.send({
      type: 'GAME_ACTION',
      commandId: 'guest_illegal_cmd_1',
      expectedVersion: 1,
      action: { type: 'ROLL_MOVEMENT' },
    });
    const notTurnAck = await guestWs.waitFor(
      'ACTION_ACK',
      (m) => m.commandId === 'guest_illegal_cmd_1'
    );
    assert.equal(notTurnAck.accepted, false);
    assert.equal(notTurnAck.errorCode, 'NOT_YOUR_TURN');
    assert.equal(notTurnAck.stateVersion, 1);

    // 8. Active player (host) rolls movement -> synced across both clients
    hostWs.send({
      type: 'GAME_ACTION',
      commandId: 'host_roll_1',
      expectedVersion: 1,
      action: { type: 'ROLL_MOVEMENT' },
    });
    const hostRollAck = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === 'host_roll_1');
    assert.equal(hostRollAck.accepted, true);
    assert.equal(hostRollAck.stateVersion, 2);

    const hostSync2 = await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === 2);
    const guestSync2 = await guestWs.waitFor('STATE_SYNC', (m) => m.stateVersion === 2);
    assert.equal(hostSync2.gameState.turnPhase, 'MOVING');
    assert.equal(guestSync2.gameState.turnPhase, 'MOVING');
    assert.equal(hostSync2.gameState.lastDiceRoll, guestSync2.gameState.lastDiceRoll);

    // 9. Anti-replay / duplicate commandId protection: sending host_roll_1 again does NOT double-execute
    hostWs.send({
      type: 'GAME_ACTION',
      commandId: 'host_roll_1',
      expectedVersion: 1,
      action: { type: 'ROLL_MOVEMENT' },
    });
    const dupAck = await hostWs.waitFor(
      'ACTION_ACK',
      (m) => m.commandId === 'host_roll_1' && m.deduplicated === true
    );
    assert.equal(dupAck.accepted, true);
    assert.equal(dupAck.deduplicated, true);
    assert.equal(dupAck.stateVersion, 2);

    // 10. Optimistic concurrency / stale expectedVersion protection
    hostWs.send({
      type: 'GAME_ACTION',
      commandId: 'host_stale_cmd',
      expectedVersion: 1, // stale, current is 2
      action: { type: 'REST' },
    });
    const staleAck = await hostWs.waitFor(
      'ACTION_ACK',
      (m) => m.commandId === 'host_stale_cmd'
    );
    assert.equal(staleAck.accepted, false);
    assert.equal(staleAck.errorCode, 'VERSION_MISMATCH');
    assert.equal(staleAck.stateVersion, 2);

    // 11. Disconnect + auto/manual Reconnect preserves full match & chat state
    await guestWs.close();
    await hostWs.waitFor(
      'PRESENCE_UPDATE',
      (m) => m.room.seats.find((s) => s.slotId === joinRes.data.slotId)?.connected === false
    );

    // Simulate full browser reload / manual reconnect using reconnectCode
    const rejoinRes = await httpJson<RoomJoinResult>(
      `${baseUrl}/api/online/rooms/${roomCode}/join`,
      'POST',
      {
        roomCode,
        reconnectCode: joinRes.data.reconnectCode,
      }
    );
    assert.equal(rejoinRes.status, 200);
    assert.equal(rejoinRes.data.reconnected, true);
    assert.equal(rejoinRes.data.slotId, joinRes.data.slotId);
    assert.equal(rejoinRes.data.gameState?.turnPhase, 'MOVING');

    const guestWs2 = await connectWsClient(srv.port);
    guestWs2.send({
      type: 'AUTH_SESSION',
      roomCode,
      sessionToken: rejoinRes.data.sessionToken,
    });
    const rejoinedSync = await guestWs2.waitFor('ROOM_SYNC');
    assert.equal(rejoinedSync.room.stateVersion, 2);
    assert.equal(rejoinedSync.gameState?.lastDiceRoll, hostSync2.gameState.lastDiceRoll);
    assert.ok(rejoinedSync.room.chatHistory.some((c) => c.text === 'Ready for the Forgotten Realms!'));

    // 12. Verify turn advances from Host -> Guest -> AI Bot (server executes AI turn!)
    // Move host cleanly so turnPhase returns to ACTION, or send END_TURN once legal:
    const stepDest = hostSync2.gameState.movement!.stepsRemaining > 0
      ? undefined
      : null;
    assert.ok(stepDest === undefined);
    // Cancel/finish host's movement by picking connected neighbors until stepsRemaining === 0 or end turn invalid during MOVING:
    // Actually let's test step moves authoritatively on server!
    let currState = hostSync2.gameState;
    let currVer = 2;
    let cmdSeq = 0;
    const { NavigationGraph } = await import('../engine/NavigationGraph');
    const { getActivePlayer } = await import('../engine/RulesEngine');

    while (currState.turnPhase === 'MOVING' && currState.movement && currState.movement.stepsRemaining > 0) {
      const actP = getActivePlayer(currState);
      const neighbors = NavigationGraph.getNeighborStatuses(actP, actP.locationId, currState);
      const next = neighbors.find((n) => n.allowed);
      assert.ok(next, 'Host must have at least one valid move');
      const cid = `host_step_${++cmdSeq}`;
      hostWs.send({
        type: 'GAME_ACTION',
        commandId: cid,
        expectedVersion: currVer,
        action: { type: 'STEP_MOVE', locationId: next.location.id },
      });
      const ack = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === cid);
      assert.equal(ack.accepted, true);
      currVer = ack.stateVersion;
      const sync = await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === currVer);
      currState = sync.gameState;
      if (currState.turnPhase === 'COMBAT' && currState.combat) {
        // Defend/attack until combat ends or flee so we can cleanly test END_TURN
        while (currState.turnPhase === 'COMBAT') {
          const cCid = `host_cmb_${++cmdSeq}`;
          hostWs.send({
            type: 'GAME_ACTION',
            commandId: cCid,
            expectedVersion: currVer,
            action: { type: 'COMBAT_ATTACK', combatType: 'physical' },
          });
          const cAck = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === cCid);
          assert.equal(cAck.accepted, true);
          currVer = cAck.stateVersion;
          const cSync = await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === currVer);
          currState = cSync.gameState;
          if (currState.phase !== 'PLAYING') break;
        }
      } else if (currState.turnPhase === 'ENCOUNTER' && currState.encounter) {
        const eCid = `host_enc_r_${++cmdSeq}`;
        hostWs.send({
          type: 'GAME_ACTION',
          commandId: eCid,
          expectedVersion: currVer,
          action: { type: 'ROLL_ENCOUNTER_CHECK' },
        });
        const eAck = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === eCid);
        assert.equal(eAck.accepted, true);
        currVer = eAck.stateVersion;
        await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === currVer);

        const eCid2 = `host_enc_ok_${++cmdSeq}`;
        hostWs.send({
          type: 'GAME_ACTION',
          commandId: eCid2,
          expectedVersion: currVer,
          action: { type: 'RESOLVE_ENCOUNTER' },
        });
        const eAck2 = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === eCid2);
        assert.equal(eAck2.accepted, true);
        currVer = eAck2.stateVersion;
        const eSync = await hostWs.waitFor('STATE_SYNC', (m) => m.stateVersion === currVer);
        currState = eSync.gameState;
      }
      if (currState.activePlayerIndex !== 0 || currState.phase !== 'PLAYING') break;
    }

    if (currState.phase === 'PLAYING' && currState.activePlayerIndex === 0) {
      hostWs.send({
        type: 'GAME_ACTION',
        commandId: 'host_end_turn',
        expectedVersion: currVer,
        action: { type: 'END_TURN' },
      });
      const endAck = await hostWs.waitFor('ACTION_ACK', (m) => m.commandId === 'host_end_turn');
      assert.equal(endAck.accepted, true);
      currVer = endAck.stateVersion;
      const guestTurnSync = await guestWs2.waitFor('STATE_SYNC', (m) => m.stateVersion === currVer);
      currState = guestTurnSync.gameState;
      assert.equal(currState.activePlayerIndex, 1);

      // Guest immediately ends turn -> triggers server-side AI turn (player index 2) and advances back to player 0 (round 2)!
      guestWs2.send({
        type: 'GAME_ACTION',
        commandId: 'guest_end_turn',
        expectedVersion: currVer,
        action: { type: 'END_TURN' },
      });
      const gEndAck = await guestWs2.waitFor('ACTION_ACK', (m) => m.commandId === 'guest_end_turn');
      assert.equal(gEndAck.accepted, true);
      const aiAftermath = await hostWs.waitFor(
        'STATE_SYNC',
        (m) => m.stateVersion > gEndAck.stateVersion && m.gameState.activePlayerIndex === 0,
        5000
      );
      assert.equal(aiAftermath.gameState.round, 2);
      assert.equal(aiAftermath.gameState.activePlayerIndex, 0);
    }

    await hostWs.close();
    await guestWs2.close();
    console.log('✓ Online multiplayer authoritative WS integration tests passed!');
  } finally {
    await srv.close();
  }
}

runOnlineTests().catch((err) => {
  console.error('Online multiplayer tests failed:', err);
  process.exit(1);
});
