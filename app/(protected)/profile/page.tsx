"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    oldPassword: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" })); // clear field error when typing
    setGeneralError("");
  };

  interface ValidationError {
    field: string;
    message: string;
  }

  interface UpdateUserError {
    errors?: ValidationError[];
    message?: string;
  }

  // Decide if current password is required
  useEffect(() => {
    const emailChanged = form.email !== (user?.email ?? "");
    const passwordChanged = form.newPassword.trim() !== "";
    setRequiresPassword(emailChanged || passwordChanged);
  }, [form.email, form.newPassword, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    if (requiresPassword && !form.oldPassword.trim()) {
      setErrors((prev) => ({
        ...prev,
        oldPassword: "Current password is required",
      }));
      return;
    }

    try {
      await updateUser({
        username: form.username,
        email: form.email,
        oldPassword: form.oldPassword || undefined,
        newPassword: form.newPassword || undefined,
      });

      alert("✅ Profile updated!");
      setForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" })); // clear password fields
    } catch (err) {
      const error = err as UpdateUserError;

      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((e) => {
          fieldErrors[e.field] = e.message;
        });
        setErrors(fieldErrors);
      } else if (error.message) {
        setGeneralError(error.message);
      } else {
        setGeneralError("Something went wrong updating profile");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* General error */}
      {generalError && (
        <div className="mb-4 text-red-600 text-sm font-medium">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.username
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Old Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Current Password {requiresPassword && <span className="text-red-500">*</span>}
          </label>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.oldPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {errors.oldPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.oldPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.newPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={requiresPassword && !form.oldPassword.trim()}
          className={`px-4 py-2 rounded-md transition-colors ${
            requiresPassword && !form.oldPassword.trim()
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
