"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const { login } = useAuth();

  const showDemoCredentials = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";

  const [email, setEmail] = useState(
    showDemoCredentials && roleParam === "parent"
      ? "parent@demo.com"
      : showDemoCredentials && roleParam === "student"
      ? "student@demo.com"
      : showDemoCredentials && roleParam === "institute"
      ? "admin@demo.com"
      : ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Must be BEFORE any await
    setError("");
    try {
      await login(email, password);
      // AuthContext.login() handles token storage and redirect
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">KAVACH AI</span>
        </div>

        {/* Card */}
        <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-[#64748B] text-sm mb-6">
            Sign in to your KAVACH AI account
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo credentials hint — only rendered when NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true */}
          {showDemoCredentials && (
          <div className="mt-6 pt-6 border-t border-[#1E2A45]">
            <p className="text-xs text-[#64748B] mb-3 font-medium uppercase tracking-wide">
              Demo Credentials
            </p>
            <div className="flex flex-col gap-2">
              {[
                { email: "parent@demo.com", role: "parent" },
                { email: "student@demo.com", role: "student" },
                { email: "admin@demo.com", role: "institute" },
              ].map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => {
                    setEmail(c.email);
                    setPassword("demo123");
                  }}
                  className="text-left text-xs px-3 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg hover:border-blue-500 transition-colors"
                >
                  <span className="text-[#94A3B8] capitalize">{c.role}:</span>{" "}
                  <span className="text-blue-400">{c.email}</span>{" "}
                  <span className="text-[#64748B]">/ demo123</span>
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        <p className="text-center mt-4 text-[#64748B] text-sm">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-400 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
