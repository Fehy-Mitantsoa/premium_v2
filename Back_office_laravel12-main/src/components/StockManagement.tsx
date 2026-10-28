/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Minus, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sliders,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, StockMovement, UserRole } from "../types";

interface StockManagementProps {
  products: Product[];
  stockMovements: StockMovement[];
  onAddStockMovement: (productId: string, quantity: number, type: "Entrée" | "Sortie", comment: string) => Promise<any>;
  onEditProduct: (id: string, product: Partial<Product>) => Promise<any>;
  currentUserRole: UserRole;
}

export default function StockManagement({
  products = [],
  stockMovements = [],
  onAddStockMovement,
  onEditProduct,
  currentUserRole
}: StockManagementProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<"Entrée" | "Sortie">("Entrée");
  const [comment, setComment] = useState("");
  
  // Custom threshold configuration states
  const [configProductId, setConfigProductId] = useState<string | null>(null);
  const [configThreshold, setConfigThreshold] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Statistics and Valuations
  const totalStockQuantity = products.reduce((acc, p) => acc + p.stock, 0);
  const stockValuationCurrent = products.reduce((acc, p) => acc + (p.stock * p.currentPrice), 0);
  const stockValuationOriginal = products.reduce((acc, p) => acc + (p.stock * p.originalPrice), 0);

  // Critical stock levels
  const outOfStockList = products.filter(p => p.stock === 0);
  const lowStockList = products.filter(p => p.stock > 0 && p.stock <= (p.minStockThreshold || 10));

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedProductId) {
      setErrorMsg("Veuillez sélectionner un produit.");
      return;
    }

    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setErrorMsg("La quantité doit être un entier supérieur à zéro.");
      return;
    }

    const targetProduct = products.find(p => p.id === selectedProductId);
    if (!targetProduct) {
      setErrorMsg("Produit introuvable.");
      return;
    }

    if (movementType === "Sortie" && targetProduct.stock < qtyNum) {
      setErrorMsg(`Impossible de sortir ${qtyNum} unités : stock insuffisant (${targetProduct.stock} disponibles).`);
      return;
    }

    try {
      await onAddStockMovement(selectedProductId, qtyNum, movementType, comment || `${movementType} manuelle de stock`);
      setSuccessMsg(`Mouvement de stock (${movementType}) enregistré avec succès !`);
      setQuantity("");
      setComment("");
      setSelectedProductId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la modification du stock.");
    }
  };

  const handleUpdateThreshold = async (id: string, thresholdValue: number) => {
    try {
      await onEditProduct(id, { minStockThreshold: thresholdValue });
      setSuccessMsg("Seuil d'alerte configuré avec succès !");
      setConfigProductId(null);
    } catch (err: any) {
      setErrorMsg("Erreur de configuration : " + err.message);
    }
  };

  const handlePrintInventory = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate simple simulated CSV downloadable
    const headers = "ID,Nom,SKU,Categorie,Stock,Seuil_Alerte,Prix_Unitaire_Vente,Valorisation_Vente\n";
    const rows = products.map(p => 
      `"${p.id}","${p.name}","${p.sku}","${p.category}",${p.stock},${p.minStockThreshold || 10},${p.currentPrice},${p.stock * p.currentPrice}`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `inventaire_valorise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Valuation and stats top dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stock-stats-grid">
        {/* Total physical stock quantity */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stock Physique Global</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalStockQuantity.toLocaleString()} pcs</h3>
            <span className="text-[10px] text-slate-500 mt-1 block">Unités cumulées dans MongoDB</span>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Stock Valuation at sales current price */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valorisation au Prix de Vente</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 tracking-tight">{stockValuationCurrent.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Valeur marchande active</span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Valuation at public catalog original price */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valorisation au Prix d'Origine</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stockValuationOriginal.toLocaleString("fr-FR")} Ar</h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Valeur catalogue brut</span>
          </div>
          <div className="p-3.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
            <Database className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Main interactive layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stock movement logger form */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 font-display flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            Enregistrer un Mouvement de Stock
          </h4>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl flex items-start gap-2 mb-4">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleStockAdjust} className="space-y-4">
            {/* Product selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Sélectionner un Produit</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Dispo: {p.stock} units - SKU: {p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Action Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mouvement</label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMovementType("Entrée")}
                    className={`flex-1 py-1 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                      movementType === "Entrée" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Entrée (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType("Sortie")}
                    className={`flex-1 py-1 text-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                      movementType === "Sortie" ? "bg-white text-red-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Sortie (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quantité *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="ex: 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Commentaire / Justification</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ex: Réception fournisseur #RE-449"
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Enregistrer dans l'historique ERP
            </button>
          </form>
        </div>

        {/* Right Column: Inventory Viewport & Configurable alerts */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                Alertes & Seuils d'Inventaire Critique
              </h4>
              <p className="text-[10px] text-slate-400">Ruptures de stock et seuils d'approvisionnement configurables</p>
            </div>

            {/* Tool actions */}
            <div className="flex gap-2">
              <button 
                onClick={handlePrintInventory} 
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Imprimer l'inventaire"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleExportCSV} 
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Exporter l'inventaire en CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of critical elements */}
          <div className="space-y-3">
            {products.map(p => {
              const isRupture = p.stock === 0;
              const isLowStock = p.stock > 0 && p.stock <= (p.minStockThreshold || 10);
              const isConfiguring = configProductId === p.id;

              return (
                <div 
                  key={p.id}
                  className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isRupture 
                      ? "bg-red-50/40 border-red-200" 
                      : isLowStock 
                      ? "bg-orange-50/40 border-orange-200" 
                      : "bg-slate-50/20 border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 text-xs">{p.name}</h5>
                      <span className="text-[9px] bg-slate-200/80 text-slate-600 font-mono font-bold px-1.5 py-0.2 rounded">
                        {p.sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>Catégorie: {p.category}</span>
                      <span>•</span>
                      <span>Valorisation: <span className="font-bold text-slate-600">{(p.stock * p.currentPrice).toLocaleString()} €</span></span>
                    </div>
                  </div>

                  {/* Threshold action configs */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                          isRupture 
                            ? "bg-red-100 text-red-700 border-red-200" 
                            : isLowStock 
                            ? "bg-orange-100 text-orange-700 border-orange-200" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {p.stock} unités disponibles
                        </span>
                      </div>
                      
                      {/* Configuration threshold display */}
                      {!isConfiguring ? (
                        <button 
                          onClick={() => {
                            setConfigProductId(p.id);
                            setConfigThreshold(String(p.minStockThreshold || 10));
                          }}
                          className="text-[9px] text-blue-600 hover:underline mt-1 font-bold block ml-auto"
                        >
                          Seuil bas actuel: {p.minStockThreshold || 10} pcs (Modifier)
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 justify-end">
                          <span className="text-[9px] font-bold text-slate-400">Seuil min :</span>
                          <input
                            type="number"
                            value={configThreshold}
                            onChange={(e) => setConfigThreshold(e.target.value)}
                            className="w-12 text-center bg-white border border-slate-300 rounded text-[10px] py-0.5 font-bold outline-none"
                          />
                          <button 
                            onClick={() => handleUpdateThreshold(p.id, Number(configThreshold))}
                            className="bg-emerald-600 text-white rounded p-0.5 hover:bg-emerald-500 cursor-pointer"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => setConfigProductId(null)}
                            className="bg-red-600 text-white rounded p-0.5 hover:bg-red-500 cursor-pointer"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Movement Log history block */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            Historique Complet des Mouvements de Stock (MongoDB Pipeline)
          </h4>
          <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
            {stockMovements.length} écritures logguées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Horodatage / ID</th>
                <th className="py-3 px-4">Produit concerné</th>
                <th className="py-3 px-4 text-center">Type de mouvement</th>
                <th className="py-3 px-4 text-right">Quantité</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Justification / Commentaire</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-mono">
              {stockMovements.map((move) => {
                const isEntry = move.type === "Entrée";

                return (
                  <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[10px]">
                      <div>{new Date(move.date).toLocaleString("fr-FR")}</div>
                      <div className="text-[9px] text-slate-300 mt-0.5">#{move.id}</div>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {move.productName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1 ${
                        isEntry 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {isEntry ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {move.type}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${isEntry ? "text-emerald-600" : "text-red-600"}`}>
                      {isEntry ? `+${move.quantity}` : `-${move.quantity}`}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-600">
                      {move.userResponsible}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500 text-xs italic">
                      {move.comment}
                    </td>
                  </tr>
                );
              })}

              {stockMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-semibold font-sans text-xs">
                    Aucun mouvement de stock enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
