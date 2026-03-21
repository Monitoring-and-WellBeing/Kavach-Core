"use client";

import { useState } from "react";
import { Shield, Loader2, Eye, EyeOff, Building2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RoleType = "INSTITUTE_ADMIN" | "PARENT";

export default function SignupPage() {
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RoleType>("INSTITUTE_ADMIN");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    instituteName: "",
    instituteType: "SCHOOL",
    city: "",
    state: "",
  });

  const isInstitute = role === "INSTITUTE_ADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup({
        role,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        instituteName: isInstitute ? form.instituteName : undefined,
        instituteType: isInstitute ? form.instituteType : undefined,
        city: form.city || undefined,
        state: form.state || undefined,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const inputClass =
    "w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors text-sm";

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">KAVACH AI</span>
        </div>

        <div className="bg-[#0F1629] border border-[#1E2A45] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-[#64748B] text-sm mb-6">
            Choose your account type to get started
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole("PARENT")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === "PARENT"
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-[#1E2A45] bg-[#0A0F1E] hover:border-[#2A3A55]"
              }`}
            >
              <Users className={`w-6 h-6 ${role === "PARENT" ? "text-teal-400" : "text-[#64748B]"}`} />
              <div>
                <div className={`text-sm font-semibold ${role === "PARENT" ? "text-teal-300" : "text-[#94A3B8]"}`}>
                  Parent
                </div>
                <div className="text-xs text-[#475569]">Monitor your child</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("INSTITUTE_ADMIN")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                isInstitute
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#1E2A45] bg-[#0A0F1E] hover:border-[#2A3A55]"
              }`}
            >
              <Building2 className={`w-6 h-6 ${isInstitute ? "text-blue-400" : "text-[#64748B]"}`} />
              <div>
                <div className={`text-sm font-semibold ${isInstitute ? "text-blue-300" : "text-[#94A3B8]"}`}>
                  Institute
                </div>
                <div className="text-xs text-[#475569]">School / Coaching</div>
              </div>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Account Details
            </p>

            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Full Name *
              </label>
              <input id="signup-name" type="text" value={form.name} onChange={set("name")}
                placeholder="Rajesh Kumar" required className={inputClass} />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Email *
              </label>
              <input id="signup-email" type="email" value={form.email} onChange={set("email")}
                placeholder={isInstitute ? "admin@institute.com" : "parent@email.com"}
                required className={inputClass} />
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Phone
              </label>
              <input id="signup-phone" type="tel" value={form.phone} onChange={set("phone")}
                placeholder="+91 98765 43210" className={inputClass} />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input id="signup-password" type={showPassword ? "text" : "password"}
                  value={form.password} onChange={set("password")}
                  placeholder="Min 8 characters" required minLength={8}
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Institute-only fields */}
            {isInstitute && (
              <>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-2">
                  Institute Details
                </p>

                <div>
                  <label htmlFor="signup-institute-name" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                    Institute Name *
                  </label>
                  <input id="signup-institute-name" type="text" value={form.instituteName}
                    onChange={set("instituteName")} placeholder="Sunrise Academy"
                    required={isInstitute} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="signup-institute-type" className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                    Institute Type *
                  </label>
                  <select id="signup-institute-type" value={form.instituteType}
                    onChange={set("instituteType")} className={inputClass}>
                    <option value="SCHOOL">School</option>
                    <option value="COACHING">Coaching Institute</option>
                    <option value="TRAINING">Training Center</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="signup-city" className="block text-sm font-medium text-[#94A3B8] mb-1.5">City</label>
                    <input id="signup-city" type="text" value={form.city} onChange={set("city")}
                      placeholder="Lucknow" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="signup-state" className="block text-sm font-medium text-[#94A3B8] mb-1.5">State</label>
                    <input id="signup-state" type="text" value={form.state} onChange={set("state")}
                      placeholder="UP" className={inputClass} />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2 ${
                isInstitute
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : `Create ${isInstitute ? "Institute" : "Parent"} Account`}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-[#64748B] text-sm">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
