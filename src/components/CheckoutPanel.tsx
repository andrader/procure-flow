import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

export function CheckoutPanel({ onSuccess }: { onSuccess?: () => void }) {
  const { cart, clearCart } = useCart();

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  const handleCheckout = async () => {
    try {
      await axios.post(`${API_BASE}/api/checkout`, { cart });
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
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between py-2">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
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
