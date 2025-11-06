import { tool } from "ai";
import { z } from "zod";
import { addProduct, products } from "../data.js";
import type { Product } from "@shared/types/product";
import { filterProductsByQuery } from "../lib/search.js";

// search_items function
export const searchProducts = tool({
  description: "Search items in the procurement catalog by query.",
  inputSchema: z.object({
    query: z.string().describe("The search query to find products"),
  }),
  async execute({ query }: { query: string }) {

    console.log(`[Tool] Searching products for: "${query}"`);
    const filtered = filterProductsByQuery(products as Product[], query);

    console.log(`[Tool] Found ${filtered.length} products. Returning top 10.`);

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

export const registerProduct = tool({
  description: "Register a new product into the procurement catalog.",
  inputSchema: z.object({
    product_details: ProductDetailsSchema.describe("Product fields to register"),
  }),
  async execute({ product_details }: { product_details: z.infer<typeof ProductDetailsSchema> }) {
    // Remove undefined fields to satisfy exactOptionalPropertyTypes
    console.log("[Tool] Registering new product");
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
