import { AdCategory } from "./types";

// "عروض خاصة" (offers) was retired as a browsable/creatable section — it is
// intentionally absent here so it no longer appears on the homepage, in the
// add-ad category picker, or in the browse-page filter pills. Old ads with
// category=="offers" are untouched in Firestore and still render correctly
// wherever a specific ad is looked up directly (CATEGORY_LABELS below still
// has an entry for it).
export const CATEGORIES: { key: AdCategory; label: string; photo: string }[] = [
  { key: "livestock", label: "المواشي", photo: "/images/animals/sheep.webp" },
  { key: "feed", label: "أعلاف", photo: "/images/animals/feed.webp" },
  { key: "equipment", label: "شبوك ومعالف", photo: "/images/animals/equipment.webp" },
  { key: "services", label: "خدمات", photo: "/images/animals/services.webp" },
  { key: "transport", label: "نقل مواشي", photo: "/images/animals/transport.webp" },
];

export const CATEGORY_LABELS: Record<AdCategory, string> = {
  livestock: "المواشي",
  feed: "أعلاف",
  equipment: "شبوك ومعالف",
  services: "خدمات",
  transport: "نقل مواشي",
  offers: "عروض خاصة",
};

export const SUB_CATEGORIES: Record<Exclude<AdCategory, "livestock">, string[]> = {
  feed: ["برسيم", "شعير", "ذرة علف", "أعلاف مركزة", "تبن"],
  equipment: ["حظائر", "مضخات مياه", "معدات حلب", "أسيجة ومظلات", "عربات نقل علف"],
  services: ["خدمات بيطرية", "تحصين وتطعيم", "تدريب وتربية", "حلاقة وتجميل", "استشارات تغذية"],
  transport: ["نقل داخل المدينة", "نقل بين المدن", "نقل مع عاملين", "نقل مع تأمين"],
  offers: [
    "خصومات",
    "عروض موسمية",
    "عروض نقل مجاني",
    "عروض تركيب مجاني",
    "عروض تجهيز الحظائر",
  ],
};

// "الضأن" replaces the old "أغنام" label — ads created before this rename
// still have animalType=="أغنام" stored in Firestore (never rewritten, per
// this project's policy of not mutating historical data on a rename), so
// DEFAULT_BREEDS below keeps "أغنام" as an alias pointing at the same breed
// list purely so an old ad's breed dropdown doesn't come up empty on edit.
export const ANIMAL_TYPES = [
  "الضأن",
  "ماعز",
  "إبل",
  "أبقار",
  "خيول",
  "دواجن",
];

const SHEEP_BREEDS = ["نجدي", "حري", "نعيمي", "برقاء", "سواكني"];

export const DEFAULT_BREEDS: Record<string, string[]> = {
  "الضأن": SHEEP_BREEDS,
  "أغنام": SHEEP_BREEDS,
  "ماعز": ["عارضي", "شامي", "جبلي"],
  "إبل": ["مجاهيم", "صفر", "حمر", "شعل"],
  "أبقار": ["هولشتاين", "بلدي", "أنجوس"],
  "خيول": ["عربي أصيل", "مستورد"],
  "دواجن": ["بلدي", "بياض", "تسمين"],
};

// The flat, single-level list of "sections" used by the homepage search box
// and the ads-page filter bar: the 6 livestock animal types plus the 4
// non-livestock categories, all at the same depth. Picking one is exactly
// equivalent to clicking its homepage tile — it's what lets a single
// "section" field resolve unambiguously into either an animalType filter
// (with breed as its dependent field) or a category filter (with
// subCategory as its dependent field).
export const SECTION_OPTIONS: { value: string; label: string; isAnimalType: boolean }[] = [
  ...ANIMAL_TYPES.map((t) => ({ value: t, label: t, isAnimalType: true })),
  ...CATEGORIES.filter((c) => c.key !== "livestock").map((c) => ({
    value: c.key,
    label: c.label,
    isAnimalType: false,
  })),
];

// The platform operates in Saudi Arabia only. The `country` field is kept on
// the ad model (and this list) so historical Gulf ads still render, but new
// ads can only ever be "السعودية".
export const COUNTRIES = ["السعودية"];

export const DEFAULT_REGIONS: Record<string, string[]> = {
  "السعودية": [
    "الرياض",
    "مكة المكرمة",
    "المدينة المنورة",
    "الشرقية",
    "القصيم",
    "عسير",
    "تبوك",
    "حائل",
    "الحدود الشمالية",
    "جازان",
    "نجران",
    "الباحة",
    "الجوف",
  ],
};

export const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
  { value: "views", label: "الأكثر مشاهدة" },
];

export const REPORT_REASONS = [
  "إعلان مخالف أو مضلل",
  "صور غير حقيقية",
  "محتوى مسيء",
  "بيانات تواصل غير صحيحة",
  "محاولة احتيال",
  "أخرى",
];

export const BRAND_COLORS = {
  primary: "#5A4632",
  secondary: "#C9A66B",
  bgLight: "#F2F2F2",
  bgDark: "#1A1A1A",
};
