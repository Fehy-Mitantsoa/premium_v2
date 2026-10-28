/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSearchParams, useParams, Link } from 'react-router-dom';
import OrderTracker from '../components/OrderTracker';
import { ArrowLeft, Package, HelpCircle, ShieldCheck } from 'lucide-react';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const { orderNumber: paramOrderNumber } = useParams();
  
  const orderNumber = paramOrderNumber || searchParams.get('order') || searchParams.get('orderNumber') || '';

  return (
    <div className="min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      
      {/* Back Link & Header */}
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
          <span>Suivi direct Madagascar</span>
        </div>
      </div>

      {/* Embed Order Tracker Component */}
      <OrderTracker initialOrderNumber={orderNumber} />

      {/* Help info footer */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Informations sur la livraison</span>
        </div>
        <p className="leading-relaxed">
          Les livraisons sur Antananarivo sont effectuées sous 24h à 48h ouvrées. Pour les provinces, l'expédition est prise en charge par nos partenaires de transport dès confirmation du règlement.
        </p>
      </div>

    </div>
  );
}
