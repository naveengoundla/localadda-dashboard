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

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
