/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  LogOut, 
  Menu, 
  X,
  Compass,
  AlertCircle,
  Loader2,
  Bell,
  CheckCircle,
  Info,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
  Settings,
  Package,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import Logo from './Logo';

export default function Navbar() {
  const { user, cart, wishlist, logout, showToast, isDarkMode, toggleDarkMode } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Logout modal states
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Vous avez été déconnecté avec succès.', 'success');
      setTimeout(() => {
        setIsLoggingOut(false);
        setLogoutModalOpen(false);
        navigate('/login');
      }, 800);
    } catch (e) {
      setIsLoggingOut(false);
      showToast('Erreur lors de la déconnexion.', 'error');
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Logo size="md" variant="horizontal" linkToHome={true} />

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-5">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Accueil
              </Link>
              <Link to="/products" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                Nos Produits
              </Link>
              <Link to="/track" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Suivre ma commande</span>
              </Link>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Rechercher un produit, une marque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Action Icons */}
          <div className="flex items-center gap-4">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title={isDarkMode ? "Passer au mode clair" : "Passer au mode sombre"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wishlist */}
            <Link to="/products?wishlist=true" className="relative p-2 text-slate-600 hover:text-rose-500 transition-colors" title="Favoris">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors" title="Panier">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative p-2 text-slate-600 hover:text-emerald-600 transition-colors" 
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-100 bg-white dark:bg-slate-800 shadow-2xl py-0 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800">Notifications</h3>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 hover:text-emerald-700"
                          >
                            Tout marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">Aucune notification pour le moment</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notifications.slice(0, 10).map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 flex gap-3 group transition-colors ${notif.isRead ? 'bg-white opacity-70 hover:opacity-100' : 'bg-emerald-50/30'}`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                {notif.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                                {notif.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm mb-0.5 ${notif.isRead ? 'text-slate-600' : 'text-slate-900 font-bold'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-slate-500 break-words line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                                  {new Date(notif.createdAt).toLocaleString('fr-FR', {
                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="shrink-0 flex flex-col justify-start items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notif.isRead && (
                                  <button 
                                    onClick={() => markAsRead(notif.id)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded bg-slate-50 hover:bg-emerald-50"
                                    title="Marquer comme lu"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteNotification(notif.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded bg-slate-50 hover:bg-rose-50"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="border-t border-slate-100 p-2 bg-slate-50">
                        <Link 
                          to="/notifications" 
                          onClick={() => setNotifDropdownOpen(false)}
                          className="block w-full text-center text-xs font-bold text-slate-600 hover:text-emerald-600 py-2 transition-colors"
                        >
                          Voir tout l'historique
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-50 border border-slate-100 text-slate-700 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">{user.name.split(' ')[0]}</span>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-50">
                        <p className="text-xs text-slate-400 font-mono">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.role === 'admin' && (
                          <span className="inline-block mt-1 text-[9px] font-extrabold tracking-wider uppercase font-mono bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Mon Profil & Commandes
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setLogoutModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border-t border-slate-50 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 hidden sm:inline-block"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors px-3.5 py-1.5 rounded-lg shadow-sm"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-emerald-600 transition-colors md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-4 px-6 space-y-4 shadow-inner">
          {/* Search Bar Mobile */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Navigation Links Mobile */}
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-700 hover:text-emerald-600 py-1 transition-colors"
            >
              Accueil
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-700 hover:text-emerald-600 py-1 transition-colors"
            >
              Nos Produits
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium text-slate-700 hover:text-emerald-600 py-1 transition-colors"
            >
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Suivre ma commande
            </Link>
            <Link
              to="/payment"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium text-slate-700 hover:text-emerald-600 py-1 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Paiement Mobile Money
            </Link>
            <Link
              to="/products?wishlist=true"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium text-slate-700 hover:text-rose-500 py-1 transition-colors"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              Favoris ({wishlistCount})
            </Link>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-base font-medium text-slate-700 hover:text-emerald-600 py-1 transition-colors"
            >
              <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Paramètres
            </Link>
            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="flex items-center gap-2 text-base font-medium text-rose-600 hover:text-rose-700 py-1 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {logoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Confirmer la déconnexion</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogoutModalOpen(false)}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-rose-200"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Déconnexion...
                    </>
                  ) : (
                    'Se déconnecter'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
