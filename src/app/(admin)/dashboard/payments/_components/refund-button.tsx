"use client";

import { processRefund } from "@/actions/refund-actions";
import { RotateCcw, AlertTriangle, X } from "lucide-react";
import { useTransition, useRef } from "react";
import { toast } from "react-hot-toast";

export default function RefundButton({
  orderId,
  amount,
}: {
  orderId: string;
  amount: string;
}) {
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleRefund = async () => {
    startTransition(async () => {
      const result = await processRefund(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Refunded successfully");
        modalRef.current?.close();
      }
    });
  };

  const openModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <button
        onClick={openModal}
        disabled={isPending}
        className="btn btn-xs btn-ghost text-error hover:bg-error/10 gap-1"
        title="Refund Transaction"
      >
        <RotateCcw size={14} /> Refund
      </button>

      {/* Confirmation Modal */}
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle text-left"
      >
        <div className="modal-box ">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X size={16} />
            </button>
          </form>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>

            <h3 className="font-bold text-xl mb-2">Process Refund?</h3>
            <p className="text-base-content/60 mb-6">
              You are about to refund <strong>{amount}</strong> for Order #
              {orderId.slice(-6).toUpperCase()}.
              <br />
              This will mark the order as <strong>CANCELLED</strong>.
            </p>

            <div className="flex gap-3">
              <form method="dialog" className="w-full">
                <button className="btn btn-outline border-base-300">
                  Cancel
                </button>
              </form>
              <button
                onClick={handleRefund}
                disabled={isPending}
                className="btn btn-error w-full text-white"
              >
                {isPending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Confirm Refund"
                )}
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
