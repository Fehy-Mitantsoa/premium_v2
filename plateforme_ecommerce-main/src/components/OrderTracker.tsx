/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Search, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  History
} from 'lucide-react';
import api from '../services/api';
import { Order } from '../types';

interface OrderTrackerProps {
  initialOrderNumber?: string;
  order?: Order | null;
  onSelectPay?: (order: Order) => void;
}

const ORDER_STEPS = [
  { key: 'En attente', label: 'Commande reçue', desc: 'Enregistrée dans le système' },
  { key: 'Confirmée', label: 'Confirmée', desc: 'Vérification et validation' },
  { key: 'En préparation', label: 'En préparation', desc: 'Emballage des articles' },
  { key: 'Expédiée', label: 'En cours de livraison', desc: 'Remise au livreur' },
  { key: 'Livrée', label: 'Livrée', desc: 'Colis remis au client' }
];

export default function OrderTracker({
  initialOrderNumber = '',
  order: propOrder = null,
  onSelectPay
}: OrderTrackerProps) {
  const navigate = useNavigate();
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || propOrder?.orderNumber || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(propOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('user_recent_orders') || '[]');
      setRecentOrders(saved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (propOrder) {
      setCurrentOrder(propOrder);
      if (propOrder.orderNumber) {
        setOrderNumberInput(propOrder.orderNumber);
      }
    }
  }, [propOrder]);

  useEffect(() => {
    if (initialOrderNumber && !propOrder) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const fetchOrder = async (numToSearch: string) => {
    const trimmed = numToSearch.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/orders/${encodeURIComponent(trimmed)}`);
      const found = res.data.order || res.data;
      setCurrentOrder(found);
    } catch (err: any) {
      setCurrentOrder(null);
      setError(err.response?.data?.message || 'Aucune commande trouvée pour ce numéro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'En attente': return 0;
      case 'Confirmée': return 1;
      case 'En préparation': return 2;
      case 'Expédiée': return 3;
      case 'Livrée': return 4;
      default: return 0;
    }
  };

  const currentStepIndex = currentOrder ? getStepIndex(currentOrder.status) : 0;

  return (
    <div id="order-tracker-card" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-lg space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              Suivi de Commande en Temps Réel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vérifiez l'état de préparation et de livraison de votre colis
            </p>
          </div>
        </div>

        {currentOrder && (
          <button
            type="button"
            onClick={() => fetchOrder(currentOrder.orderNumber)}
            disabled={loading}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        )}
      </div>

      {/* Order Search Input if not loaded or tracking another */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
          Numéro de commande (CMD-XXXXXX)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tracker-order-number-input"
            value={orderNumberInput}
            onChange={(e) => setOrderNumberInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchOrder(orderNumberInput))}
            placeholder="Ex: CMD-9K2L4P"
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            id="tracker-search-btn"
            onClick={() => fetchOrder(orderNumberInput)}
            disabled={loading || !orderNumberInput.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Rechercher</span>
          </button>
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-semibold pt-1">{error}</p>
        )}
      </div>

      {/* TRACKING RESULTS VIEW */}
      {currentOrder && (
        <div className="space-y-6 pt-2">
          
          {/* Order Header Summary Banner */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Commande :</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                  {currentOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentOrder.orderNumber)}
                  className="p-1 text-slate-400 hover:text-emerald-600 rounded-md transition-colors"
                  title="Copier le numéro"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passée le {new Date(currentOrder.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Payment status badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentOrder.paymentStatus === 'Payée' || currentOrder.status === 'Confirmée'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
              }`}>
                <CreditCard className="w-3.5 h-3.5" />
                Paiement : {currentOrder.paymentStatus || 'En attente'}
              </span>

              {/* Order Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white dark:bg-slate-700">
                <Clock className="w-3.5 h-3.5" />
                {currentOrder.status}
              </span>
            </div>
          </div>

          {/* PROGRESS STEPPER TIMELINE */}
          <div className="py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 mb-4">
              Progression de la commande
            </h4>

            {/* Stepper container */}
            <div className="relative">
              <div className="hidden sm:grid sm:grid-cols-5 gap-2 relative">
                {/* Background line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
                
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10 space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/50'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>

                      <div>
                        <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : isDone ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Stepper Vertical */}
              <div className="sm:hidden space-y-4">
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : isDone ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GRID: DETAILS CLIENT & DETAILS ARTICLES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Delivery Info Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                Informations de livraison
              </h5>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Destinataire :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {currentOrder.customerName || currentOrder.userName || 'Client'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Téléphone :</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {currentOrder.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Adresse :</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {currentOrder.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles & Totals Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Articles commandés ({currentOrder.items?.length || 0})
              </h5>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {currentOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-800 dark:text-slate-200 truncate flex-1 pr-2">
                      {item.name} <span className="text-slate-400">×{item.quantity}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Montant total :</span>
                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  {Number(currentOrder.total || 0).toLocaleString('fr-FR')} Ar
                </span>
              </div>
            </div>

          </div>

          {/* Action button: Compléter le mode de paiement if needed */}
          {onSelectPay && currentOrder.paymentStatus !== 'Payée' && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-emerald-950 dark:text-emerald-200 text-center sm:text-left">
                <strong className="block font-bold">Paiement en attente de validation</strong>
                Vous n'avez pas encore finalisé votre transfert Mobile Money ou souhaitez modifier le mode de règlement ?
              </div>
              <button
                type="button"
                onClick={() => onSelectPay(currentOrder)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>💳 Compléter le mode de paiement</span>
              </button>
            </div>
          )}

          {/* Order history activity logs if available */}
          {currentOrder.logs && currentOrder.logs.length > 0 && (
            <div className="space-y-2 pt-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-400">
                Journal des événements
              </h5>
              <div className="space-y-1.5">
                {currentOrder.logs.map((log: any, index: number) => (
                  <div key={index} className="text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
