"use client";

import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode; // can be text or JSX
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-brand-red">{title}</h2>

        {subtitle && (
          <div className="text-center text-gray-600 mt-2 mb-6">{subtitle}</div>
        )}

        {children}
      </div>
    </div>
  );
}
