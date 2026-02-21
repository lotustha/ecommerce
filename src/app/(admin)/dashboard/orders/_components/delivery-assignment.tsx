"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  assignDelivery,
  fetchCities,
  fetchZones,
  fetchAreas,
} from "@/actions/delivery-actions";
import { toast } from "react-hot-toast";
import {
  Truck,
  Package,
  ExternalLink,
  CheckCircle2,
  User,
  AlertTriangle,
  MapPin,
  Info,
  Loader2,
  Printer,
} from "lucide-react";
import { calculateShipping } from "@/actions/delivery-actions";
import { updateOrderShippingCost } from "@/actions/order-actions";

interface Rider {
  id: string;
  name: string | null;
}

interface DeliveryAssignmentProps {
  order: any;
  riders: Rider[];
}

export default function DeliveryAssignment({
  order,
  riders,
}: DeliveryAssignmentProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRider, setSelectedRider] = useState(order.riderId || "");
  const modalRef = useRef<HTMLDialogElement>(null);

  // Safely parse shipping address to extract location details
  let shippingAddress: any = {};
  try {
    shippingAddress =
      typeof order.shippingAddress === "string"
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress || {};
  } catch (e) {}

  const initialCityId =
    order.pathaoCityId || shippingAddress.logistics?.pathaoCityId;
  const initialZoneId =
    order.pathaoZoneId || shippingAddress.logistics?.pathaoZoneId;
  const initialAreaId =
    order.pathaoAreaId || shippingAddress.logistics?.pathaoAreaId;

  // Determine delivery mode based on the presence of Pathao IDs or the saved courier
  const isPathaoDelivery = !!initialCityId || order.courier === "Pathao";

  // --- Pathao Location States ---
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  const [selectedCity, setSelectedCity] = useState<number | "">(
    initialCityId || "",
  );
  const [selectedZone, setSelectedZone] = useState<number | "">(
    initialZoneId || "",
  );
  const [selectedArea, setSelectedArea] = useState<number | "">(
    initialAreaId || "",
  );

  // --- New States for Real-Time Recalculation ---
  const [weight, setWeight] = useState<number | "">("");
  const [debouncedWeight, setDebouncedWeight] = useState<number | "">("");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [customCod, setCustomCod] = useState<number | "">("");

  // ✅ FIX: Extract primitives to prevent infinite re-renders
  const paymentMethod = order.paymentMethod;
  const paymentStatus = order.paymentStatus;
  const totalAmount = order.totalAmount;

  // Initialize COD amount
  useEffect(() => {
    const initialCod =
      paymentMethod === "COD" && paymentStatus !== "PAID"
        ? Number(totalAmount)
        : 0;
    setCustomCod(initialCod);
  }, [paymentMethod, paymentStatus, totalAmount]);

  // Debounce Weight Input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedWeight(weight), 500);
    return () => clearTimeout(timer);
  }, [weight]);

  // ✅ FIX: Create a stable string representation of items to avoid reference changes during Server Action cache refreshes
  const orderItemsString = JSON.stringify(
    order.items?.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
    })) || [],
  );

  // Real-Time Pathao Price Recalculation
  useEffect(() => {
    if (
      isPathaoDelivery &&
      selectedCity &&
      selectedZone &&
      !order.trackingCode
    ) {
      setIsCalculating(true);
      calculateShipping({
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        items: JSON.parse(orderItemsString),
        override_weight:
          debouncedWeight !== "" ? Number(debouncedWeight) : undefined,
      })
        .then((res) => {
          if (res.success) {
            setShippingCost(res.cost || 0);
            if (weight === "") {
              setWeight(res.breakdown?.weight || 1);
              setDebouncedWeight(res.breakdown?.weight || 1);
            }
          }
        })
        .finally(() => setIsCalculating(false));
    } else {
      setShippingCost(null);
    }
  }, [
    selectedCity,
    selectedZone,
    debouncedWeight,
    isPathaoDelivery,
    order.trackingCode,
    orderItemsString,
  ]);

  // Fetch Cities on Mount (if Pathao)
  useEffect(() => {
    if (isPathaoDelivery && !order.trackingCode) {
      fetchCities()
        .then((data) => setCities(data || []))
        .catch(console.error);
    }
  }, [isPathaoDelivery, order.trackingCode]);

  // Fetch Zones when City changes
  useEffect(() => {
    if (selectedCity) {
      fetchZones(Number(selectedCity))
        .then((data) => setZones(data || []))
        .catch(console.error);
    } else {
      setZones([]);
    }
  }, [selectedCity]);

  // Fetch Areas when Zone changes
  useEffect(() => {
    if (selectedZone) {
      fetchAreas(Number(selectedZone))
        .then((data) => setAreas(data || []))
        .catch(console.error);
    } else {
      setAreas([]);
    }
  }, [selectedZone]);

  const handleSyncShipping = () => {
    if (shippingCost === null) return;
    startTransition(async () => {
      const res = await updateOrderShippingCost(order.id, shippingCost);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Order total updated to match Pathao cost!");
      }
    });
  };

  const handleAssignRider = () => {
    if (!selectedRider) return toast.error("Please select a rider");

    startTransition(async () => {
      const res = await assignDelivery(order.id, {
        method: "RIDER",
        riderId: selectedRider,
      });

      if (res.success) {
        toast.success("Rider assigned successfully");
      } else {
        toast.error(res.error || "Failed to assign rider");
      }
    });
  };

  const handleOpenPathaoModal = () => {
    modalRef.current?.showModal();
  };

  const confirmPushToPathao = () => {
    startTransition(async () => {
      const res = await assignDelivery(order.id, {
        method: "PATHAO",
        recipient_name:
          shippingAddress.fullName || order.user?.name || "Customer",
        recipient_phone: shippingAddress.phone || order.phone || "",
        recipient_address: shippingAddress.street || "N/A",
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        recipient_area: Number(selectedArea),
        item_weight: weight !== "" ? Number(weight) : 1,
        amount_to_collect: customCod !== "" ? Number(customCod) : 0,
        item_description: `Order #${order.id.slice(-6).toUpperCase()}`,
      });

      if (res.success) {
        toast.success("Order pushed to Pathao successfully!");
        modalRef.current?.close();
      } else {
        toast.error(res.error || "Failed to dispatch to Pathao");
        modalRef.current?.close();
      }
    });
  };

  // Helper variables for modal & print display
  const selectedCityName =
    cities.find((c) => c.city_id === selectedCity)?.city_name || "N/A";
  const selectedZoneName =
    zones.find((z) => z.zone_id === selectedZone)?.zone_name || "N/A";
  const selectedAreaName =
    areas.find((a) => a.area_id === selectedArea)?.area_name || "N/A";
  const amountToCollect =
    paymentMethod === "COD" && paymentStatus !== "PAID"
      ? Number(totalAmount)
      : 0;

  // ✅ DYNAMIC JS POP-UP PRINT WINDOW
  const handlePrintLabel = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = 400; // Optimal width for thermal labels (4 inches)
    const h = 600; // Optimal height for thermal labels (6 inches)
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    // Open a blank popup window
    const printWindow = window.open(
      "",
      "PrintLabelPopup",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${w}, height=${h}, top=${top}, left=${left}`,
    );

    if (printWindow) {
      // Inject the pure HTML/CSS directly into the new window (No routing required!)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label - Order #${order.id.slice(-6).toUpperCase()}</title>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body { font-family: Arial, sans-serif; padding: 16px; margin: 0; color: #000; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
              .header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
              .header p { font-size: 12px; font-weight: bold; margin: 4px 0 0 0; }
              .cod-box { border: 4px solid #000; padding: 8px; margin-bottom: 12px; text-align: center; border-radius: 6px; }
              .cod-box p { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0; }
              .cod-box h2 { font-size: 32px; font-weight: 900; margin: 0; }
              .customer { margin-bottom: 16px; }
              .customer .label { font-size: 10px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; display: inline-block; margin-bottom: 4px; }
              .customer h3 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 4px 0; }
              .customer p { margin: 4px 0; font-size: 14px; font-weight: bold; line-height: 1.2; }
              .info-grid { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin-bottom: 12px; display: flex; font-size: 12px; justify-content: space-between; }
              .info-col p { margin: 2px 0; }
              .info-label { font-weight: bold; opacity: 0.7; }
              .items { font-size: 12px; font-weight: bold; }
              .items .label { font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
              .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 4px; }
              .footer { margin-top: 16px; padding-top: 8px; text-align: center; font-size: 10px; font-weight: bold; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Nepal E-com</h1>
              <p>Contact Support</p>
            </div>
            <div class="cod-box">
              <p>Cash to Collect</p>
              <h2>${amountToCollect > 0 ? `Rs. ${amountToCollect.toLocaleString()}` : "PRE-PAID"}</h2>
            </div>
            <div class="customer">
              <span class="label">Deliver To:</span>
              <h3>${shippingAddress.fullName || order.user?.name || "Customer"}</h3>
              <p>📞 ${shippingAddress.phone || order.phone || "N/A"}</p>
              <p>${shippingAddress.street || "N/A"} ${shippingAddress.ward ? `, Ward ${shippingAddress.ward}` : ""}<br/>
              ${selectedCityName !== "N/A" ? selectedCityName : shippingAddress.city || "N/A"}, ${selectedZoneName !== "N/A" ? selectedZoneName : shippingAddress.district || "N/A"}<br/>
              ${shippingAddress.province || "N/A"} ${shippingAddress.postalCode ? `- ${shippingAddress.postalCode}` : ""}</p>
            </div>
            <div class="info-grid">
              <div class="info-col">
                <p class="info-label">Order ID:</p>
                <p style="font-family: monospace; font-weight: bold;">#${order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div class="info-col" style="text-align: right;">
                <p class="info-label">Delivery Partner:</p>
                <p style="font-weight: bold;">${order.courier || order.rider?.name || "Store Courier"}</p>
              </div>
            </div>
            ${
              order.trackingCode
                ? `
            <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; font-size: 12px;">
              <p class="info-label" style="margin:0 0 2px 0;">Tracking / Consignment ID:</p>
              <p style="font-family: monospace; font-size: 16px; font-weight: 900; margin:0; letter-spacing: 2px;">${order.trackingCode}</p>
            </div>`
                : ""
            }
            <div class="items">
              <div class="label">Package Contents (${order.items?.length || 0})</div>
              ${
                order.items
                  ?.map(
                    (item: any) => `
                <div class="item-row">
                  <span style="padding-right: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name || item.product?.name || "Item"}</span>
                  <span style="flex-shrink: 0;">x${item.quantity}</span>
                </div>
              `,
                  )
                  .join("") || ""
              }
            </div>
            <div class="footer">
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p style="margin-top:4px;">Thank you for shopping with us!</p>
            </div>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 20px; font-weight: bold; cursor: pointer;">Print Label Again</button>
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6">
        <h2 className="card-title text-lg flex items-center gap-2 mb-4 border-b pb-3 border-base-200">
          <Truck size={20} className="text-primary" />
          Logistics & Assignment
        </h2>

        {/* --- SCENARIO 1: INTERNAL STORE DELIVERY --- */}
        {!isPathaoDelivery && (
          <div className="space-y-4">
            <div className="alert alert-info bg-info/10 text-info-content text-sm rounded-xl p-3 border-none">
              This order is set for internal Store Delivery.
            </div>

            <div className="form-control">
              <label className="label font-bold text-sm">Assign Rider</label>
              <div className="flex gap-2">
                <select
                  className="select select-bordered flex-1"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  disabled={isPending || order.status === "CANCELLED"}
                >
                  <option value="">Select a rider...</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignRider}
                  disabled={
                    isPending || !selectedRider || order.status === "CANCELLED"
                  }
                  className="btn btn-primary"
                >
                  {isPending ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Assign"
                  )}
                </button>
              </div>
            </div>

            {/* Displays current rider & Print Button if one is already linked in the database */}
            {order.rider && (
              <div className="mt-4 p-4 bg-base-200 rounded-xl space-y-3 border border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs opacity-60 font-bold uppercase">
                      Current Rider
                    </p>
                    <p className="font-bold">{order.rider.name}</p>
                  </div>
                </div>
                {/* ✅ Added Pop-up Print Label Button for Internal Riders */}
                <button
                  onClick={handlePrintLabel}
                  className="btn btn-neutral btn-block btn-sm text-white"
                >
                  <Printer size={14} /> Print Shipping Label
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- SCENARIO 2: PATHAO DELIVERY --- */}
        {isPathaoDelivery && (
          <div className="space-y-4">
            {order.trackingCode ? (
              // PATHAO: ALREADY DISPATCHED
              <div className="p-5 bg-success/10 border border-success/20 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-success font-bold">
                  <CheckCircle2 size={24} />
                  <span>Dispatched via Pathao</span>
                </div>

                <div className="bg-base-100 p-3 rounded-lg border border-base-200">
                  <p className="text-xs opacity-60 mb-1">Consignment ID</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-lg">
                      {order.trackingCode}
                    </p>
                    <button
                      className="btn btn-xs btn-outline gap-1"
                      onClick={() =>
                        navigator.clipboard.writeText(order.trackingCode!)
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* ✅ Split into Track and Pop-up Print Label Buttons */}
                <div className="flex gap-2">
                  <a
                    href={`https://parcel.pathao.com/public-tracking?consignment_id=${order.trackingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success flex-1 text-white shadow-lg"
                  >
                    <ExternalLink size={16} /> Track
                  </a>
                  <button
                    onClick={handlePrintLabel}
                    className="btn btn-neutral flex-1 text-white shadow-lg"
                  >
                    <Printer size={16} /> Print Label
                  </button>
                </div>
              </div>
            ) : (
              // PATHAO: PENDING DISPATCH
              <div className="space-y-4">
                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                  <h3 className="text-xs font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Confirm Routing Details
                  </h3>

                  <div className="space-y-3">
                    <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                      <p className="text-[10px] opacity-60 font-bold uppercase">
                        Written Address
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {shippingAddress.street}, {shippingAddress.city},{" "}
                        {shippingAddress.district}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">
                          City
                        </label>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={selectedCity}
                          onChange={(e) => {
                            setSelectedCity(Number(e.target.value));
                            setSelectedZone("");
                            setSelectedArea("");
                          }}
                        >
                          <option value="">Select City</option>
                          {cities.map((c) => (
                            <option key={c.city_id} value={c.city_id}>
                              {c.city_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">
                          Zone
                        </label>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={selectedZone}
                          onChange={(e) => {
                            setSelectedZone(Number(e.target.value));
                            setSelectedArea("");
                          }}
                          disabled={!selectedCity}
                        >
                          <option value="">Select Zone</option>
                          {zones.map((z) => (
                            <option key={z.zone_id} value={z.zone_id}>
                              {z.zone_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">
                          Area
                        </label>
                        <select
                          className="select select-bordered select-sm w-full"
                          value={selectedArea}
                          onChange={(e) =>
                            setSelectedArea(Number(e.target.value))
                          }
                          disabled={!selectedZone}
                        >
                          <option value="">Select Area</option>
                          {areas.map((a) => (
                            <option key={a.area_id} value={a.area_id}>
                              {a.area_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="input input-sm input-bordered w-full"
                          value={weight}
                          onChange={(e) =>
                            setWeight(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                        />
                      </div>
                    </div>

                    {shippingCost !== null && (
                      <div className="flex justify-between items-center text-sm p-3 bg-base-100 rounded-lg border border-base-300 mt-3">
                        <div className="flex flex-col">
                          <span className="opacity-60 font-bold uppercase text-[10px]">
                            Pathao Delivery Fee
                          </span>
                          {shippingCost !== Number(order.shippingCost) ? (
                            <button
                              type="button"
                              onClick={handleSyncShipping}
                              disabled={isPending}
                              className="text-[10px] text-primary font-bold hover:underline text-left mt-0.5 transition-colors"
                            >
                              {isPending
                                ? "Syncing..."
                                : "Sync with Order Total"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-success font-bold mt-0.5 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Synced
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-primary flex items-center gap-2">
                          {isCalculating && (
                            <Loader2 size={12} className="animate-spin" />
                          )}
                          Rs. {shippingCost}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(!selectedCity || !selectedZone || !selectedArea) && (
                  <div className="alert alert-warning bg-warning/10 text-warning-content text-xs rounded-xl p-3 border-warning/20 flex gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>
                      Please ensure City, Zone, and Area are all selected before
                      dispatching.
                    </span>
                  </div>
                )}

                <button
                  onClick={handleOpenPathaoModal}
                  disabled={
                    isPending ||
                    !selectedCity ||
                    !selectedZone ||
                    !selectedArea ||
                    order.status === "CANCELLED"
                  }
                  className="btn btn-error btn-block text-white shadow-lg h-12"
                >
                  {isPending ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    <>
                      <Package size={18} /> Push to Pathao
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ✅ CONFIRMATION MODAL */}
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Truck size={24} className="text-error" /> Confirm Dispatch
            </h3>

            <div className="alert alert-info bg-info/10 text-info-content text-xs rounded-xl p-3 border-none mb-6">
              <Info size={16} className="shrink-0" />
              <span>
                Please review the delivery details carefully. This will
                immediately create a consignment in Pathao's system.
              </span>
            </div>

            <div className="space-y-3 text-sm bg-base-200/50 p-5 rounded-2xl border border-base-200">
              <div className="flex justify-between items-start border-b border-base-300 pb-3">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">
                  Recipient
                </span>
                <div className="text-right">
                  <p className="font-bold">
                    {shippingAddress.fullName || order.user?.name || "Customer"}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {shippingAddress.phone || order.phone || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-base-300 pb-3 pt-1">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">
                  Address
                </span>
                <span className="font-bold text-right max-w-[200px] leading-tight">
                  {shippingAddress.street || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-start border-b border-base-300 pb-3 pt-1">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">
                  Routing
                </span>
                <span className="font-bold text-right max-w-[220px] leading-tight text-primary">
                  {selectedCityName}, {selectedZoneName}, {selectedAreaName}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-base-300 pb-3 pt-1">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider">
                  Weight
                </span>
                <span className="font-bold">{weight || 1} kg</span>
              </div>
              <div className="flex justify-between items-center border-b border-base-300 pb-3 pt-1">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                  Pathao Delivery Cost
                </span>
                <span className="font-bold text-error">
                  Rs. {shippingCost ?? "---"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider">
                  Cash to Collect
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold opacity-50">Rs.</span>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-24 text-right font-black text-error focus:ring-error"
                    value={customCod}
                    onChange={(e) =>
                      setCustomCod(e.target.value ? Number(e.target.value) : "")
                    }
                  />
                </div>
              </div>
              {customCod === 0 && (
                <p className="text-[10px] text-success text-right uppercase font-bold tracking-widest mt-1">
                  Pre-Paid / Nothing to collect
                </p>
              )}
            </div>

            <div className="modal-action mt-6">
              <form method="dialog">
                <button className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
              </form>
              <button
                className="btn btn-error text-white px-8"
                onClick={confirmPushToPathao}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Confirm & Send"
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button disabled={isPending}>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
}
