import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
    try {
        const { message, history, currentPath } = await req.json();

        // 1. Get Store Settings & API Key
        const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
        const apiKey = settings?.aiGeminiKey;

        if (!apiKey) {
            return NextResponse.json({
                type: "text",
                content: "I am currently offline because my AI API key is not configured in the admin settings. Please contact support via WhatsApp!"
            });
        }

        // 2. Fetch specific product context if the user is on a product page
        let productContext = "";
        if (currentPath && currentPath.includes('/product/')) {
            const slug = currentPath.split('/product/')[1]?.split('/')[0]; // Extract slug from URL
            if (slug) {
                const viewingProduct = await prisma.product.findUnique({
                    where: { slug },
                    include: { specs: { include: { attribute: true } } }
                });

                if (viewingProduct) {
                    productContext = `
            CRITICAL CONTEXT: The user is currently on the product page for "${viewingProduct.name}".
            Price: Rs. ${Number(viewingProduct.price).toLocaleString('en-NP')}
            Specifications: ${viewingProduct.specs.map(s => `${s.attribute.name}: ${s.value}`).join(', ')}
            
            If the user says "this", "this product", "it", or asks for details without specifying a name, ASSUME they are talking about "${viewingProduct.name}" and use the specific pricing and specs provided above to answer them.
          `;
                }
            }
        }

        // 3. The "System Prompt" (Highly Optimized to Prevent Hallucinations and Force Product Cards)
        const systemPrompt = `
      You are the official AI Shopping Assistant for "${settings?.storeName || 'our store'}".
      Your traits:
      - Mirror the user's tone (be formal if they are, casual/friendly with emojis if they are).
      - Speak English, but perfectly understand and reply in Romanized Nepali or Devanagari if the user uses it.
      - Be concise. Keep answers short and highly readable.
      - NEVER guess or assume inventory. You DO NOT know what is in stock until you search the database.
      
      Store Information:
      - Shipping Charge: Rs. ${settings?.shippingCharge || 150}
      - Free Shipping over: Rs. ${settings?.freeShippingThreshold || 'N/A'}
      - Support Phone/WhatsApp: ${settings?.storePhone || 'Not available'}
      - Supported Payments: COD, ${settings?.enableEsewa ? 'eSewa, ' : ''}${settings?.enableKhalti ? 'Khalti' : ''}.

      ${productContext}

      CRITICAL RULE: You must ALWAYS respond in valid JSON format. Do not include markdown formatting like \`\`\`json.
      Also, provide a "suggested_replies" array (strings) containing 2-3 short, highly relevant follow-up questions the user could ask based on the current context.

      Choose ONE of these actions based on the user's message:
      
      1. General greetings or FAQs:
      { "action": "reply", "message": "Your helpful response here", "suggested_replies": ["Question 1", "Question 2"] }
      -> NEVER use this action to say "we don't have laptops" or guess availability.
      -> NEVER use this action if you are recommending a specific product from the context. If you recommend a specific product, ALWAYS use the "search_products" action so the user gets a clickable product card.

      2. User asks to find products, OR you want to recommend a specific product from context (e.g. "Which one is better?", "Do you have laptops?"):
      { "action": "search_products", "message": "The HP EliteBook is an excellent choice for studying because of its portability and battery life!", "query": "HP EliteBook", "suggested_replies": ["Question 1", "Question 2"] }
      -> YOU MUST USE THIS ACTION IF THE USER ASKS FOR ANY ITEM OR IF YOU ARE RECOMMENDING A SPECIFIC ITEM. 
      -> VERY IMPORTANT: The "query" field MUST be the EXACT product name (if recommending from context) OR a single broad keyword (e.g., "laptop") if doing a general search. Use the "message" field to tailor your response to their specific request.

      3. Order tracking (e.g. "where is my order", "track #123"):
      { "action": "track_order", "message": "Let me check that for you.", "query": "order_id_here if provided, or leave empty to ask", "suggested_replies": ["Question 1"] }

      4. Human handoff (user is frustrated, asks for a real person, or WhatsApp):
      { "action": "handoff", "message": "I will connect you with our human support team right away!", "suggested_replies": [] }
    `;

        // 4. Format history and Ask Gemini using native fetch API
        // We inject a dummy "Hello" so the conversation ALWAYS starts with a user role (Gemini requirement).
        const rawContents = [
            { role: "user", parts: [{ text: "Hello" }] },
            ...history.map((msg: any) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content || " " }]
            })),
            { role: "user", parts: [{ text: message }] }
        ];

        // Collapse consecutive messages from the same role to prevent 400 Bad Request errors
        const contents = rawContents.reduce((acc: any[], curr: any) => {
            if (acc.length === 0) {
                acc.push(curr);
            } else {
                const prev = acc[acc.length - 1];
                if (prev.role === curr.role) {
                    prev.parts[0].text += `\n\n${curr.parts[0].text}`;
                } else {
                    acc.push(curr);
                }
            }
            return acc;
        }, []);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const apiData = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", apiData);
            throw new Error(apiData.error?.message || "Failed to fetch from Gemini");
        }

        const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("Empty response from Gemini");
        }

        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return NextResponse.json({ type: "text", content: "I'm having a little trouble thinking right now. Could you rephrase that?" });
        }

        // ------------------------------------------------------------------
        // 5. PROCESS THE AI'S DECISION (The Magic Happens Here)
        // ------------------------------------------------------------------

        // ACTION: SEARCH PRODUCTS (Now searches keywords & brands too!)
        if (aiResponse.action === "search_products" && aiResponse.query) {
            const products = await prisma.product.findMany({
                where: {
                    isArchived: false,
                    OR: [
                        { name: { contains: aiResponse.query } },
                        { description: { contains: aiResponse.query } },
                        { category: { name: { contains: aiResponse.query } } },
                        { brand: { name: { contains: aiResponse.query } } },
                        { keywords: { contains: aiResponse.query } }
                    ]
                },
                take: 4,
                select: { id: true, name: true, price: true, discountPrice: true, images: true, slug: true }
            });

            if (products.length > 0) {
                const formattedProducts = products.map(p => {
                    let image = "/placeholder.jpg";
                    try {
                        const parsed = JSON.parse(p.images || "[]");
                        if (parsed.length > 0) image = parsed[0];
                    } catch (e) { }
                    return { ...p, image, price: Number(p.price) };
                });

                return NextResponse.json({
                    type: "products",
                    content: aiResponse.message || "Here is what I found:",
                    products: formattedProducts,
                    suggested_replies: aiResponse.suggested_replies || []
                });
            } else {
                return NextResponse.json({ type: "text", content: `I'm sorry, but I couldn't find any products matching "${aiResponse.query}" in our catalog right now. Would you like to browse our main categories?`, suggested_replies: aiResponse.suggested_replies || [] });
            }
        }

        // ACTION: TRACK ORDER
        if (aiResponse.action === "track_order") {
            if (!aiResponse.query || aiResponse.query.length < 5) {
                return NextResponse.json({ type: "text", content: "I can help with that! Could you please provide your Order ID?", suggested_replies: aiResponse.suggested_replies || [] });
            }

            const order = await prisma.order.findUnique({
                where: { id: aiResponse.query }
            });

            if (!order) {
                return NextResponse.json({ type: "text", content: `I couldn't find an order with the ID "${aiResponse.query}". Please double-check the number.`, suggested_replies: aiResponse.suggested_replies || [] });
            }

            let statusMsg = `Your order **#${order.id.slice(-6).toUpperCase()}** is currently **${order.status}**.`;
            if (order.trackingCode) {
                statusMsg += `\nTracking Code: ${order.trackingCode} (${order.courier || 'Courier'})`;
            }
            return NextResponse.json({ type: "text", content: statusMsg, suggested_replies: aiResponse.suggested_replies || [] });
        }

        // ACTION: HUMAN HANDOFF
        if (aiResponse.action === "handoff") {
            return NextResponse.json({
                type: "handoff",
                content: aiResponse.message,
                whatsappNumber: settings?.storePhone || "+9779800000000",
                suggested_replies: aiResponse.suggested_replies || []
            });
        }

        // DEFAULT ACTION: NORMAL REPLY
        return NextResponse.json({ type: "text", content: aiResponse.message, suggested_replies: aiResponse.suggested_replies || [] });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ type: "text", content: "Sorry, our servers are taking a quick nap. Please try again in a moment!" }, { status: 500 });
    }
}