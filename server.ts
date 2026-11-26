import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import type { ClientWsMessage, ServerWsMessage } from './src/types/online';

// Ensure extensionless TypeScript imports work when executed via `node server.ts`
await import('tsx/esm/api')
  .then((m) => m.register())
  .catch(() => {});

const {
  OnlineRoomManager,
  normalizeRoomCode,
  sanitizeGameStateForClient,
} = await import('./src/server/OnlineRoomManager');

interface AuthedSocketMeta {
  roomCode: string;
  slotId: string;
  isAlive: boolean;
}

export async function createGameServer(options?: {
  port?: number;
  enableVite?: boolean;
  snapshotPath?: string | null;
}) {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  const snapshotPath =
    options?.snapshotPath === undefined
      ? path.resolve(process.cwd(), '.data', 'online-rooms.json')
      : options.snapshotPath;

  const roomManager = new OnlineRoomManager({ snapshotPath });
  const server = http.createServer(app);
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 32 * 1024,
  });

  // Track active authenticated WebSockets per room -> slotId -> Set<WebSocket>
  const roomSockets = new Map<string, Map<string, Set<WebSocket>>>();
  const socketMeta = new WeakMap<WebSocket, AuthedSocketMeta>();

  function sendJson(ws: WebSocket, msg: ServerWsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function registerSocket(ws: WebSocket, roomCode: string, slotId: string): void {
    let bySlot = roomSockets.get(roomCode);
    if (!bySlot) {
      bySlot = new Map();
      roomSockets.set(roomCode, bySlot);
    }
    let set = bySlot.get(slotId);
    if (!set) {
      set = new Set();
      bySlot.set(slotId, set);
    }
    set.add(ws);
    socketMeta.set(ws, { roomCode, slotId, isAlive: true });
  }

  function unregisterSocket(ws: WebSocket): void {
    const meta = socketMeta.get(ws);
    if (!meta) return;
    socketMeta.delete(ws);

    const bySlot = roomSockets.get(meta.roomCode);
    if (!bySlot) return;
    const set = bySlot.get(meta.slotId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) {
        bySlot.delete(meta.slotId);
        roomManager.handleDisconnect(meta.roomCode, meta.slotId);
      }
    }
    if (bySlot.size === 0) {
      roomSockets.delete(meta.roomCode);
    }
  }

  roomManager.setBroadcaster({
    sendToSlot(roomCode, slotId, msg) {
      const set = roomSockets.get(roomCode)?.get(slotId);
      if (!set) return;
      for (const client of set) {
        sendJson(client, msg);
      }
    },
    broadcastToRoom(roomCode, msg) {
      const bySlot = roomSockets.get(roomCode);
      if (!bySlot) return;
      for (const set of bySlot.values()) {
        for (const client of set) {
          sendJson(client, msg);
        }
      }
    },
  });

  // REST API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: 'authoritative-ws' });
  });

  app.post('/api/online/rooms', (req, res) => {
    const body = req.body ?? {};
    if (typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: { uk: 'Некоректний запит.', en: 'Invalid request body.' } });
      return;
    }
    const created = roomManager.createRoom({
      hostName: typeof body.hostName === 'string' ? body.hostName : '',
      heroId: typeof body.heroId === 'string' ? body.heroId : 'hero_01',
      maxPlayers: Number(body.maxPlayers ?? 4),
      aiDifficulty: body.aiDifficulty,
      seed: typeof body.seed === 'number' ? body.seed : undefined,
    });
    res.status(201).json(created);
  });

  app.get('/api/online/rooms/:code', (req, res) => {
    const room = roomManager.getPublicRoom(req.params.code);
    if (!room) {
      res.status(404).json({
        error: { uk: 'Кімнату не знайдено.', en: 'Room not found.' },
      });
      return;
    }
    res.json({ room });
  });

  app.post('/api/online/rooms/:code/join', (req, res) => {
    const body = req.body ?? {};
    const joined = roomManager.joinRoom({
      roomCode: normalizeRoomCode(req.params.code),
      playerName: typeof body.playerName === 'string' ? body.playerName : undefined,
      heroId: typeof body.heroId === 'string' ? body.heroId : undefined,
      reconnectCode: typeof body.reconnectCode === 'string' ? body.reconnectCode : undefined,
    });

    if (!joined.result) {
      const status =
        joined.errorCode === 'ROOM_NOT_FOUND'
          ? 404
          : joined.errorCode === 'ROOM_FULL' || joined.errorCode === 'GAME_ALREADY_STARTED'
            ? 409
            : 400;
      res.status(status).json({ error: joined.error, errorCode: joined.errorCode });
      return;
    }

    res.json(joined.result);
  });

  // WebSocket handling on /ws
  server.on('upgrade', (request, socket, head) => {
    const urlPath = (request.url || '').split('?')[0];
    if (urlPath === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }
    // Destroy unmatched upgrades cleanly when not handled by Vite
    if (options?.enableVite === false || process.env.NODE_ENV === 'production') {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    const connState = { isAlive: true };

    ws.on('pong', () => {
      connState.isAlive = true;
      const meta = socketMeta.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on('message', (raw) => {
      let msg: ClientWsMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientWsMessage;
      } catch {
        sendJson(ws, {
          type: 'ERROR',
          code: 'BAD_JSON',
          message: { uk: 'Некоректний JSON-пакет.', en: 'Malformed JSON packet.' },
        });
        return;
      }

      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
        sendJson(ws, {
          type: 'ERROR',
          code: 'INVALID_PACKET',
          message: { uk: 'Некоректна структура повідомлення.', en: 'Invalid message packet.' },
        });
        return;
      }

      if (msg.type === 'PING') {
        sendJson(ws, { type: 'PONG', ts: Number(msg.ts) || 0, serverTime: Date.now() });
        return;
      }

      if (msg.type === 'AUTH_SESSION') {
        const auth = roomManager.authenticateSocket(msg.roomCode, msg.sessionToken);
        if (!auth) {
          sendJson(ws, {
            type: 'ERROR',
            code: 'AUTH_FAILED',
            message: {
              uk: 'Не вдалося авторизуватися в кімнаті. Перевірте код відновлення.',
              en: 'Room authentication failed. Please check your reconnect code.',
            },
          });
          return;
        }

        // If socket previously bound to another slot, clean up cleanly
        unregisterSocket(ws);
        registerSocket(ws, auth.room.roomCode, auth.seat.slotId);

        sendJson(ws, {
          type: 'ROOM_SYNC',
          room: roomManager.toPublicRoom(auth.room),
          gameState: sanitizeGameStateForClient(auth.room.gameState),
          yourSlotId: auth.seat.slotId,
          reconnectCode: auth.seat.reconnectCode,
        });
        return;
      }

      const meta = socketMeta.get(ws);
      if (!meta) {
        sendJson(ws, {
          type: 'ERROR',
          code: 'UNAUTHENTICATED',
          message: {
            uk: 'Спочатку підключіться до кімнати.',
            en: 'Authenticate with a room session first.',
          },
        });
        return;
      }

      const responses = roomManager.handleClientMessage(meta.roomCode, meta.slotId, msg);
      for (const reply of responses) {
        sendJson(ws, reply);
      }

      if (msg.type === 'LEAVE_ROOM') {
        ws.close(1000, 'Left room');
      }
    });

    ws.on('close', () => {
      unregisterSocket(ws);
    });

    ws.on('error', () => {
      unregisterSocket(ws);
    });
  });

  const heartbeatInterval = setInterval(() => {
    for (const client of wss.clients) {
      const meta = socketMeta.get(client);
      if (meta) {
        if (!meta.isAlive) {
          client.terminate();
          unregisterSocket(client);
          continue;
        }
        meta.isAlive = false;
      }
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    }
  }, 25000);

  // Vite dev middleware or static dist serving
  let viteClose: (() => Promise<void>) | null = null;
  const shouldUseVite =
    options?.enableVite ?? process.env.NODE_ENV !== 'production';

  if (shouldUseVite) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    viteClose = () => vite.close();
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const listenPort = options?.port ?? Number(process.env.PORT || 3000);

  await new Promise<void>((resolve) => {
    server.listen(listenPort, '0.0.0.0', () => resolve());
  });

  const address = server.address();
  const actualPort =
    typeof address === 'object' && address ? address.port : listenPort;

  return {
    app,
    server,
    wss,
    roomManager,
    port: actualPort,
    async close() {
      clearInterval(heartbeatInterval);
      roomManager.dispose();
      for (const client of wss.clients) {
        client.close();
      }
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (viteClose) await viteClose();
    },
  };
}

// Run standalone when executed directly (`tsx server.ts` or `node server.ts`)
const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  path.resolve(process.argv[1]).endsWith('server.ts');

if (isDirectRun) {
  createGameServer().then(({ port }) => {
    console.log(`Chronicles of the Forgotten Realms server listening on http://0.0.0.0:${port}`);
  });
}
