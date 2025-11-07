import express, { type Request, type Response, type NextFunction } from "express";
import { products, conversations, addProduct } from "./data.js";
import type { Product } from "@shared/types/product";
import { filterProductsByQuery } from "./lib/search.js";
import { handleChat } from "./handlers/chat.js";
import { transcribeHandler } from "./handlers/transcribe.js";
import { createChat, loadChat } from "./lib/chat-store.js";

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


// Health
app.get("/api/health", (req: Request, res: Response) => {
  console.log("Received /api/health request");
  res.json({ status: "ok", now: new Date().toISOString() });
});

// Products list
app.get("/api/products", (req: Request, res: Response) => {
  const qRaw = (req.query.q || "").toString();
  const q = qRaw.trim();
  let list: Product[] = [];
  if (q) {
    list = filterProductsByQuery(products as Product[], q);
  } else {
    list = products as Product[];
  }
  // Normalize output shape to the fields used by the UI
  const data = list.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    status: p.status,
    images: p.images || [],
  }));
  res.json({ count: data.length, data, ...(q ? { query: qRaw } : {}) });
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


// AI chat endpoint - streams UI messages compatible with @ai-sdk/react useChat
app.post("/api/chat", handleChat);

// Audio transcription endpoint (OpenAI Whisper)
app.post("/api/transcribe", transcribeHandler);

// Create a new chat and return its id
app.post("/api/chat/create", async (_req: Request, res: Response) => {
  try {
    const id = await createChat();
    res.json({ id });
  } catch (e) {
    console.error("/api/chat/create error", e);
    res.status(500).json({ error: "failed-to-create" });
  }
});

// Load chat history by id
app.get("/api/chat/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const messages = await loadChat(id);
    res.json({ messages });
  } catch (e) {
    res.status(404).json({ messages: [] });
  }
});



app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);

  // Optional: quick config guard
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY not set. AI chat endpoint will not work.");
  }
});
