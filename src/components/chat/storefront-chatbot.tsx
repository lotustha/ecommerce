"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  Truck,
  Headset,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock data to preview the UI before we connect the real AI
const MOCK_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    type: "text",
    content:
      "Namaste! 🙏 Welcome to our store. I am your AI Shopping Assistant. How can I help you today?",
  },
  {
    id: 2,
    role: "assistant",
    type: "product",
    content: "Here is a popular gaming laptop you might like:",
    product: {
      id: "prod_123",
      name: "ASUS ROG Strix G15",
      price: 155000,
      image:
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1000&auto=format&fit=crop",
      slug: "asus-rog-strix-g15",
    },
  },
];

const QUICK_REPLIES = [
  { icon: Truck, text: "Track my order" },
  { icon: ShoppingBag, text: "Show top laptops" },
  { icon: Headset, text: "Talk to human" },
];

export default function StorefrontChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // For now, just clear the input. We will add logic in Step 2.
    setInput("");
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-100">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 bg-primary text-primary-content rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 focus:outline-none"
            >
              <MessageSquare size={28} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-error rounded-full border-2 border-base-100 animate-pulse"></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-dvh sm:h-[600px] bg-base-100 sm:rounded-3xl shadow-2xl border border-base-200 flex flex-col z-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold leading-tight text-sm">
                    AI Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <p className="text-white/80 text-xs font-medium">
                      Online & Ready
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-base-200/30 scrollbar-hide">
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-2 items-start">
                  {/* Standard Text Bubble */}
                  {msg.type === "text" && (
                    <div className="bg-base-200 text-base-content px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm leading-relaxed shadow-sm border border-base-300">
                      {msg.content}
                    </div>
                  )}

                  {/* Interactive Product Card Bubble */}
                  {msg.type === "product" && msg.product && (
                    <div className="flex flex-col gap-2 max-w-[85%]">
                      <div className="bg-base-200 text-base-content px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm border border-base-300">
                        {msg.content}
                      </div>

                      <div className="bg-base-100 rounded-2xl overflow-hidden border border-base-200 shadow-md w-60 group">
                        <div className="relative h-40 w-full bg-base-200">
                          <Image
                            src={msg.product.image}
                            alt={msg.product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-sm leading-tight line-clamp-1 mb-1">
                            {msg.product.name}
                          </h4>
                          <p className="text-primary font-black text-base mb-3">
                            Rs. {msg.product.price.toLocaleString("en-NP")}
                          </p>
                          <Link
                            href={`/product/${msg.product.slug}`}
                            className="btn btn-primary btn-sm w-full rounded-xl gap-2 text-xs"
                          >
                            View Details <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="bg-base-100 border-t border-base-200 p-4">
              {/* Quick Replies (Icon Buttons with Tooltips) */}
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {QUICK_REPLIES.map((reply, idx) => (
                  <div
                    key={idx}
                    className="tooltip tooltip-top z-50"
                    data-tip={reply.text}
                  >
                    <button
                      className="flex items-center justify-center w-10 h-10 bg-base-200 hover:bg-primary hover:text-primary-content transition-colors rounded-full border border-base-300 shadow-sm"
                      aria-label={reply.text}
                    >
                      <reply.icon size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Input Field */}
              <form
                onSubmit={handleSend}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="input input-bordered w-full rounded-full pl-5 pr-12 h-10 text-sm bg-base-200/50 focus:bg-base-100 focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-content disabled:bg-base-300 disabled:text-base-content/40 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
