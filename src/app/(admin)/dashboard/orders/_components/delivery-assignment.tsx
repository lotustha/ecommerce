"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  Truck,
  Check,
  PackageCheck,
  Loader2,
  RefreshCw,
  Calculator,
  ExternalLink,
  MapPin,
  X,
  AlertTriangle,
  AlertCircle,
  Printer,
  Lock,
} from "lucide-react";
import {
  assignDelivery,
  fetchCities,
  fetchZones,
  fetchAreas,
  calculateShipping,
  refreshTrackingStatus,
} from "@/actions/delivery-actions";
import { updateOrderStatus } from "@/actions/order-actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface DeliveryAssignmentProps {
  orderId: string;
  currentStatus: string;
  riders: { id: string; name: string | null }[];
  shippingInfo: any;
  existingTracking?: string | null;
  existingCourier?: string | null;
  existingRiderId?: string | null;
  partners: string[];
  codAmount: number;
  senderInfo: { name: string; address: string; phone: string };
  paymentStatus: string; // ✅ Added
  paymentMethod: string; // ✅ Added
}

export default function DeliveryAssignment({
  orderId,
  currentStatus,
  riders,
  shippingInfo,
  existingTracking,
  existingCourier,
  existingRiderId,
  partners,
  codAmount,
  senderInfo,
  paymentStatus,
  paymentMethod,
}: DeliveryAssignmentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"PATHAO" | "RIDER" | "OTHER">("PATHAO");

  // Pathao Form States
  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [weight, setWeight] = useState("0.5");
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Manual/Rider States
  const [selectedRider, setSelectedRider] = useState(riders[0]?.id || "");
  const [courierName, setCourierName] = useState("");
  const [manualTracking, setManualTracking] = useState("");
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  const modalRef = useRef<HTMLDialogElement>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const isCancelled =
    currentStatus === "CANCELLED" || currentStatus === "RETURNED";
  const isAssigned =
    currentStatus === "SHIPPED" ||
    currentStatus === "DELIVERED" ||
    currentStatus === "READY_TO_SHIP";

  // ✅ Payment Validation Rule
  const isPaymentClear = paymentMethod === "COD" || paymentStatus === "PAID";

  const canAssign = !isCancelled && !isAssigned && isPaymentClear;

  useEffect(() => {
    if (isAssigned && existingCourier === "Pathao" && existingTracking) {
      handleRefreshStatus(true);
    }
  }, []);

  // --- LOCATION LOADERS ---
  useEffect(() => {
    if (mode === "PATHAO" && canAssign) {
      fetchCities()
        .then((data) => {
          setCities(data);
          if (shippingInfo && data.length > 0) {
            const userCity = shippingInfo.city?.trim().toLowerCase() || "";
            const userDistrict =
              shippingInfo.district?.trim().toLowerCase() || "";
            let matchId = "";
            if (
              ["kathmandu", "lalitpur", "bhaktapur"].includes(userDistrict) ||
              ["kathmandu", "lalitpur", "bhaktapur"].includes(userCity)
            ) {
              const ktm = data.find(
                (c: any) => c.city_name === "Kathmandu Valley",
              );
              if (ktm) matchId = ktm.city_id;
            }
            if (!matchId) {
              const direct = data.find(
                (c: any) =>
                  c.city_name.toLowerCase() === userCity ||
                  c.city_name.toLowerCase() === userDistrict,
              );
              if (direct) matchId = direct.city_id;
            }
            if (!matchId) {
              const partial = data.find(
                (c: any) =>
                  c.city_name.toLowerCase().includes(userCity) ||
                  c.city_name.toLowerCase().includes(userDistrict),
              );
              if (partial) matchId = partial.city_id;
            }
            if (matchId) setSelectedCity(String(matchId));
          }
        })
        .catch(console.error);
    }
  }, [mode, shippingInfo, canAssign]);

  useEffect(() => {
    if (selectedCity && canAssign) {
      setZones([]);
      setAreas([]);
      setSelectedZone("");
      fetchZones(Number(selectedCity))
        .then((data) => {
          setZones(data);
          if (shippingInfo && data.length > 0) {
            const addressString =
              `${shippingInfo.street} ${shippingInfo.city} ${shippingInfo.district}`.toLowerCase();
            const match = data.find((z: any) =>
              addressString.includes(z.zone_name.toLowerCase()),
            );
            if (match) setSelectedZone(String(match.zone_id));
          }
        })
        .catch(console.error);
    }
  }, [selectedCity, canAssign, shippingInfo]);

  useEffect(() => {
    if (selectedZone && canAssign) {
      setAreas([]);
      setSelectedArea("");
      fetchAreas(Number(selectedZone))
        .then((data) => {
          setAreas(data);
          if (shippingInfo && data.length > 0) {
            const addressString =
              `${shippingInfo.street} ${shippingInfo.city}`.toLowerCase();
            const match = data.find((a: any) =>
              addressString.includes(a.area_name.toLowerCase()),
            );
            if (match) setSelectedArea(String(match.area_id));
          }
        })
        .catch(console.error);
    }
  }, [selectedZone, canAssign, shippingInfo]);

  // Auto Calculate Price
  useEffect(() => {
    if (
      mode === "PATHAO" &&
      selectedCity &&
      selectedZone &&
      weight &&
      canAssign
    ) {
      const timer = setTimeout(async () => {
        setIsCalculating(true);
        try {
          const res = await calculateShipping({
            recipient_city: Number(selectedCity),
            recipient_zone: Number(selectedZone),
            item_weight: Number(weight),
          });
          if (res && res.final_price)
            setEstimatedCost(`Rs. ${res.final_price}`);
          else setEstimatedCost(null);
        } catch (error) {
          setEstimatedCost(null);
        } finally {
          setIsCalculating(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setEstimatedCost(null);
    }
  }, [selectedCity, selectedZone, weight, mode, canAssign]);

  // --- PRINT LABEL HANDLER ---
  const handlePrintLabel = () => {
    const labelWindow = window.open("", "_blank", "width=400,height=600");
    if (labelWindow) {
      const codText =
        codAmount > 0 ? `Rs. ${codAmount.toLocaleString()}` : "PREPAID";

      labelWindow.document.write(`
        <html>
          <head>
            <title>Shipping Label - ${existingTracking}</title>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; text-align: left; }
              .box { border: 2px solid #000; padding: 15px; margin-bottom: 20px; max-width: 380px; margin: 0 auto; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;}
              .courier { font-weight: 900; font-size: 24px; text-transform: uppercase; }
              .tracking { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px; border: 1px solid #ccc; padding: 5px; background: #f9f9f9; }
              
              .section { margin-bottom: 15px; }
              .label { font-size: 10px; text-transform: uppercase; color: #555; font-weight: bold; }
              .value { font-size: 14px; line-height: 1.4; }
              .bold { font-weight: bold; }
              
              .cod-box { border: 2px dashed #000; padding: 10px; text-align: center; margin-top: 20px; }
              .cod-title { font-size: 12px; text-transform: uppercase; }
              .cod-amount { font-size: 24px; font-weight: 900; }
              
              .meta { margin-top: 10px; font-size: 10px; text-align: center; opacity: 0.6; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="header">
                 <div class="courier">${existingCourier || "DELIVERY"}</div>
                 <div style="font-size: 12px; font-weight: bold;">${new Date().toLocaleDateString()}</div>
              </div>
              <div class="tracking">${existingTracking || "N/A"}</div>
              <div class="section" style="border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <div class="label">FROM (SENDER)</div>
                <div class="value bold">${senderInfo.name}</div>
                <div class="value">${senderInfo.address}</div>
                <div class="value">Ph: ${senderInfo.phone}</div>
              </div>
              <div class="section">
                <div class="label">TO (RECEIVER)</div>
                <div class="value bold">${shippingInfo.fullName}</div>
                <div class="value">${shippingInfo.street}, ${shippingInfo.ward ? `Ward ${shippingInfo.ward}` : ""}</div>
                <div class="value">${shippingInfo.city}, ${shippingInfo.district}</div>
                <div class="value">Ph: <strong>${shippingInfo.phone}</strong></div>
              </div>
              <div class="cod-box">
                <div class="cod-title">Cash To Collect</div>
                <div class="cod-amount">${codText}</div>
              </div>
              <div class="meta">Order ID: #${orderId.slice(-6).toUpperCase()}</div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      labelWindow.document.close();
    }
  };

  const handlePreAssign = () => {
    let data: any = { method: mode };
    if (mode === "PATHAO") {
      if (!selectedCity || !selectedZone || !selectedArea) {
        return toast.error("Please fill all location fields");
      }
      const cityName = cities.find(
        (c) => String(c.city_id) === selectedCity,
      )?.city_name;
      const zoneName = zones.find(
        (z) => String(z.zone_id) === selectedZone,
      )?.zone_name;
      const areaName = areas.find(
        (a) => String(a.area_id) === selectedArea,
      )?.area_name;

      const fullAddressStr = `${shippingInfo.street}${shippingInfo.ward ? `, Ward ${shippingInfo.ward}` : ""}, ${shippingInfo.city}`;
      const remarks = `Order #${orderId.slice(-6).toUpperCase()} | Addr: ${fullAddressStr} | Ph: ${shippingInfo.phone}`;

      data = {
        ...data,
        recipient_name: shippingInfo.fullName,
        recipient_phone: shippingInfo.phone,
        recipient_address: shippingInfo.street,
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        recipient_area: Number(selectedArea),
        item_weight: Number(weight),
        item_description: remarks,
        display_location: `${areaName}, ${zoneName}, ${cityName}`,
        display_cost: estimatedCost || "Not calculated",
        display_remarks: remarks,
      };
    } else if (mode === "RIDER") {
      const riderName = riders.find((r) => r.id === selectedRider)?.name;
      data = { ...data, riderId: selectedRider, riderName };
    } else {
      data = { ...data, courierName: courierName, trackingId: manualTracking };
    }
    setPendingPayload(data);
    modalRef.current?.showModal();
  };

  const confirmAssign = () => {
    if (!pendingPayload) return;
    startTransition(async () => {
      const res = await assignDelivery(orderId, pendingPayload);
      modalRef.current?.close();
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.success ?? "Delivery assigned successfully");
        router.refresh();
      }
    });
  };

  const handleRefreshStatus = async (silent = false) => {
    if (!existingTracking) return;
    if (!silent) setIsAutoRefreshing(true);
    const toastId = !silent ? toast.loading("Syncing with Pathao...") : null;
    const res = await refreshTrackingStatus(orderId, existingTracking);
    if (toastId) toast.dismiss(toastId);
    if (!silent) setIsAutoRefreshing(false);
    if (res.success && res.status) {
      const pStatus = (res.status as string).toLowerCase();
      setLiveStatus(res.status as string);
      let newSystemStatus: string | null = null;
      if (pStatus === "delivered") newSystemStatus = "DELIVERED";
      else if (pStatus === "cancelled") newSystemStatus = "CANCELLED";
      else if (pStatus === "return") newSystemStatus = "RETURNED";
      else if (
        pStatus === "picked" ||
        pStatus === "in transit" ||
        pStatus === "on process"
      )
        newSystemStatus = "SHIPPED";
      else if (pStatus === "pending" || pStatus === "accepted")
        newSystemStatus = "READY_TO_SHIP";

      if (newSystemStatus && newSystemStatus !== currentStatus) {
        // @ts-ignore
        const updateRes = await updateOrderStatus(
          orderId,
          newSystemStatus as any,
        );
        if (!updateRes.error) {
          if (!silent) toast.success(`Order status synced: ${newSystemStatus}`);
          router.refresh();
        }
      } else if (!silent) {
        toast.success("Status is up to date");
      }
    } else {
      if (!silent) toast.error("Failed to fetch tracking info");
    }
  };

  return (
    <div
      className={`card bg-base-100 border border-base-200 shadow-sm overflow-hidden ${isCancelled ? "opacity-60 grayscale" : ""}`}
    >
      <div className="p-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Truck size={18} className="text-primary" />
          Logistics
        </h3>
        {isAssigned && (
          <span className="badge badge-success text-white gap-1">
            <Check size={12} /> Active
          </span>
        )}
        {isCancelled && (
          <span className="badge badge-error text-white gap-1">
            <X size={12} /> Cancelled
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* CASE 1: CANCELLED */}
        {isCancelled ? (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
            <AlertCircle className="text-error opacity-50" size={32} />
            <p className="text-sm font-bold text-error">
              Delivery Not Applicable
            </p>
            <p className="text-xs text-base-content/60">
              This order has been cancelled or returned.
            </p>
          </div>
        ) : /* CASE 2: PAYMENT NOT CLEAR (NEW) */
        !isPaymentClear ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-warning/5 border border-warning/20 rounded-xl">
            <div className="w-12 h-12 bg-warning/20 text-warning rounded-full flex items-center justify-center">
              <Lock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-base-content">
                Payment Pending
              </p>
              <p className="text-xs text-base-content/60 px-4">
                This order is <strong>{paymentMethod}</strong> but payment
                status is <strong>{paymentStatus}</strong>.
                <br />
                Please verify payment before assigning logistics.
              </p>
            </div>
          </div>
        ) : /* CASE 3: ALREADY ASSIGNED */
        isAssigned ? (
          <div className="space-y-4">
            {existingRiderId ? (
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Rider:</span>
                <span className="font-bold">
                  {riders.find((r) => r.id === existingRiderId)?.name ||
                    "Unknown Rider"}
                </span>
              </div>
            ) : (
              <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">
                    {existingCourier || "External"}
                  </span>
                  {existingCourier === "Pathao" && (
                    <button
                      onClick={() => handleRefreshStatus(false)}
                      disabled={isAutoRefreshing}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      {isAutoRefreshing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}{" "}
                      Sync
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center bg-base-100 p-2 rounded-lg border border-base-200">
                  <span className="font-mono text-xs font-bold">
                    {existingTracking}
                  </span>
                  {liveStatus ? (
                    <span className="badge badge-sm badge-info gap-1">
                      {liveStatus}
                    </span>
                  ) : (
                    <span className="text-xs opacity-50 flex items-center gap-1">
                      {isAutoRefreshing && (
                        <Loader2 size={10} className="animate-spin" />
                      )}
                      {isAutoRefreshing ? "Syncing..." : "Checking..."}
                    </span>
                  )}
                </div>
                <button
                  onClick={handlePrintLabel}
                  className="btn btn-sm btn-outline btn-block mt-3 gap-2 border-dashed"
                >
                  <Printer size={16} /> Print Shipping Label
                </button>
                {existingCourier === "Pathao" && existingTracking && (
                  <div className="mt-3 text-xs text-center opacity-60">
                    <a
                      href={`https://parcel.pathao.com/public-tracking?consignment_id=${existingTracking}`}
                      target="_blank"
                      className="link hover:text-primary flex items-center justify-center gap-1"
                    >
                      Track on Partner Site <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* CASE 4: ASSIGN NEW (EDIT MODE) */
          <>
            <div role="tablist" className="tabs tabs-boxed tabs-sm mb-4">
              <a
                role="tab"
                className={`tab ${mode === "PATHAO" ? "tab-active" : ""}`}
                onClick={() => setMode("PATHAO")}
              >
                Pathao
              </a>
              <a
                role="tab"
                className={`tab ${mode === "RIDER" ? "tab-active" : ""}`}
                onClick={() => setMode("RIDER")}
              >
                Rider
              </a>
              <a
                role="tab"
                className={`tab ${mode === "OTHER" ? "tab-active" : ""}`}
                onClick={() => setMode("OTHER")}
              >
                Other
              </a>
            </div>

            {mode === "PATHAO" && (
              <div className="space-y-3">
                <div className="bg-warning/5 border border-warning/10 p-3 rounded-lg text-xs mb-2">
                  <p className="font-bold opacity-60 flex items-center gap-1 mb-1">
                    <MapPin size={10} /> Customer Location
                  </p>
                  <p className="font-medium">
                    {shippingInfo.city}, {shippingInfo.district}
                  </p>
                  <p className="opacity-60">{shippingInfo.province}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text-alt opacity-60">City</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full"
                      onChange={(e) => setSelectedCity(e.target.value)}
                      value={selectedCity}
                    >
                      <option value="">Select...</option>
                      {cities.map((c: any) => (
                        <option key={c.city_id} value={c.city_id}>
                          {c.city_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label py-0">
                      <span className="label-text-alt opacity-60">Zone</span>
                    </label>
                    <select
                      className="select select-bordered select-sm w-full"
                      onChange={(e) => setSelectedZone(e.target.value)}
                      value={selectedZone}
                      disabled={!selectedCity}
                    >
                      <option value="">Select...</option>
                      {zones.map((z: any) => (
                        <option key={z.zone_id} value={z.zone_id}>
                          {z.zone_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text-alt opacity-60">Area</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    onChange={(e) => setSelectedArea(e.target.value)}
                    value={selectedArea}
                    disabled={!selectedZone}
                  >
                    <option value="">Select Area...</option>
                    {areas.map((a: any) => (
                      <option key={a.area_id} value={a.area_id}>
                        {a.area_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label py-0">
                    <span className="label-text-alt opacity-60">
                      Weight (KG)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-full"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    step="0.5"
                  />
                </div>
                {(estimatedCost || isCalculating) && (
                  <div className="alert alert-info py-2 text-sm flex justify-between items-center transition-all">
                    <span className="flex items-center gap-2">
                      <Calculator size={14} /> Estimated Cost:
                    </span>
                    <span className="font-bold">
                      {isCalculating ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        estimatedCost
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {mode === "RIDER" && (
              <div className="form-control w-full">
                <select
                  className="select select-bordered select-sm rounded-lg"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === "OTHER" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Courier Name"
                  className="input input-bordered input-sm w-full"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Tracking ID"
                  className="input input-bordered input-sm w-full"
                  value={manualTracking}
                  onChange={(e) => setManualTracking(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={handlePreAssign}
              disabled={isPending || currentStatus === "CANCELLED"}
              className="btn btn-primary btn-sm btn-block rounded-lg gap-2 mt-4"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <PackageCheck size={16} />
              )}
              {mode === "PATHAO"
                ? "Create Pathao Request"
                : "Confirm Assignment"}
            </button>
          </>
        )}
      </div>

      {/* CONFIRMATION MODAL - Same as before */}
      <dialog
        ref={modalRef}
        className="modal modal-bottom sm:modal-middle text-left"
      >
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              X
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="text-warning" size={20} /> Confirm
            Delivery Request
          </h3>
          {pendingPayload && (
            <div className="space-y-3 text-sm">
              <div className="bg-base-200 p-4 rounded-xl space-y-3">
                <div className="flex justify-between border-b border-base-content/10 pb-2">
                  <span className="opacity-60">Provider</span>
                  <span className="font-bold">{mode}</span>
                </div>
                {mode === "PATHAO" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60 flex gap-1">Name</span>
                      <span className="font-bold">
                        {pendingPayload.recipient_name}
                      </span>
                    </div>
                    <div className="border-t border-base-content/10 pt-2">
                      <span className="opacity-60 block mb-1 text-xs uppercase font-bold">
                        Delivery Location
                      </span>
                      <p className="font-medium leading-tight">
                        {pendingPayload.display_location}
                      </p>
                    </div>
                    <div className="flex justify-between font-bold text-primary pt-2 border-t border-base-content/10 mt-2">
                      <span>Est. Cost</span>
                      <span>{pendingPayload.display_cost}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            <button
              onClick={confirmAssign}
              disabled={isPending}
              className="btn btn-primary"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Confirm & Send"
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
