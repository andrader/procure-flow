import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

export function CheckoutPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { cart, clearCart, totalAmount } = useCart();

  const handleCheckout = async () => {
    try {
      // Flatten cart to an array of products for the mock API
      const flatCart = cart.flatMap((ci) => Array(ci.quantity).fill(ci.product));
      await axios.post(`${API_BASE}/api/checkout`, { cart: flatCart });
      clearCart();
      onSuccess?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Checkout error:", err);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6">Checkout</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Order Summary</h3>
            {cart.map((ci) => (
              <div key={ci.product.id} className="flex justify-between py-2">
                <span>
                  {ci.product.name}
                  <span className="text-muted-foreground"> × {ci.quantity}</span>
                </span>
                <span>${(ci.product.price * ci.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full" onClick={handleCheckout} disabled={cart.length === 0}>
            Confirm Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
