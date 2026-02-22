"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { assignDelivery, fetchCities, fetchZones, fetchAreas } from "@/actions/delivery-actions";
import { cancelDeliveryAssignment } from "@/actions/delivery-cancellation";
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
  Store,
  Globe,
  ChevronDown,
  Search,
  RefreshCcw
} from "lucide-react";
import { calculateShipping } from "@/actions/delivery-actions";
import { updateOrderShippingCost } from "@/actions/order-actions";
import { getPublicSettings } from "@/actions/public-settings";

interface Rider {
  id: string;
  name: string | null;
}

interface DeliveryAssignmentProps {
  order: any;
  riders: Rider[];
}

const LOGISTICS_PARTNERS = [
  {
    id: "STORE",
    name: "Internal Delivery",
    icon: Store,
    desc: "Assign to a local staff rider for manual fulfillment."
  },
  {
    id: "PATHAO",
    name: "Pathao Logistics",
    icon: Globe,
    desc: "Automated 3rd-party dispatch and tracking."
  },
];

export default function DeliveryAssignment({
  order,
  riders,
}: DeliveryAssignmentProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRider, setSelectedRider] = useState(order.riderId || "");
  const modalRef = useRef<HTMLDialogElement>(null);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Safely parse shipping address to extract location details
  let shippingAddress: any = {};
  try {
    shippingAddress =
      typeof order.shippingAddress === "string"
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress || {};
  } catch (e) { }

  const initialCityId = order.pathaoCityId || shippingAddress.logistics?.pathaoCityId;
  const initialZoneId = order.pathaoZoneId || shippingAddress.logistics?.pathaoZoneId;
  const initialAreaId = order.pathaoAreaId || shippingAddress.logistics?.pathaoAreaId;

  const savedCourierId = order.courier?.toUpperCase();
  const isPathaoDelivery = !!initialCityId || savedCourierId === "PATHAO";

  const [deliveryMode, setDeliveryMode] = useState<string>(isPathaoDelivery ? "PATHAO" : "STORE");

  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState("");
  const partnerDropdownRef = useRef<HTMLDivElement>(null);

  const [internalShippingCost, setInternalShippingCost] = useState<number | "">(Number(order.shippingCost) || 0);

  const [cities, setCities] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  const [selectedCity, setSelectedCity] = useState<number | "">(initialCityId || "");
  const [selectedZone, setSelectedZone] = useState<number | "">(initialZoneId || "");
  const [selectedArea, setSelectedArea] = useState<number | "">(initialAreaId || "");

  const [weight, setWeight] = useState<number | "">("");
  const [debouncedWeight, setDebouncedWeight] = useState<number | "">("");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  const paymentMethod = order.paymentMethod;
  const paymentStatus = order.paymentStatus;
  const totalAmount = order.totalAmount;

  // Calculate the fixed COD amount
  const defaultCodAmount = (paymentMethod === "COD" && paymentStatus !== "PAID") ? Number(totalAmount) : 0;

  // Check if order is already processed
  const isAssigned = !!order.trackingCode || !!order.riderId;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(event.target as Node)) {
        setPartnerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    getPublicSettings().then(setSettings);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedWeight(weight), 500);
    return () => clearTimeout(timer);
  }, [weight]);

  const orderItemsString = JSON.stringify(order.items?.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) || []);

  useEffect(() => {
    if (!isAssigned && deliveryMode === "PATHAO" && selectedCity && selectedZone && !order.trackingCode) {
      setIsCalculating(true);
      calculateShipping({
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        items: JSON.parse(orderItemsString),
        override_weight: debouncedWeight !== "" ? Number(debouncedWeight) : undefined
      }).then((res) => {
        if (res.success) {
          setShippingCost(res.cost || 0);
          if (weight === "") {
            setWeight(res.breakdown?.weight || 1);
            setDebouncedWeight(res.breakdown?.weight || 1);
          }
        }
      }).finally(() => setIsCalculating(false));
    } else {
      setShippingCost(null);
    }
  }, [selectedCity, selectedZone, debouncedWeight, deliveryMode, order.trackingCode, orderItemsString, isAssigned]);

  useEffect(() => {
    if (!isAssigned && deliveryMode === "PATHAO" && !order.trackingCode) {
      fetchCities().then(data => setCities(data || [])).catch(console.error);
    }
  }, [deliveryMode, order.trackingCode, isAssigned]);

  useEffect(() => {
    if (!isAssigned && selectedCity) {
      fetchZones(Number(selectedCity)).then(data => setZones(data || [])).catch(console.error);
    } else {
      setZones([]);
    }
  }, [selectedCity, isAssigned]);

  useEffect(() => {
    if (!isAssigned && selectedZone) {
      fetchAreas(Number(selectedZone)).then(data => setAreas(data || [])).catch(console.error);
    } else {
      setAreas([]);
    }
  }, [selectedZone, isAssigned]);

  const handleSyncShipping = () => {
    if (shippingCost === null) return;
    startTransition(async () => {
      const res = await updateOrderShippingCost(order.id, shippingCost);
      if (res.error) toast.error(res.error);
      else toast.success("Order total updated to match Pathao cost!");
    });
  };

  const handleSyncInternalShipping = () => {
    if (internalShippingCost === "" || internalShippingCost === null) return;
    startTransition(async () => {
      const res = await updateOrderShippingCost(order.id, Number(internalShippingCost));
      if (res.error) toast.error(res.error);
      else toast.success("Internal delivery fee synced to order!");
    });
  };

  const handleAssignRider = () => {
    if (!selectedRider) return toast.error("Please select a rider");
    startTransition(async () => {
      const res = await assignDelivery(order.id, {
        method: "RIDER",
        riderId: selectedRider,
      });
      if (res.success) toast.success("Rider assigned successfully");
      else toast.error(res.error || "Failed to assign rider");
    });
  };

  const handleOpenPathaoModal = () => {
    modalRef.current?.showModal();
  };

  const confirmPushToPathao = () => {
    startTransition(async () => {
      const res = await assignDelivery(order.id, {
        method: "PATHAO",
        recipient_name: shippingAddress.fullName || order.user?.name || "Customer",
        recipient_phone: shippingAddress.phone || order.phone || "",
        recipient_address: shippingAddress.street || "N/A",
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        recipient_area: Number(selectedArea),
        item_weight: weight !== "" ? Number(weight) : 1,
        amount_to_collect: Math.round(defaultCodAmount), // Fixed
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

  const handleCancelAssignment = () => {
    setIsCancelling(true);
    startTransition(async () => {
      const res = await cancelDeliveryAssignment(order.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success || "Assignment cancelled");
        setCancelModalOpen(false);
        setDeliveryMode("STORE");
        setSelectedRider("");
      }
      setIsCancelling(false);
    });
  };

  const selectedCityName = cities.find(c => c.city_id === selectedCity)?.city_name || "N/A";
  const selectedZoneName = zones.find(z => z.zone_id === selectedZone)?.zone_name || "N/A";
  const selectedAreaName = areas.find(a => a.area_id === selectedArea)?.area_name || "N/A";

  const activePartner = LOGISTICS_PARTNERS.find(p => p.id === deliveryMode);
  const ActiveIcon = activePartner?.icon;
  const filteredPartners = LOGISTICS_PARTNERS.filter(p =>
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    p.desc.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const handlePrintLabel = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = 400;
    const h = 600;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const printWindow = window.open('', 'PrintLabelPopup', `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${w}, height=${h}, top=${top}, left=${left}`);

    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label - Order #${order.id.slice(-6).toUpperCase()}</title>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body { font-family: Arial, sans-serif; padding: 12px; margin: 0; color: #000; box-sizing: border-box; }
              
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
              .header h1 { font-size: 20px; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
              .header p { font-size: 10px; margin: 4px 0 0 0; }
              .header .vat { font-size: 10px; margin: 2px 0 0 0; font-weight: bold; }
              
              .cod-box { border: 4px solid #000; padding: 6px; margin-bottom: 12px; text-align: center; border-radius: 6px; }
              .cod-box p { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 2px 0; }
              .cod-box h2 { font-size: 28px; font-weight: 900; margin: 0; }
              
              .addresses { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; gap: 8px; }
              .address-block { width: 48%; }
              .address-block .label { font-size: 9px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; margin-bottom: 4px; }
              .address-block h3 { font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 0 0 2px 0; line-height: 1.1; word-wrap: break-word; }
              .address-block p { margin: 0 0 2px 0; font-size: 11px; line-height: 1.2; word-wrap: break-word; }
              .address-block .phone { font-size: 11px; font-weight: bold; margin-top: 4px; }
              
              .info-grid { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; display: flex; font-size: 11px; justify-content: space-between; }
              .info-col p { margin: 2px 0; }
              .info-label { font-weight: bold; opacity: 0.7; }
              
              .items { font-size: 11px; font-weight: bold; }
              .items .label { font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
              .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 4px; }
              
              .footer { margin-top: 12px; text-align: center; font-size: 9px; font-weight: bold; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${settings?.storeName || 'Nepal E-com'}</h1>
              <p>${settings?.storeAddress || 'Online Store'} | 📞 ${settings?.storePhone || 'Contact Support'}</p>
              ${settings?.storeTaxId ? `<p class="vat">PAN/VAT: ${settings.storeTaxId}</p>` : ''}
            </div>
            
            <div class="cod-box">
              <p>Cash to Collect</p>
              <h2>${defaultCodAmount > 0 ? `Rs. ${defaultCodAmount.toLocaleString()}` : 'PRE-PAID'}</h2>
            </div>
            
            <div class="addresses">
              <div class="address-block">
                <span class="label">Sender / Return To:</span>
                <h3>${settings?.storeName || 'Store'}</h3>
                <p>${settings?.storeAddress || 'N/A'}</p>
                <p class="phone">📞 ${settings?.storePhone || 'N/A'}</p>
              </div>
              <div class="address-block" style="text-align: right;">
                <span class="label">Deliver To:</span>
                <h3>${shippingAddress.fullName || order.user?.name || "Customer"}</h3>
                <p>${shippingAddress.street || "N/A"}</p>
                <p>${selectedCityName !== 'N/A' ? selectedCityName : (shippingAddress.city || "N/A")}, ${selectedZoneName !== 'N/A' ? selectedZoneName : (shippingAddress.district || "N/A")}</p>
                <p>${shippingAddress.province || "N/A"} ${shippingAddress.postalCode ? `- ${shippingAddress.postalCode}` : ""}</p>
                <p class="phone">📞 ${shippingAddress.phone || order.phone || "N/A"}</p>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-col">
                <p class="info-label">Order ID:</p>
                <p style="font-family: monospace; font-weight: bold;">#${order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div class="info-col" style="text-align: right;">
                <p class="info-label">Delivery Partner:</p>
                <p style="font-weight: bold;">${order.courier || (order.rider?.name || "Store Courier")}</p>
              </div>
            </div>
            
            ${order.trackingCode ? `
            <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; font-size: 11px;">
              <p class="info-label" style="margin:0 0 2px 0;">Tracking ID:</p>
              <p style="font-family: monospace; font-size: 16px; font-weight: 900; margin:0; letter-spacing: 1px;">${order.trackingCode}</p>
            </div>` : ''}
            
            <div class="items">
              <div class="label">Package Contents (${order.items?.length || 0})</div>
              ${order.items?.map((item: any) => `
                <div class="item-row">
                  <span style="padding-right: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name || item.product?.name || 'Item'}</span>
                  <span style="flex-shrink: 0;">x${item.quantity}</span>
                </div>
              `).join('') || ''}
            </div>
            
            <div class="footer">
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p style="margin-top:2px;">Thank you for shopping with us!</p>
            </div>
            
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Print Label</button>
            </div>
            
            <script>window.onload = function() { setTimeout(() => { window.print(); }, 500); }</script>
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

        {/* ✅ RENDER 1: ACTIVE ASSIGNMENT STATE */}
        {isAssigned ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {order.trackingCode && (
              <div className="p-5 bg-success/10 border border-success/20 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-bl-full pointer-events-none"></div>

                <div className="flex items-center gap-3 text-success font-bold">
                  <CheckCircle2 size={24} />
                  <span>Dispatched via Pathao</span>
                </div>

                <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
                  <p className="text-xs opacity-60 mb-1 font-bold uppercase tracking-wider">Consignment ID</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-black text-xl text-base-content">{order.trackingCode}</p>
                    <button
                      className="btn btn-xs btn-outline gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(order.trackingCode!);
                        toast.success("Copied!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://parcel.pathao.com/public-tracking?consignment_id=${order.trackingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-success flex-1 text-white shadow-lg"
                  >
                    <ExternalLink size={16} /> Track Order
                  </a>
                  <button onClick={handlePrintLabel} className="btn btn-neutral flex-1 text-white shadow-lg">
                    <Printer size={16} /> Print Label
                  </button>
                </div>
              </div>
            )}

            {order.riderId && order.rider && (
              <div className="p-5 bg-base-100 rounded-2xl space-y-4 border-2 border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <User size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs opacity-60 font-bold uppercase tracking-widest truncate">Currently Assigned</p>
                    <p className="font-black text-lg truncate text-base-content">{order.rider.name}</p>
                  </div>
                </div>
                <button onClick={handlePrintLabel} className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary hover:text-white btn-block shadow-sm">
                  <Printer size={16} /> Print Internal Shipping Label
                </button>
              </div>
            )}

            <div className="divider my-2 opacity-50"></div>

            <button onClick={() => setCancelModalOpen(true)} className="btn btn-outline btn-error btn-sm w-full group">
              <RefreshCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
              Cancel Assignment & Reassign
            </button>
          </div>
        ) : (

          /* ✅ RENDER 2: UNASSIGNED STATE */
          <>
            <div className="mb-6 relative" ref={partnerDropdownRef}>
              <label className="label text-xs font-bold uppercase opacity-60 pb-1 px-0">Logistics Partner</label>
              <div
                onClick={() => setPartnerDropdownOpen(!partnerDropdownOpen)}
                className={`input input-bordered w-full rounded-xl flex items-center justify-between cursor-pointer transition-all ${partnerDropdownOpen ? "border-primary ring-2 ring-primary/20" : "bg-base-200/50 hover:bg-base-100 hover:border-primary/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {ActiveIcon && <ActiveIcon size={18} className="text-primary" />}
                  <span className="font-bold text-sm text-base-content">{activePartner?.name || "Select Partner"}</span>
                </div>
                <ChevronDown size={16} className={`opacity-50 transition-transform duration-200 ${partnerDropdownOpen ? "rotate-180" : ""}`} />
              </div>

              {partnerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-2.5 opacity-40" />
                    <input
                      autoFocus
                      value={partnerSearch}
                      onChange={e => setPartnerSearch(e.target.value)}
                      placeholder="Search logistics..."
                      className="input input-sm input-bordered w-full pl-9 rounded-xl bg-base-200/50 focus:bg-base-100"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                    {filteredPartners.map(partner => {
                      const Icon = partner.icon;
                      const isSelected = deliveryMode === partner.id;
                      return (
                        <button
                          key={partner.id}
                          type="button"
                          onClick={() => {
                            setDeliveryMode(partner.id);
                            setPartnerDropdownOpen(false);
                            setPartnerSearch("");
                          }}
                          className={`w-full text-left px-3 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-base-200 text-base-content/80"
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-base-100 shadow-sm border border-base-200'}`}>
                            <Icon size={16} className={isSelected ? "text-primary" : "opacity-70"} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-bold">{partner.name}</span>
                            <span className="text-[10px] font-medium opacity-60 leading-tight mt-0.5">{partner.desc}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {deliveryMode === "STORE" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-base-200/40 p-5 rounded-2xl border border-base-200">
                  <div className="form-control mb-5">
                    <label className="label font-bold text-sm pt-0">Assign Rider</label>
                    <div className="flex gap-2">
                      <select
                        className="select select-bordered flex-1"
                        value={selectedRider}
                        onChange={(e) => setSelectedRider(e.target.value)}
                        disabled={isPending || order.status === "CANCELLED"}
                      >
                        <option value="">Select a rider...</option>
                        {riders.map((rider) => (
                          <option key={rider.id} value={rider.id}>{rider.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignRider}
                        disabled={isPending || !selectedRider || order.status === "CANCELLED"}
                        className="btn btn-primary px-6 shadow-md"
                      >
                        {isPending ? <span className="loading loading-spinner"></span> : "Assign"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-base-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h4 className="font-bold text-sm mb-1">Internal Delivery Fee</h4>
                        <p className="text-xs opacity-60 leading-tight">Adjust the shipping cost for your internal rider.</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-50">Rs.</span>
                          <input
                            type="number"
                            value={internalShippingCost}
                            onChange={e => setInternalShippingCost(e.target.value ? Number(e.target.value) : "")}
                            className="input input-sm input-bordered w-full pl-8 font-bold text-primary"
                          />
                        </div>

                        {Number(internalShippingCost) !== Number(order.shippingCost) ? (
                          <button onClick={handleSyncInternalShipping} disabled={isPending || internalShippingCost === ""} className="btn btn-sm btn-neutral text-white shrink-0">
                            Update Total
                          </button>
                        ) : (
                          <span className="text-xs text-success flex items-center justify-center gap-1 font-bold px-3 shrink-0 bg-success/10 rounded-lg h-8 whitespace-nowrap">
                            <CheckCircle2 size={14} /> Synced
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {deliveryMode === "PATHAO" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                  <h3 className="text-xs font-bold uppercase opacity-60 mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Confirm Routing Details
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                      <p className="text-[10px] opacity-60 font-bold uppercase">Written Address</p>
                      <p className="text-sm font-medium mt-0.5">
                        {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.district}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">City</label>
                        <select className="select select-bordered select-sm w-full" value={selectedCity} onChange={(e) => { setSelectedCity(Number(e.target.value)); setSelectedZone(""); setSelectedArea(""); }}>
                          <option value="">Select City</option>
                          {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">Zone</label>
                        <select className="select select-bordered select-sm w-full" value={selectedZone} onChange={(e) => { setSelectedZone(Number(e.target.value)); setSelectedArea(""); }} disabled={!selectedCity}>
                          <option value="">Select Zone</option>
                          {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">Area</label>
                        <select className="select select-bordered select-sm w-full" value={selectedArea} onChange={(e) => setSelectedArea(Number(e.target.value))} disabled={!selectedZone}>
                          <option value="">Select Area</option>
                          {areas.map(a => <option key={a.area_id} value={a.area_id}>{a.area_name}</option>)}
                        </select>
                      </div>

                      <div className="form-control col-span-2 sm:col-span-1">
                        <label className="label text-xs font-bold py-1">Weight (kg)</label>
                        <input type="number" min="0.1" step="0.1" className="input input-sm input-bordered w-full" value={weight} onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")} />
                      </div>
                    </div>

                    {shippingCost !== null && (
                      <div className="flex justify-between items-center text-sm p-3 bg-base-100 rounded-lg border border-base-300 mt-3">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="opacity-60 font-bold uppercase text-[10px] truncate">Pathao Delivery Fee</span>
                          {shippingCost !== Number(order.shippingCost) ? (
                            <button type="button" onClick={handleSyncShipping} disabled={isPending} className="text-[10px] text-primary font-bold hover:underline text-left mt-0.5 transition-colors">
                              {isPending ? "Syncing..." : "Sync with Order Total"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-success font-bold mt-0.5 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Synced
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-primary flex items-center gap-2">
                          {isCalculating && <Loader2 size={12} className="animate-spin" />} Rs. {shippingCost}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {(!selectedCity || !selectedZone || !selectedArea) && (
                  <div className="alert alert-warning bg-warning/10 text-warning-content text-xs rounded-xl p-3 border-warning/20 flex gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Please ensure City, Zone, and Area are all selected before dispatching.</span>
                  </div>
                )}

                <button
                  onClick={handleOpenPathaoModal}
                  disabled={isPending || !selectedCity || !selectedZone || !selectedArea || order.status === "CANCELLED"}
                  className="btn btn-error btn-block text-white shadow-lg h-12"
                >
                  {isPending ? <span className="loading loading-spinner"></span> : <><Package size={18} /> Push to Pathao</>}
                </button>
              </div>
            )}
          </>
        )}

        {/* ✅ CONFIRMATION MODAL (Fixed, Read-only COD) */}
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
          <div className="modal-box">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Truck size={24} className="text-error" /> Confirm Dispatch
            </h3>

            <div className="alert alert-info bg-info/10 text-info-content text-xs rounded-xl p-3 border-none mb-6">
              <Info size={16} className="shrink-0" />
              <span>Please review the delivery details carefully. This will immediately create a consignment in {deliveryMode === "PATHAO" ? "Pathao's" : "the"} system.</span>
            </div>

            <div className="space-y-3 text-sm bg-base-200/50 p-5 rounded-2xl border border-base-200">
              <div className="flex justify-between items-start border-b border-base-300 pb-3">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">Recipient</span>
                <div className="text-right">
                  <p className="font-bold">{shippingAddress.fullName || order.user?.name || "Customer"}</p>
                  <p className="text-xs opacity-70 mt-0.5">{shippingAddress.phone || order.phone || "N/A"}</p>
                </div>
              </div>

              <div className="flex justify-between items-start border-b border-base-300 pb-3 pt-1">
                <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">Address</span>
                <span className="font-bold text-right max-w-[200px] leading-tight">{shippingAddress.street || "N/A"}</span>
              </div>

              {deliveryMode === "PATHAO" && (
                <>
                  <div className="flex justify-between items-start border-b border-base-300 pb-3 pt-1">
                    <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider mt-0.5">Routing</span>
                    <span className="font-bold text-right max-w-[220px] leading-tight text-primary">
                      {selectedCityName}, {selectedZoneName}, {selectedAreaName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-base-300 pb-3 pt-1">
                    <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider">Weight</span>
                    <span className="font-bold">{weight || 1} kg</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-base-300 pb-3 pt-1">
                    <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                      Delivery Cost
                    </span>
                    <span className="font-bold text-error">
                      Rs. {shippingCost ?? "---"}
                    </span>
                  </div>
                </>
              )}

              {/* ✅ Read-only COD Display */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex flex-col">
                  <span className="opacity-60 font-bold uppercase text-[10px] tracking-wider">Cash to Collect (COD)</span>
                  <span className="text-[10px] text-base-content/50 mt-0.5">Amount courier must collect</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-error">
                    Rs. {defaultCodAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {defaultCodAmount === 0 && (
                <p className="text-[10px] text-success text-right uppercase font-bold tracking-widest mt-1">Pre-Paid / Nothing to collect</p>
              )}
            </div>

            <div className="modal-action mt-6">
              <form method="dialog">
                <button className="btn btn-ghost" disabled={isPending}>Cancel</button>
              </form>
              <button
                className="btn btn-error text-white px-8"
                onClick={deliveryMode === "PATHAO" ? confirmPushToPathao : handleAssignRider}
                disabled={isPending}
              >
                {isPending ? <span className="loading loading-spinner"></span> : "Confirm & Send"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button disabled={isPending}>close</button>
          </form>
        </dialog>

        {cancelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-base-100 rounded-3xl w-full max-w-md flex flex-col shadow-2xl border border-base-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2">Cancel Assignment?</h3>
                <p className="text-base-content/60 text-sm mb-6 leading-relaxed">
                  Are you sure you want to cancel the current delivery assignment?
                  {order.trackingCode && <span className="block mt-2 font-medium text-warning">Note: If the Pathao courier has already picked up the package, you must also contact Pathao support directly to halt the delivery.</span>}
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setCancelModalOpen(false)} className="btn btn-outline flex-1 border-base-300">Keep It</button>
                  <button onClick={handleCancelAssignment} disabled={isCancelling} className="btn btn-error flex-1 text-white shadow-lg shadow-error/30">
                    {isCancelling ? <span className="loading loading-spinner"></span> : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}