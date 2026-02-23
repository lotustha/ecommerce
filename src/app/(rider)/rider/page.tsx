import { prisma } from "@/lib/db/prisma";
import { Bike, MapPin, Phone, Package, Navigation, CheckCircle2, Map, Activity, Zap, Wifi } from "lucide-react";
import Image from "next/image";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

// Dynamically import Leaflet so it doesn't break Server-Side Rendering
const LiveMap = dynamicImport(
    () => import("./_components/live-map"),
    { ssr: false, loading: () => <div className="flex items-center justify-center h-full min-h-[400px] bg-base-200"><span className="loading loading-spinner text-primary"></span></div> }
);

// Assume a rider can comfortably handle 10 orders per dispatch run for load balancing UI
const MAX_CAPACITY_PER_RIDER = 5;

export default async function DispatchDashboard() {
    // 1. Fetch all riders
    const riders = await prisma.user.findMany({
        where: { role: "RIDER" },
        select: { id: true, name: true, email: true, phone: true, image: true }
    });

    // 2. Fetch all active orders assigned to riders
    const activeOrders = await prisma.order.findMany({
        where: {
            riderId: { not: null },
            status: { in: ["READY_TO_SHIP", "SHIPPED"] }
        },
        select: {
            id: true,
            riderId: true,
            shippingAddress: true,
            totalAmount: true,
            paymentMethod: true,
            paymentStatus: true,
            status: true
        },
        orderBy: { createdAt: "asc" }
    });

    // 3. Fetch today's completed orders for metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await prisma.order.findMany({
        where: {
            riderId: { not: null },
            status: "DELIVERED",
            updatedAt: { gte: today }
        },
        select: { riderId: true }
    });

    // 4. Map data together & Calculate Load Balancing
    let totalActiveFleet = 0;

    const fleetData = riders.map(rider => {
        const assignedOrders = activeOrders.filter(o => o.riderId === rider.id);
        const deliveredTodayCount = completedToday.filter(o => o.riderId === rider.id).length;

        // Calculate total cash they are currently holding/collecting
        const cashToCollect = assignedOrders.reduce((sum, order) => {
            if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
                return sum + Number(order.totalAmount);
            }
            return sum;
        }, 0);

        const activeCount = assignedOrders.length;
        if (activeCount > 0) totalActiveFleet++;

        // Load Balancing Math
        const loadPercentage = Math.min(Math.round((activeCount / MAX_CAPACITY_PER_RIDER) * 100), 100);
        let loadStatus = "IDLE";
        let loadColor = "bg-success";

        if (activeCount > 0 && activeCount < 6) {
            loadStatus = "ACTIVE";
            loadColor = "bg-info";
        } else if (activeCount >= 6 && activeCount < 10) {
            loadStatus = "BUSY";
            loadColor = "bg-warning";
        } else if (activeCount >= 10) {
            loadStatus = "OVERLOADED";
            loadColor = "bg-error";
        }

        return {
            ...rider,
            activeOrders: assignedOrders,
            deliveredTodayCount,
            cashToCollect,
            activeCount,
            loadPercentage,
            loadStatus,
            loadColor
        };
    });

    // Sort riders: Most loaded first
    fleetData.sort((a, b) => b.activeCount - a.activeCount);

    return (
        <div className="space-y-6 pb-20">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Activity size={28} className="text-primary" /> Command Center
                    </h1>
                    <p className="text-sm opacity-60 mt-1 flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                        </span>
                        Awaiting real-time Flutter GPS coordinates
                    </p>
                </div>
                <div className="flex gap-4 text-center">
                    <div className="bg-base-200 px-4 py-2 rounded-xl">
                        <p className="text-[10px] font-bold uppercase opacity-50">Active Fleet</p>
                        <p className="text-xl font-black text-primary">{totalActiveFleet} <span className="text-sm opacity-50">/ {riders.length}</span></p>
                    </div>
                    <div className="bg-base-200 px-4 py-2 rounded-xl">
                        <p className="text-[10px] font-bold uppercase opacity-50">Parcels En Route</p>
                        <p className="text-xl font-black">{activeOrders.length}</p>
                    </div>
                </div>
            </div>

            {/* TOP GRID: Live Map & Load Balancing */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Live Interactive Map */}
                <div className="lg:col-span-2 bg-base-200 rounded-3xl border border-base-300 shadow-lg overflow-hidden relative min-h-[400px] flex flex-col isolate">
                    <div className="absolute top-4 left-4 z-[500] bg-base-100/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-base-200 flex items-center gap-2 text-sm font-bold">
                        <Map size={16} className="text-primary" /> Live Tracking Map
                    </div>
                    <div className="absolute top-4 right-4 z-[500] bg-base-100/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-base-200 flex items-center gap-2 text-xs font-bold text-success">
                        <Wifi size={14} /> Tracking Ready
                    </div>

                    <div className="absolute inset-0 z-0">
                        <LiveMap riders={fleetData} />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full z-[500] p-4 bg-gradient-to-t from-base-100 to-transparent text-base-content/80 text-xs text-center font-medium pointer-events-none pb-6">
                        Simulated coordinates shown. Ready for live Firebase GPS injection.
                    </div>
                </div>

                {/* RIGHT: Load Balancing Panel */}
                <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-black flex items-center gap-2 mb-1">
                        <Zap size={20} className="text-warning" /> Fleet Load Balancing
                    </h2>
                    <p className="text-xs opacity-60 mb-6">Real-time capacity and assignment status.</p>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                        {fleetData.map(rider => (
                            <div key={rider.id} className="space-y-2 group">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <div className="avatar">
                                            <div className="w-6 h-6 rounded-full bg-base-200">
                                                {rider.image ? (
                                                    <Image src={rider.image} alt={rider.name || ""} width={24} height={24} className="object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold flex items-center justify-center h-full w-full">{rider.name?.[0]}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-bold text-sm leading-none">{rider.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{rider.loadStatus}</span>
                                </div>

                                <div className="relative w-full h-2.5 bg-base-200 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 h-full ${rider.loadColor} transition-all duration-1000`}
                                        style={{ width: `${rider.loadPercentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between text-[10px] font-bold opacity-50">
                                    <span>{rider.activeCount} assigned</span>
                                    <span>{MAX_CAPACITY_PER_RIDER} max cap.</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* BOTTOM: Detailed Route Cards */}
            <div className="pt-4 border-t border-base-200">
                <h2 className="text-2xl font-black tracking-tight mb-6">Rider Workloads & Routes</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {fleetData.map(rider => (
                        <div key={rider.id} className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden flex flex-col">

                            {/* Rider Header */}
                            <div className="p-5 border-b border-base-200 bg-base-200/30 flex justify-between items-start">
                                <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-xl border border-primary/20 overflow-hidden">
                                        {rider.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={rider.image} alt="Rider" className="w-full h-full object-cover" />
                                        ) : (
                                            rider.name?.charAt(0) || "R"
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{rider.name}</h3>
                                        <p className="text-xs opacity-60 font-medium flex items-center gap-1 mt-0.5">
                                            <Phone size={10} /> {rider.phone || rider.email || "No contact info"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`badge font-bold border-none ${rider.activeOrders.length > 0 ? 'bg-warning text-warning-content' : 'bg-success text-success-content'}`}>
                                        {rider.activeOrders.length > 0 ? 'On Route' : 'Idle'}
                                    </span>
                                </div>
                            </div>

                            {/* Rider Stats */}
                            <div className="grid grid-cols-3 divide-x divide-base-200 border-b border-base-200 bg-base-100 text-center">
                                <div className="p-3">
                                    <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Active</p>
                                    <p className="font-black text-lg">{rider.activeOrders.length}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Done Today</p>
                                    <p className="font-black text-lg text-success flex items-center justify-center gap-1">
                                        {rider.deliveredTodayCount} <CheckCircle2 size={14} />
                                    </p>
                                </div>
                                <div className="p-3 bg-error/5">
                                    <p className="text-[10px] font-bold uppercase text-error/70 mb-1">COD Cash</p>
                                    <p className="font-black text-sm text-error">Rs.{rider.cashToCollect}</p>
                                </div>
                            </div>

                            {/* Current Route / Orders */}
                            <div className="p-5 flex-1 bg-base-50">
                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 flex items-center gap-2">
                                    <Navigation size={12} /> Current Route Destinations
                                </h4>

                                {rider.activeOrders.length === 0 ? (
                                    <div className="text-center py-6 opacity-40 flex flex-col items-center">
                                        <Package size={24} className="mb-2" />
                                        <p className="text-sm font-bold">No active deliveries.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-base-300 before:to-transparent">
                                        {rider.activeOrders.map((order, index) => {
                                            let address: any = {};
                                            try { address = JSON.parse(order.shippingAddress as string); } catch (e) { }

                                            return (
                                                <div key={order.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-base-100 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2">
                                                        <span className="text-[10px] font-black">{index + 1}</span>
                                                    </div>

                                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-8 md:ml-0 p-3 rounded-xl border border-base-200 bg-base-100 shadow-sm">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <span className="font-bold text-xs line-clamp-1">{address.fullName}</span>
                                                            <span className="text-[9px] font-mono opacity-50">#{order.id.slice(-4).toUpperCase()}</span>
                                                        </div>
                                                        <p className="text-[11px] opacity-70 leading-tight flex items-start gap-1">
                                                            <MapPin size={10} className="mt-0.5 shrink-0 text-primary" />
                                                            <span className="line-clamp-2">{address.street}, {address.city}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}