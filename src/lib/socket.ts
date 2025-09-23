// src/lib/socket.ts
"use client";

import io from "socket.io-client";

// Use ReturnType<typeof io> instead of Socket type
export type SocketInstance = ReturnType<typeof io>;

// Singleton holder
let socketInstance: SocketInstance | null = null;

/**
 * Returns the existing socket instance if it exists,
 * or creates a new one if it doesn't.
 */
export const getSocket = (token: string): SocketInstance => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:4000", {
      auth: { token },
      transports: ["websocket"], // force websocket
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      socketInstance = null; // allow reconnect later
    });
  }

  return socketInstance;
};

/**
 * Disconnects the current socket (if any) and clears the singleton.
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
