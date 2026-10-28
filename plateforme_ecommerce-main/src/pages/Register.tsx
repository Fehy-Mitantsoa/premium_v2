/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PhoneInput from "../components/PhoneInput";
import { Mail, User, Phone, MapPin, ArrowRight, Lock, CheckCircle2, AlertCircle, Building2, User2, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import GoogleAuthButton from '../components/GoogleAuthButton';

const validateEmailDomain = (emailStr: string): { isValid: boolean; message: string; type?: 'personal' | 'business' } => {
  if (!emailStr) {
    return { isValid: false, message: '' };
  }
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) {
    return { isValid: false, message: "Format d'adresse e-mail incorrect (ex: sophie@domaine.com)." };
  }

  // Split parts
  const parts = emailStr.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: "L'adresse e-mail doit contenir un seul caractère '@'." };
  }

  const domain = parts[1].toLowerCase();
  
  // Check domain structure
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return { isValid: false, message: "Le domaine doit inclure une extension (ex: .com, .fr)." };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, message: `L'extension du domaine (.${tld}) n'est pas valide.` };
  }

  // Regex check for domain name containing valid characters
  const domainRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { isValid: false, message: "Le domaine contient des caractères spéciaux non autorisés." };
  }

  // List of common personal email providers
  const personalDomains = [
    'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'hotmail.fr', 'yahoo.fr',
    'icloud.com', 'orange.fr', 'sfr.fr', 'free.fr', 'laposte.net', 'wanadoo.fr', 'live.fr',
    'aol.com', 'protonmail.com', 'proton.me', 'gmx.com', 'gmx.fr', 'zoho.com', 'mail.com',
    'outlook.fr', 'live.com', 'msn.com', 'yandex.com'
  ];

  if (personalDomains.includes(domain)) {
    return { isValid: true, message: "Domaine de messagerie personnel (Gmail, Outlook...)", type: 'personal' };
  } else {
    return { isValid: true, message: "Domaine de messagerie professionnel / d'entreprise", type: 'business' };
  }
};

export default function Register() {
  const { register, user, showToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailStatus, setEmailStatus] = useState<{
    isValid: boolean;
    message: string;
    type?: 'personal' | 'business';
  } | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!email.trim()) {
      setEmailStatus(null);
      return;
    }
    const validation = validateEmailDomain(email.trim());
    setEmailStatus(validation);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Le nom complet et l\'adresse email sont obligatoires.', 'error');
      return;
    }

    const validation = validateEmailDomain(email.trim());
    if (!validation.isValid) {
      showToast(validation.message || 'L\'adresse email est invalide.', 'error');
      return;
    }

    if (!password) {
      showToast('Le mot de passe est obligatoire.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await register(name.trim(), email.trim(), address.trim(), phone.trim(), password);
      if (res && res.requireVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(res.email || email.trim())}`);
      } else {
        showToast('Bienvenue ! Votre Assistant IA est disponible sur la page d\'accueil.', 'info');
      }
    } catch (e) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6 py-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm space-y-6">
      
      {/* Logo & Title */}
      <div className="text-center space-y-3">
        <Logo size="lg" variant="badge" linkToHome={true} />
        <h2 className="text-xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
          Créer un Compte Client
        </h2>
        <p className="text-xs text-slate-400">
          Rejoignez Premium Shop pour suivre vos commandes et gérer vos favoris.
        </p>
      </div>

      {/* Google Fast Registration */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block text-center">
          Inscription Rapide en 1-Clic
        </label>
        <GoogleAuthButton mode="signup" text="S'inscrire avec Google" />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 border-t border-slate-100 dark:border-slate-700" />
        <span className="bg-white dark:bg-slate-800 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">
          Ou Remplir le Formulaire
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Nom Complet *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="ex: Sophie Martin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Adresse Email *
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="sophie@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl py-2.5 pl-10 pr-10 text-xs focus:outline-none focus:bg-white dark:bg-slate-800 text-slate-800 transition-all ${
                emailStatus === null
                  ? 'border-slate-200 focus:border-emerald-500'
                  : emailStatus.isValid
                  ? 'border-emerald-200 bg-emerald-50/10 focus:border-emerald-500'
                  : 'border-rose-200 bg-rose-50/10 focus:border-rose-500'
              }`}
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            
            {/* Dynamic end icon for real-time validation */}
            {emailStatus && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailStatus.isValid ? (
                  emailStatus.type === 'personal' ? (
                    <User2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Building2 className="w-4 h-4 text-sky-500" />
                  )
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                )}
              </div>
            )}
          </div>

          {/* Validation Feedback message */}
          {emailStatus && (
            <div className={`flex items-center gap-1.5 px-1 mt-1 text-[11px] font-medium transition-all duration-200 ${
              emailStatus.isValid 
                ? emailStatus.type === 'personal' 
                  ? 'text-emerald-600' 
                  : 'text-sky-600'
                : 'text-rose-600'
            }`}>
              {emailStatus.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{emailStatus.message}</span>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Mot de passe *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="•••••••• (au moins 6 caractères)"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Confirmer le mot de passe *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Téléphone
          </label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            inputClassName="py-2.5 text-xs font-mono"
          />
        </div>

        {/* Shipping Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Adresse de livraison par défaut
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ex: 45 Avenue des Champs-Élysées, 75008 Paris"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? 'Création de compte...' : 'Créer mon compte'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Navigation Connexion */}
      <p className="text-center text-xs text-slate-400">
        Vous possédez déjà un compte ?{' '}
        <Link to="/login" className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold">
          Connectez-vous
        </Link>
      </p>

    </div>
  );
}
