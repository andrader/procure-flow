import * as React from "react";
import type { CartItem } from "@/contexts/CartContext";

export interface InlineCartViewProps {
  /** Items currently in the cart */
  cart: Readonly<CartItem[]>;
  /** Optional root className */
  className?: string;
  /** Custom empty-cart message */
  emptyText?: string;
  /** Whether to render the header row */
  showHeader?: boolean;
}

/**
 * InlineCartView
 *
 * Small, read-only cart snapshot suitable for tool outputs or summaries.
 *
 * Usage:
 * <InlineCartView cart={cart} live />
 */
export function InlineCartView({
  cart,
  className,
  emptyText = "Your cart is empty.",
  showHeader = true,
}: InlineCartViewProps) {
  const total = React.useMemo(
    () => cart.reduce((s, ci) => s + ci.product.price * ci.quantity, 0),
    [cart]
  );

  return (
    <div className={"w-full " + (className ?? "")}>
      <div className="max-w-2xl rounded-2xl px-4 py-3 border bg-background">
        {showHeader && (
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Cart</div>
          </div>
        )}
        {cart.length === 0 ? (
          <div className="text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {cart.map((ci) => (
              <div key={ci.product.id} className="flex items-center justify-between text-sm">
                <div className="truncate mr-2">{ci.product.name}</div>
                <div className="tabular-nums">× {ci.quantity}</div>
                <div className="tabular-nums ml-4">
                  ${((ci.product.price ?? 0) * ci.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            <div className="border-t pt-2 flex items-center justify-between text-sm font-medium">
              <div>Total</div>
              <div className="tabular-nums">${total.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InlineCartView;
