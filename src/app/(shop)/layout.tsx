import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import StorefrontChatbot from "@/components/chat/storefront-chatbot";
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* ADD THIS LINE */}
      <StorefrontChatbot />
    </div>
  );
}
