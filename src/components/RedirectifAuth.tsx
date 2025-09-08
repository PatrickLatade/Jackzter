// src/components/RedirectIfAuth.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  // 🚀 Redirect immediately if logged in
  useEffect(() => {
    if (!loading && token) {
      router.replace("/chat");
    }
  }, [loading, token, router]);

  if (loading) {
    return null; // ✅ render nothing until we know auth state
  }

  if (token) {
    return null; // ✅ never show login page if already logged in
  }

  return <>{children}</>; // ✅ only show children if logged out
}
