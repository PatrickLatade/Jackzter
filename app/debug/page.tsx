// app/auth/register/page.tsx
"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import TokenDebug from "./TokenDebug";

export default function RegisterPage() {
  return (
    <AuthProvider>
      <TokenDebug />
    </AuthProvider>
  );
}
