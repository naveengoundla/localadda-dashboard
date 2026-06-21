export interface City {
  id: string;
  slug: string;
  name: string;
  state: string;
}

export interface Category {
  slug: string;
  name: string;
  emoji: string;
}

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface StoreDiscount {
  id: string;
  title: string;
  description: string | null;
  valueLabel: string | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  category: Category;
  description: string | null;
  phone: string | null;
  address: string | null;
  mapsUrl: string | null;
  bannerUrl: string | null;
  galleryUrls: string[];
  hours: Record<string, string> | null;
  isActive: boolean;
  orderingEnabled?: boolean;
  inviteQuota?: number;
  city: City;
  items: StoreItem[];
  discounts: StoreDiscount[];
}

export interface OwnerInvite {
  code: string;
  phone: string | null;
  redeemed: boolean;
  createdAt: string;
}

export interface InviteQuota {
  quota: number;
  used: number;
  remaining: number;
}
