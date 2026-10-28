/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Product, Review } from '../types';
import { initialProducts } from '../initialData';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { 
  Star, Heart, ShoppingBag, Plus, Minus, ArrowLeft, MessageSquarePlus, 
  MessageSquareCode, Play, Maximize2, Check, Video, Award, ShieldCheck, Truck, Sparkles, Clock, ZoomIn 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, user, showToast } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const isWishlisted = product ? isInWishlist(product.id) : false;

  // New features states
  const [selectedColor, setSelectedColor] = useState('Graphite');
  const [selectedSize, setSelectedSize] = useState('256 Go');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Smooth Hover Zoom state
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load product details, similar products, and recently viewed
  useEffect(() => {
    async function fetchDetails() {
      if (!slug) return;
      try {
        setLoading(true);
        // Fetch product info
        const prodRes = await api.get(`/api/products/${encodeURIComponent(slug)}`);
        const prodData = prodRes.data as Product;
        setProduct(prodData);
        if (prodData.images && prodData.images.length > 0) {
          setActiveImage(prodData.images[0]);
        }

        // Pre-fill variants based on brand/type
        if (prodData.brand === 'Apple') {
          setSelectedColor('Titane Naturel');
          setSelectedSize('256 Go');
        } else if (prodData.brand === 'Sony' || prodData.brand === 'Bose') {
          setSelectedColor('Noir Intense');
          setSelectedSize('Standard');
        } else {
          setSelectedColor('Gris Sidéral');
          setSelectedSize('Pro');
        }

        // Fetch reviews safely
        try {
          const revRes = await api.get(`/api/reviews/${prodData.id}`);
          setReviews(revRes.data || []);
        } catch (revErr) {
          console.warn('Error loading reviews:', revErr);
        }

        // Fetch similar products in same category
        try {
          const simRes = await api.get(`/api/products?limit=12`);
          const allProds = (simRes.data?.products || []) as Product[];
          const filtered = allProds
            .filter((p) => p.categoryId === prodData.categoryId && p.id !== prodData.id)
            .slice(0, 4);
          setSimilarProducts(filtered);
        } catch (simErr) {
          console.warn('Error loading similar products:', simErr);
        }

        // Handle Recently Viewed products in LocalStorage
        try {
          const viewedStr = localStorage.getItem('recently_viewed_products');
          let viewedIds: string[] = viewedStr ? JSON.parse(viewedStr) : [];
          
          // Remove if already exists, then put at front
          viewedIds = viewedIds.filter((id) => id !== prodData.id);
          viewedIds.unshift(prodData.id);
          
          // Limit to 4
          const slicedIds = viewedIds.slice(0, 5);
          localStorage.setItem('recently_viewed_products', JSON.stringify(slicedIds));

          // Fetch other viewed products
          const allProdsRes = await api.get('/api/products?limit=50');
          const allProds = (allProdsRes.data?.products || []) as Product[];
          const filteredViewed = slicedIds
            .filter((id) => id !== prodData.id)
            .map((id) => allProds.find((p) => p.id === id))
            .filter((p): p is Product => p !== undefined)
            .slice(0, 4);
          setRecentlyViewed(filteredViewed);
        } catch (storageErr) {
          console.warn('Error handling recently viewed products:', storageErr);
        }

      } catch (e) {
        console.warn('Product not found via API, checking fallback dataset:', e);
        const fallbackProd = initialProducts.find((p) => p.slug === slug || p.id === slug);
        if (fallbackProd) {
          setProduct(fallbackProd);
          if (fallbackProd.images && fallbackProd.images.length > 0) {
            setActiveImage(fallbackProd.images[0]);
          }
          const filtered = initialProducts
            .filter((p) => p.categoryId === fallbackProd.categoryId && p.id !== fallbackProd.id)
            .slice(0, 4);
          setSimilarProducts(filtered);
        } else {
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [slug]);

  const handleQtyChange = (val: number) => {
    if (!product) return;
    const nextVal = Math.max(1, Math.min(product.stock, val));
    setQuantity(nextVal);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;

    if (!newComment.trim()) {
      showToast('Veuillez rédiger un avis avant de valider.', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/api/reviews', {
        productId: product.id,
        rating: newRating,
        comment: newComment.trim(),
      });

      // Insert new review at the top of local state list
      setReviews((prev) => [res.data, ...prev]);
      
      // Update aggregated product ratings
      setProduct((prev) => {
        if (!prev) return null;
        const totalCount = prev.reviewsCount + 1;
        const totalSum = (prev.rating * prev.reviewsCount) + newRating;
        return {
          ...prev,
          reviewsCount: totalCount,
          rating: Number((totalSum / totalCount).toFixed(1)),
        };
      });

      setNewComment('');
      setNewRating(5);
      showToast('Votre avis d\'élite a été publié avec succès !', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Impossible d'envoyer votre avis.";
      showToast(errMsg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-xl font-bold text-slate-700">Produit introuvable</h2>
        <p className="text-sm text-slate-400">Le produit demandé n'existe pas ou a été retiré du catalogue.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const priceToDisplay = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  // Render mock tech specs
  const mockSpecs = [
    { key: 'Marque & Modèle', value: `${product.brand} - ${product.name}` },
    { key: 'Garantie Constructeur', value: '2 ans (Premium Support inclus)' },
    { key: 'Indice de Réparabilité', value: '8.4 / 10' },
    { key: 'Dimensions', value: '159.9 x 76.7 x 8.25 mm' },
    { key: 'Poids', value: '221 g' },
    { key: 'Matériau Principal', value: 'Titane de grade aérospatiale / Verre trempé ultra résistant' },
    { key: 'Connectivité', value: 'Wi-Fi 6E, Bluetooth 5.3, NFC, USB-C 3.0' }
  ];

  const colors = product.brand === 'Apple' 
    ? ['Titane Naturel', 'Titane Bleu', 'Titane Blanc', 'Titane Noir'] 
    : ['Noir Intense', 'Blanc Pur', 'Gris Sidéral'];

  const sizes = product.brand === 'Apple'
    ? ['128 Go', '256 Go', '512 Go', '1 To']
    : ['Standard', 'Professionnel', 'Édition Spéciale'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase font-mono tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au catalogue
        </Link>
      </div>

      {/* Main product showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Col: Interactive Image Gallery */}
        <div className="space-y-4">
          <div 
            className="aspect-square w-full rounded-2xl bg-slate-50 border border-slate-100 dark:border-slate-700 overflow-hidden relative group cursor-crosshair select-none"
            onMouseEnter={() => setIsHoverZooming(true)}
            onMouseLeave={() => setIsHoverZooming(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={activeImage || undefined}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-200 ease-out pointer-events-none"
              style={{
                transformOrigin: isHoverZooming ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                transform: isHoverZooming ? 'scale(2.2)' : 'scale(1)',
              }}
              referrerPolicy="no-referrer"
            />

            {/* Smooth Zoom Badge Overlay */}
            <AnimatePresence>
              {isHoverZooming && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 font-mono text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-lg pointer-events-none z-10"
                >
                  <ZoomIn className="w-3.5 h-3.5 animate-pulse" />
                  Zoom 2.2x
                </motion.div>
              )}
            </AnimatePresence>

            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none z-10">
                PROMO
              </span>
            )}

            {/* Fullscreen Modal Button */}
            <button
              onClick={() => setIsZoomOpen(true)}
              className="absolute bottom-4 right-4 bg-white/95 text-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all hover:bg-slate-900 hover:text-white z-10"
            >
              <Maximize2 className="w-4 h-4" />
              Plein écran
            </button>

            {/* Video Play Button Overlay */}
            <button
              onClick={() => setIsVideoOpen(true)}
              className="absolute bottom-4 left-4 bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all hover:bg-emerald-600 z-10"
            >
              <Play className="w-4 h-4 fill-white" />
              Voir la vidéo
            </button>
          </div>

          {/* Thumbnails Row */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border-2 transition-all cursor-pointer ${
                    activeImage === img ? 'border-emerald-500 scale-[0.98]' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <img
                    src={img || undefined}
                    alt={`${product.name} thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Product Information */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Stock Status */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-extrabold bg-slate-100 px-2.5 py-1 rounded-md">
                {product.brand}
              </span>

              {product.stock > 0 ? (
                product.stock < 8 ? (
                  <span className="text-xs font-bold text-amber-700 font-mono bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md animate-pulse">
                    ⚠️ Plus que {product.stock} exemplaires restants !
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                    En Stock ({product.stock})
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-rose-600 font-mono bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-md">
                  Rupture de Stock
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
                {product.rating} / 5
              </span>
              <span className="text-xs text-slate-400">
                ({product.reviewsCount} avis client{product.reviewsCount > 1 ? 's' : ''})
              </span>
            </div>

            {/* Price section */}
            <div className="py-4 border-y border-slate-100 dark:border-slate-700 flex items-center gap-4">
              {hasDiscount ? (
                <>
                  <span className="text-3xl font-extrabold text-slate-950 font-mono">
                    {product.discountPrice} Ar
                  </span>
                  <span className="text-lg text-slate-400 line-through font-mono">
                    {product.price} Ar
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold font-mono px-2.5 py-1 rounded-lg">
                    Économisez {product.price - (product.discountPrice || 0)} Ar
                  </span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-slate-950 font-mono">
                  {product.price} Ar
                </span>
              )}
            </div>

            {/* 4. Variant Selection: Colors & Sizes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Color options */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">
                  Couleur : {selectedColor}
                </span>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedColor === c 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size / Variant options */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">
                  Modèle / Capacité : {selectedSize}
                </span>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedSize === s 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description & Technical Tabs */}
            <div className="space-y-3 pt-4">
              <div className="flex border-b border-slate-100 dark:border-slate-700 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('desc')}
                  className={`pb-2 text-xs font-bold uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'desc' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 text-xs font-bold uppercase font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === 'specs' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400'
                  }`}
                >
                  Fiche Technique
                </button>
              </div>

              {activeTab === 'desc' ? (
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  {product.description}
                </p>
              ) : (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-xs font-sans">
                    <tbody>
                      {mockSpecs.map((spec, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <td className="p-3 font-semibold text-slate-500 bg-slate-50 w-1/3">{spec.key}</td>
                          <td className="p-3 text-slate-700">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Purchase Actions (Quantity & Cart Buttons) */}
          <div className="space-y-4 pt-6">
            {product.stock > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  
                  {/* Quantity adjustments */}
                  <div className="flex items-center justify-between border border-slate-200 bg-slate-50/50 p-1.5 rounded-xl sm:w-36 shrink-0">
                    <button
                      onClick={() => handleQtyChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-sm font-bold text-slate-800 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQtyChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Action Buttons */}
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl py-3 px-5 flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Ajouter au panier
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl py-3 px-5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      Acheter maintenant
                    </button>

                    <button
                      onClick={handleWishlistToggle}
                      className={`p-3 border rounded-xl transition-all cursor-pointer ${
                        isWishlisted
                          ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                      }`}
                      title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                    </button>
                  </div>

                </div>

                {/* Shipping & Support guarantees block */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 text-center space-y-1">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-700">Livr. Express</span>
                    <span className="text-[8px] text-slate-400">Gratuit dès 150 Ar</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 text-center space-y-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-700">Garantie 2 ans</span>
                    <span className="text-[8px] text-slate-400">Support VIP 24/7</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 text-center space-y-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-700">100% Authentique</span>
                    <span className="text-[8px] text-slate-400">Importateur direct</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 text-rose-900 rounded-xl p-4 text-sm font-medium">
                Cet article d'exception est actuellement en rupture de stock. Notre équipe d'approvisionnement fait le maximum pour un réassort immédiat.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Similar products Showcase row */}
      {similarProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-100 dark:border-slate-700 space-y-6">
          <div>
            <h3 className="text-xl font-sans font-extrabold tracking-tight text-slate-900">
              Produits Similaires
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              D'autres pièces technologiques d'exception de la même catégorie.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews and Ratings Breakdown Section */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Aggregate Ratings distribution */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-sans font-extrabold tracking-tight text-slate-900">
              Avis & Évaluations Clients
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Consultez les témoignages des acquéreurs de ce produit.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 text-center sm:text-left">
            <h4 className="text-4xl font-extrabold text-slate-900 font-mono">
              {product.rating} <span className="text-lg text-slate-400 font-medium">/ 5</span>
            </h4>
            <div className="flex justify-center sm:justify-start text-amber-400 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Basé sur {reviews.length} note{reviews.length > 1 ? 's' : ''} vérifiée{reviews.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Add Review Form Box */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-emerald-600" />
              Rédiger un avis
            </h4>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Interactive Star Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Votre Note
                  </label>
                  <div className="flex text-amber-400 gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewRating(num)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${num <= newRating ? 'fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Votre Avis & Commentaire
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Écrivez votre commentaire honnête ici..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {submittingReview ? 'Publication...' : 'Publier mon avis d\'élite'}
                </button>
              </form>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  Vous devez être connecté avec un compte client pour publier un avis.
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Reviews Listing */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="font-sans font-bold text-slate-800 text-base flex items-center gap-1.5">
            <MessageSquareCode className="w-5 h-5 text-emerald-600" />
            Témoignages récents ({reviews.length})
          </h4>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
              <span className="text-2xl">✍️</span>
              <p className="text-sm font-semibold text-slate-600">Aucun avis disponible</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Soyez le premier à partager votre expérience d'acquisition pour ce produit d'exception.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h5 className="font-sans font-bold text-slate-800 text-sm">
                        {rev.userName}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">
                        Le {new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Review rating */}
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <div className="pt-12 border-t border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
            <div>
              <h3 className="text-xl font-sans font-extrabold tracking-tight text-slate-900">
                Produits Récemment Consultés
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Retrouvez rapidement les articles que vous avez consultés précédemment.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl w-full flex flex-col items-center"
            >
              <button
                onClick={() => setIsZoomOpen(false)}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 cursor-pointer text-xs font-bold transition-all"
              >
                Fermer [X]
              </button>
              <img
                src={activeImage || undefined}
                alt={product.name}
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
                referrerPolicy="no-referrer"
              />
              <span className="text-white/60 text-xs font-mono mt-4 tracking-wider">
                Utilisez la molette pour zoomer • {product.name}
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Presentation Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative max-w-2xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            >
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" />
                  PRÉSENTATION EXCLUSIVE
                </span>
                <button
                  onClick={() => setIsVideoOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Fermer [X]
                </button>
              </div>

              {/* Video frame simulating high quality tech review */}
              <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
                  title="Product Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-4 bg-slate-900 text-slate-300 text-xs text-center border-t border-slate-800 font-sans italic">
                Vidéo de démonstration en haute résolution. Zoom optique et performances testées en laboratoire.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
