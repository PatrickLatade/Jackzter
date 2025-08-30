// app/auth/register/page.tsx
"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import RegisterPageContent from "./RegisterPageContent";

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterPageContent />
    </AuthProvider>
  );
}
