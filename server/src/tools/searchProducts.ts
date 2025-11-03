import { products, type Product } from "../data.js";

// Tool function: Search products in the catalog
export async function searchProductsTool({ query }: { query: string }) {
  console.log(`[Tool] Searching products for: "${query}"`);

  // Normalize search logic (same as GET /api/products)
  const normalize = (s: string | undefined): string =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const STOPWORDS = new Set([
    "show",
    "me",
    "find",
    "finds",
    "please",
    "items",
    "item",
    "matching",
    "the",
    "a",
    "an",
    "for",
  ]);

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
    products: filtered.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      status: p.status,
      images: p.images || [], // Include images array
    })),
    message:
      filtered.length === 0
        ? `No products found for "${query}"`
        : `Found ${filtered.length} product${filtered.length === 1 ? "" : "s"} matching "${query}"`,
  };
}
