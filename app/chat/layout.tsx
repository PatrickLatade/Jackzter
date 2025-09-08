// app/chat/layout.tsx
"use client";

import { AuthProvider } from "@/src/hooks/useAuth";
import ProtectedRoute from "@/src/components/ProtectedRoute";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </AuthProvider>
  );
}
