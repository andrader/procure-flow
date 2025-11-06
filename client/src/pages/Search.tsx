import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { Sparkles } from "lucide-react";
import { FloatingPrompt } from "@/components/FloatingPrompt";
import { ChatWindow } from "@/components/ChatWindow";
import type { Product } from "@shared/types/product";

const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

const PAGE_SIZE = 12;

// modular AI Button
export function AIButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      // size="icon"
      className="h-20 w-20 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-125 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 group"
      onClick={onClick}
    >
      <Sparkles strokeWidth={1.5} className="!h-10 !w-10 transition-transform duration-300 group-hover:rotate-180" />
    </Button>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const pageParam = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>();

  // Fetch whenever q changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    axios
      .get(`${API_BASE}/api/products`, { params: q ? { q } : {} })
      .then((res) => {
        if (!mounted) return;
        const data = (res.data?.data || []) as Product[];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Search fetch error:", err);
        if (!mounted) return;
        setError("Failed to load products");
        setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [q]);

  // Pagination calculations
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageParam, totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const current = items.slice(start, start + PAGE_SIZE);

  const handlePageChange = (next: number) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("page", String(next));
    setParams(nextParams, { replace: false });
  };

  const title = useMemo(() => {
    if (q) return `Results for "${q}"`;
    return "All products";
  }, [q]);

  // Empty state: just show button to add new
  if (!loading && !error && total === 0) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col relative">
        <Header />
        <div className="flex-1 min-h-0">
          <div className="container mx-auto px-4 py-10 h-full">
            <div className="h-full grid place-items-center">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">No results {q ? `for "${q}"` : "found"}</h2>
                <p className="text-muted-foreground">Try a different search, or register a new item.</p>
                <div className="pt-2">
                  <Button size="lg" onClick={() => navigate("/register")}>Register new item</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Sparkle Button */}
        {!showChat && (
          <div className="fixed bottom-6 right-6 z-40">
            <AIButton onClick={() => setShowPrompt(!showPrompt)} />
          </div>
        )}

        {/* Floating Prompt Input */}
        <FloatingPrompt
          isOpen={showPrompt}
          onClose={() => setShowPrompt(false)}
          onSubmit={(message) => {
            console.log("AI Message:", message);
            setInitialChatMessage(message.text);
            setShowPrompt(false);
            setShowChat(true);
          }}
        />

        {/* Chat Window */}
        <ChatWindow
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setInitialChatMessage(undefined);
          }}
          onOpenFullPage={() => {
            // Navigate to full chat page (you can implement this route)
            navigate("/chat");
          }}
          initialMessage={initialChatMessage}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col relative">
      <Header />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `${total} result${total === 1 ? "" : "s"}`}</p>
            </div>
            <div>
              <Button onClick={() => navigate("/register")}>Register new</Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-destructive">{error}</div>
          )}

          {/* Grid of products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {current.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) handlePageChange(page - 1);
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1;
                    // show first, last, current +/- 1, and use ellipsis in between? Keep simple: show up to 7 pages around current
                    const show =
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 2 ||
                      (page <= 3 && p <= 5) ||
                      (page >= totalPages - 2 && p >= totalPages - 4);
                    if (!show) return null;
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) handlePageChange(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Floating Sparkle Button */}
      {!showChat && (
        <div className="fixed bottom-6 right-6 z-40">
          <AIButton onClick={() => setShowPrompt(!showPrompt)} />
        </div>
      )}

      {/* Floating Prompt Input */}
      <FloatingPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onSubmit={(message) => {
          console.log("AI Message:", message);
          setInitialChatMessage(message.text);
          setShowPrompt(false);
          setShowChat(true);
        }}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={showChat}
        onClose={() => {
          setShowChat(false);
          setInitialChatMessage(undefined);
        }}
        onOpenFullPage={() => {
          // Navigate to full chat page (you can implement this route)
          navigate("/chat");
        }}
        initialMessage={initialChatMessage}
      />
    </div>
  );
}
