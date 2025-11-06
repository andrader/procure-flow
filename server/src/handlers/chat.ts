import type { Request, Response } from "express";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage, type StopCondition, TypeValidationError } from "ai";
import { openai } from "@ai-sdk/openai";
import { validateUIMessages } from 'ai';
import { z } from "zod";

import { searchProducts, registerProduct } from "../lib/tools/search-and-registry.js";
import { addToCart, removeFromCart, viewCart } from "../lib/tools/cart.js";
import { 
    addPaymentMethod, changePaymentMethod, removePaymentMethod,
    addShippingAddress, changeShippingAddress, removeShippingAddress,
    finalizePurchase
} from "../lib/tools/checkout.js";
import { loadChat, saveChat } from "../lib/chat-store.js";

interface AgentOptions {
    model: any;
    system: string;
    stopWhen?: StopCondition<any>;
    tools: Record<string, any>;
    // allow additional options
    [key: string]: any;
}

// Main procurement assistant agent
const MainAgent: AgentOptions = {
    model: openai("gpt-5-nano"),
    system: `You are ProcureFlow's helpful assistant. You help users find and purchase products in the procurement catalog.
    When users ask about products:
    1. Use the searchProducts tool to search the catalog. Do not list items yourself — let the UI render results.
    2. When the user asks to add an item (optionally with a quantity), call the addToCart tool with the most relevant productId and quantity (default 1). Prefer product IDs from the latest search results if available.
    3. Be concise. You may briefly confirm actions and suggest next steps like viewing the cart or checking out.
    
    Rules:
    - Never make up product names, IDs, prices, or details. 
    - Always use the searchProducts tool to find accurate information.
    - After calling a tool, don't summarize the cart, product list, or checkout. The UI will handle displaying that information.
    - If the user asks for something outside procurement, politely inform them that you can only assist with procurement-related queries.
    `,
    // Enable multi-step tool calling
    stopWhen: stepCountIs(20),
    tools: ({
        // search and register products tools
        searchProducts: searchProducts,
        registerProduct: registerProduct,
        // cart tools
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        viewCart: viewCart,
        // finalize purchase tool
        finalizePurchase: finalizePurchase,
    }),
};


// update user address, payment methods etc
const UserRegistrationAgent: AgentOptions = {
  model: 'openai/gpt-5-nano',
  system: `You are ProcureFlow's user account assistant. You help users manage their payment methods and shipping addresses.
  When users ask about updating their account:
  1. Use the appropriate tools to add, change, or remove payment methods and shipping addresses.
  2. Be concise. Briefly confirm actions taken.

  Rules:
  - Never make up payment method or address details.
  - Always use the provided tools to manage user information.
  `,
  stopWhen: stepCountIs(10),
  tools: {
    addPaymentMethod: addPaymentMethod,
    changePaymentMethod: changePaymentMethod,
    removePaymentMethod: removePaymentMethod,
    addShippingAddress: addShippingAddress,
    changeShippingAddress: changeShippingAddress,
    removeShippingAddress: removeShippingAddress,
    
  },
};


// Express handler for the AI chat endpoint
export const handleChat = async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log("Received /api/chat request");
    try {
        // Optional: quick config guard
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: "Server not configured: missing OPENAI_API_KEY" });
        }
        
        // Express exposes the parsed body as req.body (ensure body-parser / express.json() is enabled)
        const { message, id } = (req.body ?? {}) as { message?: UIMessage; id?: string };
        if (!message) {
            return res.status(400).json({ error: "Missing 'message' in request body" });
        }
        if (!id) {
            return res.status(400).json({ error: "Missing 'id' in request body" });
        }

        // Build working message list and (optional) chat id
          // Load previous messages from database
        const previousMessages = await loadChat(id);

        // Append new message to previousMessages messages
        const messages = [...previousMessages, message];
        
        const validatedMessages = [];
        try {
            const validatedMessages = await validateUIMessages({
                messages,
            });
        } catch (error) {
            if (error instanceof TypeValidationError) {
            // Log validation error for monitoring
            console.error('Database messages validation failed:', error);
            // Could implement message migration or filtering here
            // For now, start with empty history
            
            } else {
                throw error;
            }
        }
                

        const result = streamText({
            // unpack agent options
            ...MainAgent,
            // messages converted to model format
            messages: convertToModelMessages(
                messages
            ),
        });
        

        // Convert to Response object and pipe to Express response
        const response = result.toUIMessageStreamResponse({
            originalMessages: messages,
            onFinish: ({ messages }) => {
                saveChat({ chatId: id, messages });
            },
        });

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
