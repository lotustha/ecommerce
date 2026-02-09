import { getProductBySlug, getSimilarProducts } from "@/lib/db/data";
import ProductImages from "@/components/product/product-images";
import ProductInfo from "@/components/product/product-info";
import ProductCard from "@/components/product/product-card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// Define params type correctly for Next.js 15
interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  // Await params first (Next.js 15 requirement)
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

  if (!product) {
    notFound();
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

        <ChevronRight className="w-4 h-4 mx-2 opacity-50 flex-shrink-0" />

        <Link
          href={`/search?category=${product.category.slug}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {product.category.name}
        </Link>

        <ChevronRight className="w-4 h-4 mx-2 opacity-50 flex-shrink-0" />

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

      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="border-t border-base-200 pt-16">
          <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
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
