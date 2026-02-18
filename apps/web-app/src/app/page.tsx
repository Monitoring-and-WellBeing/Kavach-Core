"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, GraduationCap, Building2 } from "lucide-react";
import { useToast, Toast } from "@/components/ui/Toast";

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const demoAccounts = [
    {
      role: "Student",
      email: "student@demo.com",
      icon: <GraduationCap size={20} />,
      href: "/student",
      color: "#7C3AED",
      desc: "Student Portal — Focus, Progress, Achievements",
    },
    {
      role: "Parent",
      email: "parent@demo.com",
      icon: <Users size={20} />,
      href: "/parent",
      color: "#2563EB",
      desc: "Parent Dashboard — Monitor, Control, Insights",
    },
    {
      role: "Institute Admin",
      email: "admin@demo.com",
      icon: <Building2 size={20} />,
      href: "/institute",
      color: "#059669",
      desc: "Institute Dashboard — All devices & students",
    },
  ];

  const handleLogin = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const routes: Record<string, string> = {
      "student@demo.com": "/student",
      "parent@demo.com": "/parent",
      "admin@demo.com": "/institute",
    };
    const route = routes[email];
    if (route && password === "demo123") {
      router.push(route);
    } else {
      showToast("Invalid credentials. Use demo accounts below.", "error");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0A0F1E" }}
    >
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            }}
          >
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-white text-3xl font-bold">KAVACH AI</h1>
          <p className="text-gray-400 mt-1">
            Student Safety & Digital Wellbeing
          </p>
        </div>

        {/* Login form */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* Demo accounts */}
        <div className="space-y-2">
          <p className="text-gray-500 text-xs text-center mb-3">
            — Quick Demo Access —
          </p>
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              onClick={() => router.push(acc.href)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-800/50 transition-all text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: acc.color }}
              >
                {acc.icon}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">
                  {acc.role}
                </div>
                <div className="text-gray-400 text-xs">{acc.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          Password for all demo accounts:{" "}
          <span className="text-gray-400 font-mono">demo123</span>
        </p>
      </div>
    </div>
  );
}
