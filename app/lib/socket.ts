"use client";

import { io, type Socket } from "socket.io-client";

export type GroupRealtimeEventPayload = {
  groupCode?: string;
  places?: unknown[];
  place?: unknown;
  placeId?: string | number;
  finalPlaceId?: string | number | null;
  updatedAt?: string;
};

type ServerToClientEvents = {
  "meeting:updated": (payload: GroupRealtimeEventPayload) => void;
  "vote:updated": (payload: GroupRealtimeEventPayload) => void;
  "place:created": (payload: GroupRealtimeEventPayload) => void;
  "place:deleted": (payload: GroupRealtimeEventPayload) => void;
  "final-place:updated": (payload: GroupRealtimeEventPayload) => void;
};

type ClientToServerEvents = {
  "group:join": (payload: { groupCode: string }) => void;
  "group:leave": (payload: { groupCode: string }) => void;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

function getSocketUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
}

export function isSocketEnabled() {
  return getSocketUrl().trim() !== "";
}

export function connectSocket() {
  if (typeof window === "undefined") {
    return null;
  }

  const socketUrl = getSocketUrl();

  if (!socketUrl) {
    return null;
  }

  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function joinGroupRealtimeRoom(groupCode: string) {
  if (!socket?.connected) {
    return;
  }

  socket.emit("group:join", { groupCode });
}

export function leaveGroupRealtimeRoom(groupCode: string) {
  if (!socket?.connected) {
    return;
  }

  socket.emit("group:leave", { groupCode });
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}
