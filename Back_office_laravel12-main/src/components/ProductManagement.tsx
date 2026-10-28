/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  X, 
  CheckCircle,
  HelpCircle,
  Image,
  Tag,
  Eye,
  EyeOff,
  Upload,
  Share2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Facebook,
  Smartphone,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, UserRole, Category, SystemSettings } from "../types";
import Logo from "./Logo";
import { FacebookStoryModal } from "./FacebookStoryModal";

// Helper function to process image URLs safely supporting Base64 images (which contain commas)
const parseImagesText = (text: string): string[] => {
  const rawParts = text.split(",");
  const processedImages: string[] = [];
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i].trim();
    if (!part) continue;
    
    if (part.startsWith("data:") && part.includes("base64") && i + 1 < rawParts.length) {
      processedImages.push(part + "," + rawParts[i + 1].trim());
      i++; // Skip the next part as it has been combined with this one
    } else {
      processedImages.push(part);
    }
  }
  return processedImages;
};

interface ProductManagementProps {
  products: Product[];
  categories?: Category[];
  currentUserRole: UserRole;
  settings?: SystemSettings | null;
  onAddProduct: (product: Omit<Product, "id" | "lastCollected">) => Promise<any>;
  onEditProduct: (id: string, product: Partial<Product>) => Promise<any>;
  onDeleteProduct: (id: string) => Promise<any>;
  onNavigateToSettings?: () => void;
  onRefreshData?: () => void;
}

export default function ProductManagement({
  products = [],
  categories = [],
  currentUserRole,
  settings,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onNavigateToSettings,
  onRefreshData,
}: ProductManagementProps) {
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFbStatus, setSelectedFbStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Facebook post & story modal states
  const [selectedFacebookProduct, setSelectedFacebookProduct] = useState<Product | null>(null);
  const [storyModalProduct, setStoryModalProduct] = useState<Product | null>(null);
  const [isRetryingFacebook, setIsRetryingFacebook] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [minStockThreshold, setMinStockThreshold] = useState("10");
  const [status, setStatus] = useState<"Publié" | "Brouillon">("Publié");
  
  // Promotion form state
  const [hasPromotion, setHasPromotion] = useState(false);
  const [promoType, setPromoType] = useState<"percentage" | "fixed">("percentage");
  const [promoValue, setPromoValue] = useState("");

  // Multiple Images state (entered as comma-separated URLs or helper presets)
  const [imagesText, setImagesText] = useState("");

  // UI status states
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract Lists for filtering
  const uniqueProductCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  // Filter products based on search term, category, brand, status, and facebook status
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    const matchesFbStatus = selectedFbStatus === "all" || 
      (selectedFbStatus === "published" && p.facebook_publication_status === "published") ||
      (selectedFbStatus === "pending" && (p.facebook_publication_status === "pending" || p.facebook_publication_status === "generating" || p.facebook_publication_status === "publishing")) ||
      (selectedFbStatus === "failed" && p.facebook_publication_status === "failed");

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesFbStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleTriggerFacebookPublish = async (productId: string) => {
    setIsRetryingFacebook(true);
    try {
      const res = await fetch(`/api/products/${productId}/facebook-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        // Update local modal view state
        if (selectedFacebookProduct && selectedFacebookProduct.id === productId) {
          setSelectedFacebookProduct({
            ...selectedFacebookProduct,
            facebook_publication_status: "pending",
            facebook_error: undefined
          });
        }
      }
    } catch (err) {
      console.error("Erreur déclenchement Facebook :", err);
    } finally {
      setIsRetryingFacebook(false);
    }
  };

  const handleCopyPostContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), 2000);
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setCategoryId("");
    setBrand("");
    setSku("");
    setOriginalPrice("");
    setCurrentPrice("");
    setStock("");
    setSourceUrl("");
    setMinStockThreshold("10");
    setStatus("Publié");
    setHasPromotion(false);
    setPromoType("percentage");
    setPromoValue("");
    setImagesText("");
    setEditingId(null);
    setFormError("");
    setFormSuccess("");
    setSecurityWarning("");
    setIsSubmitting(false);
  };

  const handleOpenCreateModal = () => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à insérer des documents (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à modifier des documents (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setCategoryId(p.categoryId || "");
    setBrand(p.brand || "");
    setSku(p.sku);
    setOriginalPrice(String(p.originalPrice));
    setCurrentPrice(String(p.currentPrice));
    setStock(String(p.stock));
    setSourceUrl(p.sourceUrl || "");
    setMinStockThreshold(String(p.minStockThreshold !== undefined ? p.minStockThreshold : 10));
    setStatus(p.status || "Publié");
    
    if (p.promotion && p.promotion.active) {
      setHasPromotion(true);
      setPromoType(p.promotion.type);
      setPromoValue(String(p.promotion.value));
    } else {
      setHasPromotion(false);
      setPromoType("percentage");
      setPromoValue("");
    }

    if (p.images && p.images.length > 0) {
      setImagesText(p.images.join(", "));
    } else {
      setImagesText("");
    }
    setFormError("");
    setFormSuccess("");
    setSecurityWarning("");
    setIsSubmitting(false);
    
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name.trim() || !category || !sku.trim() || !originalPrice || !currentPrice) {
      setFormError("Veuillez remplir tous les champs marqués d'une astérisque (*).");
      return;
    }

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    // Check if product already exists in database (match on name or SKU, ignoring current edited product)
    const existingProduct = products.find((p) => {
      const nameMatch = p.name.trim().toLowerCase() === trimmedName.toLowerCase();
      const skuMatch = p.sku && p.sku.trim().toLowerCase() === trimmedSku.toLowerCase();
      return (nameMatch || skuMatch) && p.id !== editingId;
    });

    if (existingProduct) {
      if (existingProduct.sku.trim().toLowerCase() === trimmedSku.toLowerCase()) {
        setFormError(`⚠️ ALERTE BASE DE DONNÉES : Un produit avec le SKU "${existingProduct.sku}" ("${existingProduct.name}") existe déjà dans la base de données ! L'enregistrement d'un doublon est bloqué.`);
      } else {
        setFormError(`⚠️ ALERTE BASE DE DONNÉES : Le produit "${existingProduct.name}" existe déjà dans la base de données ! L'enregistrement d'un doublon est bloqué.`);
      }
      return;
    }

    if (isSubmitting) return; // Prevent double registration
    setIsSubmitting(true);

    // Process image URLs safely supporting Base64 images (which contain commas)
    const processedImages = parseImagesText(imagesText);

    // Fallback default image if none specified
    if (processedImages.length === 0) {
      processedImages.push("https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60");
    }

    const payload = {
      name: trimmedName,
      category,
      categoryId,
      brand: brand.trim(),
      sku: trimmedSku,
      originalPrice: Number(originalPrice),
      currentPrice: Number(currentPrice),
      price: Number(originalPrice),
      discountPrice: Number(currentPrice),
      stock: Number(stock) || 0,
      sourceUrl,
      images: processedImages,
      status,
      minStockThreshold: Number(minStockThreshold) || 10,
      promotion: hasPromotion ? {
        type: promoType,
        value: Number(promoValue) || 0,
        active: true
      } : null
    };

    try {
      if (editingId) {
        await onEditProduct(editingId, payload);
        setFormSuccess("Produit modifié avec succès dans MongoDB Atlas !");
      } else {
        await onAddProduct(payload);
        setFormSuccess("Produit inséré avec succès dans MongoDB Atlas !");
      }
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProductClick = async (id: string) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à supprimer des documents (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce produit de MongoDB Atlas ?")) {
      try {
        await onDeleteProduct(id);
      } catch (err: any) {
        setSecurityWarning("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Search and Filters panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom, marque, SKU..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              id="add-product-btn"
            >
              <Plus className="w-4 h-4" />
              Nouveau Produit
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Filtering */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Catégorie :</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Toutes</option>
              {uniqueProductCategories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Marque :</span>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Toutes</option>
              {brands.map((b, i) => (
                <option key={i} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Statut :</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="Publié">Publié</option>
              <option value="Brouillon">Brouillon</option>
            </select>
          </div>

          {/* Facebook Filter */}
          <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-xl">
            <Facebook className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] text-blue-700 font-bold uppercase">Facebook :</span>
            <select
              value={selectedFbStatus}
              onChange={(e) => {
                setSelectedFbStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-blue-900 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Tous statuts</option>
              <option value="published">Publiés sur Facebook</option>
              <option value="pending">En attente / En cours</option>
              <option value="failed">Échecs publication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security alert for analyst restriction */}
      {securityWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex justify-between items-start"
          id="security-warn"
        >
          <div className="flex gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">Limitation de droits</p>
              <p className="opacity-90 mt-0.5 font-semibold">{securityWarning}</p>
            </div>
          </div>
          <button onClick={() => setSecurityWarning("")} className="text-amber-500 hover:text-amber-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Products list card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="products-table-card">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">Gestion E-Commerce • Catalogue Produits ({filteredProducts.length})</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold font-mono px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Meta Auto-Publish IA
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold font-mono px-2 py-0.5 rounded border border-slate-200">
              Atlas Synced
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Aperçu / Produit</th>
                <th className="py-3 px-4">Marque & SKU</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Prix d'Origine</th>
                <th className="py-3 px-4 text-right">Prix Actuel / Promo</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Publication Facebook</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {paginatedProducts.map((p) => {
                const isPriceDropped = p.currentPrice < p.originalPrice;
                const percentageDiff = isPriceDropped 
                  ? Math.round(((p.originalPrice - p.currentPrice) / p.originalPrice) * 100)
                  : 0;

                const fbStatus = p.facebook_publication_status || "pending";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Image & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.images && p.images[0] ? p.images[0] : "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100"} 
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate max-w-xs">{p.name}</div>
                          {p.sourceUrl ? (
                            <a 
                              href={p.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-blue-500 hover:underline font-mono truncate block max-w-xs"
                            >
                              Amazon/Scraping Link
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-mono block">Enregistrement manuel</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Brand & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{p.brand || "N/A"}</div>
                      <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{p.sku}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.category}
                      </span>
                    </td>

                    {/* Original Price */}
                    <td className="py-3 px-4 text-right font-mono text-slate-500 font-semibold">{p.originalPrice.toLocaleString("fr-FR")} Ar</td>

                    {/* Current Price & Promo badge */}
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{p.currentPrice.toLocaleString("fr-FR")} Ar</div>
                      {p.promotion && p.promotion.active ? (
                        <div className="text-[9px] text-orange-600 font-bold flex items-center justify-end gap-1 mt-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Promo : {p.promotion.type === "percentage" ? `-${p.promotion.value}%` : `-${p.promotion.value.toLocaleString("fr-FR")} Ar`}</span>
                        </div>
                      ) : isPriceDropped ? (
                        <div className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                          <span>Baisse : -{percentageDiff}%</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Stock level */}
                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          p.stock === 0 
                            ? "bg-red-50 text-red-600 border-red-200" 
                            : p.stock <= (p.minStockThreshold || 10)
                            ? "bg-orange-50 text-orange-600 border-orange-200 animate-pulse"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {p.stock === 0 ? "RUPTURE" : `${p.stock} unités`}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-1 font-sans">Seuil min: {p.minStockThreshold || 10}</span>
                      </div>
                    </td>

                    {/* Publish Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        p.status === "Brouillon" 
                          ? "bg-slate-100 text-slate-500 border border-slate-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {p.status || "Publié"}
                      </span>
                    </td>

                    {/* Facebook Publication Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedFacebookProduct(p)}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shadow-xs hover:scale-105"
                        title="Cliquer pour voir le post Facebook généré par l'IA"
                      >
                        {fbStatus === "published" && (
                          <span className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <Facebook className="w-3 h-3 text-blue-600" />
                            <span>Publié FB</span>
                          </span>
                        )}
                        {fbStatus === "generating" && (
                          <span className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 text-blue-600 animate-spin" />
                            <span>Génération IA...</span>
                          </span>
                        )}
                        {fbStatus === "publishing" && (
                          <span className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 animate-pulse">
                            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                            <span>Publication Meta...</span>
                          </span>
                        )}
                        {fbStatus === "pending" && (
                          <span className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <Facebook className="w-3 h-3 text-amber-600" />
                            <span>En attente FB</span>
                          </span>
                        )}
                        {fbStatus === "failed" && (
                          <span className="bg-red-50 text-red-600 border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span>Échec FB (Voir)</span>
                          </span>
                        )}
                        {fbStatus === "disabled" && (
                          <span className="bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1">
                            <Facebook className="w-3 h-3 text-slate-400" />
                            <span>Désactivé</span>
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFacebookProduct(p)}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Post Facebook Marketing IA"
                        >
                          <Facebook className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => setStoryModalProduct(p)}
                          className="p-1.5 hover:bg-pink-50 text-slate-400 hover:text-pink-600 rounded transition-colors cursor-pointer"
                          title="Créer une Story Facebook (1080×1920)"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProductClick(p.id)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold font-mono text-xs">
                    Aucun produit ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded text-xs text-slate-600 font-bold transition-all cursor-pointer"
            >
              Précédent
            </button>
            <span className="text-xs text-slate-500 font-mono font-semibold">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded text-xs text-slate-600 font-bold transition-all cursor-pointer"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-800 my-auto max-h-[90vh] flex flex-col"
              id="product-crud-modal"
            >
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  {editingId ? `Modifier le produit #${editingId} dans MongoDB Atlas` : "Créer un produit dans MongoDB Atlas"}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-200/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span className="font-semibold">{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <span className="font-semibold">{formSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom du Produit *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sony Bravia Ultra HD Smart TV"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Brand & SKU */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Marque / Fabricant</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Sony, Apple, Samsung..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">SKU Unique de Stock *</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="SKU-TV-SONY-55"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Category & Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Catégorie de vente *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setCategoryId(selectedId);
                        const selectedCat = categories.find(c => c.id === selectedId);
                        if (selectedCat) {
                          setCategory(selectedCat.name);
                        } else {
                          setCategory("");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Sélectionner une catégorie --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Statut de Publication</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    >
                      <option value="Publié">Publié</option>
                      <option value="Brouillon">Brouillon (Non visible)</option>
                    </select>
                  </div>

                  {/* Prices */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prix Public Conseillé (Ar) *</label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="899"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prix de Vente Actuel (Ar) *</label>
                    <input
                      type="number"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      placeholder="799"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Stock & Threshold */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantité en Stock</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="12"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Seuil Alerte Stock Minimum</label>
                    <input
                      type="number"
                      value={minStockThreshold}
                      onChange={(e) => setMinStockThreshold(e.target.value)}
                      placeholder="5"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Images Multiple (Comma separated) & Import Photo Locale */}
                  <div className="col-span-2 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-500">Galerie d'Images (URLs ou Photos Locales)</label>
                      <button 
                        type="button"
                        onClick={() => setImagesText("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600, https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=600")}
                        className="text-[9px] text-blue-600 font-bold hover:underline"
                      >
                        Insérer des exemples d'images
                      </button>
                    </div>
                    <textarea
                      value={imagesText}
                      onChange={(e) => setImagesText(e.target.value)}
                      placeholder="https://image1.com, https://image2.com"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all font-mono"
                    />

                    {/* Local File Uploader Field */}
                    <div className="border border-dashed border-slate-200 p-3 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <span className="font-bold">Importer une photo en local</span>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center">Formats acceptés : PNG, JPG, JPEG, WEBP, GIF</p>
                      
                      <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all mt-1 shadow-xs">
                        Sélectionner un fichier...
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const filesArray = Array.from(e.target.files) as File[];
                              filesArray.forEach((file: File) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") {
                                    setImagesText(prev => {
                                      const current = prev.trim();
                                      if (!current) return reader.result;
                                      return `${current}, ${reader.result}`;
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {imagesText.includes("data:image/") && (
                        <div className="w-full flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                          <p className="w-full text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <span>✓ Image(s) locale(s) encodée(s) en Base64</span>
                          </p>
                          {parseImagesText(imagesText).map((imgUrl, i) => {
                            const trimmed = imgUrl.trim();
                            if (trimmed.startsWith("data:image/")) {
                              return (
                                <div key={i} className="relative w-12 h-12 border border-slate-200 rounded-lg overflow-hidden group shadow-sm bg-white">
                                  <img src={trimmed} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = parseImagesText(imagesText)
                                        .filter((_, idx) => idx !== i)
                                        .join(", ");
                                      setImagesText(filtered);
                                    }}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Promotions engine */}
                  <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="hasPromo" 
                        checked={hasPromotion}
                        onChange={(e) => setHasPromotion(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="hasPromo" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Appliquer une promotion / remise commerciale active
                      </label>
                    </div>

                    {hasPromotion && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="grid grid-cols-2 gap-3 pt-2"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Type de remise</label>
                          <select
                            value={promoType}
                            onChange={(e) => setPromoType(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                          >
                            <option value="percentage">Pourcentage (%)</option>
                            <option value="fixed">Montant fixe (Ar)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Valeur de la remise</label>
                          <input
                            type="number"
                            value={promoValue}
                            onChange={(e) => setPromoValue(e.target.value)}
                            placeholder={promoType === "percentage" ? "15" : "50"}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Source URL */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Source URL (Scraping de concurrentiel)</label>
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.amazon.fr/dp/B0..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 bg-white sticky bottom-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                    <span>{isSubmitting ? "Enregistrement..." : "Valider l'insertion MongoDB"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Facebook Marketing Post & Publication Status Modal */}
        {selectedFacebookProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center font-black text-base shadow-sm">
                    f
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5 font-display">
                      Publication Facebook IA • Meta Graph API
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-medium">v21.0</span>
                    </h3>
                    <p className="text-[11px] text-blue-100 font-medium truncate max-w-md">
                      {selectedFacebookProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFacebookProduct(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Status Bar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Statut Meta API :</span>
                    {selectedFacebookProduct.facebook_publication_status === "published" && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {selectedFacebookProduct.facebook_is_simulated ? "Validé (Mode Bac à sable)" : "Publié en direct sur la Page"}
                      </span>
                    )}
                    {selectedFacebookProduct.facebook_publication_status === "generating" && (
                      <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-1 rounded-full border border-blue-300 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Génération du texte marketing (Gemini)...
                      </span>
                    )}
                    {selectedFacebookProduct.facebook_publication_status === "publishing" && (
                      <span className="bg-indigo-100 text-indigo-800 font-bold text-xs px-2.5 py-1 rounded-full border border-indigo-300 flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        Transmission à Meta Graph API...
                      </span>
                    )}
                    {selectedFacebookProduct.facebook_publication_status === "pending" && (
                      <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        En file d'attente (Asynchrone)
                      </span>
                    )}
                    {selectedFacebookProduct.facebook_publication_status === "failed" && (
                      <span className="bg-red-100 text-red-800 font-bold text-xs px-2.5 py-1 rounded-full border border-red-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        Échec de publication
                      </span>
                    )}
                    {(!selectedFacebookProduct.facebook_publication_status || selectedFacebookProduct.facebook_publication_status === "disabled") && (
                      <span className="bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-full">
                        Publication automatique désactivée
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedFacebookProduct.facebook_post_id && (
                      <div className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">Post ID :</span>
                        <span className="font-bold text-blue-700">{selectedFacebookProduct.facebook_post_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation Banner for Sandbox vs Live */}
                {selectedFacebookProduct.facebook_publication_status === "published" && selectedFacebookProduct.facebook_is_simulated && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-blue-800">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        Publication prête & validée par l'algorithme IA
                      </span>
                      {onNavigateToSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFacebookProduct(null);
                            onNavigateToSettings();
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Configurer le Jeton réel ⚙️
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      L'application fonctionne actuellement en mode <strong>Bac à sable (Sandbox)</strong>. Pour que vos posts s'affichent publiquement sur votre vraie Page Facebook, renseignez simplement votre <strong>Page Access Token</strong> (généré depuis <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">Meta Graph API Explorer</a> pour l'App <code className="font-mono bg-white px-1 py-0.2 rounded text-blue-800 font-bold">1424497619527088</code>) dans l'onglet Paramètres.
                    </p>
                  </div>
                )}

                {/* Error Banner if Failed */}
                {selectedFacebookProduct.facebook_error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                        <div>
                          <p className="font-bold text-red-900">
                            {selectedFacebookProduct.facebook_error.includes("Code 190") || selectedFacebookProduct.facebook_error.toLowerCase().includes("expiré") 
                              ? "Jeton d'accès Meta Expiré (Code 190)" 
                              : "Échec de publication Meta Graph API :"}
                          </p>
                          <p className="text-[11px] text-red-800 mt-1 leading-relaxed">{selectedFacebookProduct.facebook_error}</p>
                        </div>
                      </div>
                      {onNavigateToSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFacebookProduct(null);
                            onNavigateToSettings();
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                        >
                          Mettre à jour le Jeton ⚙️
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Authentic Simulated Facebook Page Post Feed */}
                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                  {/* Post Top Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs shrink-0 bg-slate-900 border border-slate-200">
                        <Logo size="sm" variant="icon" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-display">
                          PREMIUM SHOP Madagascar Official
                          <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">✓</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          {selectedFacebookProduct.facebook_published_at ? (
                            <span>{new Date(selectedFacebookProduct.facebook_published_at).toLocaleString("fr-FR")}</span>
                          ) : (
                            <span>À l'instant</span>
                          )}
                          <span>•</span>
                          <span>Public 🌐</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyPostContent(selectedFacebookProduct.facebook_post_content || "")}
                      disabled={!selectedFacebookProduct.facebook_post_content}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Copier le texte du post"
                    >
                      {hasCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopiedText ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>

                  {/* Post Copy (AI Generated text) */}
                  <div className="p-4 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-100">
                    {selectedFacebookProduct.facebook_post_content ? (
                      selectedFacebookProduct.facebook_post_content
                    ) : (
                      <div className="py-6 text-center text-slate-400 italic text-xs">
                        Le texte marketing rédigé par l'IA sera affiché ici dès sa génération...
                      </div>
                    )}
                  </div>

                  {/* Post Media / Photo Box */}
                  <div className="bg-slate-100 border-t border-b border-slate-100 relative group overflow-hidden max-h-72 flex items-center justify-center">
                    <img
                      src={selectedFacebookProduct.images && selectedFacebookProduct.images[0] ? selectedFacebookProduct.images[0] : "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800"}
                      alt={selectedFacebookProduct.name}
                      className="w-full h-full max-h-72 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white p-2.5 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold truncate max-w-xs">{selectedFacebookProduct.name}</div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold">
                          {selectedFacebookProduct.currentPrice.toLocaleString("fr-FR")} Ar
                        </div>
                      </div>
                      <span className="bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider">
                        Acheter maintenant
                      </span>
                    </div>
                  </div>

                  {/* Facebook Like / Comment Bar */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-around text-xs text-slate-500 font-bold">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                      <span>👍</span>
                      <span>J'aime</span>
                    </div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                      <span>💬</span>
                      <span>Commenter</span>
                    </div>
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                      <span>↗️</span>
                      <span>Partager</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedFacebookProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prod = selectedFacebookProduct;
                      setSelectedFacebookProduct(null);
                      setStoryModalProduct(prod);
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Créer la Story Facebook 📸</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerFacebookPublish(selectedFacebookProduct.id)}
                    disabled={isRetryingFacebook}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetryingFacebook ? "animate-spin" : ""}`} />
                    <span>{isRetryingFacebook ? "Publication en cours..." : "Relancer la publication Facebook"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Facebook Story Modal Studio */}
      {storyModalProduct && (
        <FacebookStoryModal
          product={storyModalProduct}
          settings={settings || ({} as SystemSettings)}
          isOpen={!!storyModalProduct}
          onClose={() => setStoryModalProduct(null)}
          onStoryPublished={(updatedProduct) => {
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

    </div>
  );
}
