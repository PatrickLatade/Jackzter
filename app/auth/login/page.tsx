"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import RedirectIfAuth from "@/src/components/RedirectifAuth";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <AuthProvider>
      <RedirectIfAuth>
        <LoginPageContent />
      </RedirectIfAuth>
    </AuthProvider>
  );
}
