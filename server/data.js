// Mocked data served by the Express backend
export const products = [
  {
    id: "1",
    name: "White keyboard with cable",
    category: "Electronics",
    description: "Sleek white keyboard with USB connection",
    price: 9.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "2",
    name: "White keyboard with cable - Desktop",
    category: "Electronics",
    description: "Modern white keyboard with USB connection for desktop use",
    price: 12.99,
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
  // Added from user request (translated to EN)
  {
    id: "4",
    name: "USB-C Cable (LDLrui USB 3.1 Gen 2)",
    category: "Electronics",
    description: "USB-C 3.1 Gen 2 to USB cable supporting fast Type‑C charging.",
    price: 3.99,
    status: "In Stock",
    images: [
      "https://m.media-amazon.com/images/I/61AGlGYVAUL.jpg",
    ],
  },
  {
    id: "5",
    name: "Das Keyboard Prime 13 (Cherry MX Brown)",
    category: "Electronics",
    description: "Wired backlit mechanical keyboard with Cherry MX Brown switches and clean white LED backlighting.",
    price: 37.99,
    status: "In Stock",
    images: [
      "https://m.media-amazon.com/images/I/71P1qq-w0oL.jpg",
    ],
  },
  {
    id: "6",
    name: "Bluetooth 5.0 & 2.4G Wireless Keyboard and Mouse Combo (Mini Multimedia)",
    category: "Electronics",
    description: "Compact wireless keyboard and mouse set supporting Bluetooth 5.0 and 2.4GHz connectivity.",
    price: 29.99,
    status: "In Stock",
    images: [
      "https://m.media-amazon.com/images/I/61i-q+ebSML._UF894,1000_QL80_.jpg",
    ],
  },
  {
    id: "7",
    name: "PCFort T2403 23.8\" Office Monitor",
    category: "Electronics",
    description: "23.8-inch Full HD 70Hz monitor with HDMI and VGA, adjustable angle, VESA mount.",
    price: 359.99,
    status: "In Stock",
    images: [
      "https://images1.kabum.com.br/produtos/fotos/503501/monitor-empresarial-pcfort-t2403-23-8-full-hd-70hz-hdmi-e-vga-angulo-ajustavel-vesa-t2403_1699979801_gg.jpg",
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
