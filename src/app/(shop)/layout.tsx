import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      {/* Main Content Area specific to Shop */}
      <main className="grow container mx-auto px-4 py-6">{children}</main>

      {/* Footer is now specific to Shop pages */}
      <Footer />
    </>
  );
}
