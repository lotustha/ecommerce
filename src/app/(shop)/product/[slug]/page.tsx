import { getProductBySlug, getSimilarProducts } from "@/lib/db/data";
import ProductImages from "@/components/product/product-images";
import ProductInfo from "@/components/product/product-info";
import ProductCard from "@/components/product/product-card";
import Reviews from "@/components/product/reviews";
import ReviewForm from "@/components/product/review-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// Define params type correctly for Next.js 15
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Nepal E-com",
    };
  }

  return {
    title: `${product.name} | Nepal E-com`,
    description: product.description?.slice(0, 160),
    openGraph: {
      images: product.images ? JSON.parse(product.images)[0] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const session = await auth();

  if (!product) {
    notFound();
  }

  // Check if user has purchased this item (DELIVERED status)
  let hasPurchased = false;
  if (session?.user?.id) {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "DELIVERED",
        items: { some: { productId: product.id } },
      },
    });
    hasPurchased = !!order;
  }

  // Fetch similar products based on the current product's category
  const similarProducts = await getSimilarProducts(
    product.categoryId,
    product.id,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Modern Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-base-content/60 mb-8 overflow-x-auto whitespace-nowrap pb-2 lg:pb-0">
        <Link
          href="/"
          className="hover:text-primary flex items-center transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>

        <ChevronRight className="w-4 h-4 mx-2 opacity-50 shrink-0" />

        <Link
          href={`/search?category=${product.category.slug}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {product.category.name}
        </Link>

        <ChevronRight className="w-4 h-4 mx-2 opacity-50 shrink-0" />

        <span className="font-medium text-base-content truncate">
          {product.name}
        </span>
      </nav>

      {/* Main Grid: Images + Sticky Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
        {/* Left: Images Gallery */}
        <div className="w-full">
          <ProductImages
            images={product.images ? JSON.parse(product.images) : []}
            title={product.name}
          />
        </div>

        {/* Right: Info (Sticky on Large Screens) */}
        <div className="lg:sticky lg:top-24 h-fit">
          <ProductInfo product={product} />
        </div>
      </div>

      {/* --- REVIEWS SECTION --- */}
      <div className="border-t border-base-200 pt-16 mt-16" id="reviews">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Summary & Form */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h2 className="text-3xl font-black mb-2">Reviews</h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-warning">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={20} fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm font-medium opacity-60">
                  4.8 out of 5
                </span>
              </div>
              <p className="text-base-content/60 text-sm">
                Share your thoughts with other customers.
              </p>
            </div>

            {session ? (
              hasPurchased ? (
                <ReviewForm productId={product.id} />
              ) : (
                <div className="bg-base-200/50 p-6 rounded-2xl text-center border border-base-200 border-dashed">
                  <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag size={20} className="opacity-40" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">
                    Verified Purchase Required
                  </h4>
                  <p className="text-xs text-base-content/60">
                    You can only review products you have purchased and
                    received.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-base-200/50 p-8 rounded-3xl text-center border border-base-200">
                <p className="font-bold mb-2">Have you used this product?</p>
                <p className="text-sm text-base-content/60 mb-6">
                  Log in to leave a review and help others.
                </p>
                <Link
                  href={`/login?callbackUrl=/product/${product.slug}`}
                  className="btn btn-outline btn-block rounded-xl"
                >
                  Login to Review
                </Link>
              </div>
            )}
          </div>

          {/* Right: Review List */}
          <div className="lg:col-span-8">
            <h3 className="text-xl font-bold mb-6">Recent Reviews</h3>
            <Reviews productId={product.id} />
          </div>
        </div>
      </div>

      {/* --- RELATED PRODUCTS SECTION (Modern UI) --- */}
      {similarProducts.length > 0 && (
        <div className="border-t border-base-200 pt-16 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Related Products</h2>
              <p className="text-base-content/60">
                Other items you might be interested in
              </p>
            </div>
            <Link
              href={`/search?category=${product.category.slug}`}
              className="btn btn-ghost hover:bg-base-200 rounded-full group"
            >
              View More{" "}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
