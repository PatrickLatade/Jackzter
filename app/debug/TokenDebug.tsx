"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/src/hooks/useAuth";

interface JWTPayload {
  exp: number;
  iat: number;
  id?: number;
}

export default function DebugTokensPage() {
  const { getToken } = useAuth();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [expiresIn, setExpiresIn] = useState<string>("...");
  const [lastToken, setLastToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const refreshLoop = async () => {
      while (isMounted) {
        try {
          const token = await getToken();
          if (token) {
            // Only increment if token actually changed
            if (token !== lastToken) {
              const shortHash = token.slice(0, 6) + "🔑";
              setTokenHash(shortHash);
              setRefreshCount((c) => c + 1);
              setLastToken(token);
            }

            // decode expiration
            const decoded = jwtDecode<JWTPayload>(token);
            const now = Math.floor(Date.now() / 1000);
            const diff = decoded.exp - now;
            setExpiresIn(diff > 0 ? `${Math.floor(diff / 60)}m ${diff % 60}s` : "expired");

            // wait until token is about to expire (or 5s if already near expiry)
            const waitTime = Math.max(diff * 1000, 5000);
            await new Promise((r) => setTimeout(r, waitTime + 500)); // +0.5s buffer
          } else {
            // no token, retry in 5s
            await new Promise((r) => setTimeout(r, 5000));
          }
        } catch (err) {
          console.error("Failed to refresh token:", err);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    refreshLoop();
    return () => {
      isMounted = false;
    };
  }, [getToken, lastToken]);

  return (
    <div className="p-6 font-mono">
      <h1 className="text-2xl mb-4 text-gray-900">🔒 Safe Token Debug</h1>

      <p className="text-gray-900">
        ✅ Refresh token stored securely in HttpOnly cookie.
      </p>

      <p className="mt-2 text-gray-900">
        Access token (partial, safe for debug): <b>{tokenHash || "waiting..."}</b>
      </p>

      <p className="text-gray-900">
        Expires in: <b>{expiresIn}</b>
      </p>

      <p className="text-gray-900">
        Number of refreshes: <b>{refreshCount}</b>
      </p>

      <p className="mt-4 text-sm text-gray-500">
        🔒 Full token never exposed in DOM or console.
      </p>
    </div>
  );
}
