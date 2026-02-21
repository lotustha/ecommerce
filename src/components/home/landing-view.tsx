"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Rocket,
  ShieldCheck,
  Gem,
  Headphones,
  ArrowRight,
  Clock,
  Star,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import ProductCard from "@/components/product/product-card";
import { Product, Category, Brand } from "../../../generated/prisma/client";
import { useState, useEffect } from "react";

interface LandingViewProps {
  featuredProducts: (Product & { category: Category; brand: Brand | null })[];
  newArrivals: (Product & { category: Category; brand: Brand | null })[];
}

export default function LandingView({
  featuredProducts,
  newArrivals,
}: LandingViewProps) {
  // Countdown Timer Logic for Flash Deals
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0)
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0)
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[700px] rounded-3xl overflow-hidden shadow-2xl group mx-auto">
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
            backgroundImage: "url(/placeholder.jpeg",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent"></div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 max-w-4xl text-white"
        >
          <motion.div
            variants={fadeInUp}
            className="badge badge-primary badge-lg mb-6 uppercase font-bold tracking-widest border-none"
          >
            Spring Collection 2025
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6"
          >
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
              Everyday Style.
            </span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl opacity-90 mb-10 max-w-xl font-light leading-relaxed"
          >
            Discover the latest trends in fashion and technology. Curated just
            for you with delivery all across Nepal.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
            <Link
              href="/search"
              className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/30 border-none hover:scale-105 transition-transform"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="btn btn-outline btn-lg text-white rounded-full px-10 hover:bg-white hover:text-black hover:scale-105 transition-transform backdrop-blur-sm"
            >
              Browse Categories
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. CATEGORY SHOWCASE SECTION */}
      <section>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black mb-3">Shop by Category</h2>
          <p className="text-base-content/60 max-w-lg mx-auto">
            Explore our wide range of collections carefully selected to match
            your unique taste and needs.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
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
                className="group relative h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  style={{ backgroundImage: `url(${cat.img})` }}
                />
                <div
                  className={`absolute inset-0 bg-linear-to-t ${cat.color} to-transparent opacity-80 group-hover:opacity-90 transition-opacity`}
                />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="font-bold text-2xl text-white mb-1 group-hover:translate-x-2 transition-transform">
                    {cat.name}
                  </h3>
                  <div className="flex items-center text-white/80 text-sm group-hover:translate-x-2 transition-transform delay-75">
                    <span>Shop Now</span>
                    <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* 3. BEST-SELLING PRODUCTS SECTION */}
      <section>
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h2 className="text-4xl font-black mb-2">Best Sellers</h2>
            <p className="text-base-content/60">
              Top favorites from our customers
            </p>
          </div>
          <Link
            href="/search?sort=popular"
            className="btn btn-ghost hover:bg-base-200 rounded-full group"
          >
            View All{" "}
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. NEW ARRIVALS SECTION */}
      <section>
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h2 className="text-4xl font-black mb-2">New Arrivals</h2>
            <p className="text-base-content/60">Fresh drops just for you</p>
          </div>
          <Link
            href="/search?sort=latest"
            className="btn btn-ghost hover:bg-base-200 rounded-full group"
          >
            See All{" "}
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {newArrivals.slice(0, 4).map((product) => (
            <div key={product.id} className="relative group/new">
              {/* Fancy "NEW" Tag on Top Right */}
              <div className="absolute -top-3 -right-3 z-30">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-secondary to-primary blur opacity-60 rounded-full animate-pulse"></div>
                  <span className="relative flex items-center gap-1 bg-linear-to-r from-secondary to-primary text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full shadow-xl transform rotate-6 group-hover/new:rotate-0 transition-transform duration-300 border border-white/20">
                    <Sparkles size={14} className="animate-pulse" /> New
                  </span>
                </div>
              </div>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* 5. FLASH DEALS SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-primary text-primary-content shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-10 md:p-16 gap-10">
          <div className="max-w-xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md flex items-center gap-2">
                <Clock size={14} /> Flash Deal
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Super Sale <br />
              Up to 50% Off
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Grab the best deals on electronics and fashion. Limited time offer
              ends soon.
            </p>
            <Link
              href="/deals"
              className="btn btn-white text-primary btn-lg rounded-full px-10 font-bold border-none hover:scale-105 transition-transform shadow-xl"
            >
              Shop The Sale
            </Link>
          </div>

          <div className="flex gap-4">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div
                key={unit}
                className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-md rounded-2xl w-24 h-24 justify-center border border-white/20"
              >
                <span className="text-3xl font-black font-mono">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-widest opacity-80">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE US SECTION */}
      <section>
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
              title: "Easy Returns",
              desc: "7-day return policy for all items",
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
              <div className="mb-6 bg-base-200 w-20 h-20 flex items-center justify-center rounded-2xl text-primary">
                <feature.Icon size={40} strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
              <p className="text-sm text-base-content/60 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS SECTION */}
      <section className="bg-base-200/50 rounded-[3rem] p-10 md:p-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-3">What Our Customers Say</h2>
          <p className="text-base-content/60">
            Real stories from satisfied shoppers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Aarav Sharma",
              role: "Verified Buyer",
              text: "The delivery was incredibly fast! Ordered a phone and got it the next day in Kathmandu. Highly recommended.",
              img: "https://i.pravatar.cc/150?u=1",
            },
            {
              name: "Priya Karki",
              role: "Fashion Enthusiast",
              text: "Love the collection here. The quality of the North Face jacket I bought is top-notch and 100% genuine.",
              img: "https://i.pravatar.cc/150?u=2",
            },
            {
              name: "Suresh Thapa",
              role: "Tech Geek",
              text: "Best prices for electronics in Nepal. Customer support was very helpful in guiding me to choose the right laptop.",
              img: "https://i.pravatar.cc/150?u=3",
            },
          ].map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-base-100 p-8 rounded-3xl shadow-lg relative"
            >
              <div className="flex text-warning mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-base-content/80 mb-6 italic leading-relaxed">
                "{review.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="avatar">
                  <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={review.img} alt={review.name} />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm">{review.name}</h4>
                  <p className="text-xs text-base-content/50">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 8. LARGE CALL-TO-ACTION SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral text-neutral-content py-24 px-6 text-center">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Ready to Upgrade Your Life?
          </h2>
          <p className="text-xl opacity-80 mb-10 leading-relaxed">
            Join thousands of happy customers and experience the new standard of
            online shopping in Nepal.
          </p>
          <Link
            href="/register"
            className="btn btn-primary btn-lg rounded-full px-12 shadow-xl hover:scale-105 transition-transform"
          >
            Start Shopping Today
          </Link>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* 9. NEWSLETTER SUBSCRIPTION SECTION */}
      <section className="max-w-4xl mx-auto text-center">
        <div className="bg-base-100 border border-base-200 p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary via-secondary to-accent"></div>

          <div className="mb-8 flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full text-primary">
              <Mail size={32} />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Subscribe to our Newsletter
          </h2>
          <p className="text-base-content/60 mb-8 max-w-lg mx-auto">
            Get the latest updates on new products, flash sales, and exclusive
            offers sent directly to your inbox.
          </p>

          <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="input input-lg input-bordered w-full rounded-full focus:input-primary bg-base-200 focus:bg-base-100 transition-colors"
            />
            <button className="btn btn-primary btn-lg rounded-full px-8 shadow-lg">
              Subscribe
            </button>
          </form>

          <p className="text-xs text-base-content/40 mt-6 flex items-center justify-center gap-2">
            <CheckCircle2 size={12} /> No spam, unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
