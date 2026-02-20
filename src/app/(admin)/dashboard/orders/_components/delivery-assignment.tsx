"use client"

import { useState, useTransition } from "react";
import { assignDelivery } from "@/actions/delivery-actions";
import { toast } from "react-hot-toast";
import { Truck, Package, ExternalLink, CheckCircle2, User, AlertTriangle } from "lucide-react";

interface Rider {
    id: string;
    name: string;
}

interface DeliveryAssignmentProps {
    order: any;
    riders: Rider[];
}

export default function DeliveryAssignment({ order, riders }: DeliveryAssignmentProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedRider, setSelectedRider] = useState(order.riderId || "");

    // Safely parse shipping address to extract location details
    let shippingAddress: any = {};
    try {
        shippingAddress = typeof order.shippingAddress === 'string'
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress || {};
    } catch (e) { }

    const pathaoCityId = order.pathaoCityId || shippingAddress.logistics?.pathaoCityId;
    const pathaoZoneId = order.pathaoZoneId || shippingAddress.logistics?.pathaoZoneId;
    const pathaoAreaId = order.pathaoAreaId || shippingAddress.logistics?.pathaoAreaId;

    const handleAssignRider = () => {
        if (!selectedRider) return toast.error("Please select a rider");

        startTransition(async () => {
            const res = await assignDelivery(order.id, {
                method: "RIDER",
                riderId: selectedRider
            });

            if (res.success) {
                toast.success("Rider assigned successfully");
            } else {
                toast.error(res.error || "Failed to assign rider");
            }
        });
    };

    const handlePushToPathao = () => {
        startTransition(async () => {
            const res = await assignDelivery(order.id, {
                method: "PATHAO",
                recipient_name: shippingAddress.fullName || order.user?.name || "Customer",
                recipient_phone: shippingAddress.phone || order.phone || "",
                recipient_address: shippingAddress.street || "N/A",
                recipient_city: pathaoCityId,
                recipient_zone: pathaoZoneId,
                recipient_area: pathaoAreaId,
                item_weight: 1, // Fallback default weight
                item_description: `Order #${order.id.slice(-6).toUpperCase()}`
            });

            if (res.success) {
                toast.success("Order pushed to Pathao successfully!");
            } else {
                toast.error(res.error || "Failed to dispatch to Pathao");
            }
        });
    };

    return (
        <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
                <h2 className="card-title text-lg flex items-center gap-2 mb-4 border-b pb-3">
                    <Truck size={20} className="text-primary" />
                    Logistics & Assignment
                </h2>

                {/* --- SCENARIO 1: INTERNAL STORE DELIVERY --- */}
                {order.deliveryPartner === "STORE" && (
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
                                    disabled={isPending}
                                >
                                    <option value="">Select a rider...</option>
                                    {riders.map(rider => (
                                        <option key={rider.id} value={rider.id}>{rider.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAssignRider}
                                    disabled={isPending || !selectedRider}
                                    className="btn btn-primary"
                                >
                                    {isPending ? <span className="loading loading-spinner"></span> : "Assign"}
                                </button>
                            </div>
                        </div>

                        {order.rider && (
                            <div className="mt-4 p-4 bg-base-200 rounded-xl flex items-center gap-3 border border-base-300">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs opacity-60 font-bold uppercase">Current Rider</p>
                                    <p className="font-bold">{order.rider.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- SCENARIO 2: PATHAO DELIVERY --- */}
                {order.deliveryPartner === "PATHAO" && (
                    <div className="space-y-4">
                        {order.pathaoConsignmentId ? (
                            // PATHAO: ALREADY DISPATCHED
                            <div className="p-5 bg-success/10 border border-success/20 rounded-2xl space-y-4">
                                <div className="flex items-center gap-3 text-success font-bold">
                                    <CheckCircle2 size={24} />
                                    <span>Dispatched via Pathao</span>
                                </div>

                                <div className="bg-base-100 p-3 rounded-lg border border-base-200">
                                    <p className="text-xs opacity-60 mb-1">Consignment ID</p>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono font-bold text-lg">{order.pathaoConsignmentId}</p>
                                        <button className="btn btn-xs btn-outline gap-1" onClick={() => navigator.clipboard.writeText(order.pathaoConsignmentId!)}>
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <a
                                    href={`https://merchant.pathao.com/orders/print/${order.pathaoConsignmentId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-success btn-block text-white shadow-lg"
                                >
                                    <ExternalLink size={16} /> Print Shipping Label
                                </a>
                            </div>
                        ) : (
                            // PATHAO: PENDING DISPATCH
                            <div className="space-y-4">
                                {!pathaoCityId || !pathaoZoneId ? (
                                    <div className="alert alert-error text-sm rounded-xl p-3">
                                        <AlertTriangle size={18} />
                                        <span>Missing Pathao location IDs. Customer did not select a valid area.</span>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning bg-warning/10 text-warning-content text-sm rounded-xl p-3 border-warning/20">
                                        Ready to push to Pathao Logistics.
                                    </div>
                                )}

                                <button
                                    onClick={handlePushToPathao}
                                    disabled={isPending || !pathaoCityId || !pathaoZoneId}
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
            </div>
        </div>
    );
}