"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "PARENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push(
      form.role === "PARENT"
        ? "/parent"
        : form.role === "STUDENT"
        ? "/student"
        : "/institute"
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">KAVACH AI</span>
        </div>

        <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-[#64748B] text-sm mb-6">
            Join KAVACH AI to protect your students
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "Rajesh Kumar" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
              { key: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  required
                  className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                I am a...
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Student</option>
                <option value="INSTITUTE_ADMIN">Institute Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[#64748B] text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
