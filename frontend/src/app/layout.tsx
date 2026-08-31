import type { Metadata } from "next";
import { Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ToasterProvider from "@/components/ToasterProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaintenanceGate from "@/components/MaintenanceGate";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "تجّار المواشي | منصة بيع وشراء المواشي",
  description:
    "منصة تجّار المواشي لبيع وشراء الأغنام والإبل والأبقار والماعز والخيول في السعودية.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg-light text-brand-bg-dark">
        <AuthProvider>
          <ToasterProvider />
          <Navbar />
          <main className="flex-1">
            <MaintenanceGate>{children}</MaintenanceGate>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
