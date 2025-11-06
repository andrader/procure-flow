import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Pin, PinOff, Plus, Minus } from "lucide-react";
import { useEffect } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

type CartItem = { product: Product; quantity: number };

type CartSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onIncrement?: (productId: string) => void;
  onDecrement?: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckout: () => void;
  pinned?: boolean;
  onTogglePinned?: () => void;
  onEscClose?: () => void;
};

export function CartSidebar({ 
  open, 
  onOpenChange, 
  cart, 
  onIncrement,
  onDecrement,
  onRemoveFromCart,
  onCheckout,
  pinned = false,
  onTogglePinned,
  onEscClose,
}: CartSidebarProps) {
  const cartTotal = cart.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);

  // When pinned, displace page content to make room for the sidebar.
  useEffect(() => {
    const applyPadding = () => {
      if (pinned && open) {
        // Only displace on sm and up; on mobile keep overlay behavior
        const isSmall = window.matchMedia("(max-width: 639px)").matches;
        document.body.style.paddingRight = isSmall ? "0px" : "400px";
      } else {
        document.body.style.paddingRight = "";
      }
    };
    applyPadding();
    window.addEventListener("resize", applyPadding);
    return () => {
      window.removeEventListener("resize", applyPadding);
      document.body.style.paddingRight = "";
    };
  }, [pinned, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] sm:max-w-[400px] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => {
          onEscClose?.();
        }}
      >
        <SheetHeader className="pr-10">{/** reserve space for the close X */}
        <div className="flex items-center gap-2">
            {/** Keep pin near the title to avoid overlapping with the Close X in the top-right */}
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({cart.reduce((s, ci) => s + ci.quantity, 0)})
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${pinned ? 'text-primary' : ''}`}
              aria-label={pinned ? 'Unpin cart' : 'Pin cart'}
              title={pinned ? 'Unpin cart' : 'Pin cart'}
              onClick={onTogglePinned}
            >
              {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </Button>
          </div>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-3">
                {cart.map((ci) => (
                  <Card key={ci.product.id}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <img 
                          src={ci.product.images[0]} 
                          alt={ci.product.name}
                          className="w-16 h-16 rounded object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{ci.product.name}</h4>
                          <p className="text-xs text-muted-foreground">{ci.product.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-bold text-primary">
                              ${(ci.product.price * ci.quantity).toFixed(2)}
                            </p>
                            <span className="text-xs text-muted-foreground">(${ci.quantity} × ${ci.product.price.toFixed(2)})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onDecrement?.(ci.product.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="w-9 text-center text-sm tabular-nums">{ci.quantity}</div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onIncrement?.(ci.product.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => onRemoveFromCart(ci.product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">${cartTotal.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  onCheckout();
                  onOpenChange(false);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
