import { getFeaturedProducts } from "@/lib/db/data";
import LandingView from "@/components/home/landing-view";

// 1. Force dynamic rendering so we always see fresh data (useful during dev)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 2. Fetch data directly from the database (via our lib helper)
  const products = await getFeaturedProducts();

  // Debug Log: Check your terminal to see if this prints "Found X products"
  console.log(`⚡ Server Page: Fetched ${products.length} products`);

  // 3. Pass the data to the Client Component for rendering & animation
  return <LandingView products={products} />;
}
