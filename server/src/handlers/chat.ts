import type { Request, Response } from "express";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { searchProducts, registerProduct } from "../tools/search-and-registry.js";
import { addToCart, removeFromCart, viewCart } from "../tools/cart.js";
import { 
    addPaymentMethod, changePaymentMethod, removePaymentMethod,
    addShippingAddress, changeShippingAddress, removeShippingAddress,
    finalizePurchase
} from "../tools/checkout.js";
import { loadChat, saveChat } from "../lib/chat-store.js";

// Express handler for the AI chat endpoint
export const handleChat = async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log("Received /api/chat request");
    try {
        const { messages: incomingMessages = [], message, id } = req.body || {} as {
            messages?: UIMessage[];
            message?: UIMessage;
            id?: string;
        };

        // If a single new message and chat id are provided, load previous messages
        let workingMessages: UIMessage[] = [];
        let chatId: string | undefined = id;
        if (message && typeof id === "string") {
            try {
                const previous = await loadChat(id);

                // De-dup guard: if this exact user message already exists in history and has been
                // followed by an assistant reply, do NOT generate a new response. This prevents
                // new assistant messages from being created on page reloads.
                const existingIndex = previous.findIndex((m: UIMessage) => m.id === message.id);
                if (existingIndex !== -1) {
                    const hasAssistantAfter = previous
                        .slice(existingIndex + 1)
                        .some((m: UIMessage) => m.role === "assistant");
                    if (hasAssistantAfter) {
                        // No-op: respond with no content to indicate nothing to stream.
                        return res.status(204).end();
                    }
                }

                // Additional de-dup: if a prior identical user message (same text) already
                // received an assistant reply, skip regenerating on reload where the client
                // might have a new transient message id.
                const norm = (t?: string) => (t ?? "").trim();
                const msgText = norm(
                    message.parts?.find?.((p: any) => p?.type === "text")?.text ?? (message as any).content ?? ""
                );
                if (msgText) {
                    for (let i = 0; i < previous.length; i++) {
                        const pm = previous[i] as UIMessage;
                        if (pm.role === "user") {
                            const prevText = norm(
                                (pm as any).parts?.find?.((p: any) => p?.type === "text")?.text ?? (pm as any).content ?? ""
                            );
                            if (prevText && prevText === msgText) {
                                const hasAssistantAfterSame = previous
                                    .slice(i + 1)
                                    .some((m: UIMessage) => m.role === "assistant");
                                if (hasAssistantAfterSame) {
                                    return res.status(204).end();
                                }
                            }
                        }
                    }
                }

                workingMessages = [...previous, message];
            } catch {
                workingMessages = [message];
            }
        } else {
            workingMessages = incomingMessages as UIMessage[];
        }

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
            messages: convertToModelMessages(workingMessages),
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
                // checkout tools
                addPaymentMethod: addPaymentMethod,
                changePaymentMethod: changePaymentMethod,
                removePaymentMethod: removePaymentMethod,
                addShippingAddress: addShippingAddress,
                changeShippingAddress: changeShippingAddress,
                removeShippingAddress: removeShippingAddress,
                // finalize purchase tool
                finalizePurchase: finalizePurchase,
            } as any),
        });

        // Persist on completion (even if client disconnects)
        result.consumeStream();

        // Convert to Response object and pipe to Express response
        const response = result.toUIMessageStreamResponse({
            originalMessages: workingMessages,
            onFinish: ({ messages }) => {
                if (chatId) {
                    saveChat({ chatId, messages });
                }
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
