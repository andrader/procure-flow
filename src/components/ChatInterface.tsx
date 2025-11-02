import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image as ImageIcon, Mic, ShoppingCart, Package, CreditCard, List, Upload, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCard } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "products" | "register" | "cart" | "checkout";
  data?: any;
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

const mockProducts: Product[] = [
  {
    id: "1",
    name: "USB-C Cable 2m",
    category: "Electronics",
    description: "High-speed USB-C charging cable with durable braided design",
    price: 12.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
      "https://images.unsplash.com/photo-1591290619762-c588f3286e8c?w=800&q=80",
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
    name: "USB-C to USB-A Adapter",
    category: "Electronics",
    description: "Connect USB-C devices to USB-A ports",
    price: 7.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
    ],
  },
  {
    id: "4",
    name: "USB-C Hub 4-Port",
    category: "Electronics",
    description: "Expand your connectivity with multiple ports",
    price: 34.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80",
      "https://images.unsplash.com/photo-1591290619762-c588f3286e8c?w=800&q=80",
    ],
  },
  {
    id: "5",
    name: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 24.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80",
    ],
  },
  {
    id: "6",
    name: "Mechanical Keyboard",
    category: "Electronics",
    description: "Premium mechanical keyboard with RGB lighting",
    price: 89.99,
    status: "In Stock",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80",
    ],
  },
];

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [showView, setShowView] = useState<"chat" | "register" | "checkout">("chat");
  const [cartOpen, setCartOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response with product search
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I found ${mockProducts.length} items matching "${input}"`,
        type: "products",
        data: mockProducts,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);

    setInput("");
  };

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now().toString(),
      name: registerForm.name,
      category: registerForm.category,
      description: registerForm.description,
      price: parseFloat(registerForm.price),
      status: "Pending Approval",
      images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80"],
    };
    
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Item "${newProduct.name}" has been registered successfully and is pending approval.`,
      },
    ]);
    
    setRegisterForm({ name: "", category: "", description: "", price: "" });
    setUploadedImages([]);
    setShowView("chat");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Order confirmed! ${cart.length} items totaling $${cart.reduce((sum, p) => sum + p.price, 0).toFixed(2)} will be processed.`,
      },
    ]);
    setCart([]);
    setShowView("chat");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Cart Sidebar */}
      <CartSidebar
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        onRemoveFromCart={removeFromCart}
        onCheckout={handleCheckout}
      />
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && showView === "chat" ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-2xl w-full text-center space-y-8">
              {/* Orbital Gradient */}
              <div className="relative mx-auto w-40 h-40 mb-8">
                <div className="absolute inset-0 gradient-orb rounded-full shadow-glow animate-pulse"></div>
                <div className="absolute inset-4 bg-background rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/50 rounded-full"></div>
              </div>

              {/* Greeting */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">
                  Welcome to ProcureFlow
                </h1>
                <p className="text-3xl font-medium">
                  How Can I{" "}
                  <span className="text-accent">Assist You Today</span>?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-12 max-w-lg mx-auto">
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setInput("Show me USB-C cables")}
                >
                  <List className="w-5 h-5" />
                  <span className="text-sm font-medium">Search Catalog</span>
                  <span className="text-xs text-muted-foreground">Find materials & services</span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setShowView("register")}
                >
                  <Package className="w-5 h-5" />
                  <span className="text-sm font-medium">Register Item</span>
                  <span className="text-xs text-muted-foreground">Add new procurement item</span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">View Cart</span>
                  <span className="text-xs text-muted-foreground">
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                  </span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setShowView("checkout")}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Smart Checkout</span>
                  <span className="text-xs text-muted-foreground">Process your order</span>
                </Button>
              </div>
            </div>
          </div>
        ) : showView === "register" ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setShowView("chat")}>
                ← Back to Chat
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">Register New Item</h2>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="e.g., USB-C Cable 2m"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={registerForm.category}
                      onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                      placeholder="e.g., Electronics"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={registerForm.description}
                      onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                      placeholder="Brief description of the item"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={registerForm.price}
                      onChange={(e) => setRegisterForm({ ...registerForm, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">Product Images</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("images")?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Images
                        </Button>
                      </div>
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={img}
                                alt={`Upload ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Register Item
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : showView === "checkout" ? (
          <div className="max-w-2xl mx-auto px-4">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setShowView("chat")}>
                ← Back to Chat
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-6">Checkout</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Order Summary</h3>
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between py-2">
                        <span>{item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${cart.reduce((sum, p) => sum + p.price, 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>
                    Confirm Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="w-full px-4 md:px-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "user" ? (
                  <div className="max-w-2xl rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                    <p>{message.content}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-full space-y-3">
                    <p className="text-foreground">{message.content}</p>
                    {message.type === "products" && message.data && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                        {message.data.map((product: Product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      {showView === "chat" && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-muted rounded-2xl border border-border focus-within:border-accent transition-smooth">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="min-h-[56px] max-h-32 bg-transparent border-0 resize-none focus-visible:ring-0 px-4 pt-4 pb-3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8">
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button type="submit" size="icon" className="w-8 h-8 rounded-lg">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 text-xs"
                onClick={() => setShowView("register")}
              >
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Register Item
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 text-xs"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Cart ({cart.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 text-xs"
                onClick={() => setShowView("checkout")}
                disabled={cart.length === 0}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
