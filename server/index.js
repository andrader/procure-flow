import express from "express";
import { products, conversations, addProduct } from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Basic JSON and CORS middleware (no external deps required)
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", now: new Date().toISOString() });
});

// Products list
app.get("/api/products", (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  if (q) {
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    return res.json({ count: filtered.length, data: filtered });
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
