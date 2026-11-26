import type { GameAction } from '../engine/GameManager';
import type {
  AiBehaviorStyle,
  AiDifficulty,
  GameState,
  LocalizedText,
} from './game';

export type RoomPhase = 'LOBBY' | 'PLAYING' | 'ENDED';

export interface OnlineSeat {
  seatIndex: number;
  slotId: string;
  playerId: string | null;
  name: string;
  heroId: string;
  isHost: boolean;
  isAI: boolean;
  aiDifficulty?: AiDifficulty;
  aiStyle?: AiBehaviorStyle;
  ready: boolean;
  connected: boolean;
  disconnectedAt: number | null;
  lastSeenAt: number;
}

export interface OnlineChatMessage {
  id: string;
  roomCode: string;
  senderSlotId: string | null;
  senderName: string;
  kind: 'player' | 'system';
  text: string;
  timestamp: number;
}

export interface PublicOnlineRoom {
  roomCode: string;
  phase: RoomPhase;
  maxPlayers: number;
  hostSlotId: string;
  stateVersion: number;
  aiDifficulty: AiDifficulty;
  seats: OnlineSeat[];
  chatHistory: OnlineChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateRoomPayload {
  hostName: string;
  heroId: string;
  maxPlayers: number;
  aiDifficulty?: AiDifficulty;
  seed?: number;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName?: string;
  heroId?: string;
  reconnectCode?: string;
}

export interface RoomJoinResult {
  room: PublicOnlineRoom;
  gameState: GameState | null;
  slotId: string;
  sessionToken: string;
  reconnectCode: string;
  reconnected: boolean;
}

export type ClientWsMessage =
  | {
      type: 'AUTH_SESSION';
      roomCode: string;
      sessionToken: string;
    }
  | {
      type: 'SELECT_HERO';
      heroId: string;
    }
  | {
      type: 'UPDATE_NAME';
      name: string;
    }
  | {
      type: 'SET_READY';
      ready: boolean;
    }
  | {
      type: 'UPDATE_ROOM_CONFIG';
      maxPlayers?: number;
      aiDifficulty?: AiDifficulty;
    }
  | {
      type: 'ADD_AI_BOT';
      heroId?: string;
      aiDifficulty?: AiDifficulty;
      aiStyle?: AiBehaviorStyle;
    }
  | {
      type: 'REMOVE_SEAT';
      targetSlotId: string;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'GAME_ACTION';
      commandId: string;
      expectedVersion: number;
      action: GameAction;
    }
  | {
      type: 'CHAT_SEND';
      text: string;
      clientMsgId?: string;
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
      ts: number;
    };

export type ServerWsMessage =
  | {
      type: 'ROOM_SYNC';
      room: PublicOnlineRoom;
      gameState: GameState | null;
      yourSlotId: string;
      reconnectCode?: string;
    }
  | {
      type: 'STATE_SYNC';
      stateVersion: number;
      gameState: GameState;
      lastCommandId?: string;
      actorSlotId?: string;
    }
  | {
      type: 'PRESENCE_UPDATE';
      room: PublicOnlineRoom;
      systemMessage?: OnlineChatMessage;
    }
  | {
      type: 'CHAT_MESSAGE';
      message: OnlineChatMessage;
    }
  | {
      type: 'ACTION_ACK';
      commandId: string;
      accepted: boolean;
      stateVersion: number;
      deduplicated?: boolean;
      error?: LocalizedText;
      errorCode?: string;
    }
  | {
      type: 'ERROR';
      code: string;
      message: LocalizedText;
    }
  | {
      type: 'PONG';
      ts: number;
      serverTime: number;
    };
