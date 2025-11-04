import { tool } from "ai";
import { z } from "zod";
import { products } from "../data.js";

// add_to_cart tool
export const addToCart = tool({
  description: "Add a product to the user's shopping cart with an optional quantity.",
  inputSchema: z.object({
    item_id: z.string().describe("The catalog product id to add"),
    quantity: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(1)
      .describe("Quantity to add (defaults to 1)"),
  }),
  async execute({ item_id, quantity }: { item_id: string; quantity: number }) {
    console.log(`[Tool] addToCart item_id=${item_id} quantity=${quantity}`);
    const product = products.find((p) => p.id === item_id);
    if (!product) {
      return {
        success: false as const,
        message: `Product not found: ${item_id}`,
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
  },
});

// remove_from_cart(item_id, quantity) -> client-managed cart; return structured intent
export const removeFromCart = tool({
  description: "Remove an item (or quantity) from the cart. Client will perform the actual removal.",
  inputSchema: z.object({
    item_id: z.string().describe("Product id to remove"),
    quantity: z.number().int().min(1).max(999).default(1).describe("Quantity to remove"),
  }),
  async execute({ item_id, quantity }: { item_id: string; quantity: number }) {
    console.log(`[Tool] removeFromCart item_id=${item_id} quantity=${quantity}`);
    const product = products.find((p) => p.id === item_id);
    if (!product) {
      console.error(`[Tool] removeFromCart failed: Product not found: ${item_id}`);
      return { success: false as const, message: `Product not found: ${item_id}` };
    }
    
    const q = Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
    return {
      success: true as const,
      action: "remove" as const,
      message: `Removed ${q} × ${product.name} from cart`,
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
  },
});

// viewCart() -> signal client to show cart UI
export const viewCart = tool({
  description: "View the current cart. Signals the client UI to open the cart sidebar/panel.",
  inputSchema: z.object({}).describe("No input"),
  async execute() {
    console.log("[Tool] viewCart");
    return { success: true as const, action: "view" as const, message: "Opening cart" };
  },
});
