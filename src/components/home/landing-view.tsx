import { prisma } from "@/lib/db/prisma";
import ProductCard from "@/components/product/product-card"; // Adjust path if your ProductCard is elsewhere
import Link from "next/link";
import Image from "next/image";
import { getPublicSettings } from "@/actions/public-settings";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Zap,
  ArrowRight,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

// Ensure the homepage always fetches the latest products and settings
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 1. Fetch all required data in parallel for maximum performance
  const [featuredProducts, latestProducts, categories, settings] =
    await Promise.all([
      prisma.product.findMany({
        where: { isFeatured: true, isArchived: false },
        take: 4,
        include: {
          category: true,
          brand: true,
          variants: true,
        },
      }),
      prisma.product.findMany({
        where: { isArchived: false },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          brand: true,
          variants: true,
        },
      }),
      prisma.category.findMany({
        take: 4,
        // Sort by categories that have the most products
        orderBy: { products: { _count: "desc" } },
      }),
      getPublicSettings(),
    ]);

  // 2. Use Dynamic CMS fields with robust fallbacks
  const heroTitle = settings?.heroTitle || "Spring Collection 2025";
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Elevate Your Everyday Style with our premium selections.";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop";
  const storeName = settings?.storeName || "Our Store";

  return (
    <div className="flex flex-col pb-24 space-y-16 md:space-y-24">
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-base-300 rounded-b-[3rem] sm:rounded-b-[4rem] mx-2 sm:mx-4 mt-2">
        <Image
          src={heroImage}
          alt={`${storeName} Hero Background`}
          fill
          className="object-cover opacity-80"
          priority
        />
        {/* Gradients for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-base-300 via-base-300/40 to-transparent"></div>
        <div className="absolute inset-0 bg-black/30 mix-blend-multiply"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-10">
          <span className="inline-block badge badge-primary badge-lg py-4 px-6 mb-6 font-bold uppercase tracking-widest shadow-xl shadow-primary/30 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Welcome to {storeName}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md mt-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link
              href="/products"
              className="btn btn-primary btn-lg rounded-2xl w-full sm:w-auto shadow-2xl shadow-primary/30 text-white group"
            >
              <ShoppingBag
                size={20}
                className="group-hover:-rotate-12 transition-transform"
              />
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="btn btn-neutral btn-lg rounded-2xl w-full sm:w-auto shadow-xl bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:border-white/40"
            >
              <LayoutGrid size={20} />
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* --- VALUE PROPOSITION BAR --- */}
      <section className="relative z-20 -mt-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto bg-base-100 rounded-3xl p-6 md:p-8 shadow-2xl shadow-base-content/5 border border-base-200 flex flex-col md:flex-row justify-around items-start md:items-center gap-8">
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Truck size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Nationwide Delivery
              </h3>
              <p className="text-sm opacity-60 mt-0.5">
                Delivered right to your doorstep
              </p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-base-300"></div>
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Quality Guarantee
              </h3>
              <p className="text-sm opacity-60 mt-0.5">
                100% authentic top-tier products
              </p>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-base-300"></div>
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Fast Checkout</h3>
              <p className="text-sm opacity-60 mt-0.5">
                Seamless payments & tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- POPULAR CATEGORIES --- */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Shop by Category
              </h2>
              <p className="text-base-content/60 mt-2">
                Explore our most popular collections
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden sm:flex btn btn-ghost btn-sm text-primary hover:bg-primary/10 rounded-xl"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group relative h-48 md:h-64 rounded-3xl overflow-hidden bg-base-200 shadow-sm hover:shadow-xl transition-all border border-base-200"
              >
                <Image
                  src={
                    category.image ||
                    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
                  }
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-white font-bold text-xl md:text-2xl drop-shadow-md group-hover:-translate-y-1 transition-transform">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/categories"
            className="sm:hidden btn btn-outline btn-block mt-6 rounded-xl"
          >
            View All Categories
          </Link>
        </section>
      )}

      {/* --- FEATURED PRODUCTS --- */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-accent/10 p-2 rounded-xl text-accent">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Featured Picks
              </h2>
              <p className="text-base-content/60 mt-1">
                Handpicked products just for you
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={JSON.parse(JSON.stringify(product))}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- LATEST ARRIVALS --- */}
      {latestProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                New Arrivals
              </h2>
              <p className="text-base-content/60 mt-2">
                The latest additions to our store
              </p>
            </div>
            <Link
              href="/search?sort=latest"
              className="hidden sm:flex btn btn-ghost btn-sm text-primary hover:bg-primary/10 rounded-xl"
            >
              View All Products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={JSON.parse(JSON.stringify(product))}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/search?sort=latest"
              className="btn btn-primary btn-lg rounded-2xl px-12 shadow-xl shadow-primary/20"
            >
              Browse Entire Catalog
            </Link>
          </div>
        </section>
      )}

      {/* --- NEWSLETTER / CTA SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 w-full">
        <div className="bg-neutral text-neutral-content rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-black">
              Stay in the loop
            </h2>
            <p className="text-lg opacity-80">
              Join our newsletter to get updates on new arrivals, special
              offers, and exclusive discounts.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="input input-lg input-bordered w-full rounded-2xl bg-base-100 text-base-content focus:outline-primary"
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg rounded-2xl sm:w-auto shrink-0"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs opacity-50 mt-4">
              We care about your data in our{" "}
              <Link href="/privacy" className="underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
