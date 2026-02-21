"use server";

import { prisma } from "@/lib/db/prisma";

export interface AIProductData {
  name?: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  specs: { name: string; value: string }[];
  price?: number;
  sku?: string;
  categorySuggestion?: string;
  brandSuggestion?: string;
  options?: { name: string; values: string[] }[];
  images?: string[]; // Extracted from OpenGraph meta tags
}

export async function generateProductMagic(
  productName: string,
  existingDescription?: string,
): Promise<{ data?: AIProductData; error?: string }> {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const geminiKey = settings?.aiGeminiKey;
    const openaiKey = settings?.aiOpenAiKey;

    if (!geminiKey && !openaiKey) {
      return { error: "No AI API keys configured in System Settings." };
    }

    const systemPrompt = `You are an expert e-commerce copywriter and SEO specialist. 
Given a product name ${existingDescription ? "and additional context/description provided by the user" : ""}, generate the following details:
1. A compelling, highly-converting HTML description (use <b>, <ul>, <li>, <p> tags, no h1/h2). ${existingDescription ? "Base your description around the context provided by the user." : ""}
2. A catchy SEO Meta Title (max 60 chars).
3. An engaging SEO Meta Description (max 160 chars).
4. A comma-separated list of 5-8 SEO keywords.
5. A highly detailed and comprehensive list of 8-15 technical specifications (e.g., Weight, Dimensions, Battery Life, Display Type, Material, Processor, Connectivity, Warranty). Make the values realistic, precise, and descriptive. You MUST include "Weight".
6. Suggest a realistic market price for this item in Nepalese Rupees (NPR) as a number.
7. Generate a professional, concise SKU (Stock Keeping Unit).
8. Suggest the most appropriate general Category.
9. Suggest the Brand name if identifiable.
10. IMPORTANT: If the product typically comes in multiple variations (e.g., smartphones have Storage and Color, clothes have Size and Color), generate an "options" array. For example: [{"name": "Color", "values": ["Silver", "Black"]}, {"name": "Storage", "values": ["256GB", "512GB"]}]. If it's a simple product, return an empty array [].

Respond strictly with valid JSON matching this exact structure:
{
  "description": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "keywords": "string",
  "specs": [ { "name": "string", "value": "string" } ],
  "price": number,
  "sku": "string",
  "categorySuggestion": "string",
  "brandSuggestion": "string",
  "options": [ { "name": "string", "values": ["string", "string"] } ]
}`;

    const userPrompt = `Product Name: ${productName}\n${existingDescription ? `Context/Details from User: ${existingDescription}` : ""}`;

    let geminiErrorMsg = "";
    let openaiErrorMsg = "";

    // 1. TRY GEMINI FIRST
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { data: JSON.parse(text) };
          } else {
            geminiErrorMsg = "Gemini returned empty or safety-blocked content.";
          }
        } else {
          geminiErrorMsg = data.error?.message || "Unknown Gemini Error";
        }
        if (geminiErrorMsg) console.warn("Gemini API failed:", geminiErrorMsg);
      } catch (e: any) {
        geminiErrorMsg = e.message;
        console.warn("Gemini Fetch Exception:", e);
      }
    }

    // 2. FALLBACK TO OPENAI
    if (openaiKey) {
      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return { data: JSON.parse(text) };
          } else {
            openaiErrorMsg = "OpenAI returned empty content.";
          }
        } else {
          openaiErrorMsg = data.error?.message || "Unknown OpenAI Error";
        }
      } catch (e: any) {
        openaiErrorMsg = e.message;
      }
    }

    const detailedError = `AI Failed. Gemini: [${geminiErrorMsg || "Key missing"}]. OpenAI: [${openaiErrorMsg || "Key missing"}]`;
    console.error(detailedError);
    return { error: detailedError };
  } catch (error: any) {
    console.error("AI Magic Error:", error);
    return {
      error: error.message || "Internal server error during AI generation.",
    };
  }
}

// ✅ NEW: Scrape Webpage and Extract Product Details
export async function importProductFromUrl(
  url: string,
): Promise<{ data?: AIProductData; error?: string }> {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const geminiKey = settings?.aiGeminiKey;
    const openaiKey = settings?.aiOpenAiKey;

    if (!geminiKey && !openaiKey) {
      return { error: "No AI API keys configured in System Settings." };
    }

    // 1. Fetch the Webpage content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        error: `Failed to fetch webpage. Ensure the URL is public. Status: ${response.status}`,
      };
    }

    const html = await response.text();

    // 2. Try to extract the main Product Image from OpenGraph tags (Basic scraping)
    let extractedImages: string[] = [];
    const ogImageMatch =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    if (ogImageMatch && ogImageMatch[1]) {
      extractedImages.push(ogImageMatch[1]);
    }

    // 3. Clean HTML to plain text to save AI tokens and strip junk
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ") // Strip all remaining tags
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim()
      .substring(0, 20000); // Take maximum 20k characters

    // 4. Send to AI for Data Structuring
    const systemPrompt = `You are an expert e-commerce data extraction AI. 
I will provide you with the raw, messy text content scraped from a product webpage.
Your job is to analyze this text, find the product, and extract its details into a perfectly structured JSON format.

Extract the following:
1. "name": The exact product name.
2. "description": Write a compelling HTML formatted description based strictly on the features mentioned in the text (use <b>, <ul>, <li>).
3. "metaTitle": A catchy SEO Meta Title (max 60 chars).
4. "metaDescription": An engaging SEO Meta Description (max 160 chars).
5. "keywords": A comma-separated list of 5-8 SEO keywords based on the product.
6. "specs": Extract all technical specifications found on the page (e.g., Weight, Dimensions, Display, Material, Processor) into an array of {name, value} objects.
7. "price": Extract the price. If it's not in NPR (Nepalese Rupees), estimate the conversion to NPR as a pure number.
8. "sku": Generate a professional SKU based on the product name and model.
9. "categorySuggestion": Suggest the most appropriate general Category based on what the product is.
10. "brandSuggestion": Extract the Brand name if identifiable.
11. "options": If the text indicates the product comes in multiple variations (e.g., Colors, Sizes, Storage capacities), generate an "options" array. For example: [{"name": "Color", "values": ["Silver", "Black"]}, {"name": "Storage", "values": ["256GB"]}]. If no options are found, return an empty array [].

Respond strictly with valid JSON matching this exact structure:
{
  "name": "string",
  "description": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "keywords": "string",
  "specs": [ { "name": "string", "value": "string" } ],
  "price": number,
  "sku": "string",
  "categorySuggestion": "string",
  "brandSuggestion": "string",
  "options": [ { "name": "string", "values": ["string", "string"] } ]
}`;

    const userPrompt = `Extracted Webpage Text from URL:\n\n${cleanText}`;

    // Prefer Gemini 3 Flash Preview
    if (geminiKey) {
      try {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userPrompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        const data = await aiRes.json();

        if (aiRes.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsedData = JSON.parse(text);
            parsedData.images = extractedImages; // Inject the image we scraped
            return { data: parsedData };
          }
        }
      } catch (e: any) {
        console.warn("URL Scrape AI Error:", e);
      }
    }

    return { error: "Failed to extract product details using AI." };
  } catch (error: any) {
    console.error("Scrape Error:", error);
    return { error: error.message || "Failed to fetch and parse URL." };
  }
}

export async function searchProductImages(
  query: string,
): Promise<{ images?: string[]; error?: string }> {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const crawlerKey = settings?.crawlerApiKey;

    if (!crawlerKey) {
      return {
        error:
          "Google Search API key is missing. Please add it to Crawler API Key in Settings.",
      };
    }

    let apiKey = crawlerKey;
    let cx = process.env.GOOGLE_SEARCH_CX || "";

    if (crawlerKey.includes(":")) {
      [apiKey, cx] = crawlerKey.split(":");
    }

    if (!cx) {
      return {
        error:
          "Missing Search Engine ID (CX). Please format your key as API_KEY:CX_ID in settings.",
      };
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=6`;

    const response = await fetch(url);
    if (!response.ok) {
      return {
        error: "Google Search API request failed. Check your API limits.",
      };
    }

    const data = await response.json();
    const images = data.items?.map((item: any) => item.link) || [];

    return { images };
  } catch (error: any) {
    return { error: "Internal server error during image search." };
  }
}

export async function getColorName(
  hex: string,
): Promise<{ name?: string; error?: string }> {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const geminiKey = settings?.aiGeminiKey;
    const openaiKey = settings?.aiOpenAiKey;

    if (!geminiKey && !openaiKey) {
      return { name: "Auto Color" };
    }

    const prompt = `What is the common, human-readable commercial name for the hex color ${hex}? For example, instead of 'dark blue', you might say 'Navy Blue'. Reply with ONLY the color name and nothing else.`;

    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          },
        );

        const data = await response.json();
        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { name: text.trim().replace(/['"]/g, "") };
        }
      } catch (e) {}
    }
    return { name: "Auto Color" };
  } catch (error) {
    return { name: "Auto Color" };
  }
}
