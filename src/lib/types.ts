export type AdStatus = "active" | "ended" | "flagged" | "deleted";
export type SellerType = "individual" | "trader";
export type AccountType = "individual" | "trader";
export type UserRole = "user" | "admin";
export type ReportStatus = "open" | "closed";

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  animalType: string;
  breed: string;
  age: string;
  weight: number | null;
  country: string;
  region: string;
  city: string;
  sellerId: string;
  sellerName: string;
  sellerType: SellerType;
  sellerRating: number;
  phoneNumber: string;
  whatsapp: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
  views: number;
  reportsCount: number;
  status: AdStatus;
  featured?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  accountType: AccountType;
  rating: number;
  adsCount: number;
  reportsCount: number;
  role: UserRole;
  banned?: boolean;
  createdAt: number;
}

export interface Report {
  id: string;
  adId: string;
  adTitle?: string;
  reporterId: string;
  reason: string;
  createdAt: number;
  status: ReportStatus;
}

export interface Breed {
  id: string;
  animalType: string;
  name: string;
}

export interface RegionCity {
  id: string;
  region: string;
  city: string;
}

export interface SiteSettings {
  siteName: string;
  featuredAdPrice: number;
  supportPhone: string;
  maintenanceMode: boolean;
}
