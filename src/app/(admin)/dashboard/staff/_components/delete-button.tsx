"use client";

import { deleteStaff } from "@/actions/staff-actions";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { useTransition, useRef } from "react";
import { toast } from "react-hot-toast";

export default function DeleteStaffButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteStaff(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Staff member deleted successfully");
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
        className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
        title="Delete Staff"
      >
        <Trash2 size={16} />
      </button>

      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <X size={16} />
            </button>
          </form>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>

            <h3 className="font-bold text-xl mb-2">Delete {name}?</h3>
            <p className="text-base-content/60 mb-6">
              This action cannot be undone. They will lose access to the admin
              panel immediately.
            </p>

            <div className="flex gap-3 w-full">
              <form method="dialog" className="w-full">
                <button className="btn btn-outline w-full border-base-300">
                  Cancel
                </button>
              </form>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="btn btn-error w-full text-white"
              >
                {isPending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Delete"
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
