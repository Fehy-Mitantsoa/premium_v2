/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useApp();
  const isWishlisted = isInWishlist(product.id);

  const priceToDisplay = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden relative"
    >
      
      {/* Wishlist Button Overlay */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${
          isWishlisted 
            ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100' 
            : 'bg-white/80 dark:bg-slate-700/80 border-slate-100 dark:border-slate-600 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700'
        }`}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Sale Tag */}
      {hasDiscount && (
        <span className="absolute top-3 left-3 z-10 bg-rose-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Promo
        </span>
      )}

      {/* Link to details */}
      <Link to={`/products/${product.slug}`} className="block relative aspect-square bg-slate-50 overflow-hidden shrink-0">
        <img
          src={product.images[0] || undefined}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Brand */}
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1">
            {product.brand}
          </p>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="hover:text-emerald-600 transition-colors">
            <h4 className="font-sans font-medium text-slate-800 text-sm line-clamp-2 leading-snug">
              {product.name}
            </h4>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-2 mb-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-slate-500 font-mono">
              {product.rating} ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-xs text-slate-400 line-through font-mono">
                  {product.price} Ar
                </span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {product.discountPrice} Ar
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-slate-900 font-mono">
                {product.price} Ar
              </span>
            )}
          </div>

          {/* Quick Add Cart Button */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="p-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-all duration-300 group/btn hover:scale-105"
              title="Ajouter au panier"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </motion.div>
  );
}
