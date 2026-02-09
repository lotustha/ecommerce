"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import { register as registerAction } from "@/actions/register";
import { socialLogin } from "@/actions/login";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";

// Updated Schema to match server action
const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerAction(values).then((data) => {
        if (data.error) {
          setError(data.error);
        }
        if (data.success) {
          setSuccess(data.success);
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      });
    });
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen flex bg-base-100">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral relative flex-col justify-center items-center text-neutral-content overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 rounded-full blur-3xl z-0"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl z-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-10 max-w-lg backdrop-blur-sm bg-base-100/10 p-12 rounded-3xl border border-white/10 shadow-2xl"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/40">
              <span className="text-3xl font-bold text-secondary-content">
                N
              </span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-secondary-content to-primary-content">
            Join Us
          </h1>
          <p className="text-lg opacity-90 leading-relaxed font-light">
            Create an account today and start your journey with Nepal E-com.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-base-100 text-base-content relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="w-full max-w-md space-y-6"
        >
          <motion.div
            variants={fadeInUp}
            className="text-center lg:text-left mb-6"
          >
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">
              Create Account
            </h2>
            <p className="text-base-content/60">
              Enter your details to get started.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Input */}
            <motion.div variants={fadeInUp} className="relative group">
              <input
                {...register("name")}
                type="text"
                id="name"
                className={`peer block w-full rounded-2xl border bg-transparent px-4 pb-3 pt-6 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-0 transition-all duration-300 ${errors.name ? "border-error" : "border-base-300"}`}
                placeholder=" "
                disabled={isPending}
              />
              <label
                htmlFor="name"
                className="absolute left-4 top-4 z-10 origin-left -translate-y-3 scale-75 transform text-base-content/50 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary pointer-events-none"
              >
                Full Name
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 peer-focus:text-primary transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              {errors.name && (
                <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
                  {errors.name.message}
                </span>
              )}
            </motion.div>

            {/* Email Input */}
            <motion.div variants={fadeInUp} className="relative group">
              <input
                {...register("email")}
                type="email"
                id="email"
                className={`peer block w-full rounded-2xl border bg-transparent px-4 pb-3 pt-6 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-0 transition-all duration-300 ${errors.email ? "border-error" : "border-base-300"}`}
                placeholder=" "
                disabled={isPending}
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-4 z-10 origin-left -translate-y-3 scale-75 transform text-base-content/50 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary pointer-events-none"
              >
                Email address
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 peer-focus:text-primary transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              {errors.email && (
                <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
                  {errors.email.message}
                </span>
              )}
            </motion.div>

            {/* Phone Input (NEW) */}
            <motion.div variants={fadeInUp} className="relative group">
              <input
                {...register("phone")}
                type="tel"
                id="phone"
                className={`peer block w-full rounded-2xl border bg-transparent px-4 pb-3 pt-6 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-0 transition-all duration-300 ${errors.phone ? "border-error" : "border-base-300"}`}
                placeholder=" "
                disabled={isPending}
              />
              <label
                htmlFor="phone"
                className="absolute left-4 top-4 z-10 origin-left -translate-y-3 scale-75 transform text-base-content/50 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary pointer-events-none"
              >
                Phone Number
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 peer-focus:text-primary transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
              </div>
              {errors.phone && (
                <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
                  {errors.phone.message}
                </span>
              )}
            </motion.div>

            {/* Password Input */}
            <motion.div variants={fadeInUp} className="relative group">
              <input
                {...register("password")}
                type="password"
                id="password"
                className={`peer block w-full rounded-2xl border bg-transparent px-4 pb-3 pt-6 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-0 transition-all duration-300 ${errors.password ? "border-error" : "border-base-300"}`}
                placeholder=" "
                disabled={isPending}
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-4 z-10 origin-left -translate-y-3 scale-75 transform text-base-content/50 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary pointer-events-none"
              >
                Password
              </label>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/30 peer-focus:text-primary transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              {errors.password && (
                <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
                  {errors.password.message}
                </span>
              )}
            </motion.div>

            {/* Notifications */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="alert alert-error text-sm py-3 rounded-xl border border-error/20"
              >
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="alert alert-success text-sm py-3 rounded-xl border border-success/20"
              >
                <span>{success}</span>
              </motion.div>
            )}

            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-2xl normal-case"
              disabled={isPending}
            >
              {isPending ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <motion.div
            variants={fadeInUp}
            className="divider text-base-content/40 text-sm font-medium tracking-wide my-6"
          >
            OR JOIN WITH
          </motion.div>

          {/* Social Buttons (Existing code logic used here) */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
            <button
              onClick={() => socialLogin("google")}
              className="btn btn-outline h-12 border-base-300 hover:bg-base-200 rounded-xl font-normal normal-case"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => socialLogin("facebook")}
              className="btn btn-outline h-12 border-base-300 hover:bg-base-200 rounded-xl font-normal normal-case"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-center text-sm text-base-content/60"
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="link link-primary font-bold no-underline hover:underline transition-all"
            >
              Sign In
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
