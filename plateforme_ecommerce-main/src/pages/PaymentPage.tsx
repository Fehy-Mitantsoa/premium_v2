/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSearchParams, Link } from 'react-router-dom';
import MobileMoneyPaymentForm from '../components/MobileMoneyPaymentForm';
import { ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || searchParams.get('order') || '';

  return (
    <div className="min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top back button and heading */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Paiement sécurisé Madagascar</span>
        </div>
      </div>

      {/* Main Payment Form Component */}
      <MobileMoneyPaymentForm initialOrderNumber={initialOrderNumber} />

      {/* Helper FAQ info box */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Besoin d'aide pour votre paiement ?</span>
        </div>
        <p className="leading-relaxed">
          Pour toute question concernant votre commande ou votre transfert Mobile Money, vous pouvez contacter notre service client au <strong>+261 34 74 548 71</strong> ou utiliser notre assistant interactif en bas à droite de l'écran.
        </p>
      </div>

    </div>
  );
}
