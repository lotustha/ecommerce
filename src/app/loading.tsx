import { ShoppingBag } from "lucide-react";

// 🛠️ Dynamic Brand Configuration
// You can replace this with a database call or import from site-config.ts
const getBrandSettings = () => {
    return {
        name: process.env.NEXT_PUBLIC_APP_NAME || "Nepal E-com",
        Logo: ShoppingBag, // Pass the icon component or image URL
    };
};

export default function Loading() {
    const { name, Logo } = getBrandSettings();

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-base-100/90 backdrop-blur-sm">
            <div className="relative">
                {/* Glowing Background Effect */}
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>

                {/* Icon Container */}
                <div className="relative bg-base-100 p-6 rounded-3xl border border-base-200 shadow-2xl mb-8 flex items-center justify-center">
                    <Logo size={48} className="text-primary animate-bounce" strokeWidth={2.5} />
                </div>
            </div>

            <div className="text-center space-y-3 z-10">
                <h1 className="text-3xl font-black tracking-tighter text-base-content">
                    {name}
                </h1>
                <div className="flex items-center justify-center gap-2">
                    <span className="loading loading-dots loading-md text-primary"></span>
                </div>
            </div>
        </div>
    );
}