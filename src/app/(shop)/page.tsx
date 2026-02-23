import { getFeaturedProducts, getNewArrivals } from "@/lib/db/data";
import LandingView from "@/components/home/landing-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  console.log("⚡ Server Page: Fetching home data...");

  const [featuredProducts, newArrivals] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
  ]);

  console.log(
    `⚡ Data fetched: ${featuredProducts.length} featured, ${newArrivals.length} new`,
  );

  return (
    <LandingView
      featuredProducts={JSON.parse(JSON.stringify(featuredProducts))}
      newArrivals={JSON.parse(JSON.stringify(newArrivals))}
    />
  );
}
