// Mocked data served by the Express backend
export const products = [
  {
    id: "1",
    name: "USB-C Cable 2m",
    category: "Electronics",
    description: "High-speed USB-C charging cable with durable braided design",
    price: 12.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "2",
    name: "USB-C Cable 1m",
    category: "Electronics",
    description: "Compact USB-C cable for desktop use",
    price: 9.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "3",
    name: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 24.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
    ],
  },
];

export const conversations = {
  recent: [
    {
      id: "c1",
      title: "Order: USB-C Cables",
      snippet: "Ordered 20 units of USB-C Cable 2m",
      updatedAt: new Date().toISOString(),
    },
  ],
  older: [],
};

// helper to add a product
export function addProduct(payload) {
  const id = Date.now().toString();
  const product = {
    id,
    name: payload.name || "Unnamed Product",
    category: payload.category || "Uncategorized",
    description: payload.description || "",
    price: typeof payload.price === "number" ? payload.price : parseFloat(payload.price || 0) || 0,
    status: payload.status || "Pending Approval",
    images: payload.images || [],
  };
  products.push(product);
  return product;
}
