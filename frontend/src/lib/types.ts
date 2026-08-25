export type AdStatus = "active" | "ended" | "flagged" | "deleted";
export type SellerType = "individual" | "trader";
export type AccountType = "individual" | "trader";
export type UserRole = "user" | "admin" | "owner";
export type ReportStatus = "open" | "closed";
export type AdCategory =
  | "livestock"
  | "feed"
  | "equipment"
  | "services"
  | "transport"
  | "offers";

export interface Ad {
  id: string;
  category: AdCategory;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  animalType: string;
  breed: string;
  age: string;
  weight: number | null;
  subCategory: string;
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
  oathAccepted: boolean;
  showCallButton: boolean;
  showWhatsappButton: boolean;
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

// Admin-managed sub-categories ("services") for the four non-livestock
// sections — the equivalent of Breed, but for AdCategory instead of
// animalType.
export interface AdditionalService {
  id: string;
  category: Exclude<AdCategory, "livestock" | "offers">;
  name: string;
}

export interface SiteSettings {
  siteName: string;
  featuredAdPrice: number;
  supportPhone: string;
  maintenanceMode: boolean;
  oathText: string;
}

export interface Comment {
  id: string;
  adId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
  replyToId?: string | null;
  hidden?: boolean;
}

export interface Rating {
  id: string;
  adId: string;
  userId: string;
  value: number;
  createdAt: number;
}
