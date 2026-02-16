"use client"

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface PaymentButtonProps {
    orderId: string;
    amount: number;
    method: string;
    esewaConfig?: any; // Received from server
    customer: { name: string; email: string; phone: string };
}

export default function PaymentButton({ orderId, amount, method, esewaConfig, customer }: PaymentButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        if (method === "ESEWA") {
            try {
                if (!esewaConfig) {
                    toast.error("eSewa configuration missing");
                    setLoading(false);
                    return;
                }

                // 2. Create Form and Submit
                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", esewaConfig.url);

                for (const key in esewaConfig.params) {
                    const hiddenField = document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", esewaConfig.params[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            } catch (error) {
                console.error("eSewa Error:", error);
                toast.error("Failed to initiate eSewa payment");
                setLoading(false);
            }
        }

        else if (method === "KHALTI") {
            try {
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
                }
            } catch (e) {
                console.error("Khalti Error:", e);
                toast.error("Something went wrong");
                setLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className={`btn btn-primary btn-lg w-full rounded-xl shadow-xl text-white ${method === 'ESEWA' ? 'bg-[#60bb46] border-[#60bb46] hover:bg-[#53a53c]' : 'bg-[#5c2d91] border-[#5c2d91] hover:bg-[#4d257a]'}`}
        >
            {loading ? <Loader2 className="animate-spin" /> : `Pay with ${method}`}
        </button>
    );
}