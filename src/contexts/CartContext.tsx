import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  pinned: boolean;
  togglePinned: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [pinned, setPinned] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("cart:pinned");
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  });

  // Persist pinned state
  const persistPinned = useCallback((value: boolean) => {
    try {
      localStorage.setItem("cart:pinned", JSON.stringify(value));
    } catch {
      // noop
    }
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.product.id === product.id);
      let next: CartItem[];
      if (idx >= 0) {
        next = prev.map((ci, i) =>
          i === idx ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      } else {
        next = [...prev, { product, quantity }];
      }
      // Open the cart when the first item is added
      if (prev.length === 0) {
        setIsOpen(true);
      }
      return next;
    });
  }, []);

  const increment = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.product.id === productId ? { ...ci, quantity: ci.quantity + 1 } : ci
      )
    );
  }, []);

  const decrement = useCallback((productId: string) => {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.product.id === productId ? { ...ci, quantity: ci.quantity - 1 } : ci
        )
        .filter((ci) => ci.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    // Always allow explicit close; protections against accidental dismiss
    // are handled at the component level (e.g., prevent outside clicks)
    setIsOpen(false);
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((v) => (pinned ? true : !v));
  }, [pinned]);

  const togglePinned = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      persistPinned(next);
      // If pinning on while closed, open it
      if (next) {
        setIsOpen(true);
      }
      return next;
    });
  }, [persistPinned]);

  const totalCount = useMemo(
    () => cart.reduce((sum, ci) => sum + ci.quantity, 0),
    [cart]
  );

  const totalAmount = useMemo(
    () => cart.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      increment,
      decrement,
      removeFromCart,
      clearCart,
      totalCount,
      totalAmount,
      isOpen,
      open,
      close,
      toggle,
      pinned,
      togglePinned,
    }),
    [
      cart,
      addToCart,
      increment,
      decrement,
      removeFromCart,
      clearCart,
      totalCount,
      totalAmount,
      isOpen,
      open,
      close,
      toggle,
      pinned,
      togglePinned,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
