import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import CartDrawer from "@/components/store/CartDrawer";

import VisitorTracker from "@/components/store/VisitorTracker";
import Preloader from "@/components/store/Preloader";
import RegionConfirmationModal from "@/components/store/RegionConfirmationModal";

import { CurrencyProvider } from "@/components/store/CurrencyProvider";

import { LanguageProvider } from "@/components/store/LanguageProvider";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrencyProvider>
      <LanguageProvider>
        <Preloader />
        <VisitorTracker />

        <Navbar />
        <CartDrawer />
        <RegionConfirmationModal />
        <main className="min-h-screen relative z-10">{children}</main>
        <Footer />
      </LanguageProvider>
    </CurrencyProvider>
  );
}
