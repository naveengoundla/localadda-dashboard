import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import RegisterStorePage from './pages/RegisterStorePage';
import ProductsPage from './pages/ProductsPage';
import DiscountsPage from './pages/DiscountsPage';
import PhotosPage from './pages/PhotosPage';
import ContactPage from './pages/ContactPage';
import InvitePage from './pages/InvitePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminStoresPage from './pages/admin/AdminStoresPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdminAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Store owner */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={<RequireAuth><DashboardLayout /></RequireAuth>}
        >
          <Route index element={<DashboardHome />} />
          <Route path="register" element={<RegisterStorePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="discounts" element={<DiscountsPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="invites" element={<InvitePage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={<RequireAdminAuth><AdminLayout /></RequireAdminAuth>}
        >
          <Route index element={<Navigate to="/admin/stores" replace />} />
          <Route path="stores" element={<AdminStoresPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
