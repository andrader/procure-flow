import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import RegisterPage from "./pages/Register";
import CheckoutPage from "./pages/Checkout";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/CartSidebar";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function CartSidebarHost() {
  const { isOpen, open, close, cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  return (
    <CartSidebar
      open={isOpen}
      onOpenChange={(o) => (o ? open() : close())}
      cart={cart}
      onRemoveFromCart={removeFromCart}
      onCheckout={() => {
        close();
        navigate("/checkout");
      }}
    />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global Cart Sidebar mounted once inside Router */}
          <CartSidebarHost />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
