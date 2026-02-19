"use client";

import {
  updatePaymentStatus,
  switchPaymentToCOD,
  updateOrderStatus,
} from "@/actions/order-actions";
import { useState, useTransition, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Loader2,
  ChevronDown,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  Ban,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["UNPAID", "PAID", "FAILED", "REFUNDED"];

interface Props {
  orderId: string;
  currentStatus: string;
  currentPaymentMethod: string;
}

type ModalType = "STATUS" | "COD" | "CANCEL" | null;

export default function PaymentStatusSelect({
  orderId,
  currentStatus,
  currentPaymentMethod,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  // Modal State
  const [modalType, setModalType] = useState<ModalType>(null);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  const router = useRouter();

  const getStatusColor = (s: string) => {
    switch (s) {
      case "PAID":
        return "bg-success/15 text-success border-success/20 hover:bg-success/25";
      case "UNPAID":
        return "bg-warning/15 text-warning-content border-warning/20 hover:bg-warning/25";
      case "FAILED":
        return "bg-error/15 text-error border-error/20 hover:bg-error/25";
      case "REFUNDED":
        return "bg-neutral/15 text-neutral-content border-neutral/20 hover:bg-neutral/25";
      default:
        return "bg-base-200 text-base-content hover:bg-base-300";
    }
  };

  // --- HANDLERS ---

  const initiateStatusChange = (newStatus: string) => {
    if (newStatus === status) return;
    setTargetStatus(newStatus);
    setModalType("STATUS");
    modalRef.current?.showModal();
    (document.activeElement as HTMLElement)?.blur(); // Close dropdown
  };

  const initiateCodSwitch = () => {
    setModalType("COD");
    modalRef.current?.showModal();
  };

  const initiateCancel = () => {
    setModalType("CANCEL");
    modalRef.current?.showModal();
  };

  const handleConfirm = () => {
    if (!modalType) return;

    startTransition(async () => {
      let result;

      if (modalType === "STATUS" && targetStatus) {
        // @ts-ignore
        result = await updatePaymentStatus(orderId, targetStatus);
        if (!result.error) setStatus(targetStatus);
      } else if (modalType === "COD") {
        result = await switchPaymentToCOD(orderId);
      } else if (modalType === "CANCEL") {
        // @ts-ignore
        result = await updateOrderStatus(orderId, "CANCELLED");
        // Auto-fail payment if cancelling an unpaid order
        if (!result.error && status !== "PAID") {
          // @ts-ignore
          await updatePaymentStatus(orderId, "FAILED");
          setStatus("FAILED");
        }
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result?.success || "Updated successfully");
        router.refresh();
      }

      modalRef.current?.close();
      setModalType(null);
    });
  };

  const showTroubleshoot = status === "UNPAID" || status === "FAILED";

  return (
    <div className="space-y-4">
      {/* 1. Main Status Selector */}
      <div className="dropdown dropdown-end w-full">
        <div
          tabIndex={0}
          role="button"
          className={`btn btn-sm w-full justify-between border ${getStatusColor(status)} no-animation h-10`}
        >
          <span className="font-bold">{status}</span>
          <ChevronDown size={16} className="opacity-50" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200 mt-1"
        >
          {STATUS_OPTIONS.map((s) => (
            <li key={s}>
              <button
                onClick={() => initiateStatusChange(s)}
                className={`flex justify-between items-center ${s === status ? "active font-bold" : ""}`}
              >
                {s}
                {s === status && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Troubleshoot Actions (Modern UI) */}
      {showTroubleshoot && (
        <div className="bg-base-200/50 p-3 rounded-xl border border-base-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold opacity-50 uppercase tracking-wider">
            <Settings2 size={12} /> Troubleshoot
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentPaymentMethod !== "COD" && (
              <button
                onClick={initiateCodSwitch}
                disabled={isPending}
                className="btn btn-xs btn-outline bg-base-100 h-9 border-base-300 hover:bg-base-200 hover:border-base-400 gap-2"
                title="Convert to Cash on Delivery"
              >
                <RefreshCw size={14} className="text-primary" />
                <span className="text-xs">To COD</span>
              </button>
            )}

            <button
              onClick={initiateCancel}
              disabled={isPending}
              className={`btn btn-xs btn-outline bg-base-100 h-9 border-base-300 hover:border-error/50 hover:bg-error/5 hover:text-error gap-2 ${currentPaymentMethod === "COD" ? "col-span-2" : ""}`}
              title="Cancel Order"
            >
              <Ban size={14} className="text-error" />
              <span className="text-xs">Cancel Order</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Unified Confirmation Modal */}
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle text-left"
      >
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X size={16} />
            </button>
          </form>

          <div className="flex flex-col items-center text-center p-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                modalType === "CANCEL"
                  ? "bg-error/10 text-error"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {modalType === "CANCEL" ? (
                <Ban size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>

            <h3 className="font-bold text-xl mb-2">
              {modalType === "STATUS" && "Update Payment Status?"}
              {modalType === "COD" && "Switch to COD?"}
              {modalType === "CANCEL" && "Cancel Order?"}
            </h3>

            <p className="text-base-content/60 mb-6">
              {modalType === "STATUS" && (
                <>
                  Change status from <strong>{status}</strong> to{" "}
                  <strong className="text-primary">{targetStatus}</strong>?
                </>
              )}
              {modalType === "COD" &&
                "This will change the payment method to Cash on Delivery. Ensure you communicate this to the customer."}
              {modalType === "CANCEL" &&
                "Are you sure you want to cancel this order? This action cannot be undone."}
            </p>

            <div className="flex gap-3 w-full justify-around">
              <form method="dialog" className="">
                <button className="btn btn-outline border-base-300">
                  Back
                </button>
              </form>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`btn  text-white ${modalType === "CANCEL" ? "btn-error" : "btn-primary"}`}
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
