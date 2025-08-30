// src/hooks/useAuth.tsx
import { useState, useCallback, createContext, useContext } from "react";

type AuthContextType = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  // ⏳ Decode token to check expiry
  const isTokenExpired = (token: string) => {
    try {
      const { exp } = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  // 🔐 Login → store access token
  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include", // ✅ send/receive refresh cookie
    });
    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    setToken(data.accessToken);
  };

  // 🚪 Logout
  const logout = () => {
    setToken(null);
    // optionally call /auth/logout to clear cookie
  };

  // 🔄 Refresh access token
  const refresh = useCallback(async () => {
    const res = await fetch("http://localhost:4000/auth/refresh", {
      method: "POST",
      credentials: "include", // ✅ send refresh cookie
    });
    if (!res.ok) return null;

    const data = await res.json();
    setToken(data.accessToken);
    return data.accessToken;
  }, []);

  // 🔑 Get token (refresh if expired)
  const getToken = useCallback(async () => {
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return await refresh();
  }, [token, refresh]);

  return (
    <AuthContext.Provider value={{ token, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
