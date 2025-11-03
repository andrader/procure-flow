import express, { type Request, type Response, type NextFunction } from "express";
import { products, conversations, addProduct, type Product } from "./data.js";
import { convertToModelMessages, streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import path from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic JSON and CORS middleware (no external deps required)
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  // Allow common methods
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  // Reflect requested headers if present, otherwise allow a safe superset
  const requested = req.header("Access-Control-Request-Headers");
  if (requested) {
    res.setHeader("Access-Control-Allow-Headers", requested);
    res.setHeader("Vary", "Origin, Access-Control-Request-Headers");
  } else {
    res.setHeader(
      "Access-Control-Allow-Headers",
      [
        "Content-Type",
        "Authorization",
        "User-Agent",
        "Accept",
        "Accept-Language",
        "Cache-Control",
        "Pragma",
        "X-Requested-With",
        // AI SDK / streaming related headers (future-proof)
        "AI-Data-Stream-Version",
        "X-Data-Stream-Version",
      ].join(", ")
    );
    res.setHeader("Vary", "Origin");
  }

  // Short-circuit preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve static files from the dist/ directory
app.use(express.static(path.join(__dirname, "../../dist")));

// Health
app.get("/api/health", (req: Request, res: Response) => {
  console.log("Received /api/health request");
  res.json({ status: "ok", now: new Date().toISOString() });
});

// Products list
app.get("/api/products", (req: Request, res: Response) => {
  const qRaw = (req.query.q || "").toString();
  const q = qRaw.trim();
  if (q) {
    // Normalize a string: lowercase, replace non-alphanum with spaces, collapse spaces
    const normalize = (s: string | undefined): string =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");

    // Basic stopwords to ignore from casual queries like "show me" etc.
    const STOPWORDS = new Set(["show", "me", "find", "finds", "please", "items", "item", "matching", "the", "a", "an", "for"]);

    const tokens = normalize(q)
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t && !STOPWORDS.has(t));

    const filtered = products.filter((p: Product) => {
      const hay = normalize([p.name, p.description, p.category].filter(Boolean).join(" "));
      // every token must appear in the haystack (allow simple plural match)
      return tokens.every((tok) => {
        if (!tok) return true;
        if (hay.includes(tok)) return true;
        // naive plural handling: if token ends with 's', try without it
        if (tok.endsWith("s") && hay.includes(tok.slice(0, -1))) return true;
        // if token is two-char like 'usb' and next token is 'c', also accept combined 'usb c' matching
        return false;
      });
    });

    return res.json({ count: filtered.length, data: filtered, query: qRaw });
  }
  res.json({ count: products.length, data: products });
});

// Product detail
app.get("/api/products/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// Conversations
app.get("/api/conversations", (req: Request, res: Response) => {
  res.json(conversations);
});

// Register new product (mock)
app.post("/api/register", (req: Request, res: Response) => {
  const payload = req.body || {};
  try {
    const product = addProduct(payload);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: (err && (err as Error).message) || "invalid" });
  }
});

// Checkout simulation
app.post("/api/checkout", (req: Request, res: Response) => {
  const { cart } = req.body || {};
  const total = Array.isArray(cart) ? cart.reduce((s, it) => s + (Number(it.price) || 0), 0) : 0;
  res.json({ success: true, message: `Order confirmed for ${Array.isArray(cart) ? cart.length : 0} items.`, total });
});

// Tool function: Search products in the catalog
async function searchProductsTool({ query }: { query: string }) {
  console.log(`[Tool] Searching products for: "${query}"`);
  
  // Normalize search logic (same as GET /api/products)
  const normalize = (s: string | undefined): string =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const STOPWORDS = new Set(["show", "me", "find", "finds", "please", "items", "item", "matching", "the", "a", "an", "for"]);

  const tokens = normalize(query)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t));

  const filtered = products.filter((p: Product) => {
    const hay = normalize([p.name, p.description, p.category].filter(Boolean).join(" "));
    return tokens.every((tok) => {
      if (!tok) return true;
      if (hay.includes(tok)) return true;
      if (tok.endsWith("s") && hay.includes(tok.slice(0, -1))) return true;
      return false;
    });
  });

  console.log(`[Tool] Found ${filtered.length} products`);

  // Return structured data that the AI can use
  return {
    count: filtered.length,
    products: filtered.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      status: p.status,
      images: p.images || [], // Include images array
    })),
    message: filtered.length === 0 
      ? `No products found for "${query}"`
      : `Found ${filtered.length} product${filtered.length === 1 ? '' : 's'} matching "${query}"`,
  };
}

// Tool function: Add product to cart (returns data for client to update cart)
async function addToCartTool({
  productId,
  quantity = 1,
}: {
  productId: string;
  quantity?: number;
}) {
  console.log(`[Tool] addToCart productId=${productId} quantity=${quantity}`);
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return {
      success: false as const,
      message: `Product not found: ${productId}`,
    };
  }
  const q = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
  return {
    success: true as const,
    message: `Added ${q} × ${product.name} to cart`,
    quantity: q,
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      status: product.status,
      images: product.images || [],
    },
  };
}

// AI chat endpoint - streams UI messages compatible with @ai-sdk/react useChat
app.post("/api/chat", async (req: Request, res: Response) => {
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
          description: 'Search for products in the procurement catalog. Use this when users ask about items, materials, equipment, or want to find something.',
          inputSchema: z.object({
            query: z.string().describe('The search query to find products'),
          }),
          execute: searchProductsTool,
        }),
        addToCart: tool({
          description: 'Add a product to the user\'s shopping cart with an optional quantity.',
          inputSchema: z.object({
            productId: z.string().describe('The catalog product id to add'),
            quantity: z
              .number()
              .int()
              .min(1)
              .max(999)
              .default(1)
              .describe('Quantity to add (defaults to 1)'),
          }),
          execute: addToCartTool,
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
});

// For SPA routing (fallback for non-API routes)
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../dist", "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);

  // Optional: quick config guard
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY not set. AI chat endpoint will not work.");
  }
});
