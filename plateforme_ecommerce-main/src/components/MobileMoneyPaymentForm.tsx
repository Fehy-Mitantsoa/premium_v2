/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  CreditCard, 
  ShieldAlert, 
  Image as ImageIcon, 
  Loader2, 
  Search, 
  Upload, 
  X, 
  Copy, 
  CheckCircle2, 
  Truck, 
  Phone, 
  User, 
  Receipt,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { Order, Payment } from '../types';

interface MobileMoneyPaymentFormProps {
  initialOrderNumber?: string;
  order?: Order | null;
  onSuccess?: (payment: Payment) => void;
  onCancel?: () => void;
}

export const SELLER_ACCOUNTS = {
  'MVola': {
    name: 'MVola',
    number: '034 74 548 71',
    cleanNumber: '0347454871',
    owner: 'ANDRIAMIFEHY Fenomirindra Mitantsoa',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    activeColor: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20'
  },
  'Orange Money': {
    name: 'Orange Money',
    number: '032 25 356 12',
    cleanNumber: '0322535612',
    owner: 'ANDRIAMIFEHY Fenomirindra Mitantsoa',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    activeColor: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20'
  },
  'Airtel Money': {
    name: 'Airtel Money',
    number: '033 13 353 53',
    cleanNumber: '0331335353',
    owner: 'ANDRIAMIFEHY Fenomirindra Mitantsoa',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-700',
    activeColor: 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/20'
  },
  'Paiement à la livraison': {
    name: 'Paiement à la livraison',
    number: 'À la réception du colis',
    cleanNumber: '',
    owner: 'Règlement en espèces au livreur',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    activeColor: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
  }
};

export default function MobileMoneyPaymentForm({ 
  initialOrderNumber = '', 
  order: propOrder = null, 
  onSuccess, 
  onCancel 
}: MobileMoneyPaymentFormProps) {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || propOrder?.orderNumber || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(propOrder);
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [orderFetchError, setOrderFetchError] = useState('');

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'MVola' | 'Orange Money' | 'Airtel Money' | 'Paiement à la livraison'>('MVola');
  const [transactionReference, setTransactionReference] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedPayment, setConfirmedPayment] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if prop order changes
  useEffect(() => {
    if (propOrder) {
      setCurrentOrder(propOrder);
      if (propOrder.orderNumber) {
        setOrderNumberInput(propOrder.orderNumber);
      }
    }
  }, [propOrder]);

  // Lookup order automatically if initialOrderNumber is passed and not loaded yet
  useEffect(() => {
    if (initialOrderNumber && !propOrder) {
      fetchOrderDetails(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const fetchOrderDetails = async (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) return;
    setFetchingOrder(true);
    setOrderFetchError('');
    try {
      const res = await api.get(`/api/orders/${encodeURIComponent(trimmed)}`);
      const found = res.data.order || res.data;
      setCurrentOrder(found);
    } catch (err: any) {
      setCurrentOrder(null);
      setOrderFetchError(err.response?.data?.message || 'Commande introuvable. Veuillez vérifier le numéro.');
    } finally {
      setFetchingOrder(false);
    }
  };

  const handleCopyNumber = (num: string, key: string) => {
    navigator.clipboard.writeText(num.replace(/\s+/g, ''));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFile = (file: File) => {
    setErrorMessage('');
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formats autorisés : JPG, PNG, WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La taille maximale autorisée est de 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
        setReceiptName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetOrderNumber = orderNumberInput.trim() || currentOrder?.orderNumber;
    if (!targetOrderNumber) {
      setErrorMessage('Veuillez renseigner le numéro de commande (orderNumber).');
      return;
    }

    const isMobileMoney = paymentMethod !== 'Paiement à la livraison';
    if (isMobileMoney && !transactionReference.trim()) {
      setErrorMessage('La référence de transaction est obligatoire pour le paiement Mobile Money.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        orderNumber: targetOrderNumber,
        amount: currentOrder ? currentOrder.total : undefined,
        customerName: currentOrder ? (currentOrder.customerName || currentOrder.userName) : undefined,
        phone: currentOrder ? currentOrder.phone : undefined,
        paymentMethod,
        transactionReference: isMobileMoney ? transactionReference.trim() : '',
        receiptImage: isMobileMoney ? receiptImage : ''
      };

      const res = await api.post('/api/payments', payload);
      setConfirmedPayment(res.data);

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (confirmedPayment) {
    return (
      <div id="payment-success-card" className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-950/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Paiement enregistré avec succès.
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium max-w-md mx-auto">
            Notre équipe vérifiera votre commande.
          </p>
        </div>

        {/* Payment & Order details badge */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800 max-w-md mx-auto text-left space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">N° de Paiement :</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{confirmedPayment.paymentNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">N° de Commande :</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{confirmedPayment.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Mode de paiement :</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{confirmedPayment.paymentMethod}</span>
          </div>
          {confirmedPayment.transactionReference && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Référence :</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{confirmedPayment.transactionReference}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Montant :</span>
            <span className="font-bold text-slate-900 dark:text-white">{Number(confirmedPayment.amount || 0).toLocaleString()} Ar</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Statut :</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              confirmedPayment.status === 'À vérifier' 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}>
              {confirmedPayment.status}
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            Retourner à l'accueil
          </a>
        </div>
      </div>
    );
  }

  const isMobileMoney = paymentMethod !== 'Paiement à la livraison';

  return (
    <div id="payment-module-container" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-lg space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              Module de Paiement
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paiement direct sécurisé pour Madagascar
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs sm:text-sm text-rose-700 dark:text-rose-400 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Numéro de commande (orderNumber) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
          1. Numéro de commande (orderNumber)
        </label>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="order-number-input"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchOrderDetails(orderNumberInput))}
              placeholder="Ex: CMD-A1B2C3"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-850"
            />
          </div>
          <button
            type="button"
            id="order-lookup-btn"
            onClick={() => fetchOrderDetails(orderNumberInput)}
            disabled={fetchingOrder || !orderNumberInput.trim()}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {fetchingOrder ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Vérifier</span>
          </button>
        </div>

        {orderFetchError && (
          <p className="text-xs text-rose-500 font-medium">{orderFetchError}</p>
        )}

        {/* Display automatically retrieved details */}
        {currentOrder && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Informations récupérées automatiquement :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Nom client</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {currentOrder.customerName || currentOrder.userName || 'Client'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Téléphone</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                    {currentOrder.phone || 'Non renseigné'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Montant à régler</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                    {Number(currentOrder.total || 0).toLocaleString()} Ar
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitPayment} className="space-y-6">
        
        {/* STEP 2: Choix du mode de paiement */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            2. Choix du mode de paiement
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(SELLER_ACCOUNTS) as Array<keyof typeof SELLER_ACCOUNTS>).map((method) => {
              const account = SELLER_ACCOUNTS[method];
              const isSelected = paymentMethod === method;

              return (
                <div
                  key={method}
                  id={`payment-method-${method.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? account.activeColor
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {method === 'Paiement à la livraison' ? (
                        <Truck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      )}
                      {method}
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={isSelected}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-emerald-600"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {account.number}
                      </span>
                      {account.cleanNumber && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNumber(account.number, method);
                          }}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5"
                          title="Copier le numéro"
                        >
                          {copiedKey === method ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === method ? 'Copié' : 'Copier'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {account.owner}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Champs selon le mode */}
        {isMobileMoney ? (
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <p className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                Informations Mobile Money ({paymentMethod})
              </p>
            </div>

            {/* Instruction transfer */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-300">
              Veuillez transférer le montant de{' '}
              <strong>{currentOrder ? `${currentOrder.total.toLocaleString()} Ar` : 'votre commande'}</strong> vers{' '}
              <strong>{SELLER_ACCOUNTS[paymentMethod].number}</strong> ({SELLER_ACCOUNTS[paymentMethod].owner}), puis saisir la référence ci-dessous.
            </div>

            {/* Référence de transaction (obligatoire) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Référence de transaction <span className="text-rose-500">* (Obligatoire)</span>
              </label>
              <input
                type="text"
                id="transaction-reference-input"
                required
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Ex: 240824123456 ou TXN-987654"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                La référence reçue par SMS de votre opérateur après le transfert.
              </p>
            </div>

            {/* Reçu de paiement (image - optionnel) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reçu du paiement <span className="text-slate-400 font-normal">(Image - optionnel)</span>
              </label>

              {receiptImage ? (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl">
                  <img
                    src={receiptImage}
                    alt="Reçu de paiement"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {receiptName || 'Reçu chargé'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">Capture enregistrée</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptImage('');
                      setReceiptName('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-white dark:bg-slate-800 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Glissez ou cliquez pour joindre une capture du SMS / reçu
                  </p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, WebP (Max 5 Mo)</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Paiement à la livraison sélectionné
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Aucun reçu ni référence de transaction requis. Vous réglerez le montant exact en espèces directement auprès de notre livreur à la réception de votre colis.
            </p>
          </div>
        )}

        {/* Bouton principal : 💳 Confirmer le paiement */}
        <button
          type="submit"
          id="confirm-payment-button"
          disabled={isSubmitting || !orderNumberInput.trim()}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-base rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Traitement du paiement en cours...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>💳 Confirmer le paiement</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
