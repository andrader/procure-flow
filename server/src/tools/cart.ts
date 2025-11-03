import { tool } from "ai";
import { z } from "zod";
import { products } from "../data.js";

// add_to_cart function (migrated & renamed from addToCartTool)
export async function add_to_cart({
  item_id,
  quantity = 1,
}: {
  item_id: string;
  quantity?: number;
}) {
  console.log(`[Tool] add_to_cart item_id=${item_id} quantity=${quantity}`);
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
}

// Tool wrapper for add_to_cart
export const add_to_cart_tool = tool({
  description: "Add an item to the cart with an optional quantity (defaults to 1).",
  inputSchema: z.object({
    item_id: z.string().describe("Product id to add"),
    quantity: z.number().int().min(1).max(999).default(1).describe("Quantity to add"),
  }),
  async execute({ item_id, quantity }: { item_id: string; quantity: number }) {
    return add_to_cart({ item_id, quantity });
  },
});

// remove_from_cart(item_id, quantity) -> client-managed cart; return structured intent
export const remove_from_cart = tool({
  description: "Remove an item (or quantity) from the cart. Client will perform the actual removal.",
  inputSchema: z.object({
    item_id: z.string().describe("Product id to remove"),
    quantity: z.number().int().min(1).max(999).default(1).describe("Quantity to remove"),
  }),
  async execute({ item_id, quantity }: { item_id: string; quantity: number }) {
    const product = products.find((p) => p.id === item_id);
    if (!product) {
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

// view_cart() -> signal client to show cart UI
export const view_cart = tool({
  description: "View the current cart. Signals the client UI to open the cart sidebar/panel.",
  inputSchema: z.object({}).describe("No input"),
  async execute() {
    return { success: true as const, action: "view" as const, message: "Opening cart" };
  },
});
