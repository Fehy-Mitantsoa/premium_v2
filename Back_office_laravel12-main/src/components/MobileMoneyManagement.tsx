import React, { useState, useMemo } from "react";
import { 
  Shield, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  FileText, 
  Download, 
  Printer, 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ZoomIn,
  Wallet,
  Clock,
  User,
  MapPin,
  Phone,
  Hash,
  MessageSquare,
  RefreshCw,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileMoneyPayment, Order, User as UserType } from "../types";

interface MobileMoneyManagementProps {
  payments: MobileMoneyPayment[];
  orders: Order[];
  currentUser: { name: string; email: string; role: string };
  onUpdatePayment: (id: string, payload: Partial<MobileMoneyPayment>) => Promise<void>;
}

export default function MobileMoneyManagement({
  payments,
  orders,
  currentUser,
  onUpdatePayment
}: MobileMoneyManagementProps) {
  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [providerFilter, setProviderFilter] = useState<"all" | "MVola" | "Airtel Money" | "Orange Money">("all");
  const [dateFilter, setDateFilter] = useState("");
  
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [selectedPayment, setSelectedPayment] = useState<MobileMoneyPayment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  const [isRejecting, setIsRejectionFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<{ id: string; type: "validate" | "reject" } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Quick Inline Confirmation State (replaces blocking native confirms)
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Security verification check moved down below hooks to prevent React hook count mismatch


  // --- STATISTIQUES CALCULS ---
  const stats = useMemo(() => {
    const totalCount = payments.length;
    const pendingCount = payments.filter(p => p.status === "pending").length;
    const approvedCount = payments.filter(p => p.status === "approved").length;
    const rejectedCount = payments.filter(p => p.status === "rejected").length;

    // Daily & Monthly approved validation amounts
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);

    const approvedToday = payments
      .filter(p => p.status === "approved" && p.verifiedAt && p.verifiedAt.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    const approvedThisMonth = payments
      .filter(p => p.status === "approved" && p.verifiedAt && p.verifiedAt.startsWith(thisMonthStr))
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      approvedToday,
      approvedThisMonth
    };
  }, [payments]);

  // --- FILTER & SEARCH ---
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // 1. Search term
      const search = searchTerm.toLowerCase().trim();
      const matchSearch = !search || 
        payment.customerName.toLowerCase().includes(search) ||
        payment.reference.toLowerCase().includes(search) ||
        payment.phone.includes(search) ||
        payment.orderId.toLowerCase().includes(search);

      // 2. Status filter
      const matchStatus = statusFilter === "all" || payment.status === statusFilter;

      // 3. Provider filter
      const matchProvider = providerFilter === "all" || payment.provider === providerFilter;

      // 4. Date filter
      const matchDate = !dateFilter || payment.sentAt.startsWith(dateFilter);

      return matchSearch && matchStatus && matchProvider && matchDate;
    });
  }, [payments, searchTerm, statusFilter, providerFilter, dateFilter]);

  // --- PAGINATION ---
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;

  // --- ACTIONS ---
  const handleValidate = async (paymentId: string) => {
    setIsSubmitting(true);
    setSubmittingAction({ id: paymentId, type: "validate" });
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await onUpdatePayment(paymentId, {
        status: "approved",
        verifiedBy: currentUser.name,
        verifiedAt: new Date().toISOString()
      });
      setSuccessMsg("Paiement validé avec succès ! La commande associée a été marquée comme payée.");
      setConfirmingId(null);
      // Close details if validating inside modal
      if (selectedPayment?.id === paymentId) {
        setIsDetailOpen(false);
        setSelectedPayment(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de la validation.");
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      setErrorMsg("Veuillez saisir un motif pour rejeter le paiement.");
      return;
    }
    setIsSubmitting(true);
    setSubmittingAction({ id: paymentId, type: "reject" });
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await onUpdatePayment(paymentId, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
        verifiedBy: currentUser.name,
        verifiedAt: new Date().toISOString()
      });
      setSuccessMsg("Paiement rejeté avec succès. Le motif a bien été consigné.");
      setIsRejectionFormOpen(false);
      setRejectionReason("");
      if (selectedPayment?.id === paymentId) {
        setIsDetailOpen(false);
        setSelectedPayment(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors du rejet.");
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  // Find order associated with the payment
  const selectedOrder = useMemo(() => {
    if (!selectedPayment) return null;
    const targetId = (selectedPayment.orderId || "").trim().toLowerCase();
    const targetRef = (selectedPayment.reference || "").trim().toLowerCase();
    return orders.find(o => {
      const oId = (o.id || "").trim().toLowerCase();
      const oNum = (o.orderNumber || "").trim().toLowerCase();
      const oRef = (o.transactionReference || "").trim().toLowerCase();
      return (targetId && (oId === targetId || oNum === targetId)) ||
             (targetRef && oRef === targetRef) ||
             (o.customerName && selectedPayment.customerName && o.customerName.toLowerCase() === selectedPayment.customerName.toLowerCase() && o.totalAmount === selectedPayment.amount);
    }) || null;
  }, [selectedPayment, orders]);

  // Security Verification (Runs after all React hooks are declared to avoid hook count mismatch)
  if (currentUser.role !== "Administrateur") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 bg-red-100 border border-red-200 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Accès Réservé aux Administrateurs</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Désolé, cette page contient des données financières confidentielles. Seuls les comptes avec le rôle <strong>Administrateur</strong> sont autorisés à consulter et valider les paiements.
        </p>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Votre rôle actuel :</span> {currentUser.role} ({currentUser.name})
              <p className="mt-1">Veuillez utiliser l'option de simulation de rôle dans le menu latéral pour intervertir votre profil.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EXPORTS & IMPRESSIONS ---
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>Rapport de Paiements Mobile Money - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #334155; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
            h2 { text-align: center; font-size: 14px; font-weight: normal; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 11px; }
            th { bg-color: #f1f5f9; font-weight: bold; }
            .status-badge { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>RAPPORT DE PAIEMENTS MOBILE MONEY</h1>
          <h2>Généré le ${new Date().toLocaleString()} par ${currentUser.name}</h2>
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Commande</th>
                <th>Montant</th>
                <th>Opérateur</th>
                <th>Date d'envoi</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(p => `
                <tr>
                  <td><b>${p.reference}</b></td>
                  <td>${p.customerName}</td>
                  <td>${p.phone}</td>
                  <td>#${p.orderId}</td>
                  <td>${p.amount} Ar</td>
                  <td>${p.provider}</td>
                  <td>${new Date(p.sentAt).toLocaleDateString()}</td>
                  <td class="status-badge">${p.status === "approved" ? "Approuvé" : p.status === "rejected" ? "Rejeté" : "En attente"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ["Référence", "Nom du client", "Téléphone", "Adresse de livraison", "Numéro de commande", "Montant (Ar)", "Opérateur", "Date d'envoi", "Statut", "Validé par", "Validé le", "Motif rejet"];
    const rows = filteredPayments.map(p => [
      p.reference,
      p.customerName,
      p.phone,
      p.deliveryAddress.replace(/,/g, " "),
      p.orderId,
      p.amount,
      p.provider,
      p.sentAt,
      p.status,
      p.verifiedBy || "",
      p.verifiedAt || "",
      p.rejectionReason || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_paiements_mobile_money_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* HUD - TOAST SUCCESS & ERROR FEEDBACK */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-xs font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- CARDS STATISTIQUES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total paiements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Paiements</span>
            <h3 className="text-lg font-black text-slate-900 mt-1 font-mono">{stats.totalCount}</h3>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase font-mono">En attente</span>
            <h3 className="text-lg font-black text-slate-900 mt-1 font-mono">{stats.pendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approuvés */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase font-mono">Approuvés</span>
            <h3 className="text-lg font-black text-slate-900 mt-1 font-mono">{stats.approvedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-500">
            <Check className="w-5 h-5" />
          </div>
        </div>

        {/* Rejetés */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-500 uppercase font-mono">Rejetés</span>
            <h3 className="text-lg font-black text-slate-900 mt-1 font-mono">{stats.rejectedCount}</h3>
          </div>
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500">
            <X className="w-5 h-5" />
          </div>
        </div>

        {/* Validé aujourd'hui */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase font-mono">Validé Aujourd'hui</span>
            <h3 className="text-xs font-black text-slate-900 mt-1 font-mono truncate">{stats.approvedToday.toLocaleString()} Ar</h3>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-500 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Validé ce mois */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono">Validé ce Mois</span>
            <h3 className="text-xs font-black text-slate-900 mt-1 font-mono truncate">{stats.approvedThisMonth.toLocaleString()} Ar</h3>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-500 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* --- RECHERCHE, EXPORTS ET FILTRES --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Recherche instantanée */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher par client, référence, n° tél ou commande..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Export & Print actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              title="Exporter vers Excel (CSV)"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>CSV / Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
              title="Imprimer la liste filtrée"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>

        {/* Barre de filtres avancés */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 text-xs">
          
          {/* Filtre Moyen de paiement */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Opérateur :</span>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-700 focus:border-blue-500"
            >
              <option value="all">Tous les opérateurs</option>
              <option value="MVola">MVola</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Orange Money">Orange Money</option>
            </select>
          </div>

          {/* Filtre Date */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Date d'envoi :</span>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-700 focus:border-blue-500"
              />
            </div>
            {dateFilter && (
              <button 
                onClick={() => { setDateFilter(""); setCurrentPage(1); }} 
                className="text-red-500 hover:text-red-700 font-bold"
                title="Effacer la date"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtre Status (Tabs) */}
          <div className="flex items-center gap-1.5 ml-auto bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setStatusFilter("pending"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "pending" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => { setStatusFilter("approved"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "approved" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Approuvés
            </button>
            <button
              onClick={() => { setStatusFilter("rejected"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "rejected" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Rejetés
            </button>
          </div>
        </div>
      </div>

      {/* --- TABLEAU RESPONSIVE --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="mobile-money-payments-table">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-4.5 px-5">Référence</th>
                <th className="py-4.5 px-4">Client</th>
                <th className="py-4.5 px-4">Téléphone</th>
                <th className="py-4.5 px-4">Commande</th>
                <th className="py-4.5 px-4 text-right">Montant</th>
                <th className="py-4.5 px-4">Opérateur</th>
                <th className="py-4.5 px-4">Date d'envoi</th>
                <th className="py-4.5 px-4 text-center">Statut</th>
                <th className="py-4.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Aucun paiement trouvé</p>
                    <p className="text-[11px] text-slate-400 mt-1">Ajustez vos filtres de recherche ou sélectionnez d'autres critères.</p>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  // Badge design for Operator/Provider
                  let providerBadge = "bg-purple-100 text-purple-700 border-purple-200";
                  if (p.provider === "MVola") providerBadge = "bg-amber-100 text-amber-700 border-amber-200";
                  if (p.provider === "Airtel Money") providerBadge = "bg-red-100 text-red-700 border-red-200";
                  if (p.provider === "Orange Money") providerBadge = "bg-orange-100 text-orange-700 border-orange-200";

                  // Badge design for Status
                  let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                  if (p.status === "approved") statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  if (p.status === "rejected") statusBadge = "bg-red-100 text-red-800 border-red-200";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 font-bold font-mono text-slate-900">{p.reference}</td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{p.customerName}</td>
                      <td className="py-4 px-4 font-mono text-slate-500">{p.phone}</td>
                      <td className="py-4 px-4 font-mono text-slate-500">#{p.orderId}</td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono">
                        {p.amount.toLocaleString()} Ar
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${providerBadge}`}>
                          {p.provider}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-mono">
                        {new Date(p.sentAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {p.status === "pending" ? "En attente" : p.status === "approved" ? "Approuvé" : "Rejeté"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(p);
                              setIsDetailOpen(true);
                              setIsRejectionFormOpen(false);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Voir les détails complets"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {p.status === "pending" && (
                            <>
                              {confirmingId === p.id ? (
                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 p-0.5 rounded-lg animate-fade-in z-10">
                                  <button
                                    onClick={() => handleValidate(p.id)}
                                    className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer disabled:opacity-60 flex items-center justify-center min-w-[22px] min-h-[22px]"
                                    title="Confirmer la validation"
                                    disabled={isSubmitting}
                                  >
                                    {submittingAction?.id === p.id && submittingAction?.type === "validate" ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setConfirmingId(null)}
                                    className="p-1 bg-slate-500 hover:bg-slate-600 text-white rounded cursor-pointer"
                                    title="Annuler"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setConfirmingId(p.id)}
                                    disabled={isSubmitting}
                                    className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Valider le paiement"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPayment(p);
                                      setIsDetailOpen(true);
                                      setIsRejectionFormOpen(true);
                                    }}
                                    disabled={isSubmitting}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Rejeter le paiement"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION & LIGNES PAR PAGE --- */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Lignes par page :</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg p-1.5 bg-white font-mono text-slate-700 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span className="text-slate-500">
            Affichage de <b>{Math.min(filteredPayments.length, (currentPage - 1) * pageSize + 1)}</b> à{" "}
            <b>{Math.min(filteredPayments.length, currentPage * pageSize)}</b> sur <b>{filteredPayments.length}</b> lignes
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageIdx = i + 1;
              return (
                <button
                  key={pageIdx}
                  onClick={() => setCurrentPage(pageIdx)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    currentPage === pageIdx 
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageIdx}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL DRAWER : DETAILS DE PAIEMENT --- */}
      <AnimatePresence>
        {isDetailOpen && selectedPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDetailOpen(false);
                setSelectedPayment(null);
              }}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col justify-between border-l border-slate-200"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Détails de paiement</span>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
                    Réf : {selectedPayment.reference}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedPayment(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Info Body */}
              <div className="p-6 space-y-6 flex-1">
                
                {/* 1. Statut Actuel */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Statut du paiement :</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    selectedPayment.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    selectedPayment.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    "bg-red-100 text-red-800 border-red-200"
                  }`}>
                    {selectedPayment.status === "pending" ? "En attente de validation" :
                     selectedPayment.status === "approved" ? "Approuvé" : "Rejeté"}
                  </span>
                </div>

                {/* 2. Infos Client */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Informations du client</span>
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2 shadow-sm">
                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-500">Nom complet :</span> {selectedPayment.customerName}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5"><span className="font-bold text-slate-500">N° Téléphone :</span> <span className="font-mono">{selectedPayment.phone}</span></p>
                    <p className="text-xs text-slate-600 flex items-start gap-1.5"><span className="font-bold text-slate-500 shrink-0">Livraison :</span> <span className="text-slate-700">{selectedPayment.deliveryAddress}</span></p>
                  </div>
                </div>

                {/* 3. Infos Paiement */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span>Informations du paiement</span>
                  </h3>
                  <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2.5 shadow-sm font-sans">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Opérateur :</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedPayment.provider === "MVola" ? "bg-amber-100 text-amber-700 border-amber-200" :
                        selectedPayment.provider === "Airtel Money" ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-orange-100 text-orange-700 border-orange-200"
                      }`}>
                        {selectedPayment.provider}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Montant reçu :</span>
                      <span className="font-black text-slate-900 font-mono text-sm">{selectedPayment.amount.toLocaleString()} Ar</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Date d'envoi :</span>
                      <span className="font-mono text-slate-700">{new Date(selectedPayment.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Commande Associée */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span>Commande Associée</span>
                  </h3>
                  {selectedOrder ? (
                    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm text-xs">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span><b>N° Commande :</b> #{selectedOrder.id}</span>
                        <span><b>Date :</b> {new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Products List */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedOrder.products.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <div>
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Qte : {item.quantity} x {item.priceAtPurchase.toLocaleString()} Ar</p>
                            </div>
                            <span className="font-mono font-bold text-slate-700 shrink-0">
                              {(item.quantity * item.priceAtPurchase).toLocaleString()} Ar
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100 text-sm">
                        <span>Grand Total :</span>
                        <span className="font-mono">{selectedOrder.totalAmount.toLocaleString()} Ar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-center italic text-xs">
                      Aucun détail de commande disponible pour la référence #{selectedPayment.orderId}
                    </div>
                  )}
                </div>

                {/* 5. Preuves de paiement (Images) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Preuve(s) de paiement</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedPayment.proofs && selectedPayment.proofs.length > 0 ? (
                      selectedPayment.proofs.map((proof, i) => (
                        <div key={i} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-100 aspect-video">
                          <img
                            src={proof}
                            alt="Preuve"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setZoomImage(proof)}
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm cursor-pointer"
                              title="Agrandir l'aperçu"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                            <a
                              href={proof}
                              download={`preuve_${selectedPayment.reference}_${i}.jpg`}
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm cursor-pointer"
                              title="Télécharger l'image"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-4 bg-slate-50 text-slate-400 rounded-xl text-center italic text-xs">
                        Aucune image de preuve n'a été téléversée pour cette transaction.
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Historique de validation / Rejet */}
                {selectedPayment.status !== "pending" && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-xs">
                    <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase font-display text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Historique d'administration</span>
                    </h4>
                    <p className="text-slate-600"><span className="font-bold text-slate-500">Date d'action :</span> {selectedPayment.verifiedAt ? new Date(selectedPayment.verifiedAt).toLocaleString() : ""}</p>
                    <p className="text-slate-600"><span className="font-bold text-slate-500">Administrateur :</span> {selectedPayment.verifiedBy || ""}</p>
                    {selectedPayment.status === "rejected" && (
                      <p className="text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-100 mt-2">
                        <span className="font-bold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Motif du rejet :</span> 
                        <span className="block mt-1 font-medium">{selectedPayment.rejectionReason}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Footer controls */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                {selectedPayment.status === "pending" ? (
                  <>
                    {isRejecting ? (
                      <div className="w-full space-y-3 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-700">Saisir le motif du rejet :</label>
                        <textarea
                          placeholder="Ex: La référence de transaction est introuvable sur le réseau..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
                          rows={3}
                          disabled={isSubmitting}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(selectedPayment.id)}
                            disabled={isSubmitting}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                          >
                            {submittingAction?.id === selectedPayment.id && submittingAction?.type === "reject" ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Rejet en cours...</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
                                <span>Confirmer le rejet</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsRejectionFormOpen(false);
                              setRejectionReason("");
                            }}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir VALIDER ce paiement ? Cette action passera la commande associée au statut 'Payée'.")) {
                              handleValidate(selectedPayment.id);
                            }
                          }}
                          disabled={isSubmitting}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {submittingAction?.id === selectedPayment.id && submittingAction?.type === "validate" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Validation en cours...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Valider le paiement</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setIsRejectionFormOpen(true)}
                          disabled={isSubmitting}
                          className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-xl text-xs font-bold border border-red-100 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Rejeter</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    {selectedPayment.status === "rejected" && (
                      <button
                        onClick={() => {
                          if (window.confirm("Voulez-vous ré-approuver et VALIDER ce paiement ? La commande passera au statut 'Payé'.")) {
                            handleValidate(selectedPayment.id);
                          }
                        }}
                        disabled={isSubmitting}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {submittingAction?.id === selectedPayment.id && submittingAction?.type === "validate" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Ré-approbation en cours...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Ré-approuver ce paiement</span>
                          </>
                        )}
                      </button>
                    )}
                    {selectedPayment.status === "approved" && (
                      <button
                        onClick={() => setIsRejectionFormOpen(true)}
                        disabled={isSubmitting}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 border border-red-100 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsDetailOpen(false);
                        setSelectedPayment(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Fermer la fiche
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- LIGHTBOX (IMAGE ZOOM) --- */}
      <AnimatePresence>
        {zoomImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomImage}
              alt="Zoom Preuve"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up"
            />
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
