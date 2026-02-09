"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { newPassword } from "@/actions/new-password";
import { motion, Variants } from "framer-motion";

// --- BRAND CONFIGURATION ---
const BRAND_NAME = "Nepal E-com";
// Replace this component with an <Image /> tag if you have a logo file
const BrandLogo = () => (
  <div className="w-16 h-16 bg-success rounded-xl flex items-center justify-center shadow-lg shadow-success/40">
    <span className="text-3xl font-bold text-success-content">N</span>
  </div>
);

// Updated Schema with Confirm Password validation
const NewPasswordSchema = z
  .object({
    password: z.string().min(6, "Minimum 6 characters required"),
    confirmPassword: z.string().min(6, "Minimum 6 characters required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type NewPasswordFormValues = z.infer<typeof NewPasswordSchema>;

function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: NewPasswordFormValues) => {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing token!");
      return;
    }

    startTransition(() => {
      // We only send the main password to the server
      newPassword({ password: values.password, token }).then((data) => {
        if (data?.error) {
          setError(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          // Redirect to login after success
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
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Mobile Header (Visible only on small screens) */}
      <motion.div variants={fadeInUp} className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">{BRAND_NAME}</h1>
      </motion.div>

      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          Reset Password
        </h2>
        <p className="text-base-content/60">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password Input */}
        <div className="relative group">
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
            New Password
          </label>
          {errors.password && (
            <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="relative group">
          <input
            {...register("confirmPassword")}
            type="password"
            id="confirmPassword"
            className={`peer block w-full rounded-2xl border bg-transparent px-4 pb-3 pt-6 text-sm text-base-content focus:border-primary focus:outline-none focus:ring-0 transition-all duration-300 ${errors.confirmPassword ? "border-error" : "border-base-300"}`}
            placeholder=" "
            disabled={isPending}
          />
          <label
            htmlFor="confirmPassword"
            className="absolute left-4 top-4 z-10 origin-left -translate-y-3 scale-75 transform text-base-content/50 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary pointer-events-none"
          >
            Confirm Password
          </label>
          {errors.confirmPassword && (
            <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {error && (
          <div className="alert alert-error text-sm py-3 rounded-xl border border-error/20">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success text-sm py-3 rounded-xl border border-success/20">
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 rounded-2xl normal-case"
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Reset Password"
          )}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="link link-hover text-sm text-base-content/60 hover:text-primary transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <div className="min-h-screen flex bg-base-100">
      {/* Left Side: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral relative flex-col justify-center items-center text-neutral-content overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-success/10 rounded-full blur-3xl z-0"
        />

        <div className="relative z-10 text-center px-10 max-w-lg">
          {/* Brand Logo & Name */}
          <div className="mb-6 flex justify-center">
            <BrandLogo />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
            {BRAND_NAME}
          </h1>

          <h2 className="text-2xl font-bold mb-4 tracking-tight">
            Secure Your Account
          </h2>
          <p className="text-lg opacity-80 font-light">
            Choose a strong password to keep your shopping experience safe.
          </p>
        </div>
      </div>

      {/* Right Side: Form (Wrapped in Suspense for useSearchParams) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-base-100 text-base-content relative">
        <Suspense fallback={<div>Loading...</div>}>
          <NewPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
