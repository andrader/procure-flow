import { Button } from "@/components/ui/button";
import { Bell, Moon, Sun, Settings, SquarePen, ShoppingCart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useMemo, useState } from "react";

export function Header() {
  const { open: openCart, totalCount } = useCart();
  const [isLight, setIsLight] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("theme");
      return saved === "light";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isLight) {
        root.classList.add("light");
        localStorage.setItem("theme", "light");
      } else {
        root.classList.remove("light");
        localStorage.setItem("theme", "dark");
      }
    } catch {
      // noop
    }
  }, [isLight]);
  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("new-chat"));
  };
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {/* New empty chat (icon-only) */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          aria-label="New chat"
          title="New chat"
          onClick={handleNewChat}
        >
          <SquarePen className="w-4 h-4" />
        </Button>
        <div className="relative">
          <Input
            placeholder="Search..."
            className="w-64 h-8 bg-muted border-0 pl-8 text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Cart button top-right */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 relative"
          aria-label="Open cart"
          title="Open cart"
          onClick={openCart}
        >
          <ShoppingCart className="w-4 h-4" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] leading-[18px] grid place-items-center px-1">
              {totalCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9" onClick={() => setIsLight((v) => !v)} aria-label="Toggle theme" title="Toggle theme">
          {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Settings className="w-4 h-4" />
        </Button>
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            TB
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
