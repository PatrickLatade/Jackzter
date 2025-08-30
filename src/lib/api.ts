// src/lib/api.ts
import { useAuth } from "../hooks/useAuth";

export const useApi = () => {
  const { getToken } = useAuth();

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    return fetch(`http://localhost:4000${url}`, {
      ...options,
      headers,
      credentials: "include", // send refresh cookie when needed
    });
  };

  return { apiFetch };
};
