import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SiteSettings } from "./types";

const settingsRef = doc(db, "settings", "site");

const DEFAULTS: SiteSettings = {
  siteName: "تجّار المواشي",
  featuredAdPrice: 50,
  supportPhone: "0500000000",
  maintenanceMode: false,
  oathText:
    "أقسم بالله العظيم أنني ملزم بنسبة الموقع 1.5% من قيمة البيع وتبقى بذمتي حتى أدفعها للموقع.",
  commissionRate: 1.5,
  commissionText:
    "عمولة المنصة: يلتزم المعلن بإدخال قيمة البيع الفعلية عند إتمام عملية البيع، ويقوم النظام تلقائيًا بحساب العمولة المستحقة بناءً على النسبة المحددة من قبل الإدارة. ويحق للمدير تعديل نسبة العمولة في أي وقت دون إشعار مسبق، وتُعد النسبة الظاهرة في صفحة دفع العمولة هي النسبة المعتمدة والواجبة السداد.\n\nيجب على المعلن دفع العمولة خلال مدة لا تتجاوز 48 ساعة من إدخال قيمة البيع، وذلك عبر Apple Pay أو التحويل البنكي.\n\nفي حال إدخال قيمة بيع غير صحيحة أو الامتناع عن دفع العمولة، تحتفظ المنصة بحقها في اتخاذ الإجراءات المناسبة، والتي قد تشمل إيقاف الحساب أو منع المستخدم من إضافة إعلانات جديدة أو أي إجراء تراه الإدارة مناسبًا لضمان الالتزام بسياسات المنصة.\n\nرفع إيصال الدفع يُعد إثباتًا أوليًا، ولا يتم اعتماد الدفع إلا بعد مراجعة الإدارة والتأكد من صحة العملية.\n\nاستخدام المنصة يعني موافقة المعلن على هذه الشروط وعلى أي تحديثات مستقبلية تقوم بها الإدارة.",
  bankAccountNumber: "",
  applePayLink: "",
  servicesTransportNoticeText:
    "يقرّ المعلن بأنه المسؤول الوحيد عن دقة الخدمة أو خدمة النقل المعروضة والالتزام بالأنظمة المعمول بها، وأن المنصة وسيط عرض إعلانات فقط ولا تتحمل أي مسؤولية عن جودة الخدمة أو سلامة عملية النقل.",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) return DEFAULTS;
  return { ...DEFAULTS, ...(snap.data() as Partial<SiteSettings>) };
}

export async function saveSiteSettings(data: SiteSettings) {
  await setDoc(settingsRef, data, { merge: true });
}
