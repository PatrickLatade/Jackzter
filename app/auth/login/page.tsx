// app/auth/login/page.tsx
"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
