"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Rocket, ShieldCheck, Gem, Headphones, ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import { Product, Category, Brand } from "../../../generated/prisma/client";

// ✅ Correct Props Interface: Expects an array of products
interface LandingViewProps {
  products: (Product & {
    category: Category;
    brand: Brand | null;
  })[];
}

export default function LandingView({ products }: LandingViewProps) {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-24 pb-20">
      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop)",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent"></div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="absolute inset-0 flex flex-col justify-center px-10 md:px-20 max-w-3xl text-white"
        >
          <motion.div
            variants={fadeInUp}
            className="badge badge-primary badge-lg mb-4 uppercase font-bold tracking-widest"
          >
            New Arrivals
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black leading-tight mb-6"
          >
            Redefine Your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
              Lifestyle.
            </span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl opacity-90 mb-10 max-w-xl font-light leading-relaxed"
          >
            Experience the fusion of traditional craftsmanship and modern
            technology. Delivery all across Nepal with just a click.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex gap-4">
            <Link
              href="/search"
              className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/30 border-none hover:scale-105 transition-transform"
            >
              Shop Now
            </Link>
            <Link
              href="/about"
              className="btn btn-outline btn-lg text-white rounded-full px-10 hover:bg-white hover:text-black hover:scale-105 transition-transform backdrop-blur-sm"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* --- TRUST SIGNALS --- */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2"
      >
        {[
          {
            Icon: Rocket,
            title: "Fast Delivery",
            desc: "All over Nepal within 3-5 days",
          },
          {
            Icon: ShieldCheck,
            title: "Secure Payment",
            desc: "eSewa, Khalti & COD available",
          },
          {
            Icon: Gem,
            title: "100% Genuine",
            desc: "Authentic products guaranteed",
          },
          {
            Icon: Headphones,
            title: "24/7 Support",
            desc: "Always here to help you",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            whileHover={{ y: -10 }}
            className="flex flex-col items-center text-center p-8 bg-base-100 rounded-3xl shadow-xl border border-base-200/50 hover:border-primary/30 transition-all duration-300"
          >
            <div className="mb-4 bg-base-200 w-20 h-20 flex items-center justify-center rounded-2xl text-primary">
              <feature.Icon size={40} strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
            <p className="text-sm text-base-content/60 leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* --- POPULAR CATEGORIES --- */}
      <section>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end mb-10 px-2"
        >
          <div>
            <h2 className="text-4xl font-black mb-2">Shop by Category</h2>
            <p className="text-base-content/60">
              Explore our curated collections
            </p>
          </div>
          <Link
            href="/categories"
            className="btn btn-ghost hover:bg-base-200 rounded-full group"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            {
              name: "Electronics",
              img: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80",
              link: "/search?category=electronics",
              color: "from-blue-600/80",
            },
            {
              name: "Fashion",
              img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
              link: "/search?category=fashion",
              color: "from-purple-600/80",
            },
            {
              name: "Home",
              img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=600&q=80",
              link: "/search?category=home",
              color: "from-emerald-600/80",
            },
            {
              name: "Beauty",
              img: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80",
              link: "/search?category=beauty",
              color: "from-rose-600/80",
            },
          ].map((cat, i) => (
            <Link key={i} href={cat.link}>
              <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 0.98 }}
                className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  style={{ backgroundImage: `url(${cat.img})` }}
                />
                <div
                  className={`absolute inset-0 bg-linear-to-t ${cat.color} to-transparent opacity-80 group-hover:opacity-90 transition-opacity`}
                />

                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-bold text-2xl text-white mb-1">
                    {cat.name}
                  </h3>
                  <div className="h-1 w-12 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* --- FEATURED PRODUCTS (REAL DATA) --- */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="pb-10"
      >
        <h2 className="text-4xl font-black mb-8 px-2">Featured Products</h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="alert bg-base-100 shadow-sm border border-base-200">
            <div>
              <h3 className="font-bold">No products found</h3>
              <div className="text-xs">
                Run <code>npx prisma db seed</code> to populate your database
                with demo products.
              </div>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
