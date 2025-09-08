// src/components/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth/login");
    }
  }, [loading, token, router]);

  if (loading) {
    return <div className="p-4">Checking session...</div>; // or spinner
  }

  return <>{children}</>;
}
