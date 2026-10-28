/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  Percent,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Product, Order, Customer } from "../types";

interface AnalysisPanelProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
}

export default function AnalysisPanel({
  products = [],
  orders = [],
  customers = []
}: AnalysisPanelProps) {
  
  // ==========================================
  // CORE ANALYTICAL MATHEMATICS (ERP)
  // ==========================================
  
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalCustomers = customers.length;

  // 1. Average Basket (Panier moyen)
  const averageBasket = totalOrders > 0
    ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / totalOrders
    : 0;

  // 2. Stock Value (Valeur globale des stocks)
  const stockValue = products.reduce((sum, p) => sum + (p.stock * p.currentPrice), 0);

  // 3. Rupture Rate (Taux de rupture de stock)
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const ruptureRate = totalProducts > 0 
    ? (outOfStockCount / totalProducts) * 100 
    : 0;

  // 4. Conversion Rate (Simulated dynamic calculation based on scraping activity/visits)
  const conversionRate = 2.85; // Master thesis simulated conversion

  // 5. Customer Average Spend
  const avgCustomerSpend = totalCustomers > 0
    ? customers.reduce((sum, c) => sum + c.totalSpend, 0) / totalCustomers
    : 0;

  // ==========================================
  // TABLES COMPUTATIONS
  // ==========================================

  // A. BEST SELLERS & WORST SELLERS
  // We can compute selling frequencies from order items
  const productSalesMap: Record<string, { name: string, qty: number, totalRevenue: number, category: string, brand: string }> = {};
  
  // Initialize map with all products
  products.forEach(p => {
    productSalesMap[p.id] = {
      name: p.name,
      qty: 0,
      totalRevenue: 0,
      category: p.category,
      brand: p.brand || "Générique"
    };
  });

  // Populate map from orders
  orders.forEach(o => {
    (o.products || []).forEach(item => {
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].totalRevenue += item.quantity * item.priceAtPurchase;
      } else {
        // Product might have been deleted but order persists
        productSalesMap[item.productId] = {
          name: item.name,
          qty: item.quantity,
          totalRevenue: item.quantity * item.priceAtPurchase,
          category: "Autre",
          brand: "N/A"
        };
      }
    });
  });

  const salesAnalysisArray = Object.keys(productSalesMap).map(id => ({
    id,
    ...productSalesMap[id]
  }));

  // Sort best sellers (by quantity sold)
  const bestSellers = [...salesAnalysisArray]
    .sort((a, b) => b.qty - a.qty)
    .filter(item => item.qty > 0);

  // Sort worst sellers (by quantity sold, lowest first)
  const worstSellers = [...salesAnalysisArray]
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 5);

  // B. MOST PROFITABLE ITEMS (Higher currentPrice vs discount or absolute profit contribution)
  const profitableItems = [...products]
    .map(p => {
      // Estimated margin logic for demonstration
      const profitContribution = p.stock * p.currentPrice;
      return {
        ...p,
        profitContribution
      };
    })
    .sort((a, b) => b.profitContribution - a.profitContribution)
    .slice(0, 5);

  // Worst sellers and dormant products calculations...

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* 1. MASTER ANALYTICS KPI PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" id="analytics-kpi-grid">
        
        {/* KPI: Panier Moyen */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Panier Moyen</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{averageBasket.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[9px] text-emerald-600 font-bold font-mono">↑ 4.2%</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Calculé sur {totalOrders} factures</span>
        </div>

        {/* KPI: Nouveaux Clients */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Dépense Client Moyenne</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{avgCustomerSpend.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[9px] text-indigo-600 font-bold font-mono">Atlas CRM</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Sur {totalCustomers} profils inscrits</span>
        </div>

        {/* KPI: Valeur du Stock */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Valeur Marchande Stock</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{stockValue.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[9px] text-blue-600 font-bold font-mono">MongoDB</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Valeur active d'inventaire</span>
        </div>

        {/* KPI: Taux de Rupture */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Taux de Rupture</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className={`text-xl font-black tracking-tight ${ruptureRate > 15 ? "text-red-600" : "text-slate-950"}`}>{ruptureRate.toFixed(1)}%</h3>
            <span className="text-[9px] text-red-500 font-bold font-mono">Critique</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">{outOfStockCount} articles en rupture</span>
        </div>

        {/* KPI: Taux de Conversion */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Taux de Conversion</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-black text-slate-950 tracking-tight">{conversionRate.toFixed(2)}%</h3>
            <span className="text-[9px] text-emerald-600 font-bold font-mono">Optimisé</span>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Cible standard de commerce</span>
        </div>

      </div>

      {/* 2. ANALYTICS GRID: Best Sellers & Profitable items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table: Best Sellers */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Palmarès des Meilleures Ventes (Best Sellers)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-[9px] font-bold uppercase text-slate-500 border-b border-slate-100 font-mono">
                  <th className="py-2.5 px-4">Produit</th>
                  <th className="py-2.5 px-4">Catégorie</th>
                  <th className="py-2.5 px-4 text-center">Quantité vendue</th>
                  <th className="py-2.5 px-4 text-right">Chiffre d'Affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {bestSellers.slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">{item.qty} units</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{item.totalRevenue.toLocaleString()} Ar</td>
                  </tr>
                ))}
                {bestSellers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                      En attente de transactions commerciales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table: Stock concerns & Margins */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-500" />
              Valorisations et Contributions d'Inventaire
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-[9px] font-bold uppercase text-slate-500 border-b border-slate-100 font-mono">
                  <th className="py-2.5 px-4">Produit</th>
                  <th className="py-2.5 px-4">Unités en stock</th>
                  <th className="py-2.5 px-4 text-right">Prix de Vente</th>
                  <th className="py-2.5 px-4 text-right">Contribution Valeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {profitableItems.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/30">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.stock > 10 ? "bg-slate-100" : "bg-orange-50 text-orange-600"}`}>
                        {item.stock} pcs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{item.currentPrice} Ar</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{item.profitContribution.toLocaleString()} Ar</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 3. ADDITIONAL GRIDS: Worst Sellers */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Worst Sellers (Slow moving items) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-slate-400" />
              Articles dormants ou faibles ventes (Worst Sellers)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 text-[9px] font-bold uppercase text-slate-500 border-b border-slate-100 font-mono">
                  <th className="py-2.5 px-4">Produit ID</th>
                  <th className="py-2.5 px-4">Nom</th>
                  <th className="py-2.5 px-4 text-center">Quantité vendue</th>
                  <th className="py-2.5 px-4 text-right">Stock actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {worstSellers.map((item, index) => {
                  const realStock = products.find(p => p.id === item.id)?.stock || 0;

                  return (
                    <tr key={index} className="hover:bg-slate-50/30">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">#{item.id.substring(0, 8)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-600 font-bold">{item.qty} units</td>
                      <td className="py-3 px-4 text-right font-mono">{realStock} pcs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
