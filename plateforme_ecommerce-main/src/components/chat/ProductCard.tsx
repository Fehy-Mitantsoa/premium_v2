/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingCart, Check, ExternalLink } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProductCardProps {
  product: Partial<Product> & { id: string; name: string; price: number };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, showToast } = useApp();
  const [added, setAdded] = useState(false);

  const imageUrl = product.images?.[0] || (product as any).imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80&w=400';

  const handleAddToCart = () => {
    // Construct valid Product object for AppContext
    const fullProduct: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      description: product.description || '',
      price: product.price,
      stock: product.stock ?? 10,
      categoryId: product.categoryId || '1',
      brand: product.brand || 'Marque',
      images: [imageUrl],
      rating: product.rating || 4.5,
      reviewsCount: product.reviewsCount || 12,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    addToCart(fullProduct, 1);
    setAdded(true);
    showToast(`${product.name} ajouté au panier !`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-3 p-2.5 max-w-sm my-2">
      <div className="w-full sm:w-20 h-24 sm:h-20 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
            {product.name}
          </h4>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm mt-0.5">
            {product.price?.toLocaleString('fr-FR')} Ariary
          </p>
          {product.brand && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {product.brand}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Ajouté !
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" /> Ajouter
              </>
            )}
          </button>

          {(product.slug || (product as any).url) && (
            <a
              href={`/product/${product.slug || product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Voir la fiche produit de ${product.name}`}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
