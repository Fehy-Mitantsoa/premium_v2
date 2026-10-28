/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Login() {
  const { login, user, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Simulated password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Forgot password states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Check if redirect query exists
  const redirect = searchParams.get('redirect') || '/';
  const autoAdmin = searchParams.get('admin') === 'true';

  useEffect(() => {
    if (autoAdmin) {
      setEmail('admin@ecommerce.com');
    }
  }, [autoAdmin]);

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('L\'adresse email est requise.', 'error');
      return;
    }

    try {
      setLoading(true);
      setUnverifiedEmail(null);
      await login(email.trim(), password);
    } catch (err: any) {
      if (err.response?.data?.emailUnverified) {
        setUnverifiedEmail(err.response.data.email || email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Veuillez renseigner votre email.', 'error');
      return;
    }

    setResetSubmitting(true);
    setTimeout(() => {
      showToast(`Instructions de réinitialisation envoyées à : ${resetEmail}`, 'success');
      setResetSubmitting(false);
      setForgotPasswordOpen(false);
      setResetEmail('');
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6 py-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm space-y-8">

      {/* Logo & Title */}
      <div className="text-center space-y-3">
        <Logo size="lg" variant="badge" linkToHome={true} />
        <h2 className="text-xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white pt-2">
          Connexion E-Commerce
        </h2>
        <p className="text-xs text-slate-400">
          Connectez-vous pour finaliser vos achats d'exception ou gérer la boutique.
        </p>
      </div>

      {unverifiedEmail && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-sm space-y-2">
          <div className="font-semibold flex items-center gap-2">
            <span>⚠️</span> Email non vérifié
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Votre inscription nécessite la confirmation du code à 6 chiffres envoyé à <strong className="underline">{unverifiedEmail}</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Saisir mon code de vérification →
          </button>
        </div>
      )}

      {/* Social Logins */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block text-center">
          Connexion Instantanée en 1-Clic
        </label>
        <GoogleAuthButton mode="signin" text="Se connecter avec Google" />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 border-t border-slate-100 dark:border-slate-700" />
        <span className="bg-white dark:bg-slate-800 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
          Ou Formulaire Email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Adresse Email
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="votre@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Connexion...' : 'Se Connecter'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Navigation Inscription */}
      <p className="text-center text-xs text-slate-400">
        Vous n'avez pas encore de compte ?{' '}
        <Link to="/register" className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold">
          Créez un compte client
        </Link>
      </p>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl space-y-6 text-left border border-slate-100 dark:border-slate-700"
            >
              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-slate-900 text-lg">
                  Mot de passe oublié ?
                </h3>
                <p className="text-xs text-slate-400">
                  Saisissez l'adresse email associée à votre compte pour recevoir un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sophie@exemple.fr"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-1/2 bg-slate-900 hover:bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md"
                  >
                    {resetSubmitting ? 'Envoi...' : 'Réinitialiser'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
