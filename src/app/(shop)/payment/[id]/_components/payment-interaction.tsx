"use client"

import { useState, useEffect, useRef } from "react";
import { Loader2, Wallet, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { preparePayment } from "@/actions/payment";
import { useSearchParams } from "next/navigation";

interface PaymentInteractionProps {
  orderId: string;
  amount: number;
  initialMethod: string;
  customer: { name: string; email: string; phone: string };
}

export default function PaymentInteraction({ orderId, amount, initialMethod, customer }: PaymentInteractionProps) {
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<"ESEWA" | "KHALTI">(
    (initialMethod === "ESEWA" || initialMethod === "KHALTI") ? initialMethod : "ESEWA"
  );
  const [loading, setLoading] = useState(false);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);
  const hasAttemptedAuto = useRef(false);

  const handlePayment = async (selectedMethod?: "ESEWA" | "KHALTI") => {
    const activeMethod = selectedMethod || method;
    setLoading(true);

    try {
      const res = await preparePayment(orderId, activeMethod);

      if (res.error || !res.success) {
        toast.error(res.error || "Failed to prepare payment");
        setLoading(false);
        setIsAutoRedirecting(false);
        return;
      }

      if (res.method === "ESEWA" && res.config) {
        const form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", res.config.url);

        const fixUrl = (url: string) => {
          if (url.startsWith("http")) return url;
          const cleanPath = url.replace(/^undefined/, "");
          return `${window.location.origin}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
        };

        const params = {
          ...res.config.params,
          success_url: fixUrl(res.config.params.success_url),
          failure_url: fixUrl(res.config.params.failure_url),
        };

        for (const key in params) {
          const hiddenField = document.createElement("input");
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", key);
          // @ts-ignore
          hiddenField.setAttribute("value", String(params[key]));
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        form.submit();
      }

      else if (res.method === "KHALTI") {
        const response = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount, method: "KHALTI", customer })
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || "Failed to initiate Khalti payment");
          setLoading(false);
          setIsAutoRedirecting(false);
        }
      }

    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Something went wrong");
      setLoading(false);
      setIsAutoRedirecting(false);
    }
  };

  // ✅ Auto-initiate payment if 'auto' param is present
  useEffect(() => {
    const isAuto = searchParams.get("auto") === "true";
    if (isAuto && !hasAttemptedAuto.current) {
      hasAttemptedAuto.current = true;
      setIsAutoRedirecting(true);
      handlePayment();
    }
  }, [searchParams]);

  if (isAutoRedirecting) {
    return (
      <div className="py-10 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <Wallet size={32} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Redirecting to {method}...</h2>
          <p className="text-sm opacity-60 mt-2">Please do not close this window.</p>
        </div>
        <button
          onClick={() => handlePayment()}
          className="btn btn-ghost btn-sm gap-2"
        >
          Not redirected? Click here <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Payment Method Selection (Only visible if not auto-redirecting) */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMethod("ESEWA")}
          className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === "ESEWA"
              ? "border-success bg-success/5 text-success"
              : "border-base-200 hover:border-base-300 opacity-60 hover:opacity-100"
            }`}
        >
          {method === "ESEWA" && <div className="absolute top-3 right-3"><CheckCircle2 size={16} /></div>}
          <Wallet size={32} />
          <span className="font-bold">eSewa</span>
        </button>

        <button
          onClick={() => setMethod("KHALTI")}
          className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === "KHALTI"
              ? "border-info bg-info/5 text-info"
              : "border-base-200 hover:border-base-300 opacity-60 hover:opacity-100"
            }`}
        >
          {method === "KHALTI" && <div className="absolute top-3 right-3"><CheckCircle2 size={16} /></div>}
          <Wallet size={32} />
          <span className="font-bold">Khalti</span>
        </button>
      </div>

      <button
        onClick={() => handlePayment()}
        disabled={loading}
        className={`btn btn-lg w-full rounded-xl shadow-xl text-white border-none ${method === 'ESEWA'
            ? 'bg-[#60bb46] hover:bg-[#53a53c]'
            : 'bg-[#5c2d91] hover:bg-[#4d257a]'
          }`}
      >
        {loading ? <Loader2 className="animate-spin" /> : `Pay Rs. ${amount.toLocaleString()} with ${method}`}
      </button>
    </div>
  );
}