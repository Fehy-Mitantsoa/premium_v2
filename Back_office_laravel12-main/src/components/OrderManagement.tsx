/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Printer, 
  Download,
  AlertTriangle,
  ShoppingCart,
  Truck,
  CreditCard,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Send,
  Copy,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Check,
  Phone,
  Clock,
  Mail,
  Inbox,
  Eye,
  AtSign,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, Product, Customer, UserRole } from "../types";
import { 
  buildWhatsAppDirectLink, 
  buildDeterministicWhatsAppReply, 
  extractCustomerFirstName, 
  getCleanOrderNumber 
} from "../services/whatsappAutoService";

interface OrderManagementProps {
  orders: Order[];
  products: Product[];
  customers?: Customer[];
  onUpdateOrderStatus: (id: string, paymentStatus: "Payé" | "En attente" | "Remboursé", deliveryStatus: "Livré" | "En cours" | "Expédié" | "Annulé") => Promise<any>;
  currentUserRole: UserRole;
}

export default function OrderManagement({
  orders = [],
  products = [],
  customers = [],
  onUpdateOrderStatus,
  currentUserRole
}: OrderManagementProps) {
  // Filtering and lists
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Order for detailing / invoice printing
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Email Preview and Resend Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalType, setEmailModalType] = useState<"order_confirmation" | "payment_receipt">("order_confirmation");
  const [activeEmailOrder, setActiveEmailOrder] = useState<Order | null>(null);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string>("");
  const [emailPreviewText, setEmailPreviewText] = useState<string>("");
  const [emailPreviewSubject, setEmailPreviewSubject] = useState<string>("");
  const [emailPreviewRecipient, setEmailPreviewRecipient] = useState<string>("");
  const [emailPreviewTab, setEmailPreviewTab] = useState<"html" | "text">("html");
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailActionFeedback, setEmailActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // WhatsApp Customer Service modal & AI generation state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeWhatsAppOrder, setActiveWhatsAppOrder] = useState<Order | null>(null);
  const [whatsAppText, setWhatsAppText] = useState("");
  const [isGeneratingWhatsApp, setIsGeneratingWhatsApp] = useState(false);
  const [whatsAppScenario, setWhatsAppScenario] = useState<"auto" | "new_order" | "payment_validated" | "shipped" | "refund_claim">("auto");
  const [copySuccess, setCopySuccess] = useState(false);

  // Expanded items in row
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Success / Error alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Handler to open WhatsApp modal with pre-generated text
  const handleOpenWhatsAppModal = (order: Order, defaultScenario: "auto" | "new_order" | "payment_validated" | "shipped" | "refund_claim" = "auto") => {
    setActiveWhatsAppOrder(order);
    setWhatsAppScenario(defaultScenario);
    
    // If order already has a generated message and scenario is auto, use it; otherwise build default preview
    const initialText = (defaultScenario === "auto" && order.whatsappMessage)
      ? order.whatsappMessage
      : buildDeterministicWhatsAppReply(order, undefined, defaultScenario, products);
    setWhatsAppText(initialText);
    setCopySuccess(false);
    setIsWhatsAppModalOpen(true);
  };

  // Handler to generate or regenerate AI WhatsApp response
  const handleRegenerateWhatsAppReply = async (scenario: "auto" | "new_order" | "payment_validated" | "shipped" | "refund_claim" = whatsAppScenario) => {
    if (!activeWhatsAppOrder) return;
    setIsGeneratingWhatsApp(true);
    setWhatsAppScenario(scenario);
    setCopySuccess(false);

    try {
      const res = await fetch(`/api/orders/${activeWhatsAppOrder.id}/generate-whatsapp-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });

      if (res.ok) {
        const data = await res.json();
        setWhatsAppText(data.message || "");
        if (data.order) {
          setActiveWhatsAppOrder(data.order);
        }
        setSuccessMsg("Réponse WhatsApp générée avec succès par l'Agent IA !");
      } else {
        // Fallback local deterministic generation
        const fallbackText = buildDeterministicWhatsAppReply(activeWhatsAppOrder, undefined, scenario, products);
        setWhatsAppText(fallbackText);
      }
    } catch (err: any) {
      console.warn("Erreur requête IA WhatsApp, fallback local :", err);
      const fallbackText = buildDeterministicWhatsAppReply(activeWhatsAppOrder, undefined, scenario, products);
      setWhatsAppText(fallbackText);
    } finally {
      setIsGeneratingWhatsApp(false);
    }
  };

  // Handler to copy WhatsApp message
  const handleCopyWhatsAppText = () => {
    if (!whatsAppText) return;
    navigator.clipboard.writeText(whatsAppText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Handler to open direct WhatsApp conversation and mark as sent
  const handleSendWhatsAppMessage = async () => {
    if (!activeWhatsAppOrder) return;
    const phone = activeWhatsAppOrder.phone || "";
    const directLink = buildWhatsAppDirectLink(phone, whatsAppText);
    
    // Open in WhatsApp Web / App
    window.open(directLink, "_blank");

    // Mark as sent in backend
    try {
      await fetch(`/api/orders/${activeWhatsAppOrder.id}/mark-whatsapp-sent`, {
        method: "POST"
      });
      setActiveWhatsAppOrder(prev => prev ? { ...prev, whatsappStatus: "sent" } : null);
      setSuccessMsg(`Message WhatsApp envoyé et tracé pour la commande #${activeWhatsAppOrder.id} !`);
    } catch (err) {
      console.error("Erreur marquage statut WhatsApp :", err);
    }
  };

  // Handler to open Email confirmation / payment receipt preview modal
  const handleOpenEmailModal = async (order: Order, type: "order_confirmation" | "payment_receipt" = "order_confirmation") => {
    setActiveEmailOrder(order);
    setEmailModalType(type);
    setEmailActionFeedback(null);
    setEmailPreviewTab("html");
    setEmailPreviewRecipient(order.userEmail || order.email || "client@hightech-mada.com");
    setIsEmailModalOpen(true);
    setIsLoadingEmailPreview(true);

    try {
      const endpoint = type === "payment_receipt" 
        ? `/api/orders/${order.id}/payment-email-preview`
        : `/api/orders/${order.id}/email-preview`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setEmailPreviewHtml(data.html || "");
        setEmailPreviewText(data.text || "");
        setEmailPreviewSubject(data.subject || (type === "payment_receipt" ? `Reçu de paiement - Commande #${order.orderNumber || order.id}` : `Confirmation de votre commande #${order.orderNumber || order.id}`));
        setEmailPreviewRecipient(data.recipient || order.userEmail || order.email || "client@hightech-mada.com");
      } else {
        setEmailActionFeedback({
          success: false,
          message: "Impossible de charger l'aperçu du template e-mail."
        });
      }
    } catch (err: any) {
      setEmailActionFeedback({
        success: false,
        message: err?.message || "Erreur de chargement de l'e-mail."
      });
    } finally {
      setIsLoadingEmailPreview(false);
    }
  };

  // Handler to toggle between Order Confirmation and Payment Receipt inside modal
  const handleSwitchEmailModalType = async (type: "order_confirmation" | "payment_receipt") => {
    if (!activeEmailOrder) return;
    setEmailModalType(type);
    setIsLoadingEmailPreview(true);
    setEmailActionFeedback(null);

    try {
      const endpoint = type === "payment_receipt" 
        ? `/api/orders/${activeEmailOrder.id}/payment-email-preview`
        : `/api/orders/${activeEmailOrder.id}/email-preview`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setEmailPreviewHtml(data.html || "");
        setEmailPreviewText(data.text || "");
        setEmailPreviewSubject(data.subject || (type === "payment_receipt" ? `Reçu de paiement - Commande #${activeEmailOrder.orderNumber || activeEmailOrder.id}` : `Confirmation de votre commande #${activeEmailOrder.orderNumber || activeEmailOrder.id}`));
        setEmailPreviewRecipient(data.recipient || emailPreviewRecipient || activeEmailOrder.userEmail || "client@hightech-mada.com");
      }
    } catch (err: any) {
      console.warn("Erreur basculement aperçu e-mail :", err);
    } finally {
      setIsLoadingEmailPreview(false);
    }
  };

  // Handler to manually send / resend email confirmation or payment receipt
  const handleResendEmailConfirmation = async () => {
    if (!activeEmailOrder) return;
    setIsResendingEmail(true);
    setEmailActionFeedback(null);

    try {
      const endpoint = emailModalType === "payment_receipt"
        ? `/api/orders/${activeEmailOrder.id}/send-payment-email`
        : `/api/orders/${activeEmailOrder.id}/send-email-confirmation`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailPreviewRecipient, force: true, paymentStatus: activeEmailOrder.paymentStatus || "Payé" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const actionLabel = emailModalType === "payment_receipt" ? "Reçu de paiement et statut expédiés" : "E-mail de confirmation réexpédié";
        setEmailActionFeedback({
          success: true,
          message: `${actionLabel} avec succès à ${emailPreviewRecipient} !`
        });
        setSuccessMsg(`${actionLabel} à ${emailPreviewRecipient} !`);
        setActiveEmailOrder(prev => prev ? { 
          ...prev, 
          ...(emailModalType === "payment_receipt" ? { paymentEmailSent: true, paymentEmailStatus: "sent" } : { emailSent: true, emailStatus: "sent" }),
          userEmail: emailPreviewRecipient 
        } : null);
      } else {
        setEmailActionFeedback({
          success: false,
          message: data.error || "Erreur lors de l'envoi de l'e-mail."
        });
      }
    } catch (err: any) {
      setEmailActionFeedback({
        success: false,
        message: err?.message || "Erreur de connexion lors de l'envoi."
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const customerName = o.customerName || "";
    const id = o.id || "";
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = selectedPaymentStatus === "all" || o.paymentStatus === selectedPaymentStatus;
    const matchesDelivery = selectedDeliveryStatus === "all" || o.deliveryStatus === selectedDeliveryStatus;

    return matchesSearch && matchesPayment && matchesDelivery;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleStatusChange = async (id: string, nextPayment: "Payé" | "En attente" | "Remboursé", nextDelivery: "Livré" | "En cours" | "Expédié" | "Annulé") => {
    setSuccessMsg("");
    setErrorMsg("");
    setUpdatingOrderId(id);

    try {
      await onUpdateOrderStatus(id, nextPayment, nextDelivery);
      setSuccessMsg(`Commande #${id} mise à jour avec succès (Stock réajusté si annulée) !`);
      
      // Update locally selected order details if open
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: nextPayment, deliveryStatus: nextDelivery } : null);
      }
    } catch (err: any) {
      setErrorMsg("Erreur lors de la mise à jour de la commande : " + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = "ID_Commande,Client,Montant_Total,Statut_Paiement,Statut_Livraison,Date,Methode_Paiement\n";
    const rows = orders.map(o => 
      `"${o.id}","${o.customerName || ""}",${o.totalAmount || 0},"${o.paymentStatus || ""}","${o.deliveryStatus || ""}","${o.orderDate || ""}","${o.paymentMethod || ""}"`
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `compta_commandes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Filtering and CSV accounting actions */}
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
              placeholder="Rechercher par nom client, ID commande (#)..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter Journal (CSV)
            </button>
          </div>
        </div>

        {/* Filter selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {/* Payment Status filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Paiement :</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Tous les états de paiement</option>
              <option value="Payé">Payé</option>
              <option value="En attente">En attente</option>
              <option value="Remboursé">Remboursé</option>
            </select>
          </div>

          {/* Delivery status filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Livraison :</span>
            <select
              value={selectedDeliveryStatus}
              onChange={(e) => {
                setSelectedDeliveryStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-slate-700 text-xs focus:ring-0 outline-none pr-4 font-bold flex-1 cursor-pointer"
            >
              <option value="all">Tous les états d'expédition</option>
              <option value="En cours">Préparation en cours</option>
              <option value="Expédié">Expédié (Transit)</option>
              <option value="Livré">Livré</option>
              <option value="Annulé">Annulé (Retourné)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Success/Error Banners */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex justify-between items-start rounded-xl"
        >
          <div className="flex gap-2">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs flex justify-between items-start rounded-xl"
        >
          <div className="flex gap-2">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-700 cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Orders table list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
            Suivi et logistique des commandes clients ({filteredOrders.length})
          </h4>
          <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
            MongoDB Atlas Synchronisé
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Commande ID</th>
                <th className="py-3 px-4">Nom Client</th>
                <th className="py-3 px-4">Date de commande</th>
                <th className="py-3 px-4 text-center">Paiement</th>
                <th className="py-3 px-4 text-center">Livraison</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {paginatedOrders.map(o => {
                const isExpanded = expandedOrderId === o.id;

                return (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-slate-50/20 transition-colors">
                      {/* Chevron toggle */}
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => toggleExpandOrder(o.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Commande ID */}
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500">
                        #{o.id}
                      </td>

                      {/* Client Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {o.customerName || "Client inconnu"}
                      </td>

                      {/* Order Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                        {new Date(o.orderDate).toLocaleString("fr-FR")}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          o.paymentStatus === "Payé"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : o.paymentStatus === "Remboursé"
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          o.deliveryStatus === "Livré"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : o.deliveryStatus === "Expédié"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : o.deliveryStatus === "Annulé"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {o.deliveryStatus}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-950">
                        {(o.totalAmount || 0).toLocaleString("fr-FR")} Ar
                      </td>

                      {/* Quick invoice & WhatsApp actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Email Auto-Confirmation Button */}
                          <button
                            onClick={() => handleOpenEmailModal(o)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              o.emailSent || o.emailStatus === "sent"
                                ? "bg-purple-100/80 text-purple-800 hover:bg-purple-200 border border-purple-300"
                                : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                            }`}
                            title="Aperçu & Renvoi E-mail de confirmation"
                          >
                            <Mail className="w-3.5 h-3.5 text-purple-600" />
                            <span>E-mail</span>
                            {(o.emailSent || o.emailStatus === "sent") && (
                              <Check className="w-3 h-3 text-purple-700" />
                            )}
                          </button>

                          {/* WhatsApp Auto-Reply Button */}
                          <button
                            onClick={() => handleOpenWhatsAppModal(o, "auto")}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              o.whatsappStatus === "sent"
                                ? "bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                : o.whatsappMessage
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                            }`}
                            title="Réponse automatique WhatsApp (Agent IA)"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                            {o.whatsappStatus === "sent" && (
                              <Check className="w-3 h-3 text-emerald-700" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setIsInvoiceOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-transparent hover:border-slate-200"
                            title="Imprimer la facture"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Facture
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable products row detailing */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="p-4 border-b border-slate-200">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                                Détails de la commande #{o.id}
                              </h5>
                              {o.phone && (
                                <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-600" /> Contact : {o.phone}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Left: Product list */}
                              <div className="space-y-2 lg:col-span-1">
                                <h6 className="text-[10px] font-black text-slate-500 uppercase font-mono mb-2">Articles commandés</h6>
                                {(o.products || []).map((item, index) => (
                                  <div key={index} className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between shadow-xs">
                                    <div>
                                      <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">Ref: {item.productId}</p>
                                    </div>
                                    <div className="text-right font-mono">
                                      <p className="font-bold text-slate-900 text-xs">{item.quantity} x {item.priceAtPurchase} Ar</p>
                                      <p className="text-[10px] text-slate-400 font-bold">Total: {item.quantity * item.priceAtPurchase} Ar</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Center: WhatsApp AI Customer Service Assistant */}
                              <div className="bg-emerald-950/5 border border-emerald-200/80 p-4 rounded-xl space-y-3 lg:col-span-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="p-1 bg-emerald-600 text-white rounded-md">
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </div>
                                      <h6 className="text-xs font-black text-emerald-950">Agent IA WhatsApp</h6>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      o.whatsappStatus === "sent" 
                                        ? "bg-emerald-200 text-emerald-900" 
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}>
                                      {o.whatsappStatus === "sent" ? "✓ Envoyé" : "Généré prêt"}
                                    </span>
                                  </div>

                                  <div className="bg-white border border-emerald-100 p-3 rounded-lg text-xs text-slate-800 shadow-2xs font-sans leading-relaxed relative">
                                    <p className="italic text-slate-700">
                                      "{o.whatsappMessage || buildDeterministicWhatsAppReply(o)}"
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100">
                                  <button
                                    onClick={() => handleOpenWhatsAppModal(o, "auto")}
                                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Gérer / Envoyer</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      const text = o.whatsappMessage || buildDeterministicWhatsAppReply(o);
                                      navigator.clipboard.writeText(text);
                                      setSuccessMsg("Message WhatsApp copié dans le presse-papier !");
                                    }}
                                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                                    title="Copier"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Right: Operational modifiers (Spatie / Admin Role restrictions applied) */}
                              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 lg:col-span-1">
                                <h6 className="text-[10px] font-black text-slate-500 uppercase font-mono">Cockpit Logistique ERP</h6>
                                
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-600">Modifier l'état logistique :</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {/* Validate Payment */}
                                    {o.paymentStatus !== "Payé" && (
                                      <button
                                        disabled={o.deliveryStatus === "Annulé" || updatingOrderId === o.id}
                                        onClick={() => {
                                          handleStatusChange(o.id, "Payé", o.deliveryStatus as any);
                                          handleOpenWhatsAppModal({ ...o, paymentStatus: "Payé" }, "payment_validated");
                                        }}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {updatingOrderId === o.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                            <span>Validation...</span>
                                          </>
                                        ) : (
                                          <span>💳 Valider Paiement (+ WhatsApp)</span>
                                        )}
                                      </button>
                                    )}

                                    {/* Prep */}
                                    <button
                                      disabled={o.deliveryStatus === "Annulé" || o.deliveryStatus === "Livré" || updatingOrderId === o.id}
                                      onClick={() => handleStatusChange(o.id, o.paymentStatus as any, "En cours")}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer"
                                    >
                                      ✓ En préparation
                                    </button>

                                    {/* Shipped */}
                                    <button
                                      disabled={o.deliveryStatus === "Annulé" || o.deliveryStatus === "Livré" || updatingOrderId === o.id}
                                      onClick={() => {
                                        handleStatusChange(o.id, o.paymentStatus as any, "Expédié");
                                        handleOpenWhatsAppModal(o, "shipped");
                                      }}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 font-bold text-[10px] rounded-lg cursor-pointer"
                                    >
                                      🚀 Expédier (+ WhatsApp)
                                    </button>

                                    {/* Delivered */}
                                    <button
                                      disabled={o.deliveryStatus === "Annulé" || o.deliveryStatus === "Livré" || updatingOrderId === o.id}
                                      onClick={() => {
                                        handleStatusChange(o.id, "Payé", "Livré");
                                        handleOpenWhatsAppModal({ ...o, paymentStatus: "Payé", deliveryStatus: "Livré" }, "payment_validated");
                                      }}
                                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-700 font-bold text-[10px] rounded-lg cursor-pointer"
                                    >
                                      📦 Livraison confirmée (+ WhatsApp)
                                    </button>

                                    {/* Cancelled */}
                                    <button
                                      disabled={o.deliveryStatus === "Annulé" || o.deliveryStatus === "Livré" || updatingOrderId === o.id}
                                      onClick={() => {
                                        if (confirm("L'annulation recréditera automatiquement les stocks physiques dans MongoDB Atlas. Confirmer ?")) {
                                          handleStatusChange(o.id, "Remboursé", "Annulé");
                                        }
                                      }}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-700 font-bold text-[10px] rounded-lg cursor-pointer"
                                    >
                                      ✗ Annuler
                                    </button>
                                  </div>
                                </div>

                                <div className="text-[10px] bg-slate-50 p-2 border border-slate-100 rounded-lg text-slate-500 font-mono space-y-1">
                                  <div>Méthode : <span className="font-bold text-slate-700">{o.paymentMethod}</span></div>
                                  <div>Transporteur : <span className="font-bold text-slate-700">{o.carrier || "Coursier express"}</span></div>
                                  <div>Suivi : <span className="font-bold text-slate-700">{o.trackingNumber || `TRK-${getCleanOrderNumber(o)}`}</span></div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold font-sans text-xs">
                    Aucune commande trouvée.
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

      {/* Invoice generator printable overlay modal */}
      <AnimatePresence>
        {isInvoiceOpen && selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-800 my-8 flex flex-col"
              id="printable-invoice-card"
            >
              {/* Modal header (not printable) */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
                <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Générateur de Factures Commerciales ERP
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrintInvoice}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimer (Facture PDF)
                  </button>
                  <button onClick={() => setIsInvoiceOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* FACTURE BODY (ACTUALLY PRINTABLE) */}
              <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[75vh]" id="invoice-sheet">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h1 className="text-xl font-black text-slate-950 font-display tracking-tight">ECOMMERCE INTELLIGENT</h1>
                    <p className="text-[10px] text-slate-500 mt-0.5">Plateforme de Gestion des Ventes & Scraper NoSQL</p>
                    <p className="text-[9px] text-slate-400 mt-2 font-mono">Master II - Conception et implémentation</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-black text-blue-600 font-mono uppercase tracking-widest">FACTURE</h2>
                    <p className="text-xs font-bold text-slate-600 font-mono mt-1">Numéro : #FAC-{selectedOrder.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Date: {new Date(selectedOrder.orderDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                {/* Billing details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-2">Émetteur (Vendeur)</h4>
                    <p className="font-extrabold text-slate-800">E-Commerce Cockpit Corp.</p>
                    <p className="text-slate-500 mt-1">12 Rue de l'Innovation Tech</p>
                    <p className="text-slate-500">75013 Paris, France</p>
                    <p className="text-slate-500 mt-1 font-mono">Siret : 449 120 380 00012</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-2">Facturé à (Client NoSQL)</h4>
                    <p className="font-extrabold text-slate-800">{selectedOrder.customerName || "Client inconnu"}</p>
                    <p className="text-slate-500 mt-1">Client UID: #{selectedOrder.customerId || "N/A"}</p>
                    <p className="text-slate-500 mt-1">État de livraison : <span className="font-bold">{selectedOrder.deliveryStatus || "N/A"}</span></p>
                  </div>
                </div>

                {/* Items Invoice Table */}
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      <th className="py-2.5 px-3">Désignation de l'article</th>
                      <th className="py-2.5 px-3 text-center">Quantité</th>
                      <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                      <th className="py-2.5 px-3 text-right">Total (TTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                    {(selectedOrder.products || []).map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-3 font-sans font-extrabold text-slate-900">{item.name}</td>
                        <td className="py-3 px-3 text-center">{item.quantity}</td>
                        <td className="py-3 px-3 text-right">{item.priceAtPurchase} Ar</td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">{item.quantity * item.priceAtPurchase} Ar</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Accounting breakdown totals */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2 text-xs border-t border-slate-200 pt-4 font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Total HT :</span>
                      <span>{Math.round(selectedOrder.totalAmount * 0.8) } Ar</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>TVA (20%) :</span>
                      <span>{Math.round(selectedOrder.totalAmount * 0.2) } Ar</span>
                    </div>
                    <div className="flex justify-between text-slate-950 font-black border-t border-slate-200 pt-2 text-sm">
                      <span>TOTAL TTC :</span>
                      <span>{selectedOrder.totalAmount} Ar</span>
                    </div>

                    <div className="bg-emerald-50 text-emerald-700 p-2 text-center border border-emerald-200 rounded-lg text-[10px] font-bold font-sans mt-3">
                      Paiement validé par {selectedOrder.paymentMethod} • statut: {selectedOrder.paymentStatus}
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="text-center pt-8 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed font-sans font-semibold">
                  <p>Facture générée automatiquement par la plateforme e-commerce intelligente NoSQL.</p>
                  <p className="mt-1">Merci de votre confiance ! • Logiciel d'administration ERP v12</p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WHATSAPP AI CUSTOMER SERVICE MODAL */}
      <AnimatePresence>
        {isWhatsAppModalOpen && activeWhatsAppOrder && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-800 my-8 flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-emerald-950 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      Assistant IA Service Client WhatsApp
                      <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 text-[10px] rounded-full font-mono font-semibold">
                        Gemini Pro
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-200/80">
                      Commande #{activeWhatsAppOrder.id} • {activeWhatsAppOrder.customerName}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsWhatsAppModalOpen(false)} 
                  className="text-emerald-300 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 bg-slate-50/50">
                {/* Scenario selector tabs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Choisir le scénario du rôle Agent IA :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRegenerateWhatsAppReply("new_order")}
                      disabled={isGeneratingWhatsApp}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        whatsAppScenario === "new_order"
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="text-[11px] flex items-center gap-1">🟢 1. Commande reçue</div>
                      <div className="text-[9px] font-normal opacity-85 mt-0.5">Produit en boutique & Paiement avant livraison</div>
                    </button>

                    <button
                      onClick={() => handleRegenerateWhatsAppReply("payment_validated")}
                      disabled={isGeneratingWhatsApp}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        whatsAppScenario === "payment_validated"
                          ? "bg-indigo-700 text-white border-indigo-700 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="text-[11px] flex items-center gap-1">💳 2. Paiement validé</div>
                      <div className="text-[9px] font-normal opacity-85 mt-0.5">Règlement confirmé & Produit en livraison</div>
                    </button>

                    <button
                      onClick={() => handleRegenerateWhatsAppReply("shipped")}
                      disabled={isGeneratingWhatsApp}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        whatsAppScenario === "shipped"
                          ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="text-[11px] flex items-center gap-1">🚀 3. Expédié</div>
                      <div className="text-[9px] font-normal opacity-85 mt-0.5">Suivi & Coursier express</div>
                    </button>

                    <button
                      onClick={() => handleRegenerateWhatsAppReply("refund_claim")}
                      disabled={isGeneratingWhatsApp}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        whatsAppScenario === "refund_claim"
                          ? "bg-amber-700 text-white border-amber-700 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="text-[11px] flex items-center gap-1">💬 4. Réclamation</div>
                      <div className="text-[9px] font-normal opacity-85 mt-0.5">Transfert direct conseiller</div>
                    </button>
                  </div>
                </div>

                {/* Recipient & Order context bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Destinataire :</span>
                    <span className="font-bold text-slate-800">{activeWhatsAppOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Téléphone WhatsApp :</span>
                    <span className="font-bold text-emerald-700">{activeWhatsAppOrder.phone || "Non renseigné"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Montant :</span>
                    <span className="font-bold text-slate-900">{(activeWhatsAppOrder.totalAmount || 0).toLocaleString("fr-FR")} Ar</span>
                  </div>
                </div>

                {/* Generated Message Text Area */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      Message WhatsApp prêt à l'envoi (3 phrases max, poli & personnalisé) :
                    </label>
                    <button
                      onClick={() => handleRegenerateWhatsAppReply()}
                      disabled={isGeneratingWhatsApp}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingWhatsApp ? "animate-spin" : ""}`} />
                      Régénérer par IA
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      value={whatsAppText}
                      onChange={(e) => setWhatsAppText(e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed outline-none transition-all shadow-xs"
                      placeholder="Tapez ou générez le message..."
                    />
                    {isGeneratingWhatsApp && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          Génération IA en cours...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Directives : Prénom du client, concis, français uniquement, vérification stricte.</span>
                    <span>{whatsAppText.length} caractères</span>
                  </div>
                </div>

                {/* Direct link preview */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 truncate">
                    <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate font-mono text-[11px]">
                      {buildWhatsAppDirectLink(activeWhatsAppOrder.phone, whatsAppText)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyWhatsAppText}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le texte</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsWhatsAppModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>

                  <button
                    onClick={handleSendWhatsAppMessage}
                    className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ouvrir dans WhatsApp & Marquer envoyé</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Confirmation Preview & Resend Modal */}
      <AnimatePresence>
        {isEmailModalOpen && activeEmailOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-800 my-6 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    emailModalType === "payment_receipt" ? "bg-emerald-600" : "bg-purple-600"
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm font-display">
                        {emailModalType === "payment_receipt" ? "Reçu & Statut de Paiement par E-mail" : "Confirmation de Commande par E-mail"}
                      </h3>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded-full">
                        #{activeEmailOrder.orderNumber || activeEmailOrder.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {emailModalType === "payment_receipt" 
                        ? "Notification officielle du statut de paiement avec récapitulatif comptable et mode de règlement."
                        : "Génération automatique responsive (HTML) & Plain-Text avec les détails de la commande."}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsEmailModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Email Type Selector Tabs */}
              <div className="px-6 pt-3 pb-0 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchEmailModalType("order_confirmation")}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    emailModalType === "order_confirmation"
                      ? "bg-white text-purple-900 border-t-2 border-purple-600 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 bg-slate-200/50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Confirmation de commande</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchEmailModalType("payment_receipt")}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    emailModalType === "payment_receipt"
                      ? "bg-white text-emerald-900 border-t-2 border-emerald-600 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900 bg-slate-200/50"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Reçu & Statut de paiement</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeEmailOrder.paymentStatus === "Payé" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {activeEmailOrder.paymentStatus || "En attente"}
                  </span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                {/* Meta details & recipient */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Client</span>
                      <span className="font-bold text-slate-800">{activeEmailOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Statut Paiement</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-xs ${activeEmailOrder.paymentStatus === "Payé" ? "text-emerald-600" : "text-amber-600"}`}>
                        {activeEmailOrder.paymentStatus === "Payé" ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {activeEmailOrder.paymentStatus || "En attente"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Mode de règlement</span>
                      <span className="font-bold text-slate-700">{activeEmailOrder.paymentMethod || "Mobile Money"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-semibold">Montant Total</span>
                      <span className="font-bold text-slate-900 font-mono">{(activeEmailOrder.totalAmount || 0).toLocaleString("fr-FR")} Ar</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
                      <AtSign className="w-3.5 h-3.5 text-purple-600" />
                      E-mail du destinataire :
                    </label>
                    <input
                      type="email"
                      value={emailPreviewRecipient}
                      onChange={(e) => setEmailPreviewRecipient(e.target.value)}
                      placeholder="client@domaine.com"
                      className="w-full sm:flex-1 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Tabs HTML / Text preview */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEmailPreviewTab("html")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        emailPreviewTab === "html"
                          ? "bg-white text-purple-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Aperçu HTML Responsive
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailPreviewTab("text")}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        emailPreviewTab === "text"
                          ? "bg-white text-purple-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Version Texte (Plain text)
                    </button>
                  </div>

                  {emailPreviewSubject && (
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-xs hidden sm:inline">
                      Objet : <span className="font-bold text-slate-700">{emailPreviewSubject}</span>
                    </span>
                  )}
                </div>

                {/* Preview Frame / Content */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative min-h-[320px]">
                  {isLoadingEmailPreview ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        Génération du template e-mail...
                      </div>
                    </div>
                  ) : emailPreviewTab === "html" ? (
                    <div className="w-full">
                      <iframe
                        srcDoc={emailPreviewHtml}
                        title="Aperçu E-mail"
                        className="w-full h-[400px] border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap h-[400px] overflow-y-auto">
                      {emailPreviewText || "Aucun contenu texte brut généré."}
                    </div>
                  )}
                </div>

                {/* Feedback message */}
                {emailActionFeedback && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${emailActionFeedback.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    {emailActionFeedback.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
                    <p className="font-medium leading-relaxed">{emailActionFeedback.message}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={handleResendEmailConfirmation}
                  disabled={isResendingEmail || !emailPreviewRecipient}
                  className={`px-5 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    emailModalType === "payment_receipt" 
                      ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20" 
                      : "bg-purple-600 hover:bg-purple-500 hover:shadow-purple-500/20"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isResendingEmail 
                      ? "Expédition en cours..." 
                      : emailModalType === "payment_receipt" 
                      ? "Envoyer le reçu de paiement au client" 
                      : "Expédier confirmation de commande"}
                  </span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
