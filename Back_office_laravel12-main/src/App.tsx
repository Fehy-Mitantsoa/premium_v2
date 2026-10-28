/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Layers, 
  ShoppingBag, 
  DownloadCloud, 
  Cpu, 
  Sparkles, 
  Users as UsersIcon, 
  Activity, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Package,
  ShoppingCart,
  Bell,
  AlertTriangle,
  CheckCircle,
  Tag,
  Wallet,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Product, ActivityLog, SystemSettings, UserRole, Customer, Order, StockMovement, Category, MobileMoneyPayment } from "./types";

// Component imports
import AuthShield from "./components/AuthShield";
import DashboardOverview from "./components/DashboardOverview";
import ProductManagement from "./components/ProductManagement";
import CategoryManagement from "./components/CategoryManagement";
import AnalysisPanel from "./components/AnalysisPanel";
import UserManagement from "./components/UserManagement";
import ActivityLogs from "./components/ActivityLogs";
import SettingsPanel from "./components/SettingsPanel";
import StockManagement from "./components/StockManagement";
import CustomerManagement from "./components/CustomerManagement";
import OrderManagement from "./components/OrderManagement";
import MobileMoneyManagement from "./components/MobileMoneyManagement";
import AdminChatBot from "./components/AdminChatBot";
import Logo from "./components/Logo";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole } | null>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Database / API states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [mobileMoneyPayments, setMobileMoneyPayments] = useState<MobileMoneyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // TOAST & SYSTEM NOTIFICATIONS STATE & POLLER
  // ==========================================
  interface Toast {
    id: string;
    title: string;
    description: string;
    type: "success" | "info" | "warning" | "error";
  }
  interface SystemNotification {
    id: string;
    title: string;
    description: string;
    type: "success" | "info" | "warning" | "error";
    timestamp: string;
    read: boolean;
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "notif_init_1",
      title: "Connexion MongoDB Atlas",
      description: "Connexion réussie à la base de données 'ecommerce_db'.",
      type: "success",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true
    },
    {
      id: "notif_init_2",
      title: "Vérification n8n active",
      description: "L'orchestrateur de workflows intelligents a démarré sans erreur.",
      type: "info",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: true
    }
  ]);

  const addToast = (title: string, description: string, type: Toast["type"] = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [{ id, title, description, type }, ...prev].slice(0, 5));
    
    // Also save in persistent notifications array
    setNotifications(prev => [
      {
        id,
        title,
        description,
        type,
        timestamp: new Date().toISOString(),
        read: false
      },
      ...prev
    ]);

    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const lastLogTimeRef = React.useRef<string>("");
  const isFirstFetchRef = React.useRef<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      isFirstFetchRef.current = true;
      return;
    }

    const pollActivityLogs = async () => {
      try {
        const res = await fetch("/api/activity-logs");
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return; // Skip gracefully if the response is not JSON (e.g. HTML gateway error during server restart)
        }
        const logs: ActivityLog[] = await res.json();

        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false;
          if (logs.length > 0) {
            lastLogTimeRef.current = logs[0].timestamp;
          } else {
            lastLogTimeRef.current = new Date().toISOString();
          }
          return;
        }

        // Filter new logs that are newer than last seen log
        const newLogs = logs.filter(log => {
          return new Date(log.timestamp).getTime() > new Date(lastLogTimeRef.current).getTime();
        });

        if (newLogs.length > 0) {
          // Toast each new log in chronological order
          [...newLogs].reverse().forEach(log => {
            let type: Toast["type"] = "info";
            let title = "Événement Système";

            if (log.type === "auth") {
              type = "info";
              title = "Sécurité & Profil";
            } else if (log.type === "system") {
              const actionLower = log.action.toLowerCase();
              type = actionLower.includes("échec") || actionLower.includes("erreur") ? "error" : "warning";
              title = "Système & NoSQL";
            } else if (log.type === "crud") {
              if (log.action.toLowerCase().includes("commande")) {
                type = "success";
                title = "Nouvelle commande";
              } else if (log.action.toLowerCase().includes("suppr")) {
                type = "warning";
                title = "Base NoSQL (Suppression)";
              } else {
                type = "success";
                title = "Base NoSQL (Mise à jour)";
              }
            }

            addToast(title, log.action, type);
          });

          // Update latest timestamp to newest log
          lastLogTimeRef.current = logs[0].timestamp;

          // Reload data in tables to match the live event
          fetchAllData();
        }
      } catch (error) {
        console.warn("Erreur de polling des événements (hiccup de réseau attendu lors du redémarrage du serveur) :", error);
      }
    };

    // Initial check
    pollActivityLogs();

    // Poll every 3.5 seconds
    const intervalId = setInterval(pollActivityLogs, 3500);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  // ==========================================
  // API COMMUNICATOR / SYNCHRONIZER
  // ==========================================

  const safeFetchJson = async (url: string, defaultVal: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return defaultVal;
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return defaultVal;
      }
      return await res.json();
    } catch (e) {
      return defaultVal;
    }
  };

  const fetchAllData = async () => {
    try {
      const [
        resStatus,
        resProducts,
        resUsers,
        resActivity,
        resSettings,
        resCustomers,
        resOrders,
        resStockMovements,
        resCategories,
        resMobileMoney
      ] = await Promise.all([
        safeFetchJson("/api/system/status", { mongodb: { status: "Offline" } }),
        safeFetchJson("/api/products", []),
        safeFetchJson("/api/users", []),
        safeFetchJson("/api/activity-logs", []),
        safeFetchJson("/api/settings", {}),
        safeFetchJson("/api/customers", []),
        safeFetchJson("/api/orders", []),
        safeFetchJson("/api/stock-movements", []),
        safeFetchJson("/api/categories", []),
        safeFetchJson("/api/mobile-money", [])
      ]);

      setSystemStatus(resStatus);
      setProducts(resProducts);
      setUsers(resUsers);
      setActivityLogs(resActivity);
      setSettings(resSettings);
      setCustomers(resCustomers);
      setOrders(resOrders);
      setStockMovements(resStockMovements);
      setCategories(resCategories);
      setMobileMoneyPayments(resMobileMoney);
    } catch (error) {
      console.warn("Erreur lors de la synchronisation avec le serveur Express (hiccup de réseau attendu lors du redémarrage du serveur) :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  // Handle Log-In
  const handleLogin = (user: { name: string; email: string; role: UserRole }) => {
    setCurrentUser(user);
    // Append activity log immediately
    fetch("/api/activity-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.name,
        role: user.role,
        action: `Connexion réussie en tant que ${user.role}`,
        type: "auth"
      })
    }).then(() => fetchAllData());
  };

  // Handle Log-out
  const handleLogout = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir vous déconnecter de la plateforme ?")) {
      return;
    }
    if (currentUser) {
      // Append logout log
      fetch("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.name,
          role: currentUser.role,
          action: "Déconnexion de la plateforme",
          type: "auth"
        })
      });
    }
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  // Role quick swap (extremely practical for thesis presentation!)
  const handleQuickRoleSwap = () => {
    if (!currentUser) return;
    const nextRole: UserRole = currentUser.role === "Administrateur" ? "Analyste" : "Administrateur";
    const updatedUser = {
      ...currentUser,
      name: nextRole === "Administrateur" ? "Prof. Martin Dupont" : "Alice Bernard",
      email: nextRole === "Administrateur" ? "m.dupont@master-univ.fr" : "a.bernard@analyst.fr",
      role: nextRole
    };
    setCurrentUser(updatedUser);
  };

  // ==========================================
  // ACTION HANDLERS (CRUDS & WEBHOOKS)
  // ==========================================

  const handleAddProduct = async (productPayload: any) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur lors de l'insertion");
    }
    await fetchAllData();
  };

  const handleEditProduct = async (id: string, productPayload: any) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de mise à jour");
    }
    await fetchAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de suppression");
    }
    await fetchAllData();
  };

  const handleAddCategory = async (categoryPayload: any) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur d'insertion de catégorie");
    }
    await fetchAllData();
  };

  const handleEditCategory = async (id: string, categoryPayload: any) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de modification de catégorie");
    }
    await fetchAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de suppression de catégorie");
    }
    await fetchAllData();
  };

  const handleAddStockMovement = async (productId: string, quantity: number, type: "Entrée" | "Sortie", comment: string) => {
    const res = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity,
        type,
        comment,
        userResponsible: currentUser?.name || "Système"
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de mouvement de stock");
    }
    await fetchAllData();
  };

  const handleAddCustomer = async (customerPayload: any) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur d'ajout de client");
    }
    await fetchAllData();
  };

  const handleEditCustomer = async (id: string, customerPayload: any) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de mise à jour client");
    }
    await fetchAllData();
  };

  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de suppression client");
    }
    await fetchAllData();
  };

  const handleUpdateOrderStatus = async (id: string, paymentStatus: any, deliveryStatus: any) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus, deliveryStatus })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur de mise à jour commande");
    }
    await fetchAllData();
  };

  // Scraping and workflows have been successfully decoupled and removed.

  const handleAddUser = async (userPayload: any) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload)
    });
    if (!res.ok) throw new Error("Erreur création utilisateur");
    await fetchAllData();
  };

  const handleEditUser = async (id: string, userPayload: any) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload)
    });
    if (!res.ok) throw new Error("Erreur modification utilisateur");
    await fetchAllData();
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur de suppression");
    await fetchAllData();
  };

  const handleSaveSettings = async (settingsPayload: SystemSettings) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsPayload)
    });
    if (!res.ok) throw new Error("Erreur d'enregistrement");
    await fetchAllData();
  };

  const handleTestConnection = async (service: "mongodb" | "nodeApi" | "facebook") => {
    const res = await fetch("/api/settings/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service })
    });
    return res.json();
  };

  const handleTriggerGeminiAnalysis = async (datasetType: "pricing" | "inventory", customQuestion?: string) => {
    const res = await fetch("/api/gemini/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datasetType, customQuestion })
    });
    return res.json();
  };

  // Shield authentication wall
  if (!currentUser) {
    return <AuthShield onLogin={handleLogin} />;
  }

  // Sidebar Tabs Config
  const navigationItems = [
    { id: "dashboard", label: "Vue d'ensemble", icon: <Layers className="w-4 h-4" /> },
    { id: "products", label: "Gestion des produits", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "categories", label: "Gestion des catégories", icon: <Tag className="w-4 h-4 text-emerald-400" /> },
    { id: "stocks", label: "Gestion des stocks", icon: <Package className="w-4 h-4" /> },
    { id: "orders", label: "Gestion des commandes", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "mobilemoney", label: "Paiements Mobile Money", icon: <Wallet className="w-4 h-4 text-amber-500" /> },
    { id: "customers", label: "Gestion des clients (CRM)", icon: <UsersIcon className="w-4 h-4" /> },
    { id: "analysis", label: "Analyse décisionnelle ERP", icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
    { id: "users", label: "Gestion des utilisateurs", icon: <UsersIcon className="w-4 h-4" /> },
    { id: "activity", label: "Journal d'activité", icon: <Activity className="w-4 h-4" /> },
    { id: "settings", label: "Paramètres système", icon: <SettingsIcon className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex relative font-sans overflow-x-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside 
        className={`${isSidebarOpen ? "w-64" : "w-16"} bg-[#1e293b] text-slate-200 border-r border-slate-800/20 flex flex-col justify-between transition-all duration-300 shrink-0 z-30`}
        id="sidebar"
      >
        <div>
          {/* Brand/Thesis Header */}
          <div className="p-3.5 border-b border-slate-700/50 flex items-center justify-between bg-[#0f172a]/60">
            {isSidebarOpen ? (
              <Logo size="md" variant="horizontal" showSubtitle={true} />
            ) : (
              <div className="mx-auto" title="PREMIUM SHOP — Vahaolana Mora">
                <Logo size="sm" variant="icon" />
              </div>
            )}
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer ${!isSidebarOpen ? "hidden" : ""}`}
              title={isSidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Connected User Badge */}
          {isSidebarOpen && (
            <div className="p-4 bg-[#0f172a]/30 border-b border-slate-700/40 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400/45 flex items-center justify-center font-mono text-xs font-bold text-blue-200">
                  {currentUser.name ? currentUser.name.charAt(0) : ""}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name || "Utilisateur"}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email || ""}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-700/30">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                  currentUser.role === "Administrateur" 
                    ? "bg-blue-500/10 text-blue-300 border-blue-500/30" 
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                }`}>
                  {currentUser.role}
                </span>

                <button
                  onClick={handleQuickRoleSwap}
                  className="text-[9px] text-slate-300 hover:text-white font-mono border border-slate-700 hover:border-slate-600 bg-slate-800/40 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                  title="Intervertir de profil pour tester les middlewares"
                >
                  Simuler {currentUser.role === "Administrateur" ? "Analyste" : "Admin"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md font-bold rounded-lg" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg"
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  <span className={isActive ? "text-white animate-pulse" : "text-slate-400"}>{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Bottom */}
        <div className="p-3 border-t border-slate-700/50 bg-[#0f172a]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-red-300 hover:bg-red-950/20 transition-all cursor-pointer"
            id="btn-logout"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 flex flex-col justify-between bg-[#f8fafc]" id="main-content">
        
        {/* Top Header info */}
        <header className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Administration back-office</span>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5 uppercase font-display">
              {navigationItems.find(item => item.id === activeTab)?.label}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Notifications Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
                title="Notifications système"
                id="btn-notif-bell"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    {/* Backdrop to close click */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 text-left"
                      id="notif-dropdown-panel"
                    >
                      {/* Header */}
                      <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Bell className="w-3.5 h-3.5 text-blue-600" />
                          Notifications Système
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }}
                            className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                          >
                            Tout lire
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => {
                              setNotifications([]);
                            }}
                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                          >
                            Vider
                          </button>
                        </div>
                      </div>

                      {/* Content List */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-[11px]">Aucune notification active</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-3 text-[11px] transition-colors ${notif.read ? "bg-white" : "bg-blue-50/40"} hover:bg-slate-50`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className={`font-semibold ${
                                  notif.type === "error" ? "text-red-600" :
                                  notif.type === "warning" ? "text-amber-600" :
                                  notif.type === "success" ? "text-emerald-600" : "text-blue-600"
                                }`}>
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-0.5 leading-relaxed">{notif.description}</p>
                              {!notif.read && (
                                <button
                                  onClick={() => {
                                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                  }}
                                  className="text-[9px] text-blue-500 hover:underline mt-1 block cursor-pointer"
                                >
                                  Marquer comme lu
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* View All Button */}
                      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                        <span className="text-[9px] text-slate-400">
                          Total : {notifications.length} notifications enregistrées
                        </span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[10px] text-slate-500 max-w-md md:text-right font-sans leading-relaxed">
              <span className="font-semibold text-slate-700 block">Projet de mémoire Master II</span>
              "Plateforme e-commerce intelligente avec système de collecte, analyse & MongoDB Atlas."
            </div>
          </div>
        </header>

        {/* Tab Stage Page views */}
        <div className="p-6 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-mono animate-pulse">Chargement de la base MongoDB Atlas...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="min-h-full"
            >
              {activeTab === "dashboard" && (
                <DashboardOverview 
                  products={products}
                  systemStatus={systemStatus}
                  onNavigateToTab={setActiveTab}
                  customers={customers}
                  orders={orders}
                />
              )}

              {activeTab === "products" && (
                <ProductManagement
                  products={products}
                  categories={categories}
                  currentUserRole={currentUser.role}
                  settings={settings}
                  onAddProduct={handleAddProduct}
                  onEditProduct={handleEditProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onNavigateToSettings={() => setActiveTab("settings")}
                  onRefreshData={fetchAllData}
                />
              )}

              {activeTab === "categories" && (
                <CategoryManagement
                  categories={categories}
                  currentUserRole={currentUser.role}
                  onAddCategory={handleAddCategory}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {activeTab === "stocks" && (
                <StockManagement
                  products={products}
                  stockMovements={stockMovements}
                  onAddStockMovement={handleAddStockMovement}
                  onEditProduct={handleEditProduct}
                  currentUserRole={currentUser.role}
                />
              )}

              {activeTab === "orders" && (
                <OrderManagement
                  orders={orders}
                  products={products}
                  customers={customers}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  currentUserRole={currentUser.role}
                />
              )}

              {activeTab === "mobilemoney" && (
                <MobileMoneyManagement
                  payments={mobileMoneyPayments}
                  orders={orders}
                  currentUser={currentUser}
                  onUpdatePayment={async (id, payload) => {
                    const res = await fetch(`/api/mobile-money/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Erreur de mise à jour du paiement");
                    await fetchAllData();
                  }}
                />
              )}

              {activeTab === "customers" && (
                <CustomerManagement
                  customers={customers}
                  currentUserRole={currentUser.role}
                  onAddCustomer={handleAddCustomer}
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {activeTab === "analysis" && (
                <AnalysisPanel
                  products={products}
                  orders={orders}
                  customers={customers}
                />
              )}

              {activeTab === "users" && (
                <UserManagement
                  users={users}
                  currentUserRole={currentUser.role}
                  onAddUser={handleAddUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === "activity" && (
                <ActivityLogs
                  logs={activityLogs}
                />
              )}

              {activeTab === "settings" && settings && (
                <SettingsPanel
                  settings={settings}
                  currentUserRole={currentUser.role}
                  onSaveSettings={handleSaveSettings}
                  onTestConnection={handleTestConnection}
                />
              )}
            </motion.div>
          )}
        </div>

        {/* Custom Footer */}
        <footer className="p-4 border-t border-slate-200 bg-white text-center text-[10px] text-slate-500 font-mono">
          © 2026 Plateforme E-Commerce Intelligente. Architecture MVC : Laravel 12 + API Node.js + MongoDB Atlas.
        </footer>

        {/* Toast Notification HUD Portal */}
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none" id="toasts-portal">
          <AnimatePresence>
            {toasts.map((toast) => {
              let icon = <Bell className="w-4 h-4 text-blue-500 animate-bounce" />;
              let borderStyle = "border-blue-500 bg-white/95 text-slate-900 shadow-blue-500/10";
              let badgeColor = "bg-blue-100 text-blue-800";

              if (toast.type === "success") {
                icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
                borderStyle = "border-emerald-500 bg-white/95 text-slate-900 shadow-emerald-500/10";
                badgeColor = "bg-emerald-100 text-emerald-800";
              } else if (toast.type === "warning") {
                icon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
                borderStyle = "border-amber-500 bg-white/95 text-slate-900 shadow-amber-500/10";
                badgeColor = "bg-amber-100 text-amber-800";
              } else if (toast.type === "error") {
                icon = <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />;
                borderStyle = "border-rose-500 bg-white/95 text-slate-900 shadow-rose-500/10";
                badgeColor = "bg-rose-100 text-rose-800";
              }

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.85, transition: { duration: 0.2 } }}
                  className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border-l-4 bg-white/95 shadow-lg backdrop-blur-md transition-all font-sans relative ${borderStyle}`}
                  id={toast.id}
                >
                  <div className="mt-0.5 shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-950">{toast.title}</span>
                      <span className={`text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>
                        {toast.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1 whitespace-pre-line">
                      {toast.description}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 hover:bg-slate-100 rounded-md transition-colors"
                    title="Fermer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Floating Admin AI Chatbot */}
        {currentUser && <AdminChatBot adminId={currentUser.email || "ADMIN_ID"} />}

      </main>
    </div>
  );
}
