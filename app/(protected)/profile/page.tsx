    "use client";

    import { useAuth } from "@/src/hooks/useAuth";
    import { useState } from "react";

    export default function ProfilePage() {
    const { username } = useAuth();
    const [form, setForm] = useState({
        username: username ?? "",
        email: "", // TODO: fetch actual email from backend
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
        const res = await fetch("http://localhost:4000/auth/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
            credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to update profile");

        alert("✅ Profile updated!");
        } catch (err) {
        console.error(err);
        alert("❌ Something went wrong updating profile");
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            </div>

            {/* Email */}
            <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            </div>

            {/* Password */}
            <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            </div>

            <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
            Save Changes
            </button>
        </form>
        </div>
    );
    }
