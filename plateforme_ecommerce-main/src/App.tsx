/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import ChatBot from './components/chat/ChatBot';

// Import Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import PaymentPage from './pages/PaymentPage';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

import NotificationsPage from './pages/NotificationsPage';
import Settings from './pages/Settings';
import { ReactNode } from 'react';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-200">
          
          {/* Sticky glass header */}
          <Navbar />

          {/* Main content viewport with fade-in animation container */}
          <main className="flex-1 w-full animate-in fade-in duration-300">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/paiement" element={<PaymentPage />} />
              <Route path="/track" element={<OrderTracking />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/orders/:orderNumber" element={<OrderTracking />} />
              <Route path="/track/:orderNumber" element={<OrderTracking />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/settings" element={<Settings />} />
              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Complete e-commerce footer */}
          <Footer />

          {/* Custom Toast Alerts engine */}
          <ToastContainer />

          {/* Floating AI Chatbot Widget */}
          <ChatBot />

        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
