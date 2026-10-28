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
  X, 
  CheckCircle, 
  AlertCircle, 
  Award,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend 
} from "recharts";
import { Customer, UserRole } from "../types";

interface CustomerManagementProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, "id" | "registrationDate" | "orderCount" | "totalSpend" | "lastLoginDate">) => Promise<any>;
  onEditCustomer: (id: string, customer: Partial<Customer>) => Promise<any>;
  onDeleteCustomer: (id: string) => Promise<any>;
  currentUserRole: UserRole;
}

export default function CustomerManagement({
  customers = [],
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  currentUserRole
}: CustomerManagementProps) {
  // Filters & Page
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"Actif" | "Bloqué">("Actif");

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");

  // Helper: Classify Loyality Tiers based on total spend
  const getCustomerTier = (spend: number) => {
    if (spend >= 1500) return { label: "Platine", color: "bg-purple-100 text-purple-700 border-purple-200", iconColor: "text-purple-600" };
    if (spend >= 800) return { label: "Or", color: "bg-amber-100 text-amber-700 border-amber-200", iconColor: "text-amber-500" };
    if (spend >= 300) return { label: "Argent", color: "bg-slate-100 text-slate-700 border-slate-200", iconColor: "text-slate-400" };
    return { label: "Bronze", color: "bg-orange-100 text-orange-700 border-orange-200", iconColor: "text-orange-600" };
  };

  // Filter pipeline
  const filteredCustomers = customers.filter(c => {
    const firstName = c.firstName || "";
    const lastName = c.lastName || "";
    const email = c.email || "";
    const phone = c.phone || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          phone.includes(searchTerm);
    
    const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
    
    const tier = getCustomerTier(c.totalSpend).label;
    const matchesTier = selectedTier === "all" || tier === selectedTier;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setStatus("Actif");
    setEditingId(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleOpenCreateModal = () => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à insérer des fiches clients (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à éditer les fiches clients (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    setEditingId(c.id);
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!firstName || !lastName || !email) {
      setErrorMsg("Veuillez remplir les champs obligatoires (Nom, Prénom, Email).");
      return;
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      address,
      status
    };

    try {
      if (editingId) {
        await onEditCustomer(editingId, payload);
        setSuccessMsg("Fiche client modifiée avec succès dans MongoDB !");
      } else {
        await onAddCustomer(payload);
        setSuccessMsg("Nouveau client inséré avec succès dans MongoDB !");
      }
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de communication avec le serveur.");
    }
  };

  const handleDeleteCustomerClick = async (id: string) => {
    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre profil 'Analyste' n'est pas autorisé à supprimer des fiches clients (Middleware de sécurité : Rôle 'Administrateur' requis).");
      return;
    }
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce client de MongoDB Atlas ? Allonger ou altérer ses commandes historiques n'est pas réversible.")) {
      try {
        await onDeleteCustomer(id);
      } catch (err: any) {
        setSecurityWarning("Erreur lors de la suppression : " + err.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = "ID,Nom,Prenom,Email,Telephone,Adresse,Statut,Commandes,Depenses,Rang\n";
    const rows = customers.map(c => {
      const tier = getCustomerTier(c.totalSpend).label;
      return `"${c.id || ""}","${c.lastName || ""}","${c.firstName || ""}","${c.email || ""}","${c.phone || ""}","${c.address || ""}","${c.status || ""}",${c.orderCount || 0},${c.totalSpend || 0},"${tier}"`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `crm_clients_mongodb_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const crmStats = React.useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === "Actif").length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);
    const totalSpend = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    return { total, active, totalOrders, totalSpend };
  }, [customers]);

  const pieData = React.useMemo(() => {
    const sorted = [...customers]
      .filter(c => (c.orderCount || 0) > 0)
      .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));

    if (sorted.length === 0) {
      return [];
    }

    if (sorted.length > 5) {
      const top = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const restOrders = rest.reduce((sum, c) => sum + (c.orderCount || 0), 0);
      
      const result = top.map(c => ({
        name: `${c.firstName} ${c.lastName}`.trim(),
        value: c.orderCount || 0,
      }));
      
      if (restOrders > 0) {
        result.push({
          name: "Autres",
          value: restOrders,
        });
      }
      return result;
    }

    return sorted.map(c => ({
      name: `${c.firstName} ${c.lastName}`.trim(),
      value: c.orderCount || 0,
    }));
  }, [customers]);

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* KPI & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Clients</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">{crmStats.total}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{crmStats.active} clients actifs</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Commandes</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">{crmStats.totalOrders}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Effectuées par vos clients</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Dépenses</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="text-sm font-bold">€</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">{crmStats.totalSpend.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Volume de vente CRM cumulé</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Panier Moyen CRM</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="text-xs font-bold">PM</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">
                {crmStats.totalOrders > 0 
                  ? `${(crmStats.totalSpend / crmStats.totalOrders).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                  : "0,00 €"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Par commande validée</p>
            </div>
          </div>
        </div>

        {/* Circular / Pie Chart Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Commandes par Client</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Répartition circulaire du volume</p>
          </div>

          <div className="flex-1 min-h-[160px] flex items-center justify-center relative mt-3">
            {pieData.length > 0 ? (
              <div className="w-full flex flex-col items-center">
                <div className="w-full h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => [`${value} commande(s)`, "Commandes"]}
                        contentStyle={{ background: "#1e293b", borderRadius: "8px", border: "none", color: "#fff", fontSize: "9px", padding: "4px 8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full mt-2 pt-2 border-t border-slate-100">
                  {pieData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="truncate">{entry.name}</span>
                      <span className="text-slate-400 text-[9px]">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-[10px] text-slate-400 font-bold">Aucune commande enregistrée</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CRM Actions & Filters panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom, prénom, email, téléphone..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter CRM (CSV)
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouveau Client
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {/* Status filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Statut :</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="Actif">Actif</option>
              <option value="Bloqué">Bloqué</option>
            </select>
          </div>

          {/* Loyalty Tier filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Segmentation :</span>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Toutes les catégories de fidélité</option>
              <option value="Platine">Platine (≥ 1 500 €)</option>
              <option value="Or">Or (≥ 800 €)</option>
              <option value="Argent">Argent (≥ 300 €)</option>
              <option value="Bronze">Bronze (&lt; 300 €)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security blocker warning */}
      {securityWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex justify-between items-start"
        >
          <div className="flex gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900">Limitation Rôle Securisé</p>
              <p className="opacity-90 mt-0.5 font-semibold">{securityWarning}</p>
            </div>
          </div>
          <button onClick={() => setSecurityWarning("")} className="text-amber-500 hover:text-amber-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Main loyalty list table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
            Segmentation clients CRM & Profils de consommation NoSQL ({filteredCustomers.length})
          </h4>
          <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
            MongoDB Atlas Node Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Client / Contact</th>
                <th className="py-3 px-4">Coordonnées</th>
                <th className="py-3 px-4">Inscrit le</th>
                <th className="py-3 px-4 text-center">Commandes</th>
                <th className="py-3 px-4 text-right">Dépenses Cumulées</th>
                <th className="py-3 px-4 text-center">Fidélité</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {paginatedCustomers.map(c => {
                const tier = getCustomerTier(c.totalSpend);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Client Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {(c.firstName ? c.firstName[0] : "") || ""}{(c.lastName ? c.lastName[0] : "") || ""}
                        </div>
                        <div>
                          <div className="font-bold text-slate-950">{(c.lastName || "").toUpperCase()} {c.firstName || ""}</div>
                          <div className="text-[9px] text-slate-400 font-mono">UID: {c.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Coordinates */}
                    <td className="py-3 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.phone || "Non renseigné"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] truncate max-w-xs">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.address || "Adresse manquante"}</span>
                      </div>
                    </td>

                    {/* Reg Date */}
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(c.registrationDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>

                    {/* Order Count */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {c.orderCount}
                    </td>

                    {/* Spend amount */}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {(c.totalSpend || 0).toLocaleString("fr-FR")} Ar
                    </td>

                    {/* Loyalty Tier badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border inline-flex items-center gap-1 ${tier.color}`}>
                        <Award className={`w-3.5 h-3.5 ${tier.iconColor}`} />
                        {tier.label}
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === "Bloqué" 
                          ? "bg-red-50 text-red-600 border border-red-200" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {c.status || "Actif"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Modifier la fiche client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomerClick(c.id)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Supprimer la fiche client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold font-sans text-xs">
                    Aucun client ne correspond aux critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* CRUD Overlap Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-800"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  {editingId ? "Modifier la fiche client CRM" : "Enregistrer un nouveau client CRM"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

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

                <div className="grid grid-cols-2 gap-4">
                  {/* Lastname & Firstname */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nom de famille *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Adresse Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jean.dupont@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Téléphone de contact</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Statut d'accès</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    >
                      <option value="Actif">Actif (Autorisé)</option>
                      <option value="Bloqué">Bloqué (Banni)</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Adresse physique de livraison</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="12 Avenue de Paris, 75001 Paris"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none transition-all"
                    />
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
                    Valider la fiche client
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
