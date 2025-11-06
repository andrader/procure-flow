import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useRef } from "react";
import Index from "./pages/Index";
import RegisterPage from "./pages/Register";
import CheckoutPage from "./pages/Checkout";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CartSidebar } from "@/components/CartSidebar";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/Search";
import ChatPage from "./pages/Chat";
import ChatIdPage from "./pages/ChatId";

const queryClient = new QueryClient();

function CartSidebarHost() {
  const { isOpen, open, close, cart, removeFromCart, increment, decrement, pinned, togglePinned } = useCart();
  const navigate = useNavigate();
  const escCloseRef = useRef(false);
  return (
    <CartSidebar
      open={isOpen}
      onOpenChange={(o) => {
        if (o) return open();
        // If close came from ESC, close without unpinning
        if (escCloseRef.current) {
          escCloseRef.current = false;
          return close();
        }
        // If user clicks the close X while pinned, unpin then close
        if (pinned) togglePinned();
        return close();
      }}
      cart={cart}
      onIncrement={increment}
      onDecrement={decrement}
      onRemoveFromCart={removeFromCart}
      onCheckout={() => {
        // On checkout, force close and do not change pin state
        close();
        navigate("/checkout");
      }}
      pinned={pinned}
      onTogglePinned={togglePinned}
      onEscClose={() => {
        escCloseRef.current = true;
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
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatIdPage />} />
            <Route path="/search" element={<SearchPage />} />
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
