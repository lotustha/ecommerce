"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Headset,
  ChevronRight,
  MoreHorizontal,
  Eye,
  MessageCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { getProductContext } from "@/actions/chat-actions";

type Message = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "products" | "handoff";
  content: string;
  products?: any[];
};

export default function StorefrontChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      type: "text",
      content: "Namaste! 🙏 Welcome to our store. I am your AI Shopping Assistant. How can I help you today?",
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State to hold the visually aware product context
  const [contextProduct, setContextProduct] = useState<{ name: string, price: number, image: string } | null>(null);

  // State to hold dynamic AI suggested replies
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Check if we are on a product page
  const isProductPage = pathname?.startsWith('/product/');
  const currentSlug = isProductPage ? pathname.split('/product/')[1] : null;

  // ✅ NEW: Fetch product details whenever the URL changes
  useEffect(() => {
    if (isProductPage && currentSlug) {
      getProductContext(currentSlug).then(data => {
        setContextProduct(data);
      });
    } else {
      setContextProduct(null);
    }
  }, [isProductPage, currentSlug]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim()) return;

    // 1. Add user message to UI
    const userMsg: Message = { id: Date.now().toString(), role: "user", type: "text", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Fetch from our API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          currentPath: pathname,
          // Inject the displayed products into the AI's history context!
          history: messages.map(m => {
            let contextContent = m.content;
            if (m.type === "products" && m.products && m.products.length > 0) {
              const productNames = m.products.map(p => `${p.name} (Rs. ${p.price})`).join(" | ");
              contextContent += `\n[System Context: I showed the user these products: ${productNames}]`;
            }
            return { role: m.role, content: contextContent };
          })
        }),
      });

      const data = await res.json();

      // Update AI Suggestions
      if (data.suggested_replies && Array.isArray(data.suggested_replies) && data.suggested_replies.length > 0) {
        setAiSuggestions(data.suggested_replies);
      } else {
        setAiSuggestions([]);
      }

      // 3. Add AI Response to UI
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        type: data.type,
        content: data.content,
        products: data.products,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // 4. Handle WhatsApp Handoff
      if (data.type === "handoff" && data.whatsappNumber) {
        setTimeout(() => {
          const cleanPhone = data.whatsappNumber.replace(/[^0-9+]/g, '');
          const msg = encodeURIComponent("Hi! I was chatting with the AI bot and need to speak with a human.");
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
        }, 1500);
      }

    } catch (error) {
      console.error(error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
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
              <Bot size={30} />
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
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-base-100 sm:rounded-3xl shadow-2xl border border-base-200 flex flex-col z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold leading-tight text-sm">AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <p className="text-white/80 text-xs font-medium">Online & Ready</p>
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

            {/* ✅ REDESIGNED VISUAL AWARENESS BANNER */}
            {contextProduct && (
              <div className="bg-base-200/80 backdrop-blur-md px-5 py-3 flex items-center gap-3 border-b border-base-300 shadow-sm shrink-0 z-10 animate-in fade-in slide-in-from-top-2">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-base-100 border border-base-300 shrink-0 relative shadow-sm">
                  <Image src={contextProduct.image} alt={contextProduct.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 mb-0.5">
                    <Eye size={12} className="animate-pulse" /> Currently Viewing
                  </p>
                  <p className="text-xs font-bold text-base-content truncate leading-tight">
                    {contextProduct.name}
                  </p>
                  <p className="text-[10px] font-bold opacity-60 mt-0.5">
                    {formatPrice(contextProduct.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-base-200/30 scrollbar-hide">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                  {/* Standard Text Bubble */}
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm border ${msg.role === 'user'
                    ? 'bg-primary text-primary-content rounded-tr-sm border-primary'
                    : 'bg-base-100 text-base-content rounded-tl-sm border-base-300'
                    }`}>
                    {/* Render basic bold tracking formatting if AI uses it */}
                    {msg.content.includes('**') ? (
                      <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Interactive Product List (Redesigned & Compact) */}
                  {msg.type === "products" && msg.products && (
                    <div className="flex flex-col gap-2 w-[90%] sm:w-[85%] pt-1">
                      {msg.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 bg-base-100 p-2 rounded-xl border border-base-200 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
                        >
                          <div className="relative w-12 h-12 rounded-lg bg-base-200 overflow-hidden shrink-0 border border-base-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="font-bold text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors" title={product.name}>
                              {product.name}
                            </h4>
                            <p className="text-primary font-black text-[11px] mt-0.5">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-content transition-colors mr-1">
                            <ChevronRight size={12} className="ml-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* WhatsApp Handoff Indicator */}
                  {msg.type === "handoff" && (
                    <div className="flex items-center gap-2 mt-1 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-bold border border-green-200 animate-pulse">
                      <Headset size={14} /> Opening WhatsApp...
                    </div>
                  )}

                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start">
                  <div className="bg-base-100 text-base-content px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-base-300 flex items-center gap-1">
                    <MoreHorizontal size={18} className="animate-pulse text-base-content/40" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="bg-base-100 border-t border-base-200 p-4 shrink-0">
              {/* Context-Aware Quick Replies */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {(aiSuggestions.length > 0 ? aiSuggestions : (isProductPage ? ["Tell me about this", "Does it have a warranty?", "Talk to human"] : ["Track my order", "What are the shipping costs?", "Talk to human"])).map((text, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(undefined, text)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 whitespace-nowrap bg-base-200/60 hover:bg-primary hover:text-primary-content transition-colors px-3 py-1.5 rounded-lg text-xs font-medium border border-base-300 disabled:opacity-50"
                  >
                    <MessageCircle size={12} className="opacity-50" />
                    {text}
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ask me anything..."
                  className="input input-bordered w-full rounded-full pl-5 pr-12 h-10 text-sm bg-base-200/50 focus:bg-base-100 focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
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