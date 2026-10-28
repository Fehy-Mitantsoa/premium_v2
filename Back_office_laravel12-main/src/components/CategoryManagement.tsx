/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  X, 
  CheckCircle,
  Tag,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, UserRole } from "../types";

interface CategoryManagementProps {
  categories: Category[];
  currentUserRole: UserRole;
  onAddCategory: (category: Omit<Category, "id">) => Promise<any>;
  onEditCategory: (id: string, category: Partial<Category>) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<any>;
}

export default function CategoryManagement({
  categories = [],
  currentUserRole,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryManagementProps) {
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  // UI status states
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter categories based on search term
  const filteredCategories = categories.filter((c) => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
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

  const handleOpenEditModal = (c: Category) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à modifier des documents (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || "");
    setImage(c.image || "");
    setFormError("");
    setFormSuccess("");
    setSecurityWarning("");
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à supprimer des documents (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      try {
        await onDeleteCategory(id);
        setFormSuccess("Catégorie supprimée avec succès !");
        setTimeout(() => setFormSuccess(""), 4000);
      } catch (err: any) {
        setFormError(err.message || "Erreur de suppression.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (currentUserRole !== "Administrateur") {
      setFormError("Privilèges insuffisants : modification interdite.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    if (!trimmedName) {
      setFormError("Le nom de la catégorie est obligatoire.");
      return;
    }

    // Check if category already exists in database (case insensitive match on name or slug)
    const existingCategory = categories.find((c) => {
      const nameMatch = c.name.trim().toLowerCase() === trimmedName.toLowerCase();
      const slugMatch = c.slug && c.slug.trim().toLowerCase() === trimmedSlug.toLowerCase();
      return (nameMatch || slugMatch) && c.id !== editingId;
    });

    if (existingCategory) {
      setFormError(`⚠️ ALERTE BASE DE DONNÉES : La catégorie "${existingCategory.name}" (slug: "${existingCategory.slug}") existe déjà dans la base de données. L'enregistrement d'un doublon est bloqué.`);
      return;
    }

    if (isSubmitting) return; // Prevent duplicate clicks
    setIsSubmitting(true);

    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      description: description.trim(),
      image: image.trim()
    };

    try {
      if (editingId) {
        await onEditCategory(editingId, payload);
        setFormSuccess("Catégorie mise à jour avec succès !");
      } else {
        await onAddCategory(payload);
        setFormSuccess("Catégorie insérée avec succès dans MongoDB !");
      }
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="category-management-container">
      {/* Security Warning Banner */}
      {securityWarning && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3"
          id="role-security-alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs uppercase tracking-wider block mb-1">Alerte Protection Middleware</span>
            <p className="text-xs font-medium leading-relaxed">{securityWarning}</p>
            <button 
              onClick={() => setSecurityWarning("")}
              className="mt-2 text-[10px] text-red-600 font-bold underline hover:text-red-800 cursor-pointer"
            >
              Fermer l'alerte
            </button>
          </div>
        </motion.div>
      )}

      {/* Success banner */}
      {formSuccess && !isModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-medium"
        >
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {formSuccess}
        </motion.div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            id="btn-add-category"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Categories Grid/Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-4 w-12 text-center">Aperçu</th>
                <th className="p-4">Désignation</th>
                <th className="p-4">Code / Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-mono">
                    Aucune catégorie trouvée dans ecommerce_db.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center">
                      {c.image ? (
                        <img 
                          src={c.image} 
                          alt={c.name}
                          className="w-8 h-8 rounded-lg object-cover mx-auto border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                          <Tag className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-500">
                      {c.slug}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500">
                      {c.description || <span className="text-slate-300 italic">Aucune description</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
            <span>
              Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredCategories.length)} sur {filteredCategories.length} catégories
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 cursor-pointer"
              >
                Précédent
              </button>
              <span className="px-3 py-1 bg-slate-100 font-bold rounded text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 cursor-pointer"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col my-auto"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  {editingId ? "Modifier la catégorie NoSQL" : "Nouvelle catégorie NoSQL"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{formSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Désignation (Nom) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
                      }
                    }}
                    placeholder="Ex: Électronique, Vêtements, etc."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Code d'identification unique (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Ex: electronique"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Sera généré automatiquement si laissé vide.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Illustration de la catégorie (URL ou Photo Locale)
                  </label>
                  <div className="relative mb-2">
                    <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Local File Uploader for Category */}
                  <div className="border border-dashed border-slate-200 p-3 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="font-bold">Importer une photo locale</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">Formats acceptés : PNG, JPG, JPEG, WEBP, GIF</p>
                    
                    <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all mt-1 shadow-xs">
                      Sélectionner un fichier...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    {image && image.startsWith("data:image/") && (
                      <div className="w-full flex flex-col items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <span>✓ Image locale chargée (Base64)</span>
                        </p>
                        <div className="relative w-16 h-16 border border-slate-200 rounded-lg overflow-hidden group shadow-sm bg-white">
                          <img src={image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setImage("")}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Description de la catégorie
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Saisissez une brève description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 bg-white sticky bottom-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                    <span>{isSubmitting ? "Enregistrement..." : "Enregistrer"}</span>
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
