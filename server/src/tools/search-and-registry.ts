import { tool } from "ai";
import { z } from "zod";
import { addProduct, products, type Product } from "../data.js";

// search_items function (migrated & renamed from searchProductsTool)
export async function search_items({ criteria }: { criteria: string }) {
  const query = criteria;
  console.log(`[Tool] Searching products for: "${query}"`);

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

  return {
    count: filtered.length,
    products: filtered.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      status: p.status,
      images: p.images || [],
    })),
    message:
      filtered.length === 0
        ? `No products found for "${query}"`
        : `Found ${filtered.length} product${filtered.length === 1 ? "" : "s"} matching "${query}"`,
  };
}

// Tool wrapper for search_items
export const search_items_tool = tool({
  description: "Search items in the procurement catalog by query criteria.",
  inputSchema: z.object({
    criteria: z.string().describe("Free text search criteria"),
  }),
  async execute({ criteria }: { criteria: string }) {
    return search_items({ criteria });
  },
});

// register_product(product_details) -> uses addProduct from data.ts
const ProductDetailsSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  status: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const register_product = tool({
  description: "Register a new product into the procurement catalog.",
  inputSchema: z.object({
    product_details: ProductDetailsSchema.describe("Product fields to register"),
  }),
  async execute({ product_details }: { product_details: z.infer<typeof ProductDetailsSchema> }) {
    // Remove undefined fields to satisfy exactOptionalPropertyTypes
    const cleaned = Object.fromEntries(
      Object.entries(product_details).filter(([, v]) => v !== undefined)
    ) as Partial<Product>;
    const product = addProduct(cleaned);
    return {
      success: true as const,
      message: `Registered new product: ${product.name}`,
      product,
    };
  },
});
