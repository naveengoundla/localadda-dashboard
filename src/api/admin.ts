import api from './client';
import type { Category, CategoryField } from '../types';

// Category schema builder (admin)
export const getAdminCategories = () => api.get<Category[]>('/api/admin/categories');
export const updateCategorySchema = (slug: string, schema: CategoryField[]) =>
  api.put<Category>(`/api/admin/categories/${slug}/schema`, schema);
export const updateCategoryLayout = (slug: string, layout: string) =>
  api.put<Category>(`/api/admin/categories/${slug}/layout`, { layout });
export const updateCategoryGrouping = (slug: string, groupBy: string) =>
  api.put<Category>(`/api/admin/categories/${slug}/grouping`, { groupBy });

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  status: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  city: { slug: string; name: string; state: string };
  category: { slug: string; name: string; emoji: string };
  owner: { id: string; phone: string };
}

// Auth
export const adminLogin = (email: string, password: string) =>
  api.post<{ token: string; ownerId: string }>('/api/auth/admin/login', { email, password });

// Store listing
export const getStores = (status?: string) =>
  api.get<AdminStore[]>(`/api/admin/stores${status ? `?status=${status}` : ''}`);

// Moderation actions
export const approveStore = (id: string) =>
  api.post<{ message: string; slug: string; url: string }>(`/api/admin/stores/${id}/approve`);

export const rejectStore = (id: string, reason?: string) =>
  api.post<{ message: string }>(`/api/admin/stores/${id}/reject`, { reason });

export const suspendStore = (id: string) =>
  api.post<{ message: string }>(`/api/admin/stores/${id}/suspend`);

export const reinstateStore = (id: string) =>
  api.post<{ message: string }>(`/api/admin/stores/${id}/reinstate`);
