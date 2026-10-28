/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, Product, CartItem, Coupon } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserPreferences {
  themeMode: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  textSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  soundsVibrations: boolean;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  wishlist: Product[];
  toasts: Toast[];
  loading: boolean;
  coupon: Coupon | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, address?: string, phone?: string, password?: string) => Promise<{ requireVerification?: boolean; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<string>;
  loginWithGoogle: (payload: { credential?: string; accessToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, address?: string, phone?: string) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string, subtotal: number) => Promise<void>;
  removeCoupon: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshUser: () => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('user_preferences');
    if (saved) {
      try {
        return {
          themeMode: 'auto',
          language: 'fr',
          textSize: 'medium',
          notificationsEnabled: true,
          emailNotifications: true,
          soundsVibrations: true,
          ...JSON.parse(saved)
        };
      } catch (e) {
        console.error('Error parsing user preferences', e);
      }
    }
    return {
      themeMode: 'auto',
      language: 'fr',
      textSize: 'medium',
      notificationsEnabled: true,
      emailNotifications: true,
      soundsVibrations: true,
    };
  });

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('user_preferences', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync theme based on themeMode
  useEffect(() => {
    const applyTheme = () => {
      const mode = preferences.themeMode;
      let shouldBeDark = false;
      if (mode === 'dark') {
        shouldBeDark = true;
      } else if (mode === 'light') {
        shouldBeDark = false;
      } else {
        // auto
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    applyTheme();

    if (preferences.themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [preferences.themeMode]);

  // Sync text size base font size dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${preferences.textSize}`);
  }, [preferences.textSize]);

  // Initialize state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedCart = localStorage.getItem('cart');
    const storedWishlist = localStorage.getItem('wishlist');

    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    if (storedCart && storedCart !== 'undefined') {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error('Error parsing stored cart:', e);
        localStorage.removeItem('cart');
      }
    }
    if (storedWishlist && storedWishlist !== 'undefined') {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch (e) {
        console.error('Error parsing stored wishlist:', e);
        localStorage.removeItem('wishlist');
      }
    }
    setLoading(false);
  }, []);

  // Save cart and wishlist to localStorage on change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  // Toast utilities
  const toggleDarkMode = () => {
    const nextTheme = !isDarkMode ? 'dark' : 'light';
    updatePreferences({ themeMode: nextTheme });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Functions
  const login = async (email: string, password?: string) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/login', { email, password });
      const { user: loggedUser, token: loggedToken, message } = res.data;
      
      setUser(loggedUser);
      setToken(loggedToken);
      localStorage.setItem('token', loggedToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      showToast(message || 'Connexion réussie !', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors de la connexion.';
      showToast(errMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, address?: string, phone?: string, password?: string) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/register', { name, email, address, phone, password });
      
      if (res.data.requireVerification) {
        showToast(res.data.message || 'Un code de confirmation vous a été envoyé par email.', 'info');
        return { requireVerification: true, email: res.data.email || email };
      }

      const { user: registeredUser, token: registeredToken, message } = res.data;
      if (registeredUser && registeredToken) {
        setUser(registeredUser);
        setToken(registeredToken);
        localStorage.setItem('token', registeredToken);
        localStorage.setItem('user', JSON.stringify(registeredUser));
      }
      showToast(message || 'Compte créé avec succès !', 'success');
      return { requireVerification: false, email };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors de la création du compte.';
      showToast(errMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/verify-email', { email, code });
      const { user: verifiedUser, token: verifiedToken, message } = res.data;

      setUser(verifiedUser);
      setToken(verifiedToken);
      localStorage.setItem('token', verifiedToken);
      localStorage.setItem('user', JSON.stringify(verifiedUser));
      showToast(message || 'Adresse email vérifiée avec succès !', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors de la vérification du code.';
      showToast(errMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async (email: string): Promise<string> => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/resend-code', { email });
      const msg = res.data?.message || 'Un nouveau code de confirmation a été envoyé.';
      showToast(msg, 'success');
      return msg;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors du renvoi du code.';
      showToast(errMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (payload: { credential?: string; accessToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/google', payload);
      const { user: googleUser, token: googleToken, message } = res.data;

      setUser(googleUser);
      setToken(googleToken);
      localStorage.setItem('token', googleToken);
      localStorage.setItem('user', JSON.stringify(googleUser));
      showToast(message || 'Connexion Google réussie !', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors de l\'authentification Google.';
      showToast(errMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      setToken(null);
      setCoupon(null);
      localStorage.clear();
      sessionStorage.clear();
      // Remove specific cookies if needed, though we primarily use localStorage here
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      // Notification handled by Navbar component as per requirements
    }
  };

  const updateProfile = async (name: string, address?: string, phone?: string) => {
    try {
      const res = await api.put('/api/auth/profile', { name, address, phone });
      const { user: updatedUser, message } = res.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast(message || 'Profil mis à jour.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erreur lors de la mise à jour.';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  const refreshUser = async () => {


    if (!token) return;
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      // Token probably expired or invalid
      logout();
    }
  };

  // Cart Functions
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.productId === product.id);
      
      // Stock boundary check
      const currentInCart = existingIdx > -1 ? prevCart[existingIdx].quantity : 0;
      if (currentInCart + quantity > product.stock) {
        showToast(`Désolé, stock insuffisant (${product.stock} max).`, 'error');
        return prevCart;
      }

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        showToast(`Quantité mise à jour pour : ${product.name}`, 'success');
        return updated;
      } else {
        showToast(`${product.name} ajouté au panier !`, 'success');
        return [...prevCart, { productId: product.id, product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find(i => i.productId === productId);
      if (item) {
        showToast(`${item.product.name} retiré du panier.`, 'info');
      }
      return prev.filter((item) => item.productId !== productId);
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prev) => {
      const index = prev.findIndex((item) => item.productId === productId);
      if (index === -1) return prev;
      
      const product = prev[index].product;
      if (quantity > product.stock) {
        showToast(`Désolé, stock insuffisant (${product.stock} articles disponibles).`, 'error');
        return prev;
      }

      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  // Wishlist Functions
  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      showToast(`${product.name} ajouté aux favoris.`, 'success');
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => {
      const prod = prev.find(p => p.id === productId);
      if (prod) {
        showToast(`${prod.name} retiré des favoris.`, 'info');
      }
      return prev.filter((p) => p.id !== productId);
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  // Coupon Manager
  const applyCoupon = async (code: string, subtotal: number) => {
    try {
      const res = await api.get(`/api/coupons/validate/${code}`);
      const validatedCoupon = res.data;
      
      if (subtotal < validatedCoupon.minAmount) {
        showToast(`Ce code nécessite un achat minimum de ${validatedCoupon.minAmount} Ar.`, 'error');
        return;
      }

      setCoupon(validatedCoupon);
      showToast(`Code promo ${code} appliqué avec succès !`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Code promo invalide.';
      showToast(errMsg, 'error');
      setCoupon(null);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    showToast('Code promo retiré.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        cart,
        wishlist,
        toasts,
        loading,
        coupon,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        loginWithGoogle,
        logout,
        updateProfile,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        showToast,
        removeToast,
        refreshUser,
        isDarkMode,
        toggleDarkMode,
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
