"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions/forgot-password";
import { motion, Variants } from "framer-motion";

const ResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResetFormValues = z.infer<typeof ResetSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: ResetFormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      resetPassword(values).then((data) => {
        if (data?.error) {
          setError(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
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
    <div className="min-h-screen flex bg-base-100">
      {/* Left Side: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral relative flex-col justify-center items-center text-neutral-content overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent/10 rounded-full blur-3xl z-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-10 max-w-lg"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-accent-content"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-lg opacity-80 font-light">
            Don't worry, it happens to the best of us. We'll send you a recovery
            link shortly.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-base-100 text-base-content relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Reset Password
            </h2>
            <p className="text-base-content/60">
              Enter your email to receive instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="relative group">
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
              {errors.email && (
                <span className="text-error text-xs mt-1 absolute -bottom-5 left-1">
                  {errors.email.message}
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
                "Send Reset Link"
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
        </motion.div>
      </div>
    </div>
  );
}
