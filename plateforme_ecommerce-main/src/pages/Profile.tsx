/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Order } from '../types';
import Loader from '../components/Loader';
import PhoneInput from "../components/PhoneInput";
import MobileMoneyPaymentForm from '../components/MobileMoneyPaymentForm';
import { User, MapPin, Phone, Mail, ShoppingBag, Eye, Calendar, Tag, ShieldCheck, X, CreditCard, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { user, updateProfile, showToast, logout, addToCart } = useApp();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Sync profile states on reload
    setName(user.name);
    setAddress(user.address || '');
    setPhone(user.phone || '');

    // Fetch user order history
    async function fetchOrders() {
      try {
        setLoadingOrders(true);
        const res = await api.get('/api/orders');
        // Sort newest orders first
        const sorted = res.data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(sorted);
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [user, navigate, refreshKey]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Le nom ne peut pas être vide.', 'error');
      return;
    }

    try {
      setUpdating(true);
      await updateProfile(name.trim(), address.trim(), phone.trim());
    } catch (err) {
      // Handled in context
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'En attente':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'En attente' };
      case 'Confirmée':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-100', label: 'Confirmée' };
      case 'En préparation':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'En préparation' };
      case 'Expédiée':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Expédiée 🚚' };
      case 'Livrée':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Livrée ✓' };
      case 'Annulée':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Annulée' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-100 dark:border-slate-700', label: status };
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Header Profile Title */}
      <div className="pb-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">
            Mon Espace Client
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez votre adresse de livraison et suivez vos colis premium
          </p>
        </div>
        <button
          onClick={logout}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
        >
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: PROFILE CARD EDIT */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm space-y-6">
            <h3 className="font-sans font-extrabold text-slate-900 text-sm uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              Vos informations
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
                />
              </div>

              {/* Email (Disabled) */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Adresse de messagerie (Non modifiable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 cursor-not-allowed font-mono"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Téléphone
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  inputClassName="p-3 text-xs font-mono"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Adresse de livraison
                </label>
                <input
                  type="text"
                  placeholder="ex: 12 Rue de la Paix, 75002 Paris"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl transition-all shadow"
              >
                {updating ? 'Mise à jour...' : 'Sauvegarder les modifications'}
              </button>

            </form>
          </div>
        </div>

        {/* RIGHT PANEL: ORDERS HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-sans font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Historique de vos commandes ({orders.length})
          </h3>

          {loadingOrders ? (
            <div className="py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <Loader />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <span className="text-4xl">🛍️</span>
              <h4 className="font-sans font-bold text-slate-700 text-base">Aucune commande enregistrée</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Vous n'avez pas encore effectué d'achats. Composez votre panier et découvrez notre catalogue exclusif.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const badge = getStatusStyle(ord.status);
                const isPaid = ord.paymentStatus === 'Payée';
                const isCOD = ord.paymentStatus === 'Paiement à la livraison' || ord.paymentMethod === 'Paiement à la livraison';
                const isUnpaid = !isPaid && !isCOD && ord.status !== 'Annulée';

                return (
                  <div
                    key={ord.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                          {ord.orderNumber || `#${ord.id}`}
                        </span>
                        
                        {/* Order status */}
                        <span className={`text-[10px] font-bold border rounded px-2 py-0.5 uppercase ${badge.bg}`}>
                          {badge.label}
                        </span>

                        {/* Payment status badge */}
                        {isPaid ? (
                          <span className="text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded px-2 py-0.5">
                            ✓ Payée
                          </span>
                        ) : isCOD ? (
                          <span className="text-[10px] font-bold border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded px-2 py-0.5">
                            À la livraison
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded px-2 py-0.5 animate-pulse">
                            Paiement en attente
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span>•</span>
                        <span>{ord.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400 font-mono">Montant</p>
                        <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {Number(ord.total).toLocaleString('fr-FR')} Ar
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Bouton pour aller au mode de paiement si non payé */}
                        {isUnpaid && (
                          <button
                            type="button"
                            onClick={() => navigate(`/payment?orderNumber=${encodeURIComponent(ord.orderNumber || ord.id)}`)}
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold transition-all flex items-center gap-1.5 text-xs shadow-sm ring-2 ring-amber-400/30 cursor-pointer"
                            title="Procéder au paiement de cette commande"
                          >
                            <CreditCard className="w-4 h-4 text-slate-950" />
                            <span>Payer</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/track?order=${encodeURIComponent(ord.orderNumber || ord.id)}`)}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                          title="Suivre la commande"
                        >
                          <Package className="w-4 h-4" />
                          <span className="hidden sm:inline">Suivre</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Détails</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* SELECTED ORDER MODAL OVERLAY */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans font-extrabold text-slate-900 text-lg">
                    Commande {selectedOrder.orderNumber || `#${selectedOrder.id}`}
                  </h3>
                  <span className={`text-[10px] font-bold border rounded px-2 py-0.5 uppercase ${getStatusStyle(selectedOrder.status).bg}`}>
                    {getStatusStyle(selectedOrder.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Enregistrée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 border-y border-slate-100 dark:border-slate-700 py-4 max-h-60 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 border overflow-hidden shrink-0">
                        <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="text-xs">
                        <h5 className="font-bold text-slate-800 line-clamp-1">{item.name}</h5>
                        <p className="text-slate-400 mt-0.5">Quantité : {item.quantity} × {item.price} Ar</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900">{item.price * item.quantity} Ar</span>
                  </div>
                ))}
              </div>

              {/* Details & Total Recap */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <h5 className="font-mono font-bold text-[9px] text-slate-400 uppercase tracking-wider">Adresse de livraison</h5>
                  <p className="text-slate-800 font-medium leading-relaxed">{selectedOrder.address}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="font-mono font-bold text-[9px] text-slate-400 uppercase tracking-wider">Téléphone</h5>
                  <p className="text-slate-800 font-medium font-mono">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-150">
                  <h5 className="font-mono font-bold text-[9px] text-slate-400 uppercase tracking-wider">Règlement</h5>
                  <p className="text-slate-800 font-medium">{selectedOrder.paymentMethod || 'Visa'}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-150 text-right">
                  <h5 className="font-mono font-bold text-[9px] text-slate-400 uppercase tracking-wider">Montant Facturé</h5>
                  <p className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{selectedOrder.total} Ar</p>
                </div>
              </div>

              {selectedOrder.couponCode && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                  <Tag className="w-3.5 h-3.5" />
                  Code promo appliqué : {selectedOrder.couponCode} (-{selectedOrder.discountAmount} Ar)
                </div>
              )}

              {/* Unpaid order banner & direct link to payment mode */}
              {(selectedOrder.paymentStatus !== 'Payée' && selectedOrder.paymentStatus !== 'Paiement à la livraison' && selectedOrder.status !== 'Annulée') && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs text-amber-950 dark:text-amber-200">
                    <span className="font-bold block">Paiement non finalisé</span>
                    <span>Cette commande est en attente de règlement. Finalisez le paiement par Mobile Money (MVola, Orange Money, Airtel Money) ou à la livraison.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const orderNum = selectedOrder.orderNumber || selectedOrder.id;
                      setSelectedOrder(null);
                      navigate(`/payment?orderNumber=${encodeURIComponent(orderNum)}`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md ring-2 ring-amber-400/40 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-slate-950" />
                    <span>Aller au mode de paiement</span>
                  </button>
                </div>
              )}

              {/* Mobile Money payment section */}
              {['Mvola', 'Airtel Money', 'Orange Money'].includes(selectedOrder.paymentMethod) && 
              (selectedOrder.paymentStatus === 'En attente' || selectedOrder.paymentStatus === 'Échoué') && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <MobileMoneyPaymentForm
                    order={selectedOrder}
                    onSuccess={() => {
                      setRefreshKey((prev) => prev + 1);
                      setSelectedOrder(null);
                    }}
                  />
                </div>
              )}

              {/* Client Actions */}
              <div className="pt-2 flex justify-between border-t border-slate-50 mt-4 flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/api/orders/${selectedOrder.id}/invoice`);
                        showToast('La facture a été envoyée à votre adresse email !', 'success');
                      } catch (err) {
                        showToast('Erreur lors de l\'envoi de la facture.', 'error');
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Envoyer par email 📧
                  </button>
                  <button
                    onClick={async () => {
                      const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                      await generateInvoicePDF(selectedOrder, 'Facture');
                      showToast('Facture téléchargée.', 'success');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Télécharger la Facture (PDF)
                  </button>
                  <button
                    onClick={async () => {
                      const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                      await generateInvoicePDF(selectedOrder, 'Bon de Livraison');
                      showToast('Bon de Livraison téléchargé.', 'success');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 hidden sm:flex"
                  >
                    Bon de Livraison
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        for (const item of selectedOrder.items) {
                          const res = await api.get(`/api/products/${item.productId}`);
                          if (res.data) {
                            addToCart(res.data, item.quantity);
                          }
                        }
                        showToast('Articles ajoutés au panier.', 'success');
                        setSelectedOrder(null);
                        navigate('/cart');
                      } catch (err) {
                        showToast('Erreur lors du rajout au panier.', 'error');
                      }
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    Recommander
                  </button>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow cursor-pointer"
                >
                  Fermer
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
