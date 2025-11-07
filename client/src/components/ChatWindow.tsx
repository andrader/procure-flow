import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Minimize2, Maximize2, X, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInterface } from "@/components/ChatInterface";
import { Loader } from "@/components/ai-elements/loader";

type ChatWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: keep for compatibility, but navigation is handled internally with chat id */
  onOpenFullPage?: () => void;
  initialMessage?: string;
};

// Base URL for the API server
const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

export function ChatWindow({ isOpen, onClose, onOpenFullPage, initialMessage }: ChatWindowProps) {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mount state for safe updates across StrictMode effect replays
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create a chat id when the window opens
  useEffect(() => {
    if (!isOpen || chatId) return;
    let aborted = false;
    (async () => {
      setCreating(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/chat/create`, { method: "POST" });
        const data = await res.json();
        if (!aborted && mountedRef.current) {
          setChatId(data?.id ?? null);
        }
      } catch (e) {
        console.error("[ChatWindow] Failed to create chat id", e);
        if (!aborted && mountedRef.current) setError("Failed to start chat. Try again.");
      } finally {
        if (!aborted && mountedRef.current) setCreating(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [isOpen, chatId]);

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        "fixed bottom-6 right-6 w-96 shadow-2xl transition-all duration-300 z-50",
        isMinimized && "h-14"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold text-sm">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          {/* Always allow full-page open when a chat exists */}
          {chatId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                // Prefer internal navigation with the chat id to preserve history
                navigate(`/chat/${chatId}`);
                // Also call legacy callback if provided (no id param)
                onOpenFullPage?.();
              }}
              title="Open in full page"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[32rem]">
          {creating && (
            <div className="flex-1 grid place-items-center p-6 text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <Loader size={16} />
                <span>Starting chat…</span>
              </div>
            </div>
          )}
          {!creating && error && (
            <div className="flex-1 grid place-items-center p-6 text-destructive text-sm">
              {error}
            </div>
          )}
          {!creating && !error && chatId && (
            <div className="h-full min-h-0">
              <ChatInterface
                id={chatId}
                initialMessages={[]}
                initialSubmit={initialMessage ? { text: initialMessage } : undefined}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
