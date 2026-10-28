/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import MobileMoneyPaymentForm from '../components/MobileMoneyPaymentForm';
import OrderTracker from '../components/OrderTracker';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { 
  Trash2, 
  ShoppingCart, 
  Ticket, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Truck, 
  MapPin, 
  User,
  Phone,
  Clock,
  Sparkles,
  Loader2,
  PackageCheck,
  Package,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { Order } from '../types';

export default function Cart() {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    coupon, 
    applyCoupon, 
    removeCoupon, 
    clearCart,
    user,
    showToast
  } = useApp();
  
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'order_placed'>('cart');
  const [activeActionTab, setActiveActionTab] = useState<'tracking' | 'payment'>('payment');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Obligatory Guest/Customer Information
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [formError, setFormError] = useState('');

  // CALCUL AUTOMATIQUE
  // 1. subtotal = somme des articles
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // 2. shippingFee = 5000 Ar (ou 0 si > 150 000 Ar)
  const shippingFee = subtotal > 150000 || subtotal === 0 ? 0 : 5000;

  // 3. discount = 0 par défaut (ou calculé si coupon)
  let discount = 0;
  if (coupon && subtotal >= coupon.minAmount) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
  }

  // 4. total = subtotal + shippingFee - discount
  const total = Math.max(0, subtotal + shippingFee - discount);

  const handleApplyCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    applyCoupon(promoCode.trim().toUpperCase(), subtotal);
    setPromoCode('');
  };

  const handleCopyOrderNumber = () => {
    if (createdOrderNumber) {
      navigator.clipboard.writeText(createdOrderNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Le nom complet est obligatoire.');
      showToast('Le nom complet est obligatoire.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setFormError('Le numéro de téléphone (+261 ou 03X XX XXX XX) est obligatoire et doit être valide.');
      showToast('Le numéro de téléphone est obligatoire.', 'error');
      return;
    }

    if (!address.trim()) {
      setFormError('L\'adresse de livraison est obligatoire.');
      showToast('L\'adresse de livraison est obligatoire.', 'error');
      return;
    }

    if (cart.length === 0) {
      setFormError('Votre panier est vide.');
      return;
    }

    try {
      setSubmittingOrder(true);
      
      const payload = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        items: cart.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: item.product.discountPrice || item.product.price,
          quantity: item.quantity,
          image: item.product.images[0] || ''
        })),
        subtotal,
        shippingFee,
        discount,
        total,
        couponCode: coupon?.code,
        discountAmount: discount > 0 ? discount : undefined
      };

      const res = await api.post('/api/orders', payload);
      const orderData = res.data.order || res.data;
      const orderNum = res.data.orderNumber || orderData.orderNumber;

      setCreatedOrder(orderData);
      setCreatedOrderNumber(orderNum);

      // Save to localStorage for quick retrieval & payment resumption
      try {
        const existing = JSON.parse(localStorage.getItem('user_recent_orders') || '[]');
        const updated = [
          {
            orderNumber: orderNum,
            id: orderData.id || orderData._id || orderNum,
            createdAt: orderData.createdAt || new Date().toISOString(),
            total: orderData.total || total,
            customerName: customerName.trim(),
            phone: phone.trim(),
            status: orderData.status || 'En attente',
            paymentStatus: orderData.paymentStatus || 'En attente'
          },
          ...existing.filter((o: any) => o.orderNumber !== orderNum)
        ].slice(0, 15);
        localStorage.setItem('user_recent_orders', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving recent orders', e);
      }

      clearCart();
      setCheckoutStep('order_placed');
      showToast(`Commande ${orderNum} envoyée avec succès !`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la création de la commande.';
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // POST-ORDER VIEW : SUIVRE LA COMMANDE OU COMPLÉTER LE MODE DE PAIEMENT
  if (checkoutStep === 'order_placed') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Celebration / Confirmation Card */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white shrink-0 border border-white/20">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-mono font-bold text-emerald-200 block">
                  Succès
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Commande envoyée avec succès !
                </h1>
              </div>
            </div>

            {/* Order Number pill */}
            <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 flex items-center gap-2">
              <span className="text-xs text-emerald-200 font-mono">N° de commande :</span>
              <span className="font-mono font-black text-sm sm:text-base text-white">
                {createdOrderNumber || createdOrder?.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                className="p-1 text-emerald-200 hover:text-white rounded transition-colors"
                title="Copier le numéro de commande"
              >
                {copiedNumber ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick recap row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/15 text-xs">
            <div>
              <span className="text-emerald-200 block text-[11px]">Destinataire :</span>
              <span className="font-bold text-white truncate block">
                {createdOrder?.customerName || createdOrder?.userName || customerName}
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Téléphone :</span>
              <span className="font-mono font-bold text-white block">
                {createdOrder?.phone || phone}
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">Montant total :</span>
              <span className="font-mono font-black text-white text-sm block">
                {Number(createdOrder?.total || total).toLocaleString('fr-FR')} Ar
              </span>
            </div>
          </div>

          {/* TWO MAIN ACTION BUTTONS : SUIVRE LA COMMANDE ou COMPLÉTER LE PAIEMENT */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              id="action-track-order-btn"
              onClick={() => setActiveActionTab('tracking')}
              className={`flex-1 py-3.5 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                activeActionTab === 'tracking'
                  ? 'bg-white text-slate-900 shadow-white/10 ring-4 ring-white/30'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>📦 Suivre la commande</span>
            </button>

            <button
              type="button"
              id="action-complete-payment-btn"
              onClick={() => setActiveActionTab('payment')}
              className={`flex-1 py-3.5 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                activeActionTab === 'payment'
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-4 ring-amber-400/30'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>💳 Compléter le mode de paiement</span>
            </button>
          </div>

        </div>

        {/* ACTIVE SECTION CONTENT (Tracking or Payment) */}
        {activeActionTab === 'tracking' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Suivi en temps réel de votre colis
              </h3>

              <button
                type="button"
                onClick={() => setActiveActionTab('payment')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Passer au paiement</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <OrderTracker 
              initialOrderNumber={createdOrderNumber} 
              order={createdOrder}
              onSelectPay={() => setActiveActionTab('payment')}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Règlement de votre commande
              </h3>

              <button
                type="button"
                onClick={() => setActiveActionTab('tracking')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Voir le suivi du colis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <MobileMoneyPaymentForm 
              initialOrderNumber={createdOrderNumber} 
              order={createdOrder}
              onSuccess={(payment) => {
                showToast('Paiement enregistré avec succès.', 'success');
                if (createdOrder) {
                  setCreatedOrder({
                    ...createdOrder,
                    paymentStatus: payment.status === 'Paiement à la livraison' ? 'Paiement à la livraison' : 'À vérifier'
                  });
                }
              }}
            />
          </div>
        )}

      </div>
    );
  }

  // 2. EMPTY CART VIEW
  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Votre panier est vide</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Découvrez nos articles et ajoutez vos coups de cœur pour passer commande sans créer de compte.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-md hover:scale-[1.01] transition-all"
        >
          Découvrir les produits
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Checkout Progress Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {/* Step 1: Panier & Commande */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40">
              1
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Commande
            </span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-slate-200 dark:bg-slate-700" />

          {/* Step 2: Suivi & Paiement */}
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              2
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Suivi & Paiement
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Passer votre commande
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Aucune création de compte requise. Remplissez simplement vos coordonnées pour expédition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: ARTICLES & INFOS CLIENT */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form error alert */}
          {formError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs sm:text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2 font-medium">
              <span>{formError}</span>
            </div>
          )}

          {/* 1. ARTICLES DU PANIER */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Articles du panier ({cart.length})
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500">
                Total: {subtotal.toLocaleString('fr-FR')} Ar
              </span>
            </div>

            <div className="space-y-3">
              {cart.map((item) => {
                const price = item.product.discountPrice || item.product.price;
                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl gap-3"
                  >
                    {/* Image & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        <img
                          src={item.product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {price.toLocaleString('fr-FR')} Ar
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white w-20 text-right hidden sm:inline">
                        {(price * item.quantity).toLocaleString('fr-FR')} Ar
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. FORMULAIRE DE COMMANDE (Informations obligatoires) */}
          <form id="checkout-order-form" onSubmit={handleCreateOrderSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono text-slate-900 dark:text-white">
                Coordonnées de livraison (Obligatoires)
              </h3>
            </div>

            <div className="space-y-4">
              
              {/* Nom complet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nom complet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="customer-name-input"
                  required
                  placeholder="Ex: RAKOTOARISOA Andry"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Téléphone (+261 ou 03X XX XXX XX) <span className="text-rose-500">*</span>
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  inputClassName="p-3 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-900"
                />
                <p className="text-[11px] text-slate-400">
                  Numéro joignable pour coordonner la livraison.
                </p>
              </div>

              {/* Adresse de livraison */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Adresse de livraison <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="customer-address-input"
                  required
                  rows={3}
                  placeholder="Ex: Lot II A 45 Ter Ambohijatovo, Antananarivo 101"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  Indiquez le quartier, le numéro de lot, la ville et toute indication utile pour le livreur.
                </p>
              </div>

            </div>

            {/* Bouton principal : 🛒 Commander maintenant */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="submit"
                id="submit-order-button"
                disabled={submittingOrder}
                className="w-full py-4 px-6 bg-slate-900 hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi de votre commande...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>🛒 Commander maintenant ({total.toLocaleString('fr-FR')} Ar)</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* RIGHT COLUMN: CALCUL AUTOMATIQUE & RÉCAPITULATIF */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-700 pb-3">
              Calcul Automatique
            </h3>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              {/* subtotal */}
              <div className="flex justify-between items-center">
                <span>Sous-total articles :</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {subtotal.toLocaleString('fr-FR')} Ar
                </span>
              </div>

              {/* shippingFee */}
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Frais de livraison :
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">Gratuit</span>
                  ) : (
                    `${shippingFee.toLocaleString('fr-FR')} Ar`
                  )}
                </span>
              </div>

              {/* discount */}
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5 text-slate-400" />
                  Remise (discount) :
                </span>
                <span className="font-mono font-bold text-emerald-600">
                  {discount > 0 ? `-${discount.toLocaleString('fr-FR')} Ar` : '0 Ar'}
                </span>
              </div>

              {coupon && (
                <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg text-emerald-800 dark:text-emerald-200 font-semibold text-[11px]">
                  <span>Code {coupon.code} actif</span>
                  <button onClick={removeCoupon} className="text-rose-500 font-bold hover:underline">Retirer</button>
                </div>
              )}
            </div>

            {/* Total formula */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">Total à payer :</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {total.toLocaleString('fr-FR')} Ar
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-right">
                (subtotal + shippingFee − discount)
              </p>
            </div>

            {/* Promo code input */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Code Promo
              </label>
              <form onSubmit={handleApplyCouponSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="WELCOME10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                >
                  Appliquer
                </button>
              </form>
            </div>

          </div>

          {/* Secure note */}
          <div className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex items-start gap-3 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-slate-200 block font-semibold">Commande express sans compte</strong>
              Après validation, vous pourrez suivre l'état de votre colis en direct ou compléter votre paiement par Mobile Money (MVola, Orange Money, Airtel Money) ou en espèces.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
