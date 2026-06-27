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

// Add / show-hide / delete categories
export const createCategory = (c: { slug?: string; name: string; emoji?: string; gradient?: string; sortOrder?: number }) =>
  api.post<Category>('/api/admin/categories', c);
export const updateCategory = (slug: string, c: { name?: string; emoji?: string; gradient?: string; sortOrder?: number; isActive?: boolean }) =>
  api.put<Category>(`/api/admin/categories/${slug}`, c);
export const deleteCategory = (slug: string) => api.delete(`/api/admin/categories/${slug}`);

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

// ── Homepage banners ──────────────────────────────────────────────
export interface AdminBanner {
  id: string;
  cityId: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
  sortOrder: number;
  startAt: string | null;
  endAt: string | null;
  layout: 'auto' | 'compact' | 'hero';
  bgColor: string | null;
}

export interface BannerPayload {
  cityId?: string | null;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  sortOrder?: number;
  startAt?: string | null;
  endAt?: string | null;
  layout?: 'auto' | 'compact' | 'hero';
  bgColor?: string | null;
}

export interface CityOption { id: string; slug: string; name: string; state: string }

export const getCities = () => api.get<CityOption[]>('/api/cities');

// ── Cities (admin rollout control) ────────────────────────────────
export interface AdminCity {
  id: string; slug: string; name: string; state: string; published: boolean;
  emoji: string | null; imageUrl: string | null;
}
export const getAdminCities = () => api.get<AdminCity[]>('/api/admin/cities');
export const createCity = (c: { slug?: string; name: string; state?: string; published?: boolean; emoji?: string; imageUrl?: string }) =>
  api.post<AdminCity>('/api/admin/cities', c);
export const updateCity = (id: string, c: { name?: string; state?: string; published?: boolean; emoji?: string; imageUrl?: string }) =>
  api.put<AdminCity>(`/api/admin/cities/${id}`, c);
export const deleteCity = (id: string) => api.delete(`/api/admin/cities/${id}`);
export const getCityImagePresign = (ext: string) =>
  api.get<{ uploadUrl: string; publicUrl: string; key: string }>(`/api/admin/cities/presign?ext=${ext}`);
export const getAdminBanners = () => api.get<AdminBanner[]>('/api/admin/banners');
export const createBanner = (b: BannerPayload) => api.post<AdminBanner>('/api/admin/banners', b);
export const updateBanner = (id: string, b: BannerPayload) =>
  api.put<AdminBanner>(`/api/admin/banners/${id}`, b);
export const deleteBanner = (id: string) => api.delete(`/api/admin/banners/${id}`);
export const getBannerPresign = (ext: string) =>
  api.get<{ uploadUrl: string; publicUrl: string; key: string }>(`/api/admin/banners/presign?ext=${ext}`);
