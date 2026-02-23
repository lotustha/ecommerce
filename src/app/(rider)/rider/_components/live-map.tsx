"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

interface LiveMapProps {
    riders: any[];
}

export default function LiveMap({ riders }: LiveMapProps) {
    // Default center: Kathmandu, Nepal
    const kathmanduCenter: [number, number] = [27.7172, 85.3240];

    // Create a custom HTML marker for riders (animated and native to Tailwind)
    const createCustomIcon = (rider: any) => {
        const initial = rider.name ? rider.name.charAt(0).toUpperCase() : 'R';
        const avatarHtml = rider.image
            ? `<img src="${rider.image}" alt="${rider.name}" class="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-md" />`
            : `<div class="w-10 h-10 rounded-full bg-base-200 border-2 border-primary shadow-md flex items-center justify-center font-black text-base-content text-lg">${initial}</div>`;

        const phoneHtml = rider.phone ? `<span class="text-[10px] opacity-70 block leading-tight mt-0.5">${rider.phone}</span>` : '';

        return L.divIcon({
            className: 'bg-transparent border-none overflow-visible', // Override default leaflet background
            html: `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <!-- Radar Ping Effect -->
          <span class="absolute inset-0 bg-primary rounded-full animate-ping opacity-30"></span>
          
          <!-- Rider Image/Avatar -->
          <div class="relative z-10 w-10 h-10 rounded-full bg-base-100 shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:ring-4 ring-primary/30">
            ${avatarHtml}
          </div>

          <!-- Hover Tooltip (Detailed Info) -->
          <div class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-neutral text-neutral-content text-center px-4 py-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[1000] min-w-[140px] transform group-hover:-translate-y-1">
            <p class="font-black text-sm leading-tight whitespace-nowrap">${rider.name || 'Unknown Rider'}</p>
            ${phoneHtml}
            <div class="mt-2 bg-primary text-primary-content px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-block shadow-inner">
              ${rider.activeCount} Parcels
            </div>
            
            <!-- Tooltip Arrow -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral"></div>
          </div>
        </div>
      `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    };

    return (
        <MapContainer
            center={kathmanduCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 10 }}
            zoomControl={false}
        >
            {/* Beautiful, free CartoDB Voyager map tiles (No API key required) */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {riders.filter(r => r.activeCount > 0).map((rider, i) => {
                // Distribute riders mathematically around Kathmandu for the demo.
                // In the future, this lat/lng will be pulled directly from Firebase/Flutter.
                const lat = 27.7172 + (Math.sin(i * 2.5) * 0.015);
                const lng = 85.3240 + (Math.cos(i * 2.5) * 0.015);

                return (
                    <Marker
                        key={rider.id}
                        position={[lat, lng]}
                        icon={createCustomIcon(rider)}
                    >
                        <Popup className="rounded-3xl border-none shadow-2xl">
                            <div className="text-center p-2 w-36">
                                <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden border-2 border-base-200">
                                    {rider.image ? (
                                        <img src={rider.image} alt={rider.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-base-200 flex items-center justify-center font-bold text-lg">{rider.name?.charAt(0)}</div>
                                    )}
                                </div>
                                <p className="font-bold text-base mb-1 leading-tight">{rider.name}</p>
                                <p className="text-xs opacity-70 mb-3 font-medium">Carrying {rider.activeCount} parcels</p>
                                <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">En Route</div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    )
}