//src/lib/socket.ts
"use client";

import io from "socket.io-client";

// Type alias for the socket instance
export type SocketInstance = ReturnType<typeof io>;

/**
 * Creates a new socket.io client connection with JWT auth.
 * NOTE: This should only be called inside SocketProvider (not in components directly).
 */
export const createSocket = (token: string): SocketInstance => {
  return io("http://localhost:4000", {
    auth: { token },
    transports: ["websocket"], // force websocket
  });
};
