"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/lib/useAuthGate";
import { createAd, getAd, updateAd } from "@/lib/ads";
import { getSiteSettings } from "@/lib/settings";
import { listBreeds } from "@/lib/breeds";
import { listAdditionalServices } from "@/lib/services";
import ImageUploader from "@/components/ImageUploader";
import BackButton from "@/components/BackButton";
import AuthGateModal from "@/components/AuthGateModal";
import ImageGallery from "@/components/ImageGallery";
import {
  ANIMAL_TYPES,
  DEFAULT_BREEDS,
  COUNTRIES,
  DEFAULT_REGIONS,
  CATEGORIES,
  CATEGORY_LABELS,
  SUB_CATEGORIES,
} from "@/lib/constants";
import { AdCategory, Breed, AdditionalService } from "@/lib/types";

function uniq(list: string[]) {
  return Array.from(new Set(list));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-SA").format(price);
}

function AddAdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const initialCategory = (searchParams.get("category") as AdCategory) || "livestock";
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const { handleSuccess } = useAuthGate();

  const [step, setStep] = useState<"form" | "preview">("form");

  const [category, setCategory] = useState<AdCategory>(initialCategory);
  const [subCategory, setSubCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [animalType, setAnimalType] = useState(ANIMAL_TYPES[0]);
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [showCallButton, setShowCallButton] = useState(false);
  const [showWhatsappButton, setShowWhatsappButton] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAd, setLoadingAd] = useState(!!editId);
  const [oathAccepted, setOathAccepted] = useState(false);
  const [oathText, setOathText] = useState(
    "أقسم بالله العظيم أنني ملزم بنسبة الموقع 1.5% من قيمة البيع وتبقى بذمتي حتى أدفعها للموقع."
  );
  // Fixed, admin-controlled notice text for the "خدمات"/"نقل مواشي" sections
  // only — the user can never edit or clear it; it's read live from
  // settings each time, same pattern as oathText above.
  const [noticeText, setNoticeText] = useState("");
  // Admin-added breeds/services (/dashboard/breeds, /dashboard/services) —
  // merged into the option lists below so a new addition is selectable here
  // immediately, not just reflected on the admin page itself.
  const [customBreeds, setCustomBreeds] = useState<Breed[]>([]);
  const [customServices, setCustomServices] = useState<AdditionalService[]>([]);

  useEffect(() => {
    getSiteSettings().then((s) => {
      if (s.oathText) setOathText(s.oathText);
      setNoticeText(s.servicesTransportNoticeText || "");
    });
    listBreeds().then(setCustomBreeds).catch(() => {});
    listAdditionalServices().then(setCustomServices).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setPhoneNumber((p) => p || profile.phoneNumber || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!editId) return;
    getAd(editId).then((ad) => {
      if (!ad) {
        toast.error("الإعلان غير موجود");
        router.push("/profile");
        return;
      }
      setCategory(ad.category || "livestock");
      // A subCategory that isn't one of the fixed options for this category
      // is a custom value entered via "أخرى" — restore it into that mode
      // rather than letting the select fall back to a blank/first option
      // and silently overwrite it on save.
      const fixedOptions = ad.category && ad.category !== "livestock" ? SUB_CATEGORIES[ad.category] : [];
      if (ad.subCategory && !fixedOptions?.includes(ad.subCategory)) {
        setSubCategory("أخرى");
        setCustomSubCategory(ad.subCategory);
      } else {
        setSubCategory(ad.subCategory || "");
      }
      setTitle(ad.title);
      setDescription(ad.description);
      setPrice(String(ad.price));
      setIsNegotiable(ad.isNegotiable);
      setAnimalType(ad.animalType || ANIMAL_TYPES[0]);
      setBreed(ad.breed || "");
      setAge(ad.age);
      setWeight(ad.weight ? String(ad.weight) : "");
      setCountry(ad.country);
      setRegion(ad.region);
      setCity(ad.city);
      setPhoneNumber(ad.phoneNumber);
      setWhatsapp(ad.whatsapp);
      setShowCallButton(!!ad.showCallButton);
      setShowWhatsappButton(!!ad.showWhatsappButton);
      setImages(ad.images || []);
      setLoadingAd(false);
    });
  }, [editId, router]);

  const isLivestock = category === "livestock";
  const isOtherSubCategory = subCategory === "أخرى";
  const requiresNotice = category === "services" || category === "transport";

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (
      !title.trim() ||
      !description.trim() ||
      !region ||
      !phoneNumber ||
      (!isLivestock && !subCategory) ||
      (isOtherSubCategory && !customSubCategory.trim())
    ) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (requiresNotice && !noticeText.trim()) {
      toast.error("تعذّر تحميل النص الإلزامي لهذا القسم، يرجى إعادة المحاولة");
      return;
    }
    if (images.length === 0) {
      toast.error("يرجى إضافة صورة واحدة على الأقل");
      return;
    }
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePublish() {
    if (!firebaseUser || !profile) return;
    if (!oathAccepted) {
      toast.error("يجب الموافقة على الإقرار الإلزامي قبل نشر الإعلان");
      return;
    }
    if (requiresNotice && !noticeText.trim()) {
      toast.error("تعذّر تحميل النص الإلزامي لهذا القسم، يرجى إعادة المحاولة");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category,
        subCategory: isLivestock ? "" : isOtherSubCategory ? customSubCategory.trim() : subCategory,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        isNegotiable,
        animalType: isLivestock ? animalType : "",
        breed: isLivestock ? breed : "",
        age: isLivestock ? age : "",
        weight: isLivestock && weight ? Number(weight) : null,
        country,
        region,
        city,
        sellerId: firebaseUser.uid,
        sellerName: profile.name,
        sellerType: profile.accountType,
        sellerRating: profile.rating || 0,
        phoneNumber,
        whatsapp,
        showCallButton,
        showWhatsappButton,
        images,
        oathAccepted: true,
      };

      if (editId) {
        await updateAd(editId, payload);
        toast.success("تم تحديث الإعلان");
        router.push(`/ad?id=${editId}`);
      } else {
        const id = await createAd(payload);
        toast.success("تم نشر الإعلان بنجاح");
        router.push(`/ad?id=${id}`);
      }
    } catch {
      toast.error("تعذر حفظ الإعلان، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingAd) {
    return <p className="py-24 text-center text-black/40">جاري التحميل...</p>;
  }

  if (!firebaseUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <BackButton />
        <div className="rounded-2xl border border-dashed border-black/10 py-20 text-center text-black/40">
          يجب تسجيل الدخول لإضافة إعلان
        </div>
        <AuthGateModal open onClose={() => router.push("/")} onSuccess={handleSuccess} />
      </div>
    );
  }

  const breedOptions = uniq([
    ...(DEFAULT_BREEDS[animalType] || []),
    ...customBreeds.filter((b) => b.animalType === animalType).map((b) => b.name),
  ]);
  const regionOptions = DEFAULT_REGIONS[country] || [];
  const subCategoryOptions = isLivestock
    ? []
    : uniq([
        ...SUB_CATEGORIES[category],
        ...customServices.filter((s) => s.category === category).map((s) => s.name),
      ]);
  // A retired category (currently only "offers") is never offered for a new
  // ad, but if a seller is editing one of their existing ads in that
  // category, it must still appear as the selected option — otherwise the
  // browser silently falls back to the first option and re-saving would
  // corrupt the ad's category.
  const categoryOptions = CATEGORIES.some((c) => c.key === category)
    ? CATEGORIES
    : [...CATEGORIES, { key: category, label: CATEGORY_LABELS[category], photo: "" }];
  // Same defensive pattern for animalType: old ads still say "أغنام" (now
  // renamed to "الضأن" everywhere new ads are concerned) — inject it back in
  // only when editing one of those, so the select doesn't silently jump to
  // the first option and corrupt the ad's animal type on save.
  const animalTypeOptions = ANIMAL_TYPES.includes(animalType)
    ? ANIMAL_TYPES
    : [...ANIMAL_TYPES, animalType];
  const displaySubCategory = isOtherSubCategory ? customSubCategory : subCategory;

  if (step === "preview") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button
          onClick={() => setStep("form")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:underline"
        >
          <span aria-hidden>→</span>
          تعديل الإعلان
        </button>

        <div className="mb-4 rounded-xl bg-brand-secondary/15 px-4 py-3 text-sm font-medium text-brand-primary">
          هذه معاينة لشكل إعلانك كما سيظهر للمستخدمين — راجعها جيدًا قبل النشر.
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <ImageGallery images={images} alt={title} />
          <div className="mt-6">
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/50">
              {CATEGORY_LABELS[category]}
              {displaySubCategory && ` · ${displaySubCategory}`}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-brand-bg-dark">{title}</h1>
            <p className="mt-1 text-sm text-black/50">
              {city && `${city}، `}
              {region} — {country}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-3xl font-extrabold text-brand-primary">
                {price ? `${formatPrice(Number(price))} ريال` : "السعر عند الاتصال"}
              </span>
              {isNegotiable && (
                <span className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-bold text-brand-primary">
                  قابل للتفاوض
                </span>
              )}
            </div>

            {isLivestock && (
              <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-brand-bg-light p-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-black/40">النوع</p>
                  <p className="font-bold">{animalType}</p>
                </div>
                <div>
                  <p className="text-black/40">السلالة</p>
                  <p className="font-bold">{breed || "—"}</p>
                </div>
                <div>
                  <p className="text-black/40">العمر</p>
                  <p className="font-bold">{age || "—"}</p>
                </div>
                <div>
                  <p className="text-black/40">الوزن</p>
                  <p className="font-bold">{weight ? `${weight} كجم` : "—"}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h2 className="mb-2 font-bold text-brand-bg-dark">الوصف</h2>
              <p className="whitespace-pre-line leading-relaxed text-black/70">{description}</p>
            </div>

            {requiresNotice && (
              <div className="mt-6 rounded-xl border border-black/10 bg-black/5 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-black/60">
                  🔒 نص إلزامي
                </p>
                <p className="leading-relaxed text-black/70">{noticeText}</p>
              </div>
            )}

            <div className="mt-6 text-sm text-black/50">
              {showCallButton || showWhatsappButton ? (
                <>
                  {showCallButton && `📞 ${phoneNumber}`}
                  {showCallButton && showWhatsappButton && " · "}
                  {showWhatsappButton && `💬 واتساب: ${whatsapp}`}
                </>
              ) : (
                "لن يظهر رقم تواصل — لم تُفعّل أي طريقة تواصل"
              )}
            </div>
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-xl border border-black/10 bg-brand-bg-light p-4 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={oathAccepted}
            onChange={(e) => setOathAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <span className="font-medium text-brand-bg-dark">{oathText}</span>
        </label>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setStep("form")}
            className="flex-1 rounded-xl border border-black/10 py-3 font-bold text-black/60"
          >
            تعديل الإعلان
          </button>
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="flex-1 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "جاري النشر..." : editId ? "حفظ التعديلات" : "نشر الإعلان"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <BackButton />
      <h1 className="mb-6 text-2xl font-extrabold text-brand-bg-dark">
        {editId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
      </h1>

      <form
        onSubmit={handleReview}
        className="flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">القسم *</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as AdCategory);
              setSubCategory("");
            }}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
          >
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {requiresNotice && (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              🔒 نص إلزامي — غير قابل للتعديل *
            </label>
            <div className="w-full rounded-xl border border-black/10 bg-black/5 px-4 py-2.5 leading-relaxed text-black/70">
              {noticeText || "جاري تحميل النص..."}
            </div>
            <p className="mt-1 text-xs text-black/40">
              هذا النص ثابت من إدارة المنصة ولا يمكن تعديله أو حذفه، وهو جزء
              إلزامي من الإعلان في هذا القسم.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">عنوان الإعلان *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            placeholder={isLivestock ? "مثال: نعجة نجدي عمر سنة" : "عنوان الإعلان"}
          />
        </div>

        {isLivestock ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">نوع الحيوان *</label>
                <select
                  value={animalType}
                  onChange={(e) => {
                    setAnimalType(e.target.value);
                    setBreed("");
                  }}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
                >
                  {animalTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">السلالة</label>
                <select
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
                >
                  <option value="">اختر السلالة</option>
                  {breedOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">العمر</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثال: سنة ونصف"
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">الوزن (كجم)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">التصنيف الفرعي *</label>
            <select
              required
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            >
              <option value="">اختر التصنيف</option>
              {subCategoryOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="أخرى">أخرى</option>
            </select>
            {isOtherSubCategory && (
              <input
                required
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                placeholder="اكتب المسمى..."
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
              />
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">الوصف *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            placeholder="اكتب وصفًا دقيقًا وصادقًا..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">السعر (ريال)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
              />
              السعر قابل للتفاوض
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">الدولة *</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setRegion("");
              }}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">المنطقة *</label>
            {regionOptions.length > 0 ? (
              <select
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
              >
                <option value="">اختر المنطقة</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">المدينة</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">رقم التواصل *</label>
            <input
              required
              dir="ltr"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right outline-none focus:border-brand-secondary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رقم الواتساب</label>
            <input
              dir="ltr"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="9665xxxxxxxx"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-right outline-none focus:border-brand-secondary"
            />
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-brand-bg-light p-4">
          <p className="mb-2 text-sm font-medium">
            طرق التواصل الظاهرة للمشترين داخل الإعلان
          </p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showCallButton}
                onChange={(e) => setShowCallButton(e.target.checked)}
              />
              📞 إظهار زر الاتصال
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showWhatsappButton}
                onChange={(e) => setShowWhatsappButton(e.target.checked)}
                disabled={!whatsapp.trim()}
              />
              💬 إظهار زر واتساب
            </label>
          </div>
          <p className="mt-2 text-xs text-black/40">
            رقمك لا يظهر تلقائيًا للمشترين — لن يظهر إلا إذا فعّلت أحد الخيارين
            أعلاه. يمكنك أيضًا كتابته يدويًا داخل الوصف إن رغبت بإظهاره دون
            تفعيل أي زر.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">الصور *</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110"
        >
          استعراض الإعلان قبل النشر
        </button>
      </form>
    </div>
  );
}

export default function AddAdPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-black/40">جاري التحميل...</p>}>
      <AddAdForm />
    </Suspense>
  );
}
