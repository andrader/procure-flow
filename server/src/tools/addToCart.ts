import { products } from "../data.js";

// Tool function: Add product to cart (returns data for client to update cart)
export async function addToCartTool({
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
