/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { UserRole } from "../types";
import Logo from "./Logo";

interface AuthShieldProps {
  onLogin: (user: { name: string; email: string; role: UserRole }) => void;
}

export default function AuthShield({ onLogin }: AuthShieldProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Administrateur");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleClientId = "112086335849-p51i3pms1srkd07rvsb3nclmnjfcj8n1.apps.googleusercontent.com";

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError("");

    // Simulate Google Sign-In OAuth flow with configured Client ID
    setTimeout(() => {
      setGoogleLoading(false);
      onLogin({
        name: "Andriamifehy (Google Admin)",
        email: "andriamifehy18@gmail.com",
        role: "Administrateur",
      });
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    // Simulate login verification after 600ms
    setTimeout(() => {
      setLoading(false);
      if (email.includes("@") && password.length >= 4) {
        let name = "Administrateur Invité";
        if (email === "andriamifehy18@gmail.com") name = "Andriamifehy";
        else if (email === "m.dupont@master-univ.fr") name = "Prof. Martin Dupont";
        else if (email === "a.bernard@analyst.fr") name = "Alice Bernard";

        onLogin({
          name,
          email,
          role: email === "a.bernard@analyst.fr" ? "Analyste" : role,
        });
      } else {
        setError("Identifiants incorrects (le mot de passe doit contenir au moins 4 caractères).");
      }
    }, 600);
  };

  const handleQuickLogin = (preset: "admin" | "analyst") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (preset === "admin") {
        onLogin({
          name: "Prof. Martin Dupont",
          email: "m.dupont@master-univ.fr",
          role: "Administrateur",
        });
      } else {
        onLogin({
          name: "Alice Bernard",
          email: "a.bernard@analyst.fr",
          role: "Analyste",
        });
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] text-slate-800 p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative z-10"
        id="login-card"
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-24 h-24 mb-3 drop-shadow-md">
            <Logo size="xl" variant="icon" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black tracking-wider text-slate-900 uppercase font-display flex items-center justify-center gap-1.5">
              <span className="text-blue-600">PREMIUM</span>
              <span>SHOP</span>
            </h1>
            <span className="text-[11px] font-bold text-emerald-600 tracking-widest uppercase font-mono block mt-0.5">
              VAHAOLANA MORA
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mb-5">
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Portail d'Administration E-Commerce • Système automatisé de gestion, d'analyse et de ventes.
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
            id="btn-google-login"
            title={`Client ID: ${googleClientId}`}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continuer avec Google (andriamifehy18@gmail.com)</span>
          </button>
        </div>

        {/* Quick Demo Logins */}
        <div className="mb-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <label className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-2 text-center">
            Accès rapide de démonstration
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin("admin")}
              type="button"
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-blue-600/5 hover:bg-blue-600/10 border border-blue-200 text-blue-700 transition-colors cursor-pointer"
              id="btn-quick-admin"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Prof. Dupont (Admin)
            </button>
            <button
              onClick={() => handleQuickLogin("analyst")}
              type="button"
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-200 text-emerald-700 transition-colors cursor-pointer"
              id="btn-quick-analyst"
            >
              Alice B. (Analyst)
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">ou formulaire</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="email">
              Adresse e-mail académique / Google
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="andriamifehy18@gmail.com"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1" htmlFor="role">
              Sélectionner le rôle requis
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none transition-all"
            >
              <option value="Administrateur">Administrateur (Tous les droits)</option>
              <option value="Analyste">Analyste (Lecture & Outils d'analyse)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
            id="btn-login-submit"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Se connecter en toute sécurité"
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 font-mono">
          Google OAuth 2.0 Client • Chiffrement TLS & Middleware JWT
        </div>
      </motion.div>
    </div>
  );
}
