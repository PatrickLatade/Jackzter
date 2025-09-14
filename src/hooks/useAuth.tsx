// src/hooks/useAuth.tsx
import { useState, useCallback, createContext, useContext, useEffect } from "react";

type UserProfile = {
  age?: number;
  birthday?: string;
  profilePicture?: string;
};

type User = {
  id: string;
  username: string;
  email: string;
  uniqueId: string;
  profile?: UserProfile; // 👈 nested profile object
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  loading: boolean;
  updateMe: (updates: {
    username?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
    age?: number;
    birthday?: string;
    profilePicture?: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpired = (token: string) => {
    try {
      const { exp } = JSON.parse(atob(token.split(".")[1]));
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  };

  // -------------------- UPDATE ME --------------------
  const updateMe = async (updates: {
    username?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
    age?: number;
    birthday?: string;
    profilePicture?: string;
  }) => {
    try {
      const accessToken = await getToken();
      if (!accessToken) throw new Error("No valid token");

      const res = await fetch("http://localhost:4000/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || data.error || "Failed to update profile");
      }

      setUser(data.user); // backend returns full updated user object
    } catch (err) {
      console.error("❌ Update failed:", err);
      throw err;
    }
  };

  // -------------------- FETCH USER --------------------
  const fetchUserProfile = async (accessToken: string) => {
    try {
      const res = await fetch("http://localhost:4000/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch user profile");

      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("❌ Failed to fetch user profile:", err);
      setUser(null);
    }
  };

  // -------------------- LOGIN --------------------
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
    await fetchUserProfile(data.accessToken);
  };

  // -------------------- LOGOUT --------------------
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
      setUser(null);
    }
  };

  // -------------------- REFRESH --------------------
  const refresh = useCallback(async () => {
    const res = await fetch("http://localhost:4000/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;

    const data = await res.json();
    setToken(data.accessToken);
    await fetchUserProfile(data.accessToken);
    return data.accessToken;
  }, []);

  const getToken = useCallback(async () => {
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return await refresh();
  }, [token, refresh]);

  useEffect(() => {
    const initAuth = async () => {
      const newToken = await getToken();
      if (newToken) await fetchUserProfile(newToken);
      setLoading(false);
    };
    initAuth();
  }, [getToken]);

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, getToken, updateMe, loading }}
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
