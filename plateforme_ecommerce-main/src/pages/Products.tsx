/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Product, Category } from '../types';
import { initialCategories, initialProducts } from '../initialData';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { Search, SlidersHorizontal, ArrowUpDown, RefreshCw, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const BRANDS = ['Apple', 'Samsung', 'Sony', 'Bose', 'Dell', 'Keychron', 'Anker', 'Nomatic'];

export default function Products() {
  const { wishlist } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Read filter values from search URL query parameters
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || 'all';
  const brandQuery = searchParams.get('brand') || 'all';
  const minPriceQuery = searchParams.get('minPrice') || '';
  const maxPriceQuery = searchParams.get('maxPrice') || '';
  const sortQuery = searchParams.get('sort') || 'newest';
  const pageQuery = Number(searchParams.get('page')) || 1;
  const wishlistOnly = searchParams.get('wishlist') === 'true';

  // Client-side sub-filtering states
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Fetch categories once
  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await api.get('/api/categories').catch(() => ({ data: initialCategories }));
        setCategories(res.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : initialCategories);
      } catch (e) {
        console.warn('Fallback categories applied in Products:', e);
        setCategories(initialCategories);
      }
    }
    fetchCats();
  }, []);

  // Load recently viewed products
  useEffect(() => {
    async function fetchRecentlyViewed() {
      try {
        const viewedStr = localStorage.getItem('recently_viewed_products');
        if (viewedStr) {
          const viewedIds: string[] = JSON.parse(viewedStr);
          if (viewedIds.length > 0) {
            const allRes = await api.get('/api/products?limit=50').catch(() => ({ data: { products: initialProducts } }));
            const allProds = (allRes.data?.products || initialProducts) as Product[];
            const filtered = viewedIds
              .map(id => allProds.find(p => p.id === id))
              .filter((p): p is Product => p !== undefined)
              .slice(0, 4);
            setRecentlyViewed(filtered);
          }
        }
      } catch (err) {
        console.warn('Error loading recently viewed:', err);
      }
    }
    fetchRecentlyViewed();
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    if (wishlistOnly) {
      // In-memory wishlist view
      setProducts(wishlist);
      setTotalProducts(wishlist.length);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    async function fetchProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (categoryQuery !== 'all') params.append('category', categoryQuery);
        if (brandQuery !== 'all') params.append('brand', brandQuery);
        if (minPriceQuery) params.append('minPrice', minPriceQuery);
        if (maxPriceQuery) params.append('maxPrice', maxPriceQuery);
        params.append('sort', sortQuery);
        params.append('page', String(pageQuery));
        params.append('limit', '12'); // Larger pool to accommodate client sub-filters

        const res = await api.get(`/api/products?${params.toString()}`);
        if (res.data?.products && Array.isArray(res.data.products)) {
          setProducts(res.data.products);
          setTotalProducts(res.data.total ?? res.data.products.length);
          setTotalPages(res.data.pages ?? 1);
        } else {
          setProducts(initialProducts);
          setTotalProducts(initialProducts.length);
          setTotalPages(1);
        }
      } catch (error) {
        console.warn('Fallback products applied in Products view:', error);
        let prods = [...initialProducts];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
        }
        if (categoryQuery !== 'all') {
          prods = prods.filter(p => p.categoryId === categoryQuery);
        }
        if (brandQuery !== 'all') {
          prods = prods.filter(p => p.brand.toLowerCase() === brandQuery.toLowerCase());
        }
        setProducts(prods);
        setTotalProducts(prods.length);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchQuery, categoryQuery, brandQuery, minPriceQuery, maxPriceQuery, sortQuery, pageQuery, wishlistOnly, wishlist]);

  // Handle updates to specific filters
  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', '1'); // Reset to page 1 on filter update
    if (key === 'wishlist') {
      if (value === 'true') {
        nextParams.set('wishlist', 'true');
      } else {
        nextParams.delete('wishlist');
      }
    } else {
      nextParams.delete('wishlist'); // Disable wishlist mode if changing filters
      if (value === 'all' || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
    setInStockOnly(false);
    setSelectedColor('');
    setSelectedSize('');
    setMinRating(0);
  };

  // Perform multi-dimensional client-side sub-filtering on retrieved page
  const displayedProducts = products.filter((p) => {
    // 1. Stock check
    if (inStockOnly && p.stock <= 0) return false;

    // 2. Rating check
    if (minRating > 0 && p.rating < minRating) return false;

    // 3. Color check
    if (selectedColor) {
      const pName = p.name.toLowerCase();
      const pDesc = p.description.toLowerCase();
      const colorLower = selectedColor.toLowerCase();
      
      let terms = [colorLower];
      if (colorLower === 'noir') terms.push('black', 'dark', 'titanium dark', 'sidéral', 'titanium noir');
      if (colorLower === 'blanc') terms.push('white', 'silver', 'blanc');
      if (colorLower === 'argent') terms.push('silver', 'titanium natural', 'titane naturel');
      if (colorLower === 'bleu') terms.push('blue', 'titane bleu');
      if (colorLower === 'gold') terms.push('gold', 'or', 'titanium gold');

      const matchesColor = terms.some(t => pName.includes(t) || pDesc.includes(t));
      if (!matchesColor) return false;
    }

    // 4. Size/Variant check
    if (selectedSize) {
      const pName = p.name.toLowerCase();
      const pDesc = p.description.toLowerCase();
      const sizeLower = selectedSize.toLowerCase();

      let terms = [sizeLower];
      if (sizeLower === 'pro') terms.push('pro max', 'm3 max', 'ultra');
      if (sizeLower === 'max') terms.push('pro max', 'max', '16"');
      if (sizeLower === 'ultra') terms.push('ultra', 'titanium');
      if (sizeLower === 'standard') terms.push('standard', 'classic');

      const matchesSize = terms.some(t => pName.includes(t) || pDesc.includes(t));
      if (!matchesSize) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900">
            {wishlistOnly ? 'Ma Liste de Souhaits' : 'Notre Catalogue'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {wishlistOnly 
              ? `${totalProducts} article(s) coup de cœur enregistré(s)` 
              : `${totalProducts} produit(s) premium disponible(s)`
            }
          </p>
        </div>

        {/* Wishlist Toggle Button */}
        <button
          onClick={() => updateFilter('wishlist', wishlistOnly ? 'false' : 'true')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            wishlistOnly 
              ? 'bg-rose-50 border-rose-200 text-rose-600' 
              : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600 hover:text-rose-500 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlistOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
          {wishlistOnly ? 'Afficher Tout' : 'Voir Mes Favoris'}
        </button>
      </div>

      {/* Subcategories Horizontal Pills bar */}
      {!wishlistOnly && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-2 shrink-0">
            Catégories :
          </span>
          <button
            onClick={() => updateFilter('category', 'all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryQuery === 'all'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-150 text-slate-600'
            }`}
          >
            Tous les univers
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                categoryQuery === cat.slug
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-150 text-slate-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDE BAR FILTERS */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-sans font-bold text-slate-800 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                Filtres de recherche
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>

            {/* Availability Stock Switch */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Disponibilité
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 border-slate-200 focus:ring-emerald-500 cursor-pointer"
                />
                En stock uniquement
              </label>
            </div>

            {/* Colors Picker Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Couleur : {selectedColor || 'Toutes'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['', 'Noir', 'Blanc', 'Argent', 'Bleu', 'Gold'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {color === '' ? 'Tout' : color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Variants Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Variante / Modèle
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['', 'Standard', 'Pro', 'Max', 'Ultra'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {size === '' ? 'Tout' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimun ratings filter */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Note minimum
              </label>
              <div className="grid grid-cols-5 gap-1">
                {[0, 3, 4, 4.5, 4.8].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinRating(val)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      minRating === val
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{val === 0 ? 'Toutes' : `${val}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Marque
              </label>
              <select
                value={brandQuery}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800 font-medium"
              >
                <option value="all">Toutes les marques</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block">
                Prix (Ar)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceQuery}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-center font-mono focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
                />
                <span className="text-slate-400 font-mono text-xs">à</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceQuery}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-1/2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-center font-mono focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800"
                />
              </div>
            </div>

            {/* Sort Select */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Trier par
              </label>
              <select
                value={sortQuery}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white dark:bg-slate-800 text-slate-800 font-medium"
              >
                <option value="newest">Nouveautés d'abord</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="rating">Avis clients d'élite</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRODUCTS LIST AND PAGINATION */}
        <div className="flex-1 space-y-8">
          
          {/* Top Actions Line (Search Summary and View options) */}
          {!wishlistOnly && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              {/* Search Box Input inside listings */}
              <div className="w-full sm:max-w-xs relative">
                <input
                  type="text"
                  placeholder="Rechercher ici..."
                  value={searchQuery}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Reset Search Helper */}
              {(searchQuery || categoryQuery !== 'all' || brandQuery !== 'all' || minPriceQuery || maxPriceQuery || selectedColor || selectedSize || minRating > 0 || inStockOnly) && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Effacer tous les filtres
                </button>
              )}
            </div>
          )}

          {/* Core Grid */}
          {loading ? (
            <div className="py-24">
              <Loader />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold text-slate-700">Aucun produit trouvé</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto px-4">
                {wishlistOnly 
                  ? "Vous n'avez pas encore d'articles favoris. Cliquez sur le cœur d'un produit pour l'enregistrer ici." 
                  : "Aucun article ne correspond à vos filtres actuels. Essayez d'élargir votre recherche ou de vider les critères."}
              </p>
              {!wishlistOnly && (
                <button
                  onClick={handleClearFilters}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md cursor-pointer"
                >
                  Vider les critères
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination Section */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-slate-50">
                  <button
                    onClick={() => updateFilter('page', String(pageQuery - 1))}
                    disabled={pageQuery <= 1}
                    className="p-2 border border-slate-200 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white dark:bg-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilter('page', String(pageNum))}
                        className={`w-10 h-10 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                          pageQuery === pageNum
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => updateFilter('page', String(pageQuery + 1))}
                    disabled={pageQuery >= totalPages}
                    className="p-2 border border-slate-200 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-white dark:bg-slate-800 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* Bottom Shelf: Recently Viewed Products */}
      {!wishlistOnly && recentlyViewed.length > 0 && (
        <div className="pt-12 border-t border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-xl font-sans font-extrabold tracking-tight">
              Récemment Consultés
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
