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
  adCode?: string;
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
  images: string[];
  createdAt: number;
  updatedAt: number;
  reportsCount: number;
  status: AdStatus;
  featured?: boolean;
  oathAccepted: boolean;
  // Whether the seller has opted to expose a call / WhatsApp button. The
  // numbers themselves are NOT on this (world-readable) document — they live
  // in adsPrivate/{adId}, gated by firestore.rules. See AdContact below.
  showCallButton: boolean;
  showWhatsappButton: boolean;
}

// adsPrivate/{adId} — the seller's contact numbers for one ad, kept out of
// the public ads/{adId} document so they can't be scraped via the SDK.
// Readable only by a signed-in user when the seller enabled a contact
// button, by the seller themselves, or by an admin (moderation).
export interface AdContact {
  sellerId: string;
  phoneNumber: string;
  whatsapp: string;
  showCallButton: boolean;
  showWhatsappButton: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  accountType: AccountType;
  role: UserRole;
  banned?: boolean;
  // Set by the owner when the seller has an unpaid/overdue commission —
  // firestore.rules then blocks that seller from creating new ads until it
  // is cleared. (An automatic sweeper that sets this on the 48h deadline is
  // a Cloud Function, pending the Blaze upgrade.)
  commissionBlock?: boolean;
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
  commissionRate: number;
  commissionText: string;
  bankAccountNumber: string;
  servicesTransportNoticeText: string;
}

// Commission payments are bank transfer only — Apple Pay was removed to match
// the official spec. Historical commission documents may still carry other
// values; treat anything that isn't "bank" as legacy.
export type CommissionPaymentMethod = "bank";
export type CommissionStatus = "pending" | "approved" | "rejected";

export interface Commission {
  id: string;
  adId: string;
  adCode?: string;
  adTitle: string;
  sellerId: string;
  sellerName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  paymentMethod: CommissionPaymentMethod;
  receiptFile: string;
  status: CommissionStatus;
  createdAt: number;
  reviewedAt?: number;
  // Filled by the admin when status is set to "rejected" — shown in the
  // admin table and readable by the seller on their own record.
  rejectionReason?: string;
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
