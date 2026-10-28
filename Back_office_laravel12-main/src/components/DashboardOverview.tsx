/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Layers, 
  DownloadCloud, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  TrendingDown, 
  ArrowRight,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  FileDown
} from "lucide-react";
import { motion } from "motion/react";
import { Product, Customer, Order } from "../types";
import { generateDashboardPDF } from "../utils/pdfExport";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  ResponsiveContainer,
  LineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend
} from "recharts";

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardOverviewProps {
  products: Product[];
  systemStatus: any;
  onNavigateToTab: (tab: string) => void;
  customers: Customer[];
  orders: Order[];
  usersCount?: number;
}

export default function DashboardOverview({ 
  products = [], 
  systemStatus = {},
  onNavigateToTab,
  customers = [],
  orders = []
}: DashboardOverviewProps) {
  const [activeChartTab, setActiveChartTab] = useState<"sales" | "orders" | "prices" | "stocks">("sales");
  const [isExporting, setIsExporting] = useState(false);

  // ==========================================
  // METRICS CALCULATIONS
  // ==========================================
  const totalProducts = products.length;
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const totalCategories = categories.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  // Revenue (Chiffre d'affaires) - sum of all orders with status "Payé" or "Livré" or "Expédié" (excluding "Remboursé")
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Payé" || o.deliveryStatus === "Livré" || o.deliveryStatus === "Expédié")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Products Out of stock (Rupture)
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  // Products Low stock (Faible stock: stock <= minStockThreshold, but greater than 0)
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStockThreshold || 10)).length;

  // Active connected users count
  const connectedUsersCount = 3; // Prof. Martin, Alice, System Agent

  // ==========================================
  // CHART 1: VENTES PAR MOIS (Sales per Month)
  // ==========================================
  const monthsLabels = ["Févr", "Mars", "Avr", "Mai", "Juin", "Juil"];
  const salesData = [1200, 2400, 1800, 3900, 4800, totalRevenue > 0 ? totalRevenue : 6500];

  const salesChartData = {
    labels: monthsLabels,
    datasets: [
      {
        label: "Chiffre d'Affaires (Ar)",
        data: salesData,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#3b82f6",
        fill: true,
        tension: 0.3,
      }
    ]
  };

  // ==========================================
  // DUAL-AXIS ORDERS LAST 7 DAYS (RECHARTS)
  // ==========================================
  const ordersLast7Days = React.useMemo(() => {
    const daysData = [];
    const baseDate = new Date("2026-07-15T03:00:16-07:00");
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateString = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const label = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      daysData.push({
        dateString,
        label,
        "Nombre de commandes": 0,
        "Montant total (kAr)": 0,
        "Montant total (Ar)": 0,
      });
    }

    orders.forEach((o) => {
      if (!o.orderDate) return;
      const oDate = o.orderDate.split("T")[0];
      const found = daysData.find(d => d.dateString === oDate);
      if (found) {
        found["Nombre de commandes"] += 1;
        found["Montant total (kAr)"] += Math.round(o.totalAmount / 1000);
        found["Montant total (Ar)"] += o.totalAmount;
      }
    });

    return daysData;
  }, [orders]);

  // ==========================================
  // CHART 2: ÉVOLUTION DES COMMANDES (Orders Volume)
  // ==========================================
  const ordersVolumeData = [5, 12, 8, 20, 25, totalOrders > 0 ? totalOrders : 32];
  const ordersChartData = {
    labels: monthsLabels,
    datasets: [
      {
        label: "Commandes Passées",
        data: ordersVolumeData,
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 6,
      }
    ]
  };

  // ==========================================
  // CHART 3: ÉVOLUTION DES PRIX (Price trends)
  // ==========================================
  // Let's track price trends based on products current vs original price
  const priceLabels = products.slice(0, 6).map(p => p.sku || p.name.substring(0, 10));
  const originalPrices = products.slice(0, 6).map(p => p.originalPrice);
  const currentPrices = products.slice(0, 6).map(p => p.currentPrice);

  const priceChartData = {
    labels: priceLabels.length > 0 ? priceLabels : ["Prod 1", "Prod 2", "Prod 3", "Prod 4", "Prod 5", "Prod 6"],
    datasets: [
      {
        label: "Prix d'Origine (Ar)",
        data: originalPrices.length > 0 ? originalPrices : [1199, 2499, 349, 599, 189, 149],
        borderColor: "#94a3b8",
        backgroundColor: "rgba(148, 163, 184, 0.1)",
        borderDash: [5, 5],
        borderWidth: 1.5,
        fill: false,
        tension: 0.1,
      },
      {
        label: "Prix Actuel (Ar)",
        data: currentPrices.length > 0 ? currentPrices : [1049, 2499, 299, 489, 189, 129],
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "#f97316",
        fill: false,
        tension: 0.1,
      }
    ]
  };

  // ==========================================
  // CHART 4: ÉVOLUTION DES STOCKS (Stocks Distribution)
  // ==========================================
  // Category-based stocks
  const stockCategories = Array.from(new Set(products.map(p => p.category)));
  const stockLevels = stockCategories.map(cat => {
    return products.filter(p => p.category === cat).reduce((sum, p) => sum + p.stock, 0);
  });

  const stocksChartData = {
    labels: stockCategories.length > 0 ? stockCategories : ["Électronique", "Ordinateurs", "Audio", "Écrans", "Stockage"],
    datasets: [
      {
        label: "Niveau de Stock Physique",
        data: stockLevels.length > 0 ? stockLevels : [45, 12, 85, 18, 120],
        backgroundColor: [
          "rgba(59, 130, 246, 0.75)",
          "rgba(16, 185, 129, 0.75)",
          "rgba(245, 158, 11, 0.75)",
          "rgba(239, 68, 68, 0.75)",
          "rgba(139, 92, 246, 0.75)",
        ],
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { family: "JetBrains Mono", size: 10 },
          boxWidth: 12,
        }
      },
      tooltip: {
        bodyFont: { family: "Inter", size: 11 },
        titleFont: { family: "JetBrains Mono", size: 11 }
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { font: { family: "JetBrains Mono", size: 9 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "JetBrains Mono", size: 9 } }
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { family: "JetBrains Mono", size: 10 },
          boxWidth: 10,
        }
      }
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        generateDashboardPDF({
          products,
          customers,
          orders,
          systemStatus
        } as any);
      } catch (err) {
        console.error("Erreur d'exportation PDF :", err);
        alert("Une erreur s'est produite lors de la génération du rapport PDF.");
      } finally {
        setIsExporting(false);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* EXPORT PANEL & REPORT BANNER */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="pdf-export-banner">
        <div>
          <h4 className="text-sm font-bold text-slate-900 font-display uppercase tracking-tight flex items-center gap-1.5">
            <FileDown className="w-4 h-4 text-blue-500" />
            Rapports d'Activité et Analyses Décisionnelles
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Générez et téléchargez un rapport exécutif PDF consolidant les indicateurs clés de vente (en Ariary), la valorisation NoSQL des stocks et l'état des workflows de collecte automatique.
          </p>
        </div>
        <div>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4.5 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:bg-slate-100 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            id="btn-export-pdf"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                <span>Compilation du PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-slate-500" />
                <span>Exporter en PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* 1. COMPREHENSIVE 8 KPI METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        {/* KPI 1: Total Products */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("products")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Produits
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalProducts}</h3>
            <span className="text-[9px] text-blue-600 font-semibold block mt-0.5">Fiches référencées</span>
          </div>
        </motion.div>

        {/* KPI 2: Total Categories */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("products")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Catégories
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalCategories}</h3>
            <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Graphes segmentés NoSQL</span>
          </div>
        </motion.div>

        {/* KPI 3: Total Customers */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("customers")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Clients (CRM)
            </span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalCustomers}</h3>
            <span className="text-[9px] text-indigo-600 font-semibold block mt-0.5">Profils enregistrés</span>
          </div>
        </motion.div>

        {/* KPI 4: Total Orders */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("orders")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-violet-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Commandes
            </span>
            <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalOrders}</h3>
            <span className="text-[9px] text-violet-600 font-semibold block mt-0.5">Commandes globales</span>
          </div>
        </motion.div>

        {/* KPI 5: Revenue (CA) */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("orders")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500 transition-all duration-150 col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Chiffre d'Affaires
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{totalRevenue.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">Total payé / validé</span>
          </div>
        </motion.div>

        {/* KPI 6: Out of Stock (Rupture) */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("stock")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Ruptures Stock
            </span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className={`text-xl font-black tracking-tight ${outOfStockProducts > 0 ? "text-red-600 animate-pulse" : "text-slate-950"}`}>
              {outOfStockProducts}
            </h3>
            <span className="text-[9px] text-red-600 font-semibold block mt-0.5">Produits à réapprovisionner</span>
          </div>
        </motion.div>

        {/* KPI 7: Low Stock Alerts */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("stock")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Alerte Seuil Bas
            </span>
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{lowStockProducts}</h3>
            <span className="text-[9px] text-orange-600 font-semibold block mt-0.5">Sous le seuil minimum</span>
          </div>
        </motion.div>

        {/* KPI 10: Active Online Users */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={() => onNavigateToTab("users")}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-500 transition-all duration-150"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Admins en Ligne
            </span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-lg animate-pulse">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{connectedUsersCount} <span className="text-xs font-normal text-emerald-500">● Live</span></h3>
            <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Sessions actives sécurisées</span>
          </div>
        </motion.div>

      </div>

      {/* 2. FIVE ADVANCED INTERACTIVE GRAPHICS (CHART.JS) WITH TAB SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">Visualisations graphiques</span>
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase mt-0.5 font-display">
              Système d'Analyse Statistique & Monitoring
            </h4>
          </div>

          {/* Interactive Chart Tab Selector */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveChartTab("sales")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                activeChartTab === "sales" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              Ventes / CA
            </button>
            <button
              onClick={() => setActiveChartTab("orders")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                activeChartTab === "orders" ? "bg-white text-purple-600 shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              Commandes
            </button>
            <button
              onClick={() => setActiveChartTab("prices")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                activeChartTab === "prices" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              Évolution Prix
            </button>
            <button
              onClick={() => setActiveChartTab("stocks")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                activeChartTab === "stocks" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              Stocks Catégorie
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 relative w-full">
          {activeChartTab === "sales" && (
            <Line data={salesChartData} options={chartOptions} />
          )}
          {activeChartTab === "orders" && (
            <div className="w-full h-full flex flex-col md:flex-row gap-4">
              <div className="flex-1 h-full" id="orders-recharts-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={ordersLast7Days}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#64748b" }} 
                      stroke="#cbd5e1"
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      stroke="#8b5cf6" 
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#8b5cf6" }}
                      label={{ value: "Commandes", angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#8b5cf6', fontFamily: 'Inter', fontWeight: 'bold' } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#3b82f6" 
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#3b82f6" }}
                      label={{ value: "Montant (kAr)", angle: 90, position: 'insideRight', style: { fontSize: 9, fill: '#3b82f6', fontFamily: 'Inter', fontWeight: 'bold' } }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: "#ffffff", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "11px",
                        fontFamily: "Inter"
                      }}
                    />
                    <RechartsLegend 
                      wrapperStyle={{ 
                        fontSize: "10px", 
                        fontFamily: "JetBrains Mono",
                        paddingTop: "10px"
                      }} 
                    />
                    <RechartsLine 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="Nombre de commandes" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      dot={{ r: 4, stroke: "#8b5cf6", strokeWidth: 2, fill: "#fff" }}
                    />
                    <RechartsLine 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="Montant total (kAr)" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5}
                      dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-64 bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between text-xs shrink-0">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-2 font-mono">
                    Focus 7 Derniers Jours
                  </span>
                  <p className="text-slate-600 font-medium mb-3">
                    Statistiques de commandes collectées sur la période glissante (09 Juil - 15 Juil 2026).
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-500">Commandes :</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {ordersLast7Days.reduce((acc, curr) => acc + curr["Nombre de commandes"], 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-500">Volume Total :</span>
                      <span className="font-bold text-blue-600 font-mono">
                        {ordersLast7Days.reduce((acc, curr) => acc + curr["Montant total (Ar)"], 0).toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                      <span className="text-slate-500">Panier Moyen :</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {Math.round(
                          ordersLast7Days.reduce((acc, curr) => acc + curr["Nombre de commandes"], 0) > 0
                            ? ordersLast7Days.reduce((acc, curr) => acc + curr["Montant total (Ar)"], 0) /
                              ordersLast7Days.reduce((acc, curr) => acc + curr["Nombre de commandes"], 0)
                            : 0
                        ).toLocaleString("fr-FR")} Ar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-200">
                  <p>Moteur Recharts v2.x</p>
                  <p className="font-mono mt-0.5">ecommerce_db.orders</p>
                </div>
              </div>
            </div>
          )}
          {activeChartTab === "prices" && (
            <Line data={priceChartData} options={chartOptions} />
          )}
          {activeChartTab === "stocks" && (
            <div className="h-full flex items-center justify-center max-w-lg mx-auto">
              <Doughnut data={stocksChartData} options={donutOptions} />
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">
          <span>Source: Pipeline MongoDB Atlas + API Node.js</span>
          <span>Mis à jour en temps réel</span>
        </div>
      </div>

      {/* 3. DYNAMIC ARCHITECTURE TOPOLOGY */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm" id="topology-viewer">
        <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase mb-4 flex items-center gap-2 font-display">
          <Layers className="w-4 h-4 text-blue-600" />
          Topologie Fonctionnelle & Flux de Données du Mémoire
        </h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
          
          {/* Node 1: Back-Office Laravel 12 */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center relative flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase">Actif</span>
            </div>
            <div>
              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono block w-fit mx-auto mb-2">
                Laravel 12 / MVC
              </span>
              <h5 className="font-bold text-slate-900 text-sm mb-1">{systemStatus.laravel?.name || "Laravel Back-Office"}</h5>
              <p className="text-[10px] text-slate-500 leading-normal">Cockpit d'Administration, authentification sécurisée multi-rôles & validation ERP.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>PHP 8.3 & Blade</span>
              <span>Port : 3000</span>
            </div>
          </div>

          {/* Node 2: Node.js REST API */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center relative flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase">Online</span>
            </div>
            <div>
              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-mono block w-fit mx-auto mb-2">
                Microservice API
              </span>
              <h5 className="font-bold text-slate-900 text-sm mb-1">{systemStatus.nodeApi?.name || "API REST Node.js"}</h5>
              <p className="text-[10px] text-slate-500 leading-normal">Liaison de données, passerelle de communication Express & traitement des requêtes CRM.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Express Server</span>
              <span>Status: OK</span>
            </div>
          </div>

          {/* Node 3: MongoDB Atlas */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center relative flex flex-col justify-between hover:border-emerald-200 transition-colors">
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {systemStatus.mongodb?.status === "Online" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase">Connecté Atlas</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[9px] font-bold font-mono text-amber-600 uppercase">Hors ligne (Mémoire)</span>
                </>
              )}
            </div>
            <div>
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded font-mono block w-fit mx-auto mb-2">
                NoSQL Database
              </span>
              <h5 className="font-bold text-slate-900 text-sm mb-1">{systemStatus.mongodb?.name || "MongoDB Atlas"}</h5>
              <p className="text-[10px] text-slate-500 leading-normal">Persistance persistante et flexible des catalogues de produits, CRM, ERP, et logs.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
              <span>{systemStatus.mongodb?.status === "Online" ? "Cluster Cloud" : "Mode Simulation"}</span>
              <span>Docs: {totalProducts + totalCustomers + totalOrders} items</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. REAL-TIME ALERTS & SYSTEM STATUS OVERVIEW */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Latest Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase flex items-center gap-2 font-display">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Alertes de Stock Critique (Inventaire Actif)
            </h4>
            <span onClick={() => onNavigateToTab("stock")} className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">Voir l'inventaire</span>
          </div>

          <div className="space-y-3">
            {products.filter(p => p.stock <= (p.minStockThreshold || 10)).slice(0, 4).map((p, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 border rounded-xl ${
                  p.stock === 0 ? "bg-red-50/40 border-red-200" : "bg-orange-50/40 border-orange-200"
                }`}
              >
                <div>
                  <h5 className="font-bold text-slate-900 text-xs mb-0.5">{p.name}</h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>SKU: {p.sku}</span>
                    <span>•</span>
                    <span>Marque: <span className="font-bold">{p.brand || "Générique"}</span></span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    p.stock === 0 ? "bg-red-100 text-red-700 border border-red-200" : "bg-orange-100 text-orange-700 border border-orange-200"
                  }`}>
                    {p.stock === 0 ? "RUPTURE COMPLETE" : `${p.stock} unités restantes`}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Seuil Configurable: {p.minStockThreshold || 10}</p>
                </div>
              </div>
            ))}
            {products.filter(p => p.stock <= (p.minStockThreshold || 10)).length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
                <p className="text-slate-500 text-xs font-semibold">Tous les stocks sont au-dessus des seuils d'alertes.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
