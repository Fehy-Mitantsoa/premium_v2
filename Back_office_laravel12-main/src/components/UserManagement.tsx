/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  UserCheck, 
  UserX,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserRole, UserStatus } from "../types";

interface UserManagementProps {
  users: User[];
  currentUserRole: UserRole;
  onAddUser: (user: Omit<User, "id" | "lastLogin">) => Promise<any>;
  onEditUser: (id: string, user: Partial<User>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
}

export default function UserManagement({
  users,
  currentUserRole,
  onAddUser,
  onEditUser,
  onDeleteUser,
}: UserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Analyste");
  const [status, setStatus] = useState<UserStatus>("Actif");

  // Status flags
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("Analyste");
    setStatus("Actif");
    setEditingId(null);
    setErrorMsg("");
    setSuccessMsg("");
    setSecurityWarning("");
  };

  const handleOpenAddModal = () => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à créer des utilisateurs (Spatie Permission: Role 'Administrateur' requis).");
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à modifier des profils d'utilisateurs (Spatie Permission: Role 'Administrateur' requis).");
      return;
    }
    setEditingId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (u: User) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à activer ou désactiver des profils (Spatie Permission: Role 'Administrateur' requis).");
      return;
    }
    const nextStatus: UserStatus = u.status === "Actif" ? "Inactif" : "Actif";
    try {
      await onEditUser(u.id, { status: nextStatus });
    } catch (err: any) {
      alert("Erreur lors de la modification du statut : " + err.message);
    }
  };

  const handleDeleteUserClick = async (id: string) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à supprimer des utilisateurs (Spatie Permission: Role 'Administrateur' requis).");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur du back-office ?")) {
      try {
        await onDeleteUser(id);
      } catch (err: any) {
        setSecurityWarning("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name || !email) {
      setErrorMsg("Veuillez renseigner le nom et l'adresse email.");
      return;
    }

    const payload = { name, email, role, status };

    try {
      if (editingId) {
        await onEditUser(editingId, payload);
        setSuccessMsg("Profil utilisateur mis à jour dans MongoDB Atlas !");
      } else {
        await onAddUser(payload);
        setSuccessMsg("Nouvel utilisateur créé avec succès dans MongoDB !");
      }
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de communication avec le serveur.");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Introduction and Controller Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-1 font-display">Administration des Utilisateurs & Rôles</h4>
          <p className="text-xs text-slate-500 font-medium">
            CRUD complet gérant l'habilitation des administrateurs et des analystes de la plateforme. Synchronisé avec MongoDB Atlas.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          id="add-user-btn"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Security alert block */}
      {securityWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex justify-between items-start"
          id="user-security-warn"
        >
          <div className="flex gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">Blocage Middleware Laravel — Accès Restreint</p>
              <p className="opacity-90 mt-0.5 font-semibold">{securityWarning}</p>
            </div>
          </div>
          <button onClick={() => setSecurityWarning("")} className="text-amber-500 hover:text-amber-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Users Database Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="users-table-card">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">Habilitations & Profils de l'équipe</h4>
          <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
            MongoDB Schema: `db.users`
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nom de l'utilisateur</th>
                <th className="py-3 px-4">Adresse E-mail</th>
                <th className="py-3 px-4">Rôle attribué</th>
                <th className="py-3 px-4">État de connexion</th>
                <th className="py-3 px-4 text-center">Statut d'accès</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-blue-600 border border-slate-200 font-bold font-mono">
                      {u.name ? u.name.charAt(0) : ""}
                    </div>
                    <span className="font-display font-bold">{u.name || "Utilisateur sans nom"}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-xs font-semibold">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role === "Administrateur" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                      {u.role === "Administrateur" ? "Administrateur" : "Analyste"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400 font-bold">
                    {u.lastLogin && typeof u.lastLogin === "string" && u.lastLogin.includes("Z") 
                      ? new Date(u.lastLogin).toLocaleString("fr-FR") 
                      : (u.lastLogin || "Jamais")}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        u.status === "Actif" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/50" 
                          : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/50"
                      }`}
                      title={u.status === "Actif" ? "Désactiver le compte" : "Activer le compte"}
                    >
                      {u.status === "Actif" ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Actif
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-red-500" />
                          Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                        title="Modifier le rôle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUserClick(u.id)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD User Overlay Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-800"
              id="user-crud-modal"
            >
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  {editingId ? "Modifier le compte utilisateur" : "Créer un nouvel utilisateur MongoDB"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                    <span className="font-semibold">{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <span className="font-semibold">{successMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom Complet *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex : Alice Bernard"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Adresse E-mail Académique *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@master-univ.fr"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Habilitation de Rôle *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 outline-none font-semibold"
                    >
                      <option value="Administrateur">Administrateur (Tous les droits)</option>
                      <option value="Analyste">Analyste (Lecture / Rapports / Outils)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">État de compte initial</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 outline-none font-semibold"
                    >
                      <option value="Actif">Actif (Accès autorisé)</option>
                      <option value="Inactif">Inactif (Désactivé)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Confirmer l'inscription
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
