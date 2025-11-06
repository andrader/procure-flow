import * as React from "react";
import type { CartItem } from "@/contexts/CartContext";

export interface CheckoutSummaryProps {
  /** Cart items included in the summary */
  cart: Readonly<CartItem[]>;
  /** Whether snapshot is live */
  live?: boolean;
  /** Shipping address display string */
  shippingAddress?: string;
  /** Payment method display string */
  paymentMethod?: string;
  /** Current confirmation state */
  status?: "confirmed" | "canceled" | undefined;
  /** Called when user clicks confirm */
  onConfirm?: () => void;
  /** Called when user clicks cancel */
  onCancel?: () => void;
  /** Disabled when confirming with empty cart */
  disableConfirmIfEmpty?: boolean;
  className?: string;
}

/**
 * CheckoutSummary
 *
 * Read-only summary of the current cart with shipping/payment and confirm/cancel actions.
 * Extracted from ChatInterface tool-finalizePurchase output.
 *
 * Usage:
 * <CheckoutSummary cart={cart} live status={status} onConfirm={...} onCancel={...} />
 */
export function CheckoutSummary({
  cart,
  live = true,
  shippingAddress = "John Doe, 123 Main St, Springfield, USA",
  paymentMethod = "Visa •••• 4242",
  status,
  onConfirm,
  onCancel,
  disableConfirmIfEmpty = true,
  className,
}: CheckoutSummaryProps) {
  const total = React.useMemo(
    () => cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0),
    [cart]
  );
  const empty = cart.length === 0;
  return (
    <div className={"w-full space-y-3 " + (className ?? "")}>      
      <div className="flex items-center justify-between">
        <div className="font-medium">Checkout Summary</div>
        <span className={`text-xs ${live ? "text-emerald-600" : "text-amber-600"}`}>{live ? "Live snapshot" : "Stale view"}</span>
      </div>
      <div className="space-y-1 text-sm">
        {empty ? (
          <div className="text-muted-foreground">Your cart is empty.</div>
        ) : (
          cart.map((ci) => (
            <div key={ci.product.id} className="flex items-center justify-between">
              <div className="truncate mr-2">
                {ci.product.name} × {ci.quantity}
              </div>
              <div className="tabular-nums">
                ${((ci.product.price ?? 0) * ci.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
        <div className="border-t pt-2 flex items-center justify-between font-medium">
          <div>Total</div>
          <div className="tabular-nums">${total.toFixed(2)}</div>
        </div>
      </div>
      <div className="text-sm">
        <div className="mb-1 font-medium">Shipping Address</div>
        <div className="text-muted-foreground">{shippingAddress}</div>
      </div>
      <div className="text-sm">
        <div className="mb-1 font-medium">Payment Method</div>
        <div className="text-muted-foreground">{paymentMethod}</div>
      </div>
      {status ? (
        <div className={`text-sm ${status === "confirmed" ? "text-emerald-600" : "text-amber-600"}`}>          
          {status === "confirmed" ? "Order confirmed." : "Order canceled."}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm disabled:opacity-50"
            onClick={onConfirm}
            disabled={disableConfirmIfEmpty && empty}
          >
            Confirm
          </button>
          <button
            className="px-3 py-1.5 rounded-md border text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default CheckoutSummary;
