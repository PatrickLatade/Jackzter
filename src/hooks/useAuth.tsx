// src/hooks/useAuth.tsx
import { useState, useCallback, createContext, useContext, useEffect } from "react";

type AuthContextType = {
  token: string | null;
  username: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ⏳ Decode token to check expiry
  const isTokenExpired = (token: string) => {
    try {
      const { exp } = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  // 🔎 Centralized JWT decode
  const decodeAndSetUser = (accessToken: string) => {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      console.log("🔑 Full JWT:", accessToken);
      console.log("📦 Decoded JWT payload:", payload);
      setUsername(payload.username || null);
    } catch (err) {
      console.error("❌ Failed to decode JWT:", err);
      setUsername(null);
    }
  };

  // 🔐 Login → store access token
  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    setToken(data.accessToken);
    decodeAndSetUser(data.accessToken); // ✅ single decode
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await fetch("http://localhost:4000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setToken(null);
      setUsername(null);
    }
  };

  // 🔄 Refresh access token
  const refresh = useCallback(async () => {
    const res = await fetch("http://localhost:4000/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;

    const data = await res.json();
    setToken(data.accessToken);
    decodeAndSetUser(data.accessToken); // ✅ single decode
    return data.accessToken;
  }, []);

  // 🔑 Get token (refresh if expired)
  const getToken = useCallback(async () => {
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return await refresh();
  }, [token, refresh]);

  // 🛠 Init auth on mount → try to refresh immediately
  useEffect(() => {
    const initAuth = async () => {
      const newToken = await getToken();
      if (newToken) {
        decodeAndSetUser(newToken); // ✅ single decode
      }
      setLoading(false);
    };
    initAuth();
  }, [getToken]);

  return (
    <AuthContext.Provider
      value={{ token, username, login, logout, getToken, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
