"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSiteSettings } from "@/lib/settings";
import { createCommission } from "@/lib/commissions";
import { updateAd } from "@/lib/ads";
import { SiteSettings, CommissionPaymentMethod } from "@/lib/types";
import { fileToCompressedBlob } from "@/lib/image";
import { uploadCommissionReceipt } from "@/lib/storage";

function formatPrice(n: number) {
  return new Intl.NumberFormat("ar-SA").format(n);
}

export default function SaleConfirmationModal({
  open,
  onClose,
  adId,
  adCode,
  adTitle,
  sellerId,
  sellerName,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  adId: string;
  adCode?: string;
  adTitle: string;
  sellerId: string;
  sellerName: string;
  onSuccess: () => void;
}) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<CommissionPaymentMethod>("applepay");
  const [receiptFile, setReceiptFile] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) getSiteSettings().then(setSettings);
  }, [open]);

  if (!open) return null;

  const rate = settings?.commissionRate ?? 0;
  const amountNum = Number(saleAmount) || 0;
  const commissionAmount = Math.round(amountNum * (rate / 100) * 100) / 100;

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await fileToCompressedBlob(file);
      setReceiptFile(await uploadCommissionReceipt(sellerId, blob));
      setReceiptFileName(file.name);
    } catch {
      toast.error("تعذر رفع صورة الإيصال");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    if (amountNum <= 0) {
      toast.error("يرجى إدخال قيمة بيع صحيحة");
      return;
    }
    if (!receiptFile) {
      toast.error("يرجى رفع إيصال الدفع");
      return;
    }
    setSubmitting(true);
    try {
      await createCommission({
        adId,
        ...(adCode ? { adCode } : {}),
        adTitle,
        sellerId,
        sellerName,
        saleAmount: amountNum,
        commissionRate: rate,
        commissionAmount,
        paymentMethod,
        receiptFile,
      });
      await updateAd(adId, { status: "ended" });
      toast.success("تم تسجيل عملية البيع، بانتظار مراجعة الإدارة لإيصال الدفع");
      onSuccess();
      onClose();
    } catch {
      toast.error("تعذر إتمام العملية، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-brand-primary">تم البيع</h3>
            <button onClick={onClose} className="text-black/40 hover:text-black/70">
              ✕
            </button>
          </div>
          {adCode && (
            <p className="mt-0.5 text-xs text-black/40">
              إعلان رقم: <bdi className="font-medium">{adCode}</bdi>
            </p>
          )}
        </div>

        {!settings ? (
          <p className="py-10 text-center text-black/40">جاري التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">قيمة البيع الفعلية (ريال) *</label>
              <input
                required
                type="number"
                min="1"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:border-brand-secondary"
              />
            </div>

            <div className="rounded-xl bg-brand-bg-light p-4 text-center">
              <p className="text-xs text-black/50">
                العمولة المستحقة ({rate}% من قيمة البيع)
              </p>
              <p className="text-2xl font-extrabold text-brand-primary">
                {formatPrice(commissionAmount)} ريال
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">طريقة الدفع *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("applepay")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                    paymentMethod === "applepay"
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-black/10 text-black/50"
                  }`}
                >
                   Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${
                    paymentMethod === "bank"
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-black/10 text-black/50"
                  }`}
                >
                  تحويل بنكي
                </button>
              </div>
              <div className="mt-2 rounded-xl border border-dashed border-black/10 p-3 text-sm">
                {paymentMethod === "applepay" ? (
                  settings.applePayLink ? (
                    <a
                      href={settings.applePayLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brand-primary underline"
                    >
                      رابط الدفع عبر Apple Pay
                    </a>
                  ) : (
                    <span className="text-black/40">لم يضبط المدير رابط Apple Pay بعد</span>
                  )
                ) : settings.bankAccountNumber ? (
                  <span dir="ltr" className="font-bold">
                    {settings.bankAccountNumber}
                  </span>
                ) : (
                  <span className="text-black/40">لم يضبط المدير رقم الحساب البنكي بعد</span>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">إيصال الدفع *</label>
              <label
                htmlFor="receipt-upload"
                className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-lg border border-[#ddd] bg-[#f5f5f5] px-3 text-sm text-black/60 transition hover:bg-black/10"
              >
                <span className="text-base">📎</span>
                <span className="truncate">
                  {uploading ? "جاري رفع الصورة..." : receiptFileName || "اختر ملف الإيصال"}
                </span>
              </label>
              <input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files)}
                className="hidden"
              />
              {receiptFile && !uploading && (
                <p className="mt-1 text-xs text-green-600">✓ تم إرفاق الإيصال</p>
              )}
            </div>

            <p className="whitespace-pre-line rounded-xl bg-black/5 p-3 text-xs leading-relaxed text-black/60">
              {settings.commissionText}
            </p>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="rounded-xl bg-brand-primary py-3 font-bold text-white disabled:opacity-50"
            >
              {submitting ? "جاري الإرسال..." : "تأكيد وإرسال"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
