/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingCart, Check, ExternalLink, Scale, Star, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface ComparisonCardsProps {
  products: Partial<Product>[];
}

export const ComparisonCards: React.FC<ComparisonCardsProps> = ({ products }) => {
  const { addToCart, showToast } = useApp();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!products || products.length < 2) return null;

  const validProducts = products.slice(0, 3); // Compare up to 3 products side-by-side

  // Find lowest price to highlight value
  const prices = validProducts.map(p => p.price || 0).filter(p => p > 0);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const handleAddToCart = (product: Partial<Product>) => {
    if (!product.id || !product.name || !product.price) return;

    const fullProduct: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      description: product.description || '',
      price: product.price,
      stock: product.stock ?? 10,
      categoryId: product.categoryId || '1',
      brand: product.brand || 'ElectroStore',
      images: product.images || [(product as any).imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=400'],
      rating: product.rating || 4.5,
      reviewsCount: product.reviewsCount || 12,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    addToCart(fullProduct, 1);
    setAddedIds(prev => ({ ...prev, [product.id!]: true }));
    showToast(`${product.name} ajouté au panier !`, 'success');
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id!]: false }));
    }, 2000);
  };

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/80">
      <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
        <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
        <span>Comparaison Côte à Côte ({validProducts.length} Produits)</span>
      </div>

      {/* Grid Split View Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {validProducts.map((product, idx) => {
          const isBestPrice = product.price === lowestPrice && prices.length > 1;
          const imageUrl = product.images?.[0] || (product as any).imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=400';
          const isAdded = !!addedIds[product.id || ''];

          return (
            <div
              key={product.id || idx}
              className={`relative bg-slate-50 dark:bg-slate-900/90 border rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md ${
                isBestPrice
                  ? 'border-emerald-500/80 dark:border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-700/80'
              }`}
            >
              {/* Best Value Badge */}
              {isBestPrice && (
                <div className="absolute -top-2.5 right-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  <span>Meilleur Prix</span>
                </div>
              )}

              <div>
                {/* Product Image & Title Header */}
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 p-1">
                    <img
                      src={imageUrl}
                      alt={product.name || 'Produit'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                      {product.brand || 'ElectroStore'}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                  </div>
                </div>

                {/* Specs rows comparison */}
                <div className="space-y-1.5 text-[11px] mb-3 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Prix :</span>
                    <span className={`font-extrabold ${isBestPrice ? 'text-emerald-600 dark:text-emerald-400 text-xs' : 'text-slate-800 dark:text-slate-200'}`}>
                      {product.price?.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Stock :</span>
                    <span className={`font-semibold ${product.stock && product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                      {product.stock && product.stock > 0 ? `${product.stock} dispo` : 'En réappro'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Avis clients :</span>
                    <span className="flex items-center gap-1 font-medium text-amber-500 dark:text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating || 4.5}/5</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Garantie :</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> 12 mois
                    </span>
                  </div>

                  {product.description && (
                    <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-white/60 dark:bg-slate-800/60 p-1.5 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                      "{product.description}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Ajouté
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" /> Ajouter
                    </>
                  )}
                </button>

                {(product.slug || product.id) && (
                  <a
                    href={`/product/${product.slug || product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Fiche produit complète"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonCards;
