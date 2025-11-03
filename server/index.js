import express from "express";
import { products, conversations, addProduct } from "./data.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 4000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Basic JSON and CORS middleware (no external deps required)
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Serve static files from the dist/ directory
app.use(express.static(path.join(__dirname, "../dist")));


// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", now: new Date().toISOString() });
});

// Products list
app.get("/api/products", (req, res) => {
  const qRaw = (req.query.q || "").toString();
  const q = qRaw.trim();
  if (q) {
    // Normalize a string: lowercase, replace non-alphanum with spaces, collapse spaces
    const normalize = (s) =>
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

    const filtered = products.filter((p) => {
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
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

// Conversations
app.get("/api/conversations", (req, res) => {
  res.json(conversations);
});

// Register new product (mock)
app.post("/api/register", (req, res) => {
  const payload = req.body || {};
  try {
    const product = addProduct(payload);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, error: (err && err.message) || "invalid" });
  }
});

// Checkout simulation
app.post("/api/checkout", (req, res) => {
  const { cart } = req.body || {};
  const total = Array.isArray(cart) ? cart.reduce((s, it) => s + (Number(it.price) || 0), 0) : 0;
  res.json({ success: true, message: `Order confirmed for ${Array.isArray(cart) ? cart.length : 0} items.`, total });
});



// For SPA routing (fallback for non-API routes)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
