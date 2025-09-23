// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SocketInstance } from "../lib/socket";
import { getSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

interface SocketContextValue {
  socket: SocketInstance | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<SocketInstance | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setupSocket = async () => {
      const token = await getToken();
      if (!token || cancelled) return;

      const createdSocket = getSocket(token); // singleton
      setSocket(createdSocket);

      createdSocket.on("connect", () => {
        console.log("🔌 Connected:", createdSocket.id);
      });

      createdSocket.on("disconnect", (reason: string) => {
        console.log("❌ Disconnected:", reason);
      });
    };

    setupSocket();

    return () => {
      cancelled = true;
      if (socket) {
        socket.removeAllListeners();
        disconnectSocket(); // clears singleton
        setSocket(null);
      }
    };
  }, [getToken, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
