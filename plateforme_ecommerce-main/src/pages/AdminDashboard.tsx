/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { Product, Category, Order, Coupon, DashboardStats, User } from '../types';
import Loader from '../components/Loader';
import ImageUploader from '../components/ImageUploader';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  LayoutGrid, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Tag, 
  Calendar, 
  Settings, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  X,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

type AdminTab = 'stats' | 'products' | 'categories' | 'orders' | 'coupons' | 'payments';

export default function AdminDashboard() {
  const { user, showToast } = useApp();
  const navigate = useNavigate();

  // Redirect non-admins
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('Accès refusé. Rôle administrateur requis.', 'error');
      navigate('/');
    }
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [loading, setLoading] = useState(true);

  // Stats Data
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Datasets
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; database?: string; type?: string; error?: string } | null>(null);

  // Mobile Money management states
  const [paymentSearch, setPaymentSearch] = useState('');
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Modals / Form States
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    categoryId: '',
    brand: '',
    imageUrl: '',
    featured: false
  });

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: ''
  });

  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percentage' as Coupon['type'],
    value: '',
    minAmount: '',
    expiryDate: ''
  });

  // Order Management States
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    status: '',
    paymentStatus: '',
    carrier: '',
    trackingNumber: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'product' | 'category' | 'coupon' | null;
    id: string;
    title: string;
    message: string;
  }>({
    show: false,
    type: null,
    id: '',
    title: '',
    message: '',
  });

  // Fetch all administration datasets
  const fetchAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, prodRes, catRes, ordRes, coupRes, clientRes, payRes, dbRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/products?limit=100'),
        api.get('/api/categories'),
        api.get('/api/orders'),
        api.get('/api/coupons'),
        api.get('/api/admin/clients'),
        api.get('/api/payments'),
        api.get('/api/db-status').catch(() => ({ data: { connected: false } }))
      ]);

      setStats(statsRes.data);
      setProducts(prodRes.data.products);
      setCategories(catRes.data);
      setOrders(ordRes.data);
      setCoupons(coupRes.data);
      setClients(clientRes.data);
      setPayments(payRes.data);
      if (dbRes?.data) {
        setDbStatus(dbRes.data);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
      showToast('Erreur lors de la synchronisation des données admin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAllAdminData();
    }
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  // --- SUBMISSIONS & DELETE OPERATIONS ---

  // CATEGORIES CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('Le nom de la catégorie est obligatoire.', 'error');
      return;
    }

    try {
      if (editingCategory) {
        const res = await api.put(`/api/categories/${editingCategory.id}`, categoryForm);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? res.data : c)));
        showToast('Catégorie mise à jour avec succès.', 'success');
      } else {
        const res = await api.post('/api/categories', categoryForm);
        setCategories((prev) => [...prev, res.data]);
        showToast('Nouvelle catégorie enregistrée.', 'success');
      }
      setCategoryFormOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', image: '' });
      // Refresh statistics counts
      fetchAllAdminData();
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement de la catégorie.', 'error');
    }
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setDeleteConfirm({
      show: true,
      type: 'category',
      id,
      title: 'Supprimer la catégorie',
      message: `Voulez-vous vraiment supprimer la catégorie "${cat?.name || id}" ? Cette action est irréversible et supprimera également tous les produits associés à cette catégorie.`
    });
  };

  // PRODUCTS CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, price, categoryId, brand } = productForm;
    if (!name.trim() || !price || !categoryId || !brand.trim()) {
      showToast('Veuillez renseigner tous les champs obligatoires.', 'error');
      return;
    }

    const submissionData = {
      ...productForm,
      price: Number(productForm.price),
      discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
      stock: Number(productForm.stock) || 0,
      images: [productForm.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600']
    };

    try {
      if (editingProduct) {
        const res = await api.put(`/api/products/${editingProduct.id}`, submissionData);
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data : p)));
        showToast('Produit mis à jour avec succès.', 'success');
      } else {
        const res = await api.post('/api/products', submissionData);
        setProducts((prev) => [...prev, res.data]);
        showToast('Nouveau produit d\'exception répertorié.', 'success');
      }
      setProductFormOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        stock: '',
        categoryId: '',
        brand: '',
        imageUrl: '',
        featured: false
      });
      fetchAllAdminData();
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement du produit.', 'error');
    }
  };

  const handleDeleteProduct = (id: string) => {
    const p = products.find((prod) => prod.id === id);
    setDeleteConfirm({
      show: true,
      type: 'product',
      id,
      title: 'Supprimer le produit',
      message: `Voulez-vous vraiment retirer définitivement le produit "${p?.name || id}" de votre catalogue ?`
    });
  };

  // COUPONS CRUD
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { code, type, value } = couponForm;
    if (!code.trim() || !type || !value) {
      showToast('Veuillez remplir les champs obligatoires du coupon.', 'error');
      return;
    }

    try {
      const res = await api.post('/api/coupons', {
        ...couponForm,
        value: Number(couponForm.value),
        minAmount: Number(couponForm.minAmount) || 0,
        expiryDate: couponForm.expiryDate ? new Date(couponForm.expiryDate).toISOString() : undefined
      });
      setCoupons((prev) => [...prev, res.data]);
      showToast('Nouveau code promo enregistré avec succès.', 'success');
      setCouponFormOpen(false);
      setCouponForm({ code: '', type: 'percentage', value: '', minAmount: '', expiryDate: '' });
    } catch (err) {
      showToast('Erreur lors de la création du coupon.', 'error');
    }
  };

  const handleDeleteCoupon = (id: string) => {
    const coup = coupons.find((c) => c.id === id);
    setDeleteConfirm({
      show: true,
      type: 'coupon',
      id,
      title: 'Supprimer le code promo',
      message: `Voulez-vous vraiment désactiver et supprimer le code promo "${coup?.code || id}" ?`
    });
  };

  const executeDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;

    try {
      if (type === 'category') {
        await api.delete(`/api/categories/${id}`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Catégorie supprimée avec succès.', 'info');
      } else if (type === 'product') {
        await api.delete(`/api/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Produit supprimé du catalogue.', 'info');
      } else if (type === 'coupon') {
        await api.delete(`/api/coupons/${id}`);
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        showToast('Code promo supprimé.', 'info');
      }
      fetchAllAdminData();
    } catch (err) {
      showToast(`Erreur lors de la suppression de l'élément.`, 'error');
    } finally {
      setDeleteConfirm({ show: false, type: null, id: '', title: '', message: '' });
    }
  };

  // UPDATE ORDER Fulfillment STATUS
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status } : o)));
      showToast(`Statut de la commande #${orderId} mis à jour : ${newStatus}`, 'success');
      fetchAllAdminData();
    } catch (err) {
      showToast('Erreur lors du changement de statut.', 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="w-8 h-8 text-emerald-600 animate-spin-slow" />
              Console Administration
            </h1>

            {dbStatus && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                dbStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>MongoDB: {dbStatus.database || 'ecommerce_db'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gérez votre stock, analysez vos rapports de ventes et modifiez vos catégories
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {(['stats', 'products', 'categories', 'orders', 'coupons', 'payments'] as AdminTab[]).map((tab) => {
            let label = '';
            if (tab === 'stats') label = 'Rapports 📊';
            if (tab === 'products') label = 'Produits';
            if (tab === 'categories') label = 'Catégories';
            if (tab === 'orders') label = 'Commandes';
            if (tab === 'coupons') label = 'Codes Promo';
            if (tab === 'payments') label = 'Paiements Mobile 📱';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE DISPLAY SWITCH */}
      {activeTab === 'stats' && (
        /* REPORTS / STATS TAB */
        <div className="space-y-8">
          {/* Bento counter stats block */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Sales */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-block">
                <TrendingUp className="w-5 h-5" />
              </span>
              <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalSales} Ar</h3>
            </div>

            {/* Orders */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl inline-block">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Commandes enregistrées</p>
              <h3 className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalOrders}</h3>
            </div>

            {/* Clients */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="p-3 bg-slate-100 text-slate-600 rounded-xl inline-block">
                <Users className="w-5 h-5" />
              </span>
              <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Clients d'Élite</p>
              <h3 className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalClients}</h3>
            </div>

            {/* Products stock */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl inline-block">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <p className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Références produits</p>
              <h3 className="text-2xl font-extrabold font-mono text-slate-900">{stats.totalProducts}</h3>
            </div>

          </div>

          {/* Recharts Graphical Visualizers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sales over time (7 Days Area chart) */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <h4 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider font-mono">
                Évolution du chiffre d'affaires (7 derniers jours)
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesHistory}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={11} fontStyle="italic" />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(value) => [`${value} Ar`, 'Ventes']} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown (Bar chart) */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-sans font-extrabold text-slate-800 text-sm uppercase tracking-wider font-mono">
                Répartition des ventes par catégorie
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categorySales} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="categoryName" type="category" width={80} stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value} art.`, 'Articles vendus']} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'products' && (
        /* PRODUCTS MANAGEMENT TABLE */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 font-mono uppercase">
              {products.length} référence(s) enregistrée(s)
            </span>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  discountPrice: '',
                  stock: '',
                  categoryId: categories[0]?.id || '',
                  brand: '',
                  imageUrl: '',
                  featured: false
                });
                setProductFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouveau Produit
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase font-mono tracking-wider">
                    <th className="p-4">Visuel</th>
                    <th className="p-4">Désignation</th>
                    <th className="p-4">Marque & Catégorie</th>
                    <th className="p-4">Tarif</th>
                    <th className="p-4 text-center">Stock</th>
                    <th className="p-4 text-center">Featured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <img src={p.images[0] || undefined} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" referrerPolicy="no-referrer" />
                        </td>
                        <td className="p-4">
                          <h5 className="font-bold text-slate-800 line-clamp-1">{p.name}</h5>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs block">{p.slug}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded mr-1.5">{p.brand}</span>
                          <span className="text-slate-500">{cat?.name || 'Inconnue'}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800">
                          {p.discountPrice ? (
                            <span className="flex flex-col">
                              <span className="text-rose-600">{p.discountPrice} Ar</span>
                              <span className="text-[10px] text-slate-400 line-through">{p.price} Ar</span>
                            </span>
                          ) : (
                            <span>{p.price} Ar</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                            p.stock === 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : p.stock < 5 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {p.stock} art.
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {p.featured ? <span className="text-emerald-500">✓ Oui</span> : <span className="text-slate-300">Non</span>}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm({
                                  name: p.name,
                                  description: p.description,
                                  price: String(p.price),
                                  discountPrice: p.discountPrice ? String(p.discountPrice) : '',
                                  stock: String(p.stock),
                                  categoryId: p.categoryId,
                                  brand: p.brand,
                                  imageUrl: p.images[0],
                                  featured: p.featured
                                });
                                setProductFormOpen(true);
                              }}
                              className="p-1.5 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        /* CATEGORIES MANAGEMENT CRUD */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 font-mono uppercase">
              {categories.length} catégorie(s) enregistrée(s)
            </span>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryForm({ name: '', description: '', image: '' });
                setCategoryFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Catégorie
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="aspect-video w-full relative bg-slate-100">
                  <img src={cat.image || undefined} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-sans font-extrabold text-slate-900 text-base">{cat.name}</h4>
                    <p className="text-xs text-slate-400 font-mono leading-none">{cat.slug}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{cat.description || "Aucune description renseignée."}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-50 mt-4">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          description: cat.description,
                          image: cat.image
                        });
                        setCategoryFormOpen(true);
                      }}
                      className="p-1.5 border border-slate-150 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editer
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 border border-slate-150 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        /* ORDERS MANAGEMENT PANEL */
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono font-bold uppercase text-slate-500">
            <span>Historique général : {orders.length} commande(s) globale(s)</span>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Rechercher par Num, Client..."
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="flex-1 md:w-auto bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={async () => {
                  try {
                    const XLSX = await import('xlsx');
                    const ws = XLSX.utils.json_to_sheet(orders.map(o => ({
                      "Commande ID": o.orderNumber || o.id,
                      "Nom Client": o.customerName || o.userName || 'Client',
                      "Date de commande": new Date(o.createdAt).toLocaleString('fr-FR'),
                      "Paiement": `${o.paymentMethod || 'Mvola'} (${o.paymentStatus || 'En attente'})`,
                      "Livraison": `${o.deliveryStatus || o.status || 'En attente'} - ${o.address || ''}`,
                      "Montant": o.total,
                      "Email": o.userEmail || '',
                      "Téléphone": o.phone || '',
                      "Référence Paiement": o.transactionReference || '',
                      "Transporteur": o.carrier || '',
                      "Suivi": o.trackingNumber || ''
                    })));
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
                    XLSX.writeFile(wb, "export_commandes.xlsx");
                    showToast('Export Excel réussi', 'success');
                  } catch (err) {
                    showToast('Erreur lors de l\'export', 'error');
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg"
              >
                Exporter (Excel)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase font-mono tracking-wider">
                    <th className="p-4">Commande ID</th>
                    <th className="p-4">Nom Client</th>
                    <th className="p-4">Date de commande</th>
                    <th className="p-4">Paiement</th>
                    <th className="p-4">Livraison</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.filter(o => 
                    (o.orderNumber || o.id).toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                    (o.userName || o.customerName || '').toLowerCase().includes(orderSearchTerm.toLowerCase())
                  ).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* 1. Commande ID */}
                      <td className="p-4">
                        <span className="font-mono text-xs font-extrabold text-slate-900 block">{ord.orderNumber || ord.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {ord.id}</span>
                      </td>

                      {/* 2. Nom Client */}
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">{ord.customerName || ord.userName || 'Client'}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{ord.phone || ord.userEmail}</span>
                      </td>

                      {/* 3. Date de commande */}
                      <td className="p-4">
                        <span className="text-slate-700 font-medium block">
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ord.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* 4. Paiement */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">
                            {ord.paymentMethod || 'Mvola'}
                          </span>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.paymentStatus === 'Payé' ? 'bg-emerald-100 text-emerald-800' :
                              ord.paymentStatus === 'Échoué' ? 'bg-rose-100 text-rose-800' :
                              ord.paymentStatus === 'Remboursé' ? 'bg-slate-100 text-slate-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.paymentStatus || 'En attente'}
                            </span>
                          </div>
                          {ord.transactionReference && (
                            <span className="text-[9px] font-mono text-slate-400 block">Réf: {ord.transactionReference}</span>
                          )}
                        </div>
                      </td>

                      {/* 5. Livraison */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                            ord.status === 'En attente' ? 'bg-amber-100 text-amber-700' :
                            ord.status === 'Confirmée' ? 'bg-blue-100 text-blue-700' :
                            ord.status === 'En préparation' ? 'bg-indigo-100 text-indigo-700' :
                            ord.status === 'Expédiée' ? 'bg-purple-100 text-purple-700' :
                            ord.status === 'Livrée' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {ord.deliveryStatus || ord.status || 'En attente'}
                          </span>
                          <span className="text-[10px] text-slate-500 block max-w-[140px] truncate" title={ord.address}>
                            {ord.address}
                          </span>
                        </div>
                      </td>

                      {/* 6. Montant */}
                      <td className="p-4">
                        <span className="font-mono text-sm font-extrabold text-emerald-600 block">{ord.total.toLocaleString('fr-FR')} Ar</span>
                        <span className="text-[10px] text-slate-400">
                          {ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || ord.products?.reduce((s, i) => s + (i.quantity || 1), 0) || 1} art.
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setOrderForm({
                              status: ord.status || 'En attente',
                              paymentStatus: ord.paymentStatus || 'En attente',
                              carrier: ord.carrier || '',
                              trackingNumber: ord.trackingNumber || ''
                            });
                            setOrderModalOpen(true);
                          }}
                          className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        /* COUPONS MANAGEMENT */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500 font-mono uppercase">
              {coupons.length} coupon(s) répertorié(s)
            </span>
            <button
              onClick={() => {
                setCouponForm({ code: '', type: 'percentage', value: '', minAmount: '', expiryDate: '' });
                setCouponFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nouveau Code Promo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((coup) => (
              <div
                key={coup.id}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono font-extrabold text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                      {coup.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {coup.active ? '🟢 Actif' : '🔴 Expiré'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Réduction :{' '}
                    <strong className="text-slate-900 font-mono">
                      {coup.value}
                      {coup.type === 'percentage' ? '%' : ' Ar'}
                    </strong>{' '}
                    sur tout achat minimum de{' '}
                    <strong className="text-slate-900 font-mono">{coup.minAmount} Ar</strong>
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    Valide jusqu'au {new Date(coup.expiryDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex justify-end">
                  <button
                    onClick={() => handleDeleteCoupon(coup.id)}
                    className="p-1.5 border border-slate-150 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        /* PAYMENTS MANAGEMENT */
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono font-bold uppercase text-slate-500">
            <span>Déclarations reçues : {payments.length} transaction(s) Mobile Money</span>
            <input
              type="text"
              placeholder="Filtrer par Réf, Client, Tél, ID Commande..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="w-full md:w-64 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 text-xs font-sans normal-case font-normal text-slate-800"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase font-mono tracking-wider">
                    <th className="p-4">Commande</th>
                    <th className="p-4">Client Mobile Money</th>
                    <th className="p-4">Méthode</th>
                    <th className="p-4">Référence</th>
                    <th className="p-4">Montant Déclaré</th>
                    <th className="p-4">Preuve(s)</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Validation / Notes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments
                    .filter(p => {
                      const term = paymentSearch.toLowerCase();
                      const orderNum = orders.find(o => o.id === p.orderId)?.orderNumber || p.orderId;
                      return (
                        p.paymentReference.toLowerCase().includes(term) ||
                        p.fullName.toLowerCase().includes(term) ||
                        p.phoneNumber.includes(term) ||
                        orderNum.toLowerCase().includes(term) ||
                        p.deliveryAddress.toLowerCase().includes(term)
                      );
                    })
                    .map((pay) => {
                      const matchingOrder = orders.find(o => o.id === pay.orderId);
                      const isPending = pay.status === 'pending';
                      const isApproved = pay.status === 'approved';
                      const isRejected = pay.status === 'rejected';

                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            {matchingOrder ? (
                              <div>
                                <span className="font-bold text-slate-800">{matchingOrder.orderNumber}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">ID: {pay.orderId}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">ID: {pay.orderId}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div>
                              <span className="font-semibold text-slate-800">{pay.fullName}</span>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pay.phoneNumber}</p>
                              <p className="text-[9px] text-slate-400 max-w-[150px] truncate" title={pay.deliveryAddress}>{pay.deliveryAddress}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                              pay.paymentMethod === 'MVola' 
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                : pay.paymentMethod === 'Airtel Money'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              {pay.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-800 bg-slate-50/30">
                            {pay.paymentReference}
                          </td>
                          <td className="p-4 font-mono font-extrabold text-slate-900">
                            {pay.amount} Ar
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {pay.receiptImages?.map((img: any, i: number) => (
                                <div 
                                  key={i} 
                                  onClick={() => setPreviewImage(img.url)}
                                  className="w-8 h-8 rounded-lg border border-slate-100 overflow-hidden shrink-0 cursor-zoom-in hover:scale-105 transition-transform bg-slate-100"
                                >
                                  <img src={img.url} alt="receipt" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : isRejected 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse'
                            }`}>
                              {isApproved ? 'Approuvé' : isRejected ? 'Rejeté' : 'En attente'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 max-w-[150px]">
                            {isApproved && (
                              <div className="text-[10px]">
                                <span className="font-semibold text-emerald-600 flex items-center gap-1">✔ Validé</span>
                                <p className="mt-0.5">Le {new Date(pay.verifiedAt!).toLocaleDateString('fr-FR')}</p>
                              </div>
                            )}
                            {isRejected && (
                              <div className="text-[10px]">
                                <span className="font-semibold text-rose-600 flex items-center gap-1">❌ Refusé</span>
                                <p className="mt-0.5 italic text-slate-400 font-sans" title={pay.rejectionReason}>Raison: {pay.rejectionReason}</p>
                              </div>
                            )}
                            {isPending && <span className="text-[10px] italic text-slate-400">À vérifier manuellement</span>}
                          </td>
                          <td className="p-4 text-right">
                            {isPending ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={async () => {
                                    if (confirm(`Approuver cette transaction de ${pay.amount} Ar ? La commande associée sera automatiquement marquée comme Payée.`)) {
                                      try {
                                        await api.put(`/api/payments/${pay.id}/verify`, { status: 'approved' });
                                        showToast('Paiement approuvé avec succès !', 'success');
                                        fetchAllAdminData();
                                      } catch (err) {
                                        showToast('Erreur lors de la validation.', 'error');
                                      }
                                    }
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Approuver
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingPaymentId(pay.id);
                                    setRejectionReason('');
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Rejeter
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {payments.filter(p => {
                    const term = paymentSearch.toLowerCase();
                    const orderNum = orders.find(o => o.id === p.orderId)?.orderNumber || p.orderId;
                    return (
                      p.paymentReference.toLowerCase().includes(term) ||
                      p.fullName.toLowerCase().includes(term) ||
                      p.phoneNumber.includes(term) ||
                      orderNum.toLowerCase().includes(term) ||
                      p.deliveryAddress.toLowerCase().includes(term)
                    );
                  }).length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic animate-pulse">
                        Aucun paiement ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODALS --- */}

      {/* 1. PRODUCT CRUD MODAL */}
      <AnimatePresence>
        {productFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-sans font-extrabold text-slate-950 text-lg border-b border-slate-50 pb-2">
                {editingProduct ? 'Modifier la référence' : 'Ajouter un produit haut de gamme'}
              </h3>

              <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Désignation *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Apple, Sony"
                    value={productForm.brand}
                    onChange={(e) => setProductForm((p) => ({ ...p, brand: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Catégorie *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Tarif initial (Ar) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Discount price */}
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Tarif réduit (Ar)</label>
                  <input
                    type="number"
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm((p) => ({ ...p, discountPrice: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Stock d'approvisionnement</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Image cover */}
                <div className="space-y-1">
                  <ImageUploader
                    label="Photo du produit (Importation locale) *"
                    value={productForm.imageUrl}
                    onChange={(base64) => setProductForm((p) => ({ ...p, imageUrl: base64 }))}
                    showToast={showToast}
                    maxSizeMB={4}
                  />
                </div>

                {/* Featured checkbox */}
                <div className="space-y-1 sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="feat"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm((p) => ({ ...p, featured: e.target.checked }))}
                    className="rounded border-slate-300 focus:ring-emerald-500 h-4 w-4"
                  />
                  <label htmlFor="feat" className="font-sans font-bold text-slate-700">Mettre en avant ce produit sur l'accueil</label>
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Description technique</label>
                  <textarea
                    rows={4}
                    value={productForm.description}
                    onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 pt-4 border-t border-slate-50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProductFormOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow"
                  >
                    Enregistrer
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. CATEGORY CRUD MODAL */}
      <AnimatePresence>
        {categoryFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <h3 className="font-sans font-extrabold text-slate-950 text-lg border-b border-slate-50 pb-2">
                {editingCategory ? 'Modifier la catégorie' : 'Créer une nouvelle catégorie'}
              </h3>

              <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Nom de la catégorie *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Image */}
                <div className="space-y-1.5">
                  <ImageUploader
                    label="Image de couverture (Importation locale) *"
                    value={categoryForm.image}
                    onChange={(base64) => setCategoryForm((p) => ({ ...p, image: base64 }))}
                    showToast={showToast}
                    maxSizeMB={4}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Brève Description</label>
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFormOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow"
                  >
                    Enregistrer
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. COUPON CODE CREATION MODAL */}
      <AnimatePresence>
        {couponFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <h3 className="font-sans font-extrabold text-slate-950 text-lg border-b border-slate-50 pb-2">
                Générer un Code Promo
              </h3>

              <form onSubmit={handleCouponSubmit} className="space-y-4 text-xs">
                
                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Code Promo Unique *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: WINTER30"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono uppercase font-bold"
                  />
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Type de remise *</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm((p) => ({ ...p, type: e.target.value as Coupon['type'] }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-sans font-medium text-slate-800"
                  >
                    <option value="percentage">Pourcentage de réduction (%)</option>
                    <option value="fixed">Montant fixe de remise (Ar)</option>
                  </select>
                </div>

                {/* Value */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Valeur de la remise *</label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 15 pour 15% ou 15 Ar"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm((p) => ({ ...p, value: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono font-bold"
                  />
                </div>

                {/* Minimum Purchase */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Montant d'achat minimum requis (Ar)</label>
                  <input
                    type="number"
                    value={couponForm.minAmount}
                    onChange={(e) => setCouponForm((p) => ({ ...p, minAmount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Date de fin de validité</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm((p) => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponFormOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow"
                  >
                    Créer le code
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ORDER MANAGEMENT MODAL */}
      <AnimatePresence>
        {orderModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-sans font-extrabold text-slate-950 text-lg">
                    Gestion Commande {selectedOrder.orderNumber || `#${selectedOrder.id}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">Client : {selectedOrder.userName}</p>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-100 rounded-lg text-xs"
                >
                  X
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Status Updates Form */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Mise à jour des statuts</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Statut Commande</label>
                      <select
                        value={orderForm.status}
                        onChange={(e) => setOrderForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Confirmée">Confirmée</option>
                        <option value="En préparation">En préparation</option>
                        <option value="Expédiée">Expédiée</option>
                        <option value="Livrée">Livrée</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Paiement</label>
                      <select
                        value={orderForm.paymentStatus}
                        onChange={(e) => setOrderForm(p => ({ ...p, paymentStatus: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="En attente">En attente</option>
                        <option value="Payé">Payé</option>
                        <option value="Échoué">Échoué</option>
                        <option value="Remboursé">Remboursé</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">Transporteur</label>
                      <input
                        type="text"
                        placeholder="Ex: DHL"
                        value={orderForm.carrier}
                        onChange={(e) => setOrderForm(p => ({ ...p, carrier: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 uppercase tracking-wider font-mono font-bold">N° Suivi</label>
                      <input
                        type="text"
                        placeholder="Ex: 1Z999999999"
                        value={orderForm.trackingNumber}
                        onChange={(e) => setOrderForm(p => ({ ...p, trackingNumber: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const res = await api.put(`/api/orders/${selectedOrder.id}/status`, orderForm);
                        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? res.data : o));
                        setSelectedOrder(res.data);
                        showToast('Mise à jour effectuée', 'success');
                      } catch (err) {
                        showToast('Erreur lors de la mise à jour', 'error');
                      }
                    }}
                    className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg mt-2 hover:bg-slate-800"
                  >
                    Sauvegarder les modifications
                  </button>
                </div>

                {/* Document Generation */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Documents (PDF)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={async () => {
                        const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                        await generateInvoicePDF(selectedOrder, 'Facture');
                        showToast('Facture PDF générée.', 'success');
                      }}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-2 px-2 rounded-lg text-center"
                    >
                      Facture
                    </button>
                    <button
                      onClick={async () => {
                        const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                        await generateInvoicePDF(selectedOrder, 'Bon de Commande');
                        showToast('Bon de Commande PDF généré.', 'success');
                      }}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-2 px-2 rounded-lg text-center"
                    >
                      Bon Cde.
                    </button>
                    <button
                      onClick={async () => {
                        const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                        await generateInvoicePDF(selectedOrder, 'Bon de Livraison');
                        showToast('Bon de Livraison PDF généré.', 'success');
                      }}
                      className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2 px-2 rounded-lg text-center"
                    >
                      Bon Livr.
                    </button>
                  </div>
                </div>

                {/* Email Invoice */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Envoyer par Email</h4>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="email" 
                      id="invoice-email-target"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      placeholder="Adresse email du client"
                      defaultValue={selectedOrder.userEmail}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const input = document.getElementById('invoice-email-target') as HTMLInputElement;
                          const targetEmail = input?.value || selectedOrder.userEmail;
                          await api.post(`/api/orders/${selectedOrder.id}/invoice`, { email: targetEmail });
                          showToast(`Facture envoyée à ${targetEmail} !`, 'success');
                        } catch (err) {
                          showToast('Erreur lors de l\'envoi de la facture.', 'error');
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-center flex items-center justify-center gap-2 transition-all"
                    >
                      <span>📧</span> Envoyer la facture
                    </button>
                  </div>
                </div>

                {/* Logs */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Historique / Logs</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                    {(selectedOrder.logs || []).slice().reverse().map((log: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-[10px]">
                        <span className="text-slate-500 font-mono whitespace-nowrap">{new Date(log.date).toLocaleString()}</span>
                        <span className="text-slate-700 font-medium ml-2">{log.action}</span>
                        <span className="text-slate-400 italic ml-2">par {log.user}</span>
                      </div>
                    ))}
                    {(!selectedOrder.logs || selectedOrder.logs.length === 0) && (
                      <span className="text-slate-400 italic">Aucun log enregistré.</span>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CUSTOM DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="font-sans font-extrabold text-slate-950 text-lg">
                  {deleteConfirm.title}
                </h3>
              </div>

              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <p>{deleteConfirm.message}</p>
                {deleteConfirm.type === 'category' && (
                  <div className="text-rose-500 font-bold bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs flex gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>Attention : La suppression de cette catégorie supprimera tous les produits associés à celle-ci !</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ show: false, type: null, id: '', title: '', message: '' })}
                  className="bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirmer la suppression
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MOBILE MONEY REJECTION REASON MODAL */}
      <AnimatePresence>
        {rejectingPaymentId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 w-full max-w-md shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-600 border-b border-slate-100 pb-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-sans font-extrabold text-slate-950 text-base">
                  Rejeter la transaction Mobile Money
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Veuillez spécifier la raison du refus (ex: Référence introuvable, reçu illisible, montant erroné). Cette raison sera visible par le client sur son profil.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Motif du rejet *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ex: Référence de transaction invalide ou introuvable."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingPaymentId(null)}
                  className="bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim()}
                  onClick={async () => {
                    try {
                      await api.put(`/api/payments/${rejectingPaymentId}/verify`, { 
                        status: 'rejected', 
                        rejectionReason: rejectionReason.trim() 
                      });
                      showToast('Paiement rejeté avec succès.', 'success');
                      setRejectingPaymentId(null);
                      fetchAllAdminData();
                    } catch (err) {
                      showToast('Erreur lors du rejet du paiement.', 'error');
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-200 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1"
                >
                  Confirmer le rejet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. HIGH-RESOLUTION RECEIPT IMAGE LIGHTBOX PREVIEW */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="Receipt High Res" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl mx-auto" />
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
