// app/auth/register/RegisterPageContent.tsx
"use client";

import { useState } from "react";
import AuthCard from "@/src/components/AuthCard";

export default function RegisterPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: "include", // ⚠️ future-proof if cookies are used
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Account created successfully!");
        window.location.href = "/auth/login";
      } else {
        alert(`❌ ${data.error || "Registration failed"}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong, please try again.");
    }
  };

  return (
    <AuthCard
      title="Register"
      subtitle={
        <span>
          Already have an account?{" "}
          <a href="/auth/login" className="text-brand-red hover:underline">
            Sign in
          </a>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none text-gray-900 placeholder-gray-400"
            placeholder="Enter your email"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none pr-10 text-gray-900 placeholder-gray-400"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none text-gray-900 placeholder-gray-400"
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-brand-red text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Register
        </button>
      </form>
    </AuthCard>
  );
}
