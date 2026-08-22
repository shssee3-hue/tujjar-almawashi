import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SiteSettings } from "./types";

const settingsRef = doc(db, "settings", "site");

const DEFAULTS: SiteSettings = {
  siteName: "تجّار المواشي",
  featuredAdPrice: 50,
  supportPhone: "0500000000",
  maintenanceMode: false,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDoc(settingsRef);
  if (!snap.exists()) return DEFAULTS;
  return { ...DEFAULTS, ...(snap.data() as Partial<SiteSettings>) };
}

export async function saveSiteSettings(data: SiteSettings) {
  await setDoc(settingsRef, data, { merge: true });
}
