import api from './client';
import type { Store, StoreItem, StoreDiscount } from '../types';

// Store
export const getMyStore = () => api.get<Store>('/api/store/me');
export const registerStore = (data: object) => api.post<Store>('/api/store/register', data);
export const updateStore = (data: object) => api.put<Store>('/api/store/me', data);
export const updateBanner = (bannerUrl: string) => api.put<Store>('/api/store/me/banner', { bannerUrl });
export const addGalleryPhoto = (photoUrl: string) => api.post<Store>('/api/store/me/gallery', { photoUrl });

// Items
export const addItem = (data: object) => api.post<StoreItem>('/api/store/me/items', data);
export const updateItem = (id: string, data: object) => api.put<StoreItem>(`/api/store/me/items/${id}`, data);
export const deleteItem = (id: string) => api.delete(`/api/store/me/items/${id}`);

// Discounts
export const setDiscount = (data: object) => api.post<StoreDiscount>('/api/store/me/discounts', data);
export const removeDiscount = () => api.delete('/api/store/me/discounts');

// Upload presign
export const getBannerPresign = (ext: string) =>
  api.get<{ uploadUrl: string; publicUrl: string }>(`/api/upload/banner?ext=${ext}`);
export const getGalleryPresign = (ext: string) =>
  api.get<{ uploadUrl: string; publicUrl: string }>(`/api/upload/gallery?ext=${ext}`);
export const getItemImagePresign = (itemId: string, ext: string) =>
  api.get<{ uploadUrl: string; publicUrl: string }>(`/api/upload/item-image?itemId=${itemId}&ext=${ext}`);
