/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { Product, Category } from '../types';
import { initialCategories, initialProducts } from '../initialData';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import ChatBotWidget from '../components/ChatBotWidget';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, Gift, Percent, Star, Bot } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'L\'innovation à votre poignet',
    subtitle: 'Apple Watch Ultra 2 Titanium',
    desc: 'Boîtier d\'exception en titane, écran ultra lumineux de 3000 nits, et autonomie record pour toutes vos explorations.',
    btnText: 'Découvrir la montre',
    link: '/products/apple-watch-ultra-2',
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=1200',
    tag: 'EXCLUSIVITÉ'
  },
  {
    id: 2,
    title: 'La perfection sonore, sans distraction',
    subtitle: 'Sony WH-1000XM5 ANC',
    desc: 'Plongez dans un son haute fidélité d\'une clarté inégalée grâce au meilleur système d\'annulation active du bruit du marché.',
    btnText: 'Voir le produit',
    link: '/products/sony-wh-1000xm5-anc',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1200',
    tag: 'OFFRE LIMITÉE'
  },
  {
    id: 3,
    title: 'Libérez votre productivité',
    subtitle: 'MacBook Pro 16" M3 Max',
    desc: 'Un processeur d\'une puissance inouïe, un écran Liquid Retina XDR somptueux et jusqu\'à 22h de batterie.',
    btnText: 'Découvrir les Mac',
    link: '/products/macbook-pro-16-m3-max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200',
    tag: 'PERFORMANCE PRO'
  }
];

const TESTIMONIALS = [
  {
    name: 'Olivier Roussel',
    role: 'Acheteur Vérifié',
    comment: 'Une expérience d\'achat absolument remarquable. Le MacBook Pro est arrivé dans un emballage de haute protection d\'une élégance folle. Service client d\'une réactivité incroyable !',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'
  },
  {
    name: 'Amandine Petit',
    role: 'Acheteur Vérifié',
    comment: 'Le casque Sony WH-1000XM5 commandé ici dépasse toutes mes espérances. Livraison express sous 24h gratuite. Je recommande vivement ce site de matériel d\'exception.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
  },
  {
    name: 'Julien Mercier',
    role: 'Client Privilégié',
    comment: 'Un catalogue soigné avec des références triées sur le volet. Le code WELCOME10 m\'a permis d\'économiser sur mon iPhone 15 Pro Max. Tout est parfait.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
  }
];

export default function Home() {
  const { user, showToast } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Fetch initial products and categories
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/api/categories').catch((err) => {
            console.warn('API /api/categories fetch fallback:', err?.message || err);
            return { data: initialCategories };
          }),
          api.get('/api/products?limit=20').catch((err) => {
            console.warn('API /api/products fetch fallback:', err?.message || err);
            return { data: { products: initialProducts, total: initialProducts.length, pages: 1 } };
          })
        ]);
        
        if (!isMounted) return;

        const catData = (catRes?.data && Array.isArray(catRes.data) && catRes.data.length > 0)
          ? catRes.data
          : initialCategories;
        setCategories(catData);

        const allProds = (prodRes?.data?.products && Array.isArray(prodRes.data.products) && prodRes.data.products.length > 0)
          ? (prodRes.data.products as Product[])
          : initialProducts;
        
        // Split products for different rows
        setFeaturedProducts(allProds.filter(p => p.featured).slice(0, 4));
        setSaleProducts(allProds.filter(p => p.discountPrice !== undefined).slice(0, 4));
        
        // Sort products by date to get newest arrivals
        const sortedByDate = [...allProds].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNewArrivals(sortedByDate.slice(0, 4));
      } catch (error) {
        if (!isMounted) return;
        console.warn('Recovered gracefully using initial catalog data:', error);
        setCategories(initialCategories);
        setFeaturedProducts(initialProducts.filter(p => p.featured).slice(0, 4));
        setSaleProducts(initialProducts.filter(p => p.discountPrice !== undefined).slice(0, 4));
        const sortedByDate = [...initialProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNewArrivals(sortedByDate.slice(0, 4));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Slide loop timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Hero Banner Slider */}
      <section className="relative h-[480px] sm:h-[550px] bg-slate-900 overflow-hidden w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-slate-950/60 z-10" />
            <img
              src={SLIDES[currentSlide].image || undefined}
              alt={SLIDES[currentSlide].subtitle}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />

            {/* Content Container */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl text-left space-y-4">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-extrabold tracking-widest px-3 py-1 rounded-full border border-emerald-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    {SLIDES[currentSlide].tag}
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight text-white leading-tight">
                    {SLIDES[currentSlide].title}
                  </h1>
                  <h3 className="text-xl sm:text-2xl font-medium text-slate-200">
                    {SLIDES[currentSlide].subtitle}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                    {SLIDES[currentSlide].desc}
                  </p>
                  <div className="pt-4">
                    <Link
                      to={SLIDES[currentSlide].link}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                    >
                      {SLIDES[currentSlide].btnText}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all cursor-pointer hidden md:block"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all cursor-pointer hidden md:block"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-sans font-extrabold tracking-tight text-slate-900">
              Acheter par catégorie
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Explorez nos univers de technologies d'élite.
            </p>
          </div>
          <Link
            to="/products"
            className="group flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-all shrink-0"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all h-full"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image || undefined}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-sans font-semibold text-xs sm:text-sm text-slate-800 text-center mt-4 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {cat.name}
                </h4>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Promo Highlights Banner */}
      <section className="bg-slate-50 dark:bg-slate-900 py-8 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Offre de bienvenue : -10% immédiats !</h3>
                <p className="text-xs sm:text-sm text-slate-500">Utilisez le code promo <strong className="font-mono bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/20">WELCOME10</strong> à l'étape du panier.</p>
              </div>
            </div>
            <Link
              to="/products"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-5 rounded-xl transition-all shadow-sm shrink-0"
            >
              Profiter de l'offre
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Products Showcase */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h2 className="text-2xl font-sans font-extrabold tracking-tight text-slate-900">
                Produits Populaires
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                La sélection premium plébiscitée par nos clients d'élite.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 4b. New Arrivals ("Nouveautés") Showcase */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h2 className="text-2xl font-sans font-extrabold tracking-tight text-slate-900">
                Nouveautés d'Exception
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Découvrez les dernières références technologiques haut de gamme ajoutées à notre catalogue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Special Discounts Row */}
      {saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h2 className="text-2xl font-sans font-extrabold tracking-tight text-slate-900">
                Promotions Spéciales
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Prix réduits exclusifs sur notre matériel d'exception.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5b. Customer Testimonials ("Avis Clients") Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
            <h2 className="text-2xl font-sans font-extrabold tracking-tight text-slate-900">
              Témoignages de nos clients d'élite
            </h2>
            <p className="text-sm text-slate-500">
              Découvrez les retours d'expérience de passionnés qui nous ont fait confiance pour leur équipement technologique d'exception.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((test, id) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: id * 0.1 }}
                className="bg-white border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans italic">
                  "{test.comment}"
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                  <img
                    src={test.avatar || undefined}
                    alt={test.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h5 className="font-sans font-bold text-slate-800 text-xs sm:text-sm">
                      {test.name}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">
                        {test.role}
                      </span>
                      <div className="flex text-amber-400">
                        {[...Array(test.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Chatbot Widget (@n8n/chat) */}
      <ChatBotWidget />

    </div>
  );
}
