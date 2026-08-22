"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createAd, getAd, updateAd } from "@/lib/ads";
import ImageUploader from "@/components/ImageUploader";
import {
  ANIMAL_TYPES,
  DEFAULT_BREEDS,
  COUNTRIES,
  DEFAULT_REGIONS,
} from "@/lib/constants";

function AddAdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { firebaseUser, profile, loading: authLoading } = useAuth();

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
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAd, setLoadingAd] = useState(!!editId);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      toast.error("يجب تسجيل الدخول أولًا");
      router.push("/login");
    }
  }, [authLoading, firebaseUser, router]);

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
      setTitle(ad.title);
      setDescription(ad.description);
      setPrice(String(ad.price));
      setIsNegotiable(ad.isNegotiable);
      setAnimalType(ad.animalType);
      setBreed(ad.breed);
      setAge(ad.age);
      setWeight(ad.weight ? String(ad.weight) : "");
      setCountry(ad.country);
      setRegion(ad.region);
      setCity(ad.city);
      setPhoneNumber(ad.phoneNumber);
      setWhatsapp(ad.whatsapp);
      setImages(ad.images || []);
      setLoadingAd(false);
    });
  }, [editId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) return;

    if (!title.trim() || !description.trim() || !price || !breed || !region || !city || !phoneNumber) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (images.length === 0) {
      toast.error("يرجى إضافة صورة واحدة على الأقل");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        isNegotiable,
        animalType,
        breed,
        age,
        weight: weight ? Number(weight) : null,
        country,
        region,
        city,
        sellerId: firebaseUser.uid,
        sellerName: profile.name,
        sellerType: profile.accountType,
        sellerRating: profile.rating || 0,
        phoneNumber,
        whatsapp,
        images,
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

  const breedOptions = DEFAULT_BREEDS[animalType] || [];
  const regionOptions = DEFAULT_REGIONS[country] || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-brand-bg-dark">
        {editId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">عنوان الإعلان *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            placeholder="مثال: نعجة نجدي عمر سنة"
          />
        </div>

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
              {ANIMAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">السلالة *</label>
            <select
              required
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

        <div>
          <label className="mb-1 block text-sm font-medium">الوصف *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
            placeholder="اكتب وصفًا دقيقًا وصادقًا للحيوان..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">السعر (ريال) *</label>
            <input
              type="number"
              required
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
            <label className="mb-1 block text-sm font-medium">المدينة *</label>
            <input
              required
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

        <div>
          <label className="mb-2 block text-sm font-medium">صور الحيوان *</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-brand-primary py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? "جاري النشر..." : editId ? "حفظ التعديلات" : "نشر الإعلان"}
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
