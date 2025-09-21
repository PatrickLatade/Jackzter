"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/hooks/useAuth";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { SocketProvider } from "@/src/context/SocketContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/src/components/Avatar";

interface ProtectedLayoutProps {
  children: ReactNode;
}

// This component now safely uses useAuth() inside AuthProvider
function LayoutContent({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleCopy = () => {
    if (user?.uniqueId) {
      navigator.clipboard.writeText(user.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000); // hide after 1s
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (dropdownOpen) closeDropdown();
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-foreground/20 bg-background">
        <h1
          className="text-xl font-bold text-brand-red cursor-pointer"
          onClick={() => router.push("/chat")} // replace with your chat page path
        >
          JackZer
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <span
              className="font-medium cursor-pointer"
              onClick={handleCopy}
            >
              {user ? `Welcome, ${user.username}` : "Welcome"}
            </span>

            {/* Hover tooltip: show uniqueId */}
            {user?.uniqueId && !copied && (
              <span
                className="absolute left-1/2 -translate-x-1/2 mt-1
                          hidden group-hover:block px-2 py-1 text-xs text-white bg-black rounded-md shadow-lg z-50"
              >
                {user.uniqueId}
              </span>
            )}

            {/* Click feedback tooltip */}
            {copied && (
              <span
                className="absolute left-1/2 -translate-x-1/2 mt-1
                          px-2 py-1 text-xs text-white bg-green-600 rounded-md shadow-lg z-50 animate-fade-out"
              >
                Copied!
              </span>
            )}
          </div>

          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              onClick={() => (dropdownOpen ? closeDropdown() : setDropdownOpen(true))}
              className="w-10 h-10 rounded-full bg-brand-red text-brand-white flex items-center justify-center font-bold
                        transition transform hover:bg-brand-red/90 hover:scale-105 hover:shadow-lg hover:shadow-brand-red/40 
                        active:scale-95 cursor-pointer overflow-hidden"
            >
            <Avatar src={user?.profile?.profilePicture} username={user?.username || "User"} />
            </button>

            {(dropdownOpen || isClosing) && (
              <div
                className={`absolute right-0 z-50 mt-2 w-40 rounded-lg bg-background border border-foreground/20 
                            shadow-lg origin-top-right transition-all duration-200 ease-out
                            ${isClosing ? "animate-dropdown-close" : "animate-dropdown"}`}
                style={{ top: "100%" }}
              >
                <ul className="text-sm">
                  <li>
                    <Link
                      href="/profile"
                      onClick={closeDropdown}
                      className="block px-4 py-2 hover:bg-foreground/10 cursor-pointer"
                    >
                      Profile
                    </Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-foreground/10 cursor-pointer">Settings</li>
                  <li
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-foreground/10 cursor-pointer text-brand-red"
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SocketProvider> {/* ← wrap layout with SocketProvider */}
          <LayoutContent>{children}</LayoutContent>
        </SocketProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
