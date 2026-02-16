"use client";

import { useState } from "react";
import { Loader2, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { preparePayment } from "@/actions/payment";

interface PaymentInteractionProps {
  orderId: string;
  amount: number;
  initialMethod: string;
  customer: { name: string; email: string; phone: string };
}

export default function PaymentInteraction({
  orderId,
  amount,
  initialMethod,
  customer,
}: PaymentInteractionProps) {
  const [method, setMethod] = useState<"ESEWA" | "KHALTI">(
    initialMethod === "ESEWA" || initialMethod === "KHALTI"
      ? initialMethod
      : "ESEWA",
  );
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Prepare Payment on Server (Generate Config / Update Method)
      const res = await preparePayment(orderId, method);

      if (res.error || !res.success) {
        toast.error(res.error || "Failed to prepare payment");
        setLoading(false);
        return;
      }

      // 2. Handle eSewa
      if (res.method === "ESEWA" && res.config) {
        const form = document.createElement("form");
        form.setAttribute("method", "POST");
        form.setAttribute("action", res.config.url);

        // Fix URLs client-side if needed (optional double-check)
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
          hiddenField.setAttribute("value", params[key]);
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        form.submit();
      }

      // 3. Handle Khalti
      else if (res.method === "KHALTI") {
        const response = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount, method: "KHALTI", customer }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || "Failed to initiate Khalti payment");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMethod("ESEWA")}
          className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
            method === "ESEWA"
              ? "border-success bg-success/5 text-success"
              : "border-base-200 hover:border-base-300 opacity-60 hover:opacity-100"
          }`}
        >
          {method === "ESEWA" && (
            <div className="absolute top-3 right-3">
              <CheckCircle2 size={16} />
            </div>
          )}
          <Wallet size={32} />
          <span className="font-bold">eSewa</span>
        </button>

        <button
          onClick={() => setMethod("KHALTI")}
          className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
            method === "KHALTI"
              ? "border-info bg-info/5 text-info"
              : "border-base-200 hover:border-base-300 opacity-60 hover:opacity-100"
          }`}
        >
          {method === "KHALTI" && (
            <div className="absolute top-3 right-3">
              <CheckCircle2 size={16} />
            </div>
          )}
          <Wallet size={32} />
          <span className="font-bold">Khalti</span>
        </button>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`btn btn-lg w-full rounded-xl shadow-xl text-white border-none ${
          method === "ESEWA"
            ? "bg-[#60bb46] hover:bg-[#53a53c]"
            : "bg-[#5c2d91] hover:bg-[#4d257a]"
        }`}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          `Pay Rs. ${amount.toLocaleString()} with ${method}`
        )}
      </button>
    </div>
  );
}
