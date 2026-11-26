import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { HEROES, HERO_MAP } from '../data/heroes';
import { AiManager } from '../engine/AiManager';
import { cloneGameState } from '../engine/GameState';
import { GameAction, GameManager } from '../engine/GameManager';
import { getActivePlayer, RulesEngine } from '../engine/RulesEngine';
import {
  AiBehaviorStyle,
  AiDifficulty,
  EquipSlot,
  GameState,
  LocalizedText,
  MajorWorldEventId,
} from '../types/game';
import {
  ClientWsMessage,
  CreateRoomPayload,
  JoinRoomPayload,
  OnlineChatMessage,
  OnlineSeat,
  PublicOnlineRoom,
  RoomJoinResult,
  RoomPhase,
  ServerWsMessage,
} from '../types/online';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_CHAT_HISTORY = 100;
const MAX_COMMAND_CACHE = 400;

const ALLOWED_ACTION_TYPES = new Set<GameAction['type']>([
  'ROLL_MOVEMENT',
  'REROLL_MOVEMENT_DICE',
  'STEP_MOVE',
  'STOP_MOVEMENT_EARLY',
  'MOVE',
  'EXPLORE',
  'ROLL_ENCOUNTER_CHECK',
  'REROLL_ENCOUNTER_CHECK',
  'REST',
  'DRAW_CARD',
  'BUY_SUPPLY',
  'BUY_MARKET_CARD',
  'SELL_CARD',
  'REFRESH_MARKET',
  'HEAL_AT_SANCTUARY',
  'CLEANSE_CURSE',
  'USE_ABILITY',
  'UPGRADE_STAT',
  'PLAY_CARD',
  'STORE_INVENTORY',
  'USE_INVENTORY_ITEM',
  'DISCARD_HAND_CARD',
  'DISCARD_INVENTORY_CARD',
  'DISMISS_COMPANION',
  'EQUIP_INVENTORY',
  'UNEQUIP_SLOT',
  'CHALLENGE_GATE_GUARDIAN',
  'CHALLENGE_SEAL',
  'ATTEMPT_TRIAL',
  'CHALLENGE_CITADEL',
  'CHALLENGE_VOID_LORD',
  'CHALLENGE_PLAYER',
  'COMBAT_ATTACK',
  'COMBAT_DEFEND',
  'COMBAT_FLEE',
  'RESOLVE_ENCOUNTER',
  'INTERVENE_WORLD_EVENT',
  'TALK_NPC',
  'SELECT_NPC_OPTION',
  'CLOSE_NPC_DIALOG',
  'END_TURN',
]);

interface InternalSeat extends OnlineSeat {
  sessionToken: string;
  reconnectCode: string;
}

interface CommandCacheEntry {
  accepted: boolean;
  stateVersion: number;
  error?: LocalizedText;
  errorCode?: string;
}

interface InternalRoom {
  roomCode: string;
  phase: RoomPhase;
  maxPlayers: number;
  hostSlotId: string;
  stateVersion: number;
  aiDifficulty: AiDifficulty;
  seedOverride?: number;
  seats: InternalSeat[];
  chatHistory: OnlineChatMessage[];
  gameState: GameState | null;
  processedCommands: Map<string, CommandCacheEntry>;
  processedOrder: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RoomBroadcaster {
  sendToSlot: (roomCode: string, slotId: string, msg: ServerWsMessage) => void;
  broadcastToRoom: (roomCode: string, msg: ServerWsMessage) => void;
}

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLen);
}

function generateInviteCode(existing: Set<string>): string {
  for (let attempt = 0; attempt < 32; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += ROOM_CODE_ALPHABET[crypto.randomInt(ROOM_CODE_ALPHABET.length)];
    }
    if (!existing.has(code)) return code;
  }
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

function generateSecretToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function generateReconnectCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function normalizeRoomCode(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
}

/**
 * Masks RNG internals and unseen deck order before sending authoritative state
 * to online clients so clients cannot predict rolls or peek future draws.
 */
export function sanitizeGameStateForClient(state: GameState | null): GameState | null {
  if (!state) return null;
  const view = cloneGameState(state);
  view.seed = 0;
  view.rngState = 0;
  view.deck = view.deck.map((_, idx) => `__hidden_${idx}__`);
  if (view.adventureDeck) {
    view.adventureDeck = view.adventureDeck.map((_, idx) => `__hidden_adv_${idx}__`);
  }
  return view;
}

function validateGameActionShape(action: unknown): action is GameAction {
  if (!action || typeof action !== 'object') return false;
  const candidate = action as Record<string, unknown>;
  const type = candidate.type;
  if (typeof type !== 'string' || !ALLOWED_ACTION_TYPES.has(type as GameAction['type'])) {
    return false;
  }
  switch (type) {
    case 'STEP_MOVE':
    case 'MOVE':
      return typeof candidate.locationId === 'string' && candidate.locationId.length > 0 && candidate.locationId.length <= 64;
    case 'BUY_MARKET_CARD':
    case 'PLAY_CARD':
    case 'STORE_INVENTORY':
    case 'USE_INVENTORY_ITEM':
    case 'DISCARD_HAND_CARD':
    case 'DISCARD_INVENTORY_CARD':
    case 'DISMISS_COMPANION':
    case 'EQUIP_INVENTORY':
      return typeof candidate.cardId === 'string' && candidate.cardId.length > 0 && candidate.cardId.length <= 64;
    case 'SELL_CARD':
      return (
        (candidate.source === 'hand' || candidate.source === 'inventory') &&
        typeof candidate.cardId === 'string' &&
        candidate.cardId.length > 0 &&
        candidate.cardId.length <= 64
      );
    case 'CLEANSE_CURSE':
      return (
        candidate.curseCardId === undefined ||
        (typeof candidate.curseCardId === 'string' && candidate.curseCardId.length <= 64)
      );
    case 'UPGRADE_STAT':
      return candidate.stat === 'strength' || candidate.stat === 'intellect';
    case 'UNEQUIP_SLOT':
      return (['weapon', 'armor', 'talisman'] as EquipSlot[]).includes(candidate.slot as EquipSlot);
    case 'CHALLENGE_PLAYER':
      return typeof candidate.targetPlayerId === 'string' && candidate.targetPlayerId.length > 0 && candidate.targetPlayerId.length <= 64;
    case 'COMBAT_ATTACK':
      return (
        candidate.combatType === undefined ||
        candidate.combatType === 'physical' ||
        candidate.combatType === 'magic'
      );
    case 'INTERVENE_WORLD_EVENT':
      return typeof candidate.eventId === 'string' && (candidate.eventId as MajorWorldEventId).startsWith('major_');
    case 'TALK_NPC':
      return typeof candidate.npcId === 'string' && candidate.npcId.length > 0 && candidate.npcId.length <= 64;
    case 'SELECT_NPC_OPTION':
      return typeof candidate.optionId === 'string' && candidate.optionId.length > 0 && candidate.optionId.length <= 64;
    default:
      return true;
  }
}

export class OnlineRoomManager {
  private rooms = new Map<string, InternalRoom>();
  private aiTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private broadcaster: RoomBroadcaster | null = null;
  private snapshotPath: string | null = null;

  constructor(options?: { snapshotPath?: string | null; broadcaster?: RoomBroadcaster | null }) {
    this.snapshotPath = options?.snapshotPath ?? null;
    this.broadcaster = options?.broadcaster ?? null;
    if (this.snapshotPath) {
      this.loadSnapshot();
    }
  }

  setBroadcaster(broadcaster: RoomBroadcaster): void {
    this.broadcaster = broadcaster;
  }

  dispose(): void {
    for (const timer of this.aiTimers.values()) {
      clearTimeout(timer);
    }
    this.aiTimers.clear();
  }

  private saveSnapshot(): void {
    if (!this.snapshotPath) return;
    try {
      const dir = path.dirname(this.snapshotPath);
      fs.mkdirSync(dir, { recursive: true });
      const serializable = [...this.rooms.values()].map((r) => ({
        ...r,
        seats: r.seats.map((s) => ({ ...s, connected: false })),
        processedCommands: [...r.processedCommands.entries()],
      }));
      const tmp = `${this.snapshotPath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(serializable));
      fs.renameSync(tmp, this.snapshotPath);
    } catch {
      // Ignore snapshot write failures in ephemeral environments
    }
  }

  private loadSnapshot(): void {
    if (!this.snapshotPath || !fs.existsSync(this.snapshotPath)) return;
    try {
      const raw = fs.readFileSync(this.snapshotPath, 'utf8');
      const parsed = JSON.parse(raw) as Array<
        Omit<InternalRoom, 'processedCommands'> & {
          processedCommands: Array<[string, CommandCacheEntry]>;
        }
      >;
      if (!Array.isArray(parsed)) return;
      for (const item of parsed) {
        if (!item || typeof item.roomCode !== 'string') continue;
        this.rooms.set(item.roomCode, {
          ...item,
          processedCommands: new Map(item.processedCommands ?? []),
        });
      }
    } catch {
      // Ignore corrupted snapshot file cleanly
    }
  }

  private toPublicSeat(seat: InternalSeat): OnlineSeat {
    return {
      seatIndex: seat.seatIndex,
      slotId: seat.slotId,
      playerId: seat.playerId,
      name: seat.name,
      heroId: seat.heroId,
      isHost: seat.isHost,
      isAI: seat.isAI,
      aiDifficulty: seat.aiDifficulty,
      aiStyle: seat.aiStyle,
      ready: seat.ready,
      connected: seat.connected,
      disconnectedAt: seat.disconnectedAt,
      lastSeenAt: seat.lastSeenAt,
    };
  }

  toPublicRoom(room: InternalRoom): PublicOnlineRoom {
    return {
      roomCode: room.roomCode,
      phase: room.phase,
      maxPlayers: room.maxPlayers,
      hostSlotId: room.hostSlotId,
      stateVersion: room.stateVersion,
      aiDifficulty: room.aiDifficulty,
      seats: room.seats.map((s) => this.toPublicSeat(s)),
      chatHistory: room.chatHistory.slice(-MAX_CHAT_HISTORY),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  private pushSystemChat(room: InternalRoom, text: string): OnlineChatMessage {
    const msg: OnlineChatMessage = {
      id: `sys_${Date.now()}_${crypto.randomInt(100000)}`,
      roomCode: room.roomCode,
      senderSlotId: null,
      senderName: 'Chronicle',
      kind: 'system',
      text,
      timestamp: Date.now(),
    };
    room.chatHistory.push(msg);
    if (room.chatHistory.length > MAX_CHAT_HISTORY) {
      room.chatHistory = room.chatHistory.slice(-MAX_CHAT_HISTORY);
    }
    return msg;
  }

  getPublicRoom(roomCodeRaw: string): PublicOnlineRoom | null {
    const code = normalizeRoomCode(roomCodeRaw);
    const room = this.rooms.get(code);
    return room ? this.toPublicRoom(room) : null;
  }

  createRoom(payload: CreateRoomPayload): RoomJoinResult {
    const heroId = HERO_MAP.has(payload.heroId) ? payload.heroId : HEROES[0].id;
    const hero = HERO_MAP.get(heroId)!;
    const maxPlayers = Math.max(1, Math.min(6, Math.floor(Number(payload.maxPlayers) || 4)));
    const aiDifficulty: AiDifficulty =
      payload.aiDifficulty === 'easy' || payload.aiDifficulty === 'hard'
        ? payload.aiDifficulty
        : 'normal';

    const hostName =
      sanitizeText(payload.hostName, 32) || hero.name.uk.split(' ')[0] || 'Host';
    const roomCode = generateInviteCode(new Set(this.rooms.keys()));
    const now = Date.now();
    const slotId = `slot_${crypto.randomBytes(6).toString('hex')}`;
    const sessionToken = generateSecretToken();
    const reconnectCode = generateReconnectCode();

    const hostSeat: InternalSeat = {
      seatIndex: 0,
      slotId,
      playerId: null,
      name: hostName,
      heroId,
      isHost: true,
      isAI: false,
      ready: true,
      connected: false,
      disconnectedAt: null,
      lastSeenAt: now,
      sessionToken,
      reconnectCode,
    };

    const room: InternalRoom = {
      roomCode,
      phase: 'LOBBY',
      maxPlayers,
      hostSlotId: slotId,
      stateVersion: 1,
      aiDifficulty,
      seedOverride:
        typeof payload.seed === 'number' && Number.isFinite(payload.seed)
          ? Math.floor(payload.seed)
          : undefined,
      seats: [hostSeat],
      chatHistory: [],
      gameState: null,
      processedCommands: new Map(),
      processedOrder: [],
      createdAt: now,
      updatedAt: now,
    };

    this.pushSystemChat(room, `${hostName} created room ${roomCode}.`);
    this.rooms.set(roomCode, room);
    this.saveSnapshot();

    return {
      room: this.toPublicRoom(room),
      gameState: null,
      slotId,
      sessionToken,
      reconnectCode,
      reconnected: false,
    };
  }

  joinRoom(payload: JoinRoomPayload): { result?: RoomJoinResult; error?: LocalizedText; errorCode?: string } {
    const roomCode = normalizeRoomCode(payload.roomCode);
    const room = this.rooms.get(roomCode);
    if (!room) {
      return {
        errorCode: 'ROOM_NOT_FOUND',
        error: {
          uk: `Кімнату "${roomCode || '?'}" не знайдено.`,
          en: `Room "${roomCode || '?'}" not found.`,
        },
      };
    }

    const reconnectCode = sanitizeText(payload.reconnectCode, 16).toUpperCase();
    if (reconnectCode) {
      const targetSeat = room.seats.find(
        (s) => !s.isAI && s.reconnectCode === reconnectCode
      );
      if (!targetSeat) {
        return {
          errorCode: 'INVALID_RECONNECT_CODE',
          error: {
            uk: 'Невірний код відновлення для цієї кімнати.',
            en: 'Invalid reconnect code for this room.',
          },
        };
      }
      targetSeat.sessionToken = generateSecretToken();
      targetSeat.lastSeenAt = Date.now();
      targetSeat.disconnectedAt = null;
      const sysMsg = this.pushSystemChat(room, `${targetSeat.name} reclaimed their seat.`);
      room.updatedAt = Date.now();
      this.saveSnapshot();
      this.broadcaster?.broadcastToRoom(room.roomCode, {
        type: 'PRESENCE_UPDATE',
        room: this.toPublicRoom(room),
        systemMessage: sysMsg,
      });

      return {
        result: {
          room: this.toPublicRoom(room),
          gameState: sanitizeGameStateForClient(room.gameState),
          slotId: targetSeat.slotId,
          sessionToken: targetSeat.sessionToken,
          reconnectCode: targetSeat.reconnectCode,
          reconnected: true,
        },
      };
    }

    if (room.phase !== 'LOBBY') {
      return {
        errorCode: 'GAME_ALREADY_STARTED',
        error: {
          uk: 'Партія вже розпочалась. Використайте код відновлення, щоб повернутися.',
          en: 'Match already started. Use your reconnect code to rejoin.',
        },
      };
    }

    if (room.seats.length >= room.maxPlayers) {
      return {
        errorCode: 'ROOM_FULL',
        error: {
          uk: `Кімната ${room.roomCode} заповнена (${room.seats.length}/${room.maxPlayers}).`,
          en: `Room ${room.roomCode} is full (${room.seats.length}/${room.maxPlayers}).`,
        },
      };
    }

    const usedHeroes = new Set(room.seats.map((s) => s.heroId));
    const requestedHero =
      payload.heroId && HERO_MAP.has(payload.heroId)
        ? payload.heroId
        : HEROES.find((h) => !usedHeroes.has(h.id))?.id ?? HEROES[room.seats.length % HEROES.length].id;
    const hero = HERO_MAP.get(requestedHero)!;
    const playerName =
      sanitizeText(payload.playerName, 32) ||
      `${hero.name.uk.split(' ')[0]}_${room.seats.length + 1}`;
    const slotId = `slot_${crypto.randomBytes(6).toString('hex')}`;
    const sessionToken = generateSecretToken();
    const newReconnectCode = generateReconnectCode();
    const now = Date.now();

    const newSeat: InternalSeat = {
      seatIndex: room.seats.length,
      slotId,
      playerId: null,
      name: playerName,
      heroId: requestedHero,
      isHost: false,
      isAI: false,
      ready: false,
      connected: false,
      disconnectedAt: null,
      lastSeenAt: now,
      sessionToken,
      reconnectCode: newReconnectCode,
    };

    room.seats.push(newSeat);
    room.updatedAt = now;
    const sysMsg = this.pushSystemChat(room, `${playerName} joined the room.`);
    this.saveSnapshot();

    this.broadcaster?.broadcastToRoom(room.roomCode, {
      type: 'PRESENCE_UPDATE',
      room: this.toPublicRoom(room),
      systemMessage: sysMsg,
    });

    return {
      result: {
        room: this.toPublicRoom(room),
        gameState: null,
        slotId,
        sessionToken,
        reconnectCode: newReconnectCode,
        reconnected: false,
      },
    };
  }

  authenticateSocket(
    roomCodeRaw: string,
    sessionToken: string
  ): { room: InternalRoom; seat: InternalSeat; reconnected: boolean } | null {
    const code = normalizeRoomCode(roomCodeRaw);
    const room = this.rooms.get(code);
    if (!room || typeof sessionToken !== 'string' || sessionToken.length < 16) return null;

    const seat = room.seats.find((s) => !s.isAI && s.sessionToken === sessionToken);
    if (!seat) return null;

    const wasDisconnected = !seat.connected && seat.disconnectedAt !== null;
    seat.connected = true;
    seat.disconnectedAt = null;
    seat.lastSeenAt = Date.now();
    room.updatedAt = Date.now();

    const sysMsg = wasDisconnected
      ? this.pushSystemChat(room, `${seat.name} reconnected.`)
      : undefined;

    this.broadcaster?.broadcastToRoom(room.roomCode, {
      type: 'PRESENCE_UPDATE',
      room: this.toPublicRoom(room),
      systemMessage: sysMsg,
    });

    return { room, seat, reconnected: wasDisconnected };
  }

  handleDisconnect(roomCodeRaw: string, slotId: string): void {
    const room = this.rooms.get(normalizeRoomCode(roomCodeRaw));
    if (!room) return;
    const seat = room.seats.find((s) => s.slotId === slotId);
    if (!seat || !seat.connected) return;

    seat.connected = false;
    seat.disconnectedAt = Date.now();
    room.updatedAt = Date.now();
    const sysMsg = this.pushSystemChat(room, `${seat.name} disconnected.`);
    this.saveSnapshot();

    this.broadcaster?.broadcastToRoom(room.roomCode, {
      type: 'PRESENCE_UPDATE',
      room: this.toPublicRoom(room),
      systemMessage: sysMsg,
    });
  }

  handleClientMessage(
    roomCodeRaw: string,
    slotId: string,
    msg: ClientWsMessage
  ): ServerWsMessage[] {
    const room = this.rooms.get(normalizeRoomCode(roomCodeRaw));
    if (!room) {
      return [
        {
          type: 'ERROR',
          code: 'ROOM_NOT_FOUND',
          message: { uk: 'Кімнату не знайдено.', en: 'Room not found.' },
        },
      ];
    }

    const seat = room.seats.find((s) => s.slotId === slotId);
    if (!seat) {
      return [
        {
          type: 'ERROR',
          code: 'UNAUTHORIZED',
          message: { uk: 'Сесія недійсна.', en: 'Session unauthorized.' },
        },
      ];
    }

    seat.lastSeenAt = Date.now();

    switch (msg.type) {
      case 'PING':
        return [{ type: 'PONG', ts: Number(msg.ts) || 0, serverTime: Date.now() }];

      case 'CHAT_SEND': {
        const clean = sanitizeText(msg.text, 300);
        if (!clean) return [];
        const chatMsg: OnlineChatMessage = {
          id: `chat_${Date.now()}_${crypto.randomInt(100000)}`,
          roomCode: room.roomCode,
          senderSlotId: seat.slotId,
          senderName: seat.name,
          kind: 'player',
          text: clean,
          timestamp: Date.now(),
        };
        room.chatHistory.push(chatMsg);
        if (room.chatHistory.length > MAX_CHAT_HISTORY) {
          room.chatHistory = room.chatHistory.slice(-MAX_CHAT_HISTORY);
        }
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'CHAT_MESSAGE',
          message: chatMsg,
        });
        return [];
      }

      case 'SELECT_HERO': {
        if (room.phase !== 'LOBBY') {
          return [
            {
              type: 'ERROR',
              code: 'NOT_IN_LOBBY',
              message: { uk: 'Неможливо змінити героя під час партії.', en: 'Cannot change hero after match start.' },
            },
          ];
        }
        if (!HERO_MAP.has(msg.heroId)) {
          return [
            {
              type: 'ERROR',
              code: 'INVALID_HERO',
              message: { uk: 'Невідомий герой.', en: 'Invalid hero.' },
            },
          ];
        }
        seat.heroId = msg.heroId;
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
        });
        return [];
      }

      case 'UPDATE_NAME': {
        if (room.phase !== 'LOBBY') return [];
        const clean = sanitizeText(msg.name, 32);
        if (!clean) return [];
        seat.name = clean;
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
        });
        return [];
      }

      case 'SET_READY': {
        if (room.phase !== 'LOBBY') return [];
        seat.ready = Boolean(msg.ready);
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
        });
        return [];
      }

      case 'UPDATE_ROOM_CONFIG': {
        if (room.phase !== 'LOBBY' || !seat.isHost) {
          return [
            {
              type: 'ERROR',
              code: 'HOST_ONLY',
              message: { uk: 'Лише хост може змінювати налаштування кімнати.', en: 'Only the host can configure the room.' },
            },
          ];
        }
        if (typeof msg.maxPlayers === 'number') {
          const requested = Math.max(1, Math.min(6, Math.floor(msg.maxPlayers)));
          room.maxPlayers = Math.max(room.seats.length, requested);
        }
        if (msg.aiDifficulty === 'easy' || msg.aiDifficulty === 'normal' || msg.aiDifficulty === 'hard') {
          room.aiDifficulty = msg.aiDifficulty;
          for (const s of room.seats) {
            if (s.isAI) s.aiDifficulty = msg.aiDifficulty;
          }
        }
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
        });
        return [];
      }

      case 'ADD_AI_BOT': {
        if (room.phase !== 'LOBBY' || !seat.isHost) {
          return [
            {
              type: 'ERROR',
              code: 'HOST_ONLY',
              message: { uk: 'Лише хост може додавати ботів.', en: 'Only the host can add bots.' },
            },
          ];
        }
        if (room.seats.length >= room.maxPlayers) {
          return [
            {
              type: 'ERROR',
              code: 'ROOM_FULL',
              message: { uk: 'Немає вільних місць у кімнаті.', en: 'No open seats remaining in the room.' },
            },
          ];
        }
        const used = new Set(room.seats.map((s) => s.heroId));
        const heroId =
          msg.heroId && HERO_MAP.has(msg.heroId)
            ? msg.heroId
            : HEROES.find((h) => !used.has(h.id))?.id ?? HEROES[room.seats.length % HEROES.length].id;
        const hero = HERO_MAP.get(heroId)!;
        const idx = room.seats.length;
        const diff: AiDifficulty =
          msg.aiDifficulty === 'easy' || msg.aiDifficulty === 'hard' || msg.aiDifficulty === 'normal'
            ? msg.aiDifficulty
            : room.aiDifficulty;
        const style: AiBehaviorStyle =
          msg.aiStyle ?? AiManager.assignDefaultStyle(heroId, idx);
        const aiSeat: InternalSeat = {
          seatIndex: idx,
          slotId: `bot_${crypto.randomBytes(5).toString('hex')}`,
          playerId: null,
          name: `${hero.name.uk.split(' ')[0]} (ШІ)`,
          heroId,
          isHost: false,
          isAI: true,
          aiDifficulty: diff,
          aiStyle: style,
          ready: true,
          connected: true,
          disconnectedAt: null,
          lastSeenAt: Date.now(),
          sessionToken: '',
          reconnectCode: '',
        };
        room.seats.push(aiSeat);
        const sysMsg = this.pushSystemChat(room, `AI bot ${aiSeat.name} added.`);
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
          systemMessage: sysMsg,
        });
        return [];
      }

      case 'REMOVE_SEAT': {
        if (room.phase !== 'LOBBY' || !seat.isHost) {
          return [
            {
              type: 'ERROR',
              code: 'HOST_ONLY',
              message: { uk: 'Лише хост може прибирати учасників.', en: 'Only the host can remove seats.' },
            },
          ];
        }
        if (msg.targetSlotId === seat.slotId) return [];
        const before = room.seats.length;
        const target = room.seats.find((s) => s.slotId === msg.targetSlotId);
        room.seats = room.seats
          .filter((s) => s.slotId !== msg.targetSlotId)
          .map((s, idx) => ({ ...s, seatIndex: idx }));
        if (room.seats.length === before) return [];
        const sysMsg = this.pushSystemChat(room, `${target?.name ?? 'Participant'} left the room.`);
        room.updatedAt = Date.now();
        this.saveSnapshot();
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
          systemMessage: sysMsg,
        });
        return [];
      }

      case 'START_GAME': {
        if (room.phase !== 'LOBBY' || !seat.isHost) {
          return [
            {
              type: 'ERROR',
              code: 'HOST_ONLY',
              message: { uk: 'Лише хост може розпочати партію.', en: 'Only the host can start the match.' },
            },
          ];
        }
        const unreadyHumans = room.seats.filter((s) => !s.isAI && !s.isHost && !s.ready);
        if (unreadyHumans.length > 0) {
          return [
            {
              type: 'ERROR',
              code: 'PLAYERS_NOT_READY',
              message: {
                uk: `Не всі гравці готові (${unreadyHumans.map((u) => u.name).join(', ')}).`,
                en: `Not all players are ready (${unreadyHumans.map((u) => u.name).join(', ')}).`,
              },
            },
          ];
        }

        const serverSeed =
          room.seedOverride ?? crypto.randomInt(100000, 2147483647);
        const state = RulesEngine.createNewGame({
          mode: 'online',
          seed: serverSeed,
          aiDifficulty: room.aiDifficulty,
          playerConfigs: room.seats.map((s) => ({
            name: s.name,
            heroId: s.heroId,
            isAI: s.isAI,
            aiDifficulty: s.isAI ? s.aiDifficulty ?? room.aiDifficulty : undefined,
            aiStyle: s.isAI ? s.aiStyle : undefined,
          })),
        });

        room.seats.forEach((s, idx) => {
          s.playerId = state.players[idx]?.id ?? null;
        });
        room.gameState = state;
        room.phase = 'PLAYING';
        room.stateVersion = 1;
        room.updatedAt = Date.now();
        const sysMsg = this.pushSystemChat(room, `Match started with ${room.seats.length} hero(es)!`);
        this.saveSnapshot();

        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'PRESENCE_UPDATE',
          room: this.toPublicRoom(room),
          systemMessage: sysMsg,
        });
        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'STATE_SYNC',
          stateVersion: room.stateVersion,
          gameState: sanitizeGameStateForClient(room.gameState)!,
        });

        this.scheduleAiIfNeeded(room.roomCode);
        return [];
      }

      case 'GAME_ACTION': {
        const commandId = sanitizeText(msg.commandId, 80);
        if (!commandId) {
          return [
            {
              type: 'ACTION_ACK',
              commandId: '',
              accepted: false,
              stateVersion: room.stateVersion,
              errorCode: 'INVALID_COMMAND_ID',
              error: { uk: 'Відсутній ідентифікатор команди.', en: 'Missing command identifier.' },
            },
          ];
        }

        // Idempotency / anti-replay check: same commandId returns cached ack without double execution
        const cached = room.processedCommands.get(commandId);
        if (cached) {
          return [
            {
              type: 'ACTION_ACK',
              commandId,
              accepted: cached.accepted,
              stateVersion: cached.stateVersion,
              deduplicated: true,
              error: cached.error,
              errorCode: cached.errorCode,
            },
          ];
        }

        if (room.phase !== 'PLAYING' || !room.gameState) {
          const entry: CommandCacheEntry = {
            accepted: false,
            stateVersion: room.stateVersion,
            errorCode: 'GAME_NOT_ACTIVE',
            error: { uk: 'Партія не активна.', en: 'Match is not active.' },
          };
          this.rememberCommand(room, commandId, entry);
          return [{ type: 'ACTION_ACK', commandId, ...entry }];
        }

        if (!validateGameActionShape(msg.action)) {
          const entry: CommandCacheEntry = {
            accepted: false,
            stateVersion: room.stateVersion,
            errorCode: 'INVALID_ACTION_PAYLOAD',
            error: { uk: 'Некоректна команда гри.', en: 'Invalid game action payload.' },
          };
          this.rememberCommand(room, commandId, entry);
          return [{ type: 'ACTION_ACK', commandId, ...entry }];
        }

        // Authoritative turn ownership check
        const activePlayer = getActivePlayer(room.gameState);
        if (!seat.playerId || seat.playerId !== activePlayer.id || activePlayer.isAI) {
          const entry: CommandCacheEntry = {
            accepted: false,
            stateVersion: room.stateVersion,
            errorCode: 'NOT_YOUR_TURN',
            error: {
              uk: `Зараз хід гравця ${activePlayer.name}. Очікуйте своєї черги.`,
              en: `It is currently ${activePlayer.name}'s turn.`,
            },
          };
          return [{ type: 'ACTION_ACK', commandId, ...entry }];
        }

        // Optimistic concurrency / stale state version guard
        if (Number(msg.expectedVersion) !== room.stateVersion) {
          return [
            {
              type: 'ACTION_ACK',
              commandId,
              accepted: false,
              stateVersion: room.stateVersion,
              errorCode: 'VERSION_MISMATCH',
              error: {
                uk: 'Стан гри оновився на сервері. Синхронізація...',
                en: 'Server state version changed. Re-syncing...',
              },
            },
            {
              type: 'STATE_SYNC',
              stateVersion: room.stateVersion,
              gameState: sanitizeGameStateForClient(room.gameState)!,
            },
          ];
        }

        const result = GameManager.dispatch(room.gameState, msg.action);
        if (result.error) {
          const entry: CommandCacheEntry = {
            accepted: false,
            stateVersion: room.stateVersion,
            errorCode: 'RULE_REJECTED',
            error: result.error,
          };
          this.rememberCommand(room, commandId, entry);
          return [{ type: 'ACTION_ACK', commandId, ...entry }];
        }

        room.gameState = result.state;
        room.stateVersion += 1;
        room.updatedAt = Date.now();
        if (result.state.phase === 'VICTORY' || result.state.phase === 'DEFEAT') {
          room.phase = 'ENDED';
        }

        const entry: CommandCacheEntry = {
          accepted: true,
          stateVersion: room.stateVersion,
        };
        this.rememberCommand(room, commandId, entry);
        this.saveSnapshot();

        this.broadcaster?.broadcastToRoom(room.roomCode, {
          type: 'STATE_SYNC',
          stateVersion: room.stateVersion,
          gameState: sanitizeGameStateForClient(room.gameState)!,
          lastCommandId: commandId,
          actorSlotId: seat.slotId,
        });

        this.scheduleAiIfNeeded(room.roomCode);

        return [{ type: 'ACTION_ACK', commandId, accepted: true, stateVersion: room.stateVersion }];
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(room.roomCode, seat.slotId);
        return [];
      }

      default:
        return [
          {
            type: 'ERROR',
            code: 'UNKNOWN_MESSAGE',
            message: { uk: 'Невідомий тип повідомлення.', en: 'Unknown message type.' },
          },
        ];
    }
  }

  private rememberCommand(room: InternalRoom, commandId: string, entry: CommandCacheEntry): void {
    room.processedCommands.set(commandId, entry);
    room.processedOrder.push(commandId);
    if (room.processedOrder.length > MAX_COMMAND_CACHE) {
      const oldest = room.processedOrder.shift();
      if (oldest) room.processedCommands.delete(oldest);
    }
  }

  private scheduleAiIfNeeded(roomCode: string): void {
    const existing = this.aiTimers.get(roomCode);
    if (existing) {
      clearTimeout(existing);
      this.aiTimers.delete(roomCode);
    }

    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'PLAYING' || !room.gameState) return;
    if (room.gameState.phase !== 'PLAYING') return;

    const active = getActivePlayer(room.gameState);
    if (!active.isAI) return;

    const timer = setTimeout(() => {
      this.aiTimers.delete(roomCode);
      const currentRoom = this.rooms.get(roomCode);
      if (!currentRoom || currentRoom.phase !== 'PLAYING' || !currentRoom.gameState) return;
      const act = getActivePlayer(currentRoom.gameState);
      if (!act.isAI) return;

      const nextState = RulesEngine.runAiTurn(currentRoom.gameState);
      currentRoom.gameState = nextState;
      currentRoom.stateVersion += 1;
      currentRoom.updatedAt = Date.now();
      if (nextState.phase === 'VICTORY' || nextState.phase === 'DEFEAT') {
        currentRoom.phase = 'ENDED';
      }
      this.saveSnapshot();

      this.broadcaster?.broadcastToRoom(currentRoom.roomCode, {
        type: 'STATE_SYNC',
        stateVersion: currentRoom.stateVersion,
        gameState: sanitizeGameStateForClient(currentRoom.gameState)!,
      });

      this.scheduleAiIfNeeded(currentRoom.roomCode);
    }, 550);

    this.aiTimers.set(roomCode, timer);
  }
}
