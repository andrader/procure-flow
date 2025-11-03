import type { Request, Response } from "express";
import { convertToModelMessages, streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { search_items } from "../tools/search-and-registry.js";
import { add_to_cart } from "../tools/cart.js";

// Express handler for the AI chat endpoint
export const handleChat = async (req: Request, res: Response) => {
  // eslint-disable-next-line no-console
  console.log("Received /api/chat request");
  try {
    const { messages = [] } = req.body || {};

    // Optional: quick config guard
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server not configured: missing OPENAI_API_KEY" });
    }

    const result = streamText({
      model: openai("gpt-5-nano"),
      system: `You are ProcureFlow's helpful assistant. You help users find and purchase products in the procurement catalog.

When users ask about products:
1. Use the searchProducts tool to search the catalog. Do not list items yourself — let the UI render results.
2. When the user asks to add an item (optionally with a quantity), call the addToCart tool with the most relevant productId and quantity (default 1). Prefer product IDs from the latest search results if available.
3. Be concise. You may briefly confirm actions and suggest next steps like viewing the cart or checking out.
`,
      messages: convertToModelMessages(messages),
      // Enable multi-step tool calling
      stopWhen: stepCountIs(5),
      tools: {
        searchProducts: tool({
          description:
            "Search for products in the procurement catalog. Use this when users ask about items, materials, equipment, or want to find something.",
          inputSchema: z.object({
            query: z.string().describe("The search query to find products"),
          }),
          execute: async ({ query }: { query: string }) => search_items({ criteria: query }),
        }),
        addToCart: tool({
          description: "Add a product to the user's shopping cart with an optional quantity.",
          inputSchema: z.object({
            productId: z.string().describe("The catalog product id to add"),
            quantity: z
              .number()
              .int()
              .min(1)
              .max(999)
              .default(1)
              .describe("Quantity to add (defaults to 1)"),
          }),
          execute: async ({ productId, quantity }: { productId: string; quantity: number }) =>
            add_to_cart({ item_id: productId, quantity }),
        }),
      },
    });

    // Convert to Response object and pipe to Express response
    const response = result.toUIMessageStreamResponse();

    // Copy headers from the Response to Express response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Set status and pipe the body
    res.status(response.status);

    // Stream the response body
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error("Stream error:", error);
          if (!res.headersSent) {
            res.status(500).end();
          }
        }
      };
      pump();
    } else {
      res.end();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("/api/chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred." });
    }
  }
};
