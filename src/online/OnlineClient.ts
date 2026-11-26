import { GameAction } from '../engine/GameManager';
import { GameState, LocalizedText } from '../types/game';
import {
  ClientWsMessage,
  CreateRoomPayload,
  JoinRoomPayload,
  OnlineChatMessage,
  PublicOnlineRoom,
  RoomJoinResult,
  ServerWsMessage,
} from '../types/online';

export type OnlineConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface OnlineClientCallbacks {
  onStatusChange?: (status: OnlineConnectionStatus) => void;
  onRoomSync?: (payload: {
    room: PublicOnlineRoom;
    gameState: GameState | null;
    yourSlotId: string;
    reconnectCode?: string;
  }) => void;
  onStateSync?: (payload: {
    stateVersion: number;
    gameState: GameState;
    lastCommandId?: string;
    actorSlotId?: string;
  }) => void;
  onPresenceUpdate?: (payload: {
    room: PublicOnlineRoom;
    systemMessage?: OnlineChatMessage;
  }) => void;
  onChatMessage?: (message: OnlineChatMessage) => void;
  onActionAck?: (ack: {
    commandId: string;
    accepted: boolean;
    stateVersion: number;
    deduplicated?: boolean;
    error?: LocalizedText;
    errorCode?: string;
  }) => void;
  onError?: (err: { code: string; message: LocalizedText }) => void;
}

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

export function generateCommandId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createOnlineRoomApi(
  payload: CreateRoomPayload
): Promise<RoomJoinResult> {
  const res = await fetch('/api/online/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data as RoomJoinResult;
}

export async function joinOnlineRoomApi(
  payload: JoinRoomPayload
): Promise<RoomJoinResult> {
  const res = await fetch(`/api/online/rooms/${encodeURIComponent(payload.roomCode)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data as RoomJoinResult;
}

export async function fetchOnlineRoomPreviewApi(
  roomCode: string
): Promise<PublicOnlineRoom | null> {
  const res = await fetch(`/api/online/rooms/${encodeURIComponent(roomCode)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { room?: PublicOnlineRoom };
  return data.room ?? null;
}

export class OnlineClient {
  private ws: WebSocket | null = null;
  private roomCode: string | null = null;
  private sessionToken: string | null = null;
  private reconnectCode: string | null = null;
  private status: OnlineConnectionStatus = 'disconnected';
  private callbacks: OnlineClientCallbacks = {};
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private manualClose = false;
  private pendingMessages: ClientWsMessage[] = [];

  setCallbacks(callbacks: OnlineClientCallbacks): void {
    this.callbacks = callbacks;
  }

  getStatus(): OnlineConnectionStatus {
    return this.status;
  }

  getCredentials(): {
    roomCode: string | null;
    reconnectCode: string | null;
  } {
    return {
      roomCode: this.roomCode,
      reconnectCode: this.reconnectCode,
    };
  }

  private setStatus(next: OnlineConnectionStatus): void {
    this.status = next;
    this.callbacks.onStatusChange?.(next);
  }

  connect(roomCode: string, sessionToken: string, reconnectCode?: string): void {
    this.clearReconnectTimer();
    this.manualClose = false;
    this.roomCode = roomCode;
    this.sessionToken = sessionToken;
    if (reconnectCode) {
      this.reconnectCode = reconnectCode;
    }
    this.openSocket(false);
  }

  private openSocket(isRetry: boolean): void {
    if (!this.roomCode || !this.sessionToken) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }

    this.setStatus(isRetry ? 'reconnecting' : 'connecting');
    const socket = new WebSocket(buildWsUrl());
    this.ws = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      if (this.roomCode && this.sessionToken) {
        socket.send(
          JSON.stringify({
            type: 'AUTH_SESSION',
            roomCode: this.roomCode,
            sessionToken: this.sessionToken,
          } satisfies ClientWsMessage)
        );
      }
      this.setStatus('connected');

      // Flush any commands queued while temporarily disconnected (using preserved commandId)
      if (this.pendingMessages.length > 0) {
        const queued = [...this.pendingMessages];
        this.pendingMessages = [];
        for (const msg of queued) {
          socket.send(JSON.stringify(msg));
        }
      }
    };

    socket.onmessage = (event) => {
      let msg: ServerWsMessage;
      try {
        msg = JSON.parse(String(event.data)) as ServerWsMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ROOM_SYNC':
          if (msg.reconnectCode) {
            this.reconnectCode = msg.reconnectCode;
          }
          this.callbacks.onRoomSync?.({
            room: msg.room,
            gameState: msg.gameState,
            yourSlotId: msg.yourSlotId,
            reconnectCode: msg.reconnectCode,
          });
          break;
        case 'STATE_SYNC':
          this.callbacks.onStateSync?.({
            stateVersion: msg.stateVersion,
            gameState: msg.gameState,
            lastCommandId: msg.lastCommandId,
            actorSlotId: msg.actorSlotId,
          });
          break;
        case 'PRESENCE_UPDATE':
          this.callbacks.onPresenceUpdate?.({
            room: msg.room,
            systemMessage: msg.systemMessage,
          });
          break;
        case 'CHAT_MESSAGE':
          this.callbacks.onChatMessage?.(msg.message);
          break;
        case 'ACTION_ACK':
          this.callbacks.onActionAck?.(msg);
          break;
        case 'ERROR':
          this.callbacks.onError?.({ code: msg.code, message: msg.message });
          break;
        case 'PONG':
          break;
      }
    };

    socket.onclose = () => {
      if (this.ws === socket) {
        this.ws = null;
      }
      if (this.manualClose) {
        this.setStatus('disconnected');
        return;
      }
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      // onclose handles reconnect cleanly
    };
  }

  private scheduleReconnect(): void {
    if (this.manualClose || !this.roomCode || !this.sessionToken) {
      this.setStatus('disconnected');
      return;
    }
    this.setStatus('reconnecting');
    const delayMs = Math.min(8000, 500 * Math.pow(2, this.reconnectAttempt));
    this.reconnectAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = window.setTimeout(() => {
      this.openSocket(true);
    }, delayMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(msg: ClientWsMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else if (!this.manualClose && this.roomCode && this.sessionToken) {
      // Queue game actions / chat for flush upon reconnect
      if (msg.type === 'GAME_ACTION' || msg.type === 'CHAT_SEND') {
        this.pendingMessages.push(msg);
      }
    }
  }

  sendGameAction(action: GameAction, expectedVersion: number): string {
    const commandId = generateCommandId();
    this.send({
      type: 'GAME_ACTION',
      commandId,
      expectedVersion,
      action,
    });
    return commandId;
  }

  disconnect(leaveRoom = false): void {
    this.manualClose = true;
    this.clearReconnectTimer();
    this.pendingMessages = [];
    if (leaveRoom && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'LEAVE_ROOM' } satisfies ClientWsMessage));
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.sessionToken = null;
    this.reconnectCode = null;
    this.reconnectAttempt = 0;
    this.setStatus('disconnected');
  }
}
