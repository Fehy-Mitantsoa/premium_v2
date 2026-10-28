/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PhoneInput from '../components/PhoneInput';
import {
  User,
  Lock,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Languages,
  Type,
  Bell,
  Mail,
  Volume2,
  Info,
  FileText,
  HelpCircle,
  Star,
  Shield,
  Check,
  ChevronRight,
  Globe,
  Sliders,
  Loader2,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

// Translation dictionary
const t = {
  fr: {
    title: "Paramètres",
    subtitle: "Gérez vos préférences et votre compte",
    tabs: {
      account: "Compte",
      appearance: "Apparence",
      notifications: "Notifications",
      about: "À propos"
    },
    account: {
      title: "Gestion du Compte",
      editProfile: "Modifier le profil",
      name: "Nom complet",
      email: "Adresse e-mail",
      address: "Adresse de livraison",
      phone: "Numéro de téléphone",
      saveProfile: "Sauvegarder le profil",
      saving: "Enregistrement...",
      changePassword: "Changer le mot de passe",
      oldPassword: "Ancien mot de passe",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le nouveau mot de passe",
      savePassword: "Mettre à jour le mot de passe",
      logout: "Déconnexion",
      logoutDesc: "Déconnectez-vous de votre session en toute sécurité.",
      notLoggedIn: "Vous n'êtes pas connecté",
      notLoggedInDesc: "Connectez-vous pour modifier votre profil et votre mot de passe.",
      loginBtn: "Se connecter",
      logoutConfirmTitle: "Confirmer la déconnexion",
      logoutConfirmDesc: "Êtes-vous sûr de vouloir vous déconnecter de votre compte ?",
      cancel: "Annuler"
    },
    appearance: {
      title: "Apparence",
      theme: "Mode d'affichage",
      themeDesc: "Sélectionnez le thème visuel de l'application.",
      light: "Clair",
      dark: "Sombre",
      auto: "Automatique",
      language: "Langue",
      languageDesc: "Choisissez la langue de l'interface.",
      textSize: "Taille du texte",
      textSizeDesc: "Ajustez la taille de police pour une meilleure lisibilité.",
      small: "Petit",
      medium: "Moyen",
      large: "Grand"
    },
    notifications: {
      title: "Notifications",
      master: "Activer les notifications",
      masterDesc: "Recevoir des alertes système et des rappels importants.",
      email: "Notifications par e-mail",
      emailDesc: "Recevoir des récapitulatifs, offres spéciales et factures.",
      sounds: "Sons et vibrations",
      soundsDesc: "Jouer un son et vibrer lors des notifications d'événements."
    },
    about: {
      title: "À propos",
      version: "Version de l'application",
      terms: "Conditions d'utilisation",
      termsDesc: "Consultez nos conditions générales de vente et d'utilisation.",
      support: "Contacter le support",
      supportDesc: "Une question ou un problème ? Notre équipe est à votre écoute.",
      rate: "Évaluer l'application",
      rateDesc: "Partagez votre avis pour nous aider à nous améliorer !",
      rateSuccess: "Merci pour votre évaluation de {stars} étoiles !",
      supportTitle: "Contacter le support client",
      supportMessage: "Votre message",
      supportPlaceholder: "Décrivez votre problème ou posez votre question...",
      send: "Envoyer",
      sending: "Envoi...",
      supportSuccess: "Votre message a été envoyé au support client avec succès."
    }
  },
  en: {
    title: "Settings",
    subtitle: "Manage your preferences and account",
    tabs: {
      account: "Account",
      appearance: "Appearance",
      notifications: "Notifications",
      about: "About"
    },
    account: {
      title: "Account Management",
      editProfile: "Edit Profile",
      name: "Full Name",
      email: "Email Address",
      address: "Shipping Address",
      phone: "Phone Number",
      saveProfile: "Save Profile",
      saving: "Saving...",
      changePassword: "Change Password",
      oldPassword: "Old Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      savePassword: "Update Password",
      logout: "Log Out",
      logoutDesc: "Safely sign out of your session.",
      notLoggedIn: "You are not logged in",
      notLoggedInDesc: "Log in to edit your profile and password.",
      loginBtn: "Log In",
      logoutConfirmTitle: "Confirm Log Out",
      logoutConfirmDesc: "Are you sure you want to log out of your account?",
      cancel: "Cancel"
    },
    appearance: {
      title: "Appearance",
      theme: "Display Theme",
      themeDesc: "Choose the visual theme of the application.",
      light: "Light",
      dark: "Dark",
      auto: "Automatic",
      language: "Language",
      languageDesc: "Choose interface language.",
      textSize: "Text Size",
      textSizeDesc: "Adjust the font size for better readability.",
      small: "Small",
      medium: "Medium",
      large: "Large"
    },
    notifications: {
      title: "Notifications",
      master: "Enable Notifications",
      masterDesc: "Receive system alerts and important reminders.",
      email: "Email Notifications",
      emailDesc: "Receive newsletters, special offers, and invoices.",
      sounds: "Sounds and Vibrations",
      soundsDesc: "Play sound and vibrate on notification events."
    },
    about: {
      title: "About",
      version: "Application Version",
      terms: "Terms of Service",
      termsDesc: "Read our general terms of sales and service guidelines.",
      support: "Contact Support",
      supportDesc: "Question or concern? Our team is here to assist you.",
      rate: "Rate the App",
      rateDesc: "Share your rating to help us improve the experience!",
      rateSuccess: "Thank you for your {stars}-star rating!",
      supportTitle: "Contact Customer Support",
      supportMessage: "Your Message",
      supportPlaceholder: "Describe your issue or ask your question here...",
      send: "Send",
      sending: "Sending...",
      supportSuccess: "Your message has been sent to support successfully."
    }
  }
};

export default function Settings() {
  const { user, logout, updateProfile, showToast, preferences, updatePreferences } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'notifications' | 'about'>('account');
  const lang = preferences.language === 'en' ? 'en' : 'fr';
  const currT = t[lang];

  // Profile forms state
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password forms state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Modals / Overlays
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  // Interactive rating
  const [userRating, setUserRating] = useState<number>(0);

  // Sync user properties if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAddress(user.address || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(lang === 'fr' ? 'Le nom est requis.' : 'Name is required.', 'error');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      await updateProfile(name.trim(), address.trim(), phone.trim());
    } catch (err) {
      // toast shown in context
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast(lang === 'fr' ? 'Le nouveau mot de passe est requis.' : 'New password is required.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.', 'error');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      const res = await api.put('/api/auth/change-password', { oldPassword, newPassword });
      showToast(res.data.message || (lang === 'fr' ? 'Mot de passe modifié.' : 'Password updated.'), 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || (lang === 'fr' ? 'Erreur lors de la modification.' : 'Error updating password.');
      showToast(errMsg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    setLogoutModalOpen(false);
    await logout();
    showToast(lang === 'fr' ? 'Déconnexion réussie.' : 'Log out successful.', 'success');
    navigate('/');
  };

  // Support Message Submission
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    try {
      setIsSendingSupport(true);
      // Simulate API support submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast(currT.about.supportSuccess, 'success');
      setSupportMessage('');
      setSupportModalOpen(false);
    } catch (err) {
      showToast(lang === 'fr' ? 'Erreur de connexion.' : 'Network error.', 'error');
    } finally {
      setIsSendingSupport(false);
    }
  };

  // Handle rating star clicks
  const handleRate = (stars: number) => {
    setUserRating(stars);
    showToast(currT.about.rateSuccess.replace('{stars}', stars.toString()), 'success');
  };

  // Toggle Switch subcomponent for Android-style feel
  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Settings Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          {currT.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {currT.subtitle}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Sidebar/Rail */}
        <div className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-2.5 shadow-sm space-y-1">
          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'account'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <User className="w-5 h-5" />
              {currT.tabs.account}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'appearance'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Languages className="w-5 h-5" />
              {currT.tabs.appearance}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              {currT.tabs.notifications}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'about'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Info className="w-5 h-5" />
              {currT.tabs.about}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>

        {/* Content Panel Area */}
        <div className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-3">
                {currT.account.title}
              </h2>

              {!user ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{currT.account.notLoggedIn}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      {currT.account.notLoggedInDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/login?redirect=/settings')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none"
                  >
                    {currT.account.loginBtn}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* EDIT PROFILE FORM */}
                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      {currT.account.editProfile}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                          {currT.account.name}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                          {currT.account.email}
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full bg-slate-100 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                        {currT.account.address}
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                        {currT.account.phone}
                      </label>
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        inputClassName="py-2.5 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                    >
                      {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                      {currT.account.saveProfile}
                    </button>
                  </form>

                  {/* CHANGE PASSWORD FORM */}
                  <form onSubmit={handlePasswordSubmit} className="space-y-5 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      {currT.account.changePassword}
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                          {currT.account.oldPassword}
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                            {currT.account.newPassword}
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                            {currT.account.confirmPassword}
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                    >
                      {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                      {currT.account.savePassword}
                    </button>
                  </form>

                  {/* LOGOUT */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-rose-600 dark:text-rose-400">{currT.account.logout}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {currT.account.logoutDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(true)}
                      className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm py-2.5 px-5 rounded-xl transition-all border border-rose-100 dark:border-rose-900/30 self-start"
                    >
                      {currT.account.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-3">
                {currT.appearance.title}
              </h2>

              {/* 1. Theme selection */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-emerald-500" />
                    {currT.appearance.theme}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {currT.appearance.themeDesc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <button
                    onClick={() => updatePreferences({ themeMode: 'light' })}
                    className={`flex flex-col items-center gap-2 p-3.5 border rounded-2xl font-medium transition-all ${
                      preferences.themeMode === 'light'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs">{currT.appearance.light}</span>
                  </button>

                  <button
                    onClick={() => updatePreferences({ themeMode: 'dark' })}
                    className={`flex flex-col items-center gap-2 p-3.5 border rounded-2xl font-medium transition-all ${
                      preferences.themeMode === 'dark'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs">{currT.appearance.dark}</span>
                  </button>

                  <button
                    onClick={() => updatePreferences({ themeMode: 'auto' })}
                    className={`flex flex-col items-center gap-2 p-3.5 border rounded-2xl font-medium transition-all ${
                      preferences.themeMode === 'auto'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <Laptop className="w-5 h-5" />
                    <span className="text-xs">{currT.appearance.auto}</span>
                  </button>
                </div>
              </div>

              {/* 2. Language selection */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    {currT.appearance.language}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {currT.appearance.languageDesc}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    onClick={() => updatePreferences({ language: 'fr' })}
                    className={`flex items-center gap-3 p-3 border rounded-2xl font-medium transition-all ${
                      preferences.language === 'fr'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">🇫🇷</span>
                    <span className="text-xs font-semibold">Français</span>
                    {preferences.language === 'fr' && <Check className="w-4 h-4 ml-auto text-emerald-600 dark:text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => updatePreferences({ language: 'en' })}
                    className={`flex items-center gap-3 p-3 border rounded-2xl font-medium transition-all ${
                      preferences.language === 'en'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-xs font-semibold">English</span>
                    {preferences.language === 'en' && <Check className="w-4 h-4 ml-auto text-emerald-600 dark:text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* 3. Text Size */}
              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-500" />
                    {currT.appearance.textSize}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {currT.appearance.textSizeDesc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <button
                    onClick={() => updatePreferences({ textSize: 'small' })}
                    className={`p-3.5 border rounded-2xl font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                      preferences.textSize === 'small'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="text-[12px] font-bold">A</span>
                    <span className="text-xs">{currT.appearance.small}</span>
                  </button>

                  <button
                    onClick={() => updatePreferences({ textSize: 'medium' })}
                    className={`p-3.5 border rounded-2xl font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                      preferences.textSize === 'medium'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="text-[15px] font-bold">A</span>
                    <span className="text-xs">{currT.appearance.medium}</span>
                  </button>

                  <button
                    onClick={() => updatePreferences({ textSize: 'large' })}
                    className={`p-3.5 border rounded-2xl font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                      preferences.textSize === 'large'
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="text-[18px] font-bold">A</span>
                    <span className="text-xs">{currT.appearance.large}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-3">
                {currT.notifications.title}
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-slate-700 space-y-5">
                {/* 1. Master push notifications switch */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-500" />
                      {currT.notifications.master}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {currT.notifications.masterDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preferences.notificationsEnabled}
                    onChange={(val) => updatePreferences({ notificationsEnabled: val })}
                  />
                </div>

                {/* 2. Email notifications switch */}
                <div className="flex items-center justify-between gap-4 pt-5">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      {currT.notifications.email}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {currT.notifications.emailDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preferences.emailNotifications}
                    onChange={(val) => updatePreferences({ emailNotifications: val })}
                  />
                </div>

                {/* 3. Sounds vibrations switch */}
                <div className="flex items-center justify-between gap-4 pt-5">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-500" />
                      {currT.notifications.sounds}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {currT.notifications.soundsDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={preferences.soundsVibrations}
                    onChange={(val) => updatePreferences({ soundsVibrations: val })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white border-b border-slate-50 dark:border-slate-700 pb-3">
                {currT.about.title}
              </h2>

              <div className="divide-y divide-slate-100 dark:divide-slate-700 space-y-6">
                {/* 1. App Version */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currT.about.version}</h3>
                      <p className="text-xs text-slate-400">v1.2.4 (Android Ready)</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                    Production
                  </span>
                </div>

                {/* 2. Terms */}
                <div className="flex items-center justify-between pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currT.about.terms}</h3>
                      <p className="text-xs text-slate-400">{currT.about.termsDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTermsModalOpen(true)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* 3. Support contact */}
                <div className="flex items-center justify-between pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currT.about.support}</h3>
                      <p className="text-xs text-slate-400">{currT.about.supportDesc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSupportModalOpen(true)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* 4. Rate App */}
                <div className="space-y-3 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-500 dark:text-slate-400">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currT.about.rate}</h3>
                      <p className="text-xs text-slate-400">{currT.about.rateDesc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-12">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        className="transition-transform active:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= userRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRM LOGOUT MODAL */}
      <AnimatePresence>
        {logoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currT.account.logoutConfirmTitle}
                </h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {currT.account.logoutConfirmDesc}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  {currT.account.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  {currT.account.logout}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TERMS OF USE MODAL */}
      <AnimatePresence>
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  {currT.about.terms}
                </h3>
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {lang === 'fr' ? "Bienvenue sur notre plateforme e-commerce." : "Welcome to our e-commerce platform."}
                </p>
                <p>
                  {lang === 'fr'
                    ? "1. Utilisation du service : En accédant à cette application, vous acceptez nos présentes conditions d'utilisation et vous engagez à respecter les lois locales en vigueur."
                    : "1. Service Usage: By accessing this application, you agree to these terms of service and commit to respecting active local laws."}
                </p>
                <p>
                  {lang === 'fr'
                    ? "2. Confidentialité des données : Nous mettons tout en œuvre pour sécuriser vos données personnelles, y compris vos coordonnées bancaires, numéros de téléphone et adresses de livraison."
                    : "2. Data Privacy: We implement strong mechanisms to secure your personal data, including billing options, phone numbers, and shipping addresses."}
                </p>
                <p>
                  {lang === 'fr'
                    ? "3. Responsabilités : L'application décline toute responsabilité en cas d'interruption temporaire de service ou de problème technique indépendant de notre volonté."
                    : "3. Liabilities: The application declines any responsibility for temporary service interruptions or external network technical errors."}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2 px-5 rounded-xl transition-all"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPPORT FORM MODAL */}
      <AnimatePresence>
        {supportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-500" />
                  {currT.about.supportTitle}
                </h3>
                <button
                  onClick={() => setSupportModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                    {currT.about.supportMessage}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={currT.about.supportPlaceholder}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    {currT.account.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSupport || !supportMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm py-2 px-5 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                  >
                    {isSendingSupport && <Loader2 className="w-4 h-4 animate-spin" />}
                    {currT.about.send}
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
