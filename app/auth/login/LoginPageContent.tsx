// app/auth/login/LoginPageContent.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import AuthCard from "@/src/components/AuthCard";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPageContent() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);  // ✅ uses context
      setMessage("✅ Logged in!");

      // ✅ redirect to dashboard/chat
      router.push("/chat"); 
    } catch (err) {
      setMessage("❌ Invalid email or password");
      console.error(err);
    }
  };

  return (
    <AuthCard
      title="Login"
      subtitle={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-brand-red hover:underline">
            Register here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-red text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Login
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-900 placeholder-gray-400">
          {message}
        </p>
      )}
    </AuthCard>
  );
}
