"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import RedirectIfAuth from "@/src/components/RedirectifAuth";

export default function HomeRedirect() {
  return (
    <AuthProvider>
      <RedirectIfAuth>
        <div className="p-4">Redirecting...</div>
      </RedirectIfAuth>
    </AuthProvider>
  );
}
