// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import type { SocketInstance } from "../lib/socket";
import { createSocket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

interface SocketContextValue {
  socket: SocketInstance | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();
  const socketRef = useRef<SocketInstance | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      const token = await getToken();
      if (!token || !isMounted) return;

      // create socket once
      const newSocket = createSocket(token);
      socketRef.current = newSocket;

      newSocket.on("connect", () => {
        console.log("🔌 Connected:", newSocket.id);
      });

      newSocket.on("disconnect", (reason: string) => {
        console.log("❌ Disconnected:", reason);
      });
    };

    setupSocket();

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
    // no socket in deps → prevents accidental disconnects
  }, [getToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook for easy usage in components
export const useSocket = () => useContext(SocketContext);
