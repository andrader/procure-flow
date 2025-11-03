import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, CreditCard, List } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegisterItemForm } from "@/components/RegisterItemForm";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { useCart } from "@/contexts/CartContext";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInputProvider,
  type PromptInputMessage,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { SharedPromptInput } from "@/components/ai-elements/shared-prompt-input";
import { useStickToBottomContext } from "use-stick-to-bottom";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: string;
  images: string[];
};

// Base URL for the mock API server
const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

// Helper component to access scroll context inside Conversation
function AutoScroll({ messages }: { messages: UIMessage[] }) {
  const { scrollToBottom } = useStickToBottomContext();

  useEffect(() => {
    if (messages.length > 0) {
      // Use a small delay to ensure DOM has updated and images start loading
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  return null;
}

function ChatContent() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { textInput } = usePromptInputController();
  const { cart, open: openCart, totalCount } = useCart();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // AI chat hook with proper streaming configuration
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_BASE}/api/chat`,
    }),
  });

  const handleSubmit = async (
    message: PromptInputMessage,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    if (!message.text?.trim() && (!message.files || message.files.length === 0)) return;

    // Send message to AI - useChat will handle adding it to messages automatically
    sendMessage({ text: message.text ?? "", files: message.files });
    
    // Clear the input immediately after submitting
    textInput.setInput("");

    // Optionally search products in parallel for better UX
    if (message.text?.trim()) {
      try {
        await axios.get(`${API_BASE}/api/products`, {
          params: { q: message.text },
        });
        // Product results could be handled via tool calling or custom data parts
        // For now, we let the AI assistant provide guidance
      } catch (err) {
        console.error("Product search error:", err);
      }
    }
  };

  const onRegistered = (product?: Product) => {
    // Instead of manually adding a message, we could send a message to the AI
    // For now, keep the UX simple with a notification
    setRegisterOpen(false);
    // Optionally notify the AI about the registration
    if (product) {
      sendMessage({ 
        text: `I just registered a new item: ${product.name}. Can you confirm?` 
      });
    }
  };

  // Listen for global "new-chat" event from Header to reset the conversation
  useEffect(() => {
    const handler = () => {
      // Clear all messages to start a new chat
      setMessages([]);
      // Clear input if present
      textInput.setInput("");
    };
    window.addEventListener("new-chat", handler);
    return () => window.removeEventListener("new-chat", handler);
  }, [setMessages, textInput]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {hasMessages ? (
        <>
          {/* Messages Area */}
          <Conversation>
            <AutoScroll messages={messages} />
            <ConversationContent>
              <div className="w-full px-4 md:px-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "user" ? (
                      <div className="max-w-2xl rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                        {message.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return <p key={i}>{part.text}</p>;
                            case "file":
                              return (
                                <img 
                                  key={i} 
                                  src={part.url} 
                                  alt={part.filename ?? "uploaded image"}
                                  className="max-w-xs rounded-lg mt-2"
                                />
                              );
                            default:
                              return null;
                          }
                        })}
                      </div>
                    ) : (
                      <div className="w-full max-w-full space-y-3">
                        <div className="max-w-2xl rounded-2xl px-4 py-3 bg-muted text-foreground">
                          {message.parts.map((part, i) => {
                            switch (part.type) {
                              case "text":
                                return <p key={i}>{part.text}</p>;
                              case "reasoning":
                                return (
                                  <pre key={i} className="text-xs opacity-70 whitespace-pre-wrap">
                                    {part.text}
                                  </pre>
                                );
                              case "file":
                                return (
                                  <img 
                                    key={i} 
                                    src={part.url} 
                                    alt={part.filename ?? "generated image"}
                                    className="max-w-xs rounded-lg mt-2"
                                  />
                                );
                              default:
                                return null;
                            }
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(status === "streaming" || status === "submitted") && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl rounded-2xl px-4 py-3 bg-muted">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Input at bottom when there are messages */}
          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <SharedPromptInput
                onSubmit={handleSubmit}
                textareaRef={textareaRef}
                accept="image/*"
                multiple
                status={status}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 text-xs"
                  onClick={() => setRegisterOpen(true)}
                >
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Register Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 text-xs"
                  onClick={() => openCart()}
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Cart ({totalCount})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 text-xs"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Initial state: hero at top of column, chat input centered, suggestions directly under input
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 md:px-6">
            <div className="max-w-3xl mx-auto h-full flex flex-col items-stretch justify-center py-8">
              {/* Hero (Welcome to ProcureFlow) */}
              <div className="space-y-8 text-center">
                {/* Orbital Gradient */}
                <div className="relative mx-auto w-40 h-40 mb-4">
                  <div className="absolute inset-0 gradient-orb rounded-full shadow-glow animate-pulse"></div>
                  <div className="absolute inset-4 bg-background rounded-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/50 rounded-full"></div>
                </div>
                {/* Greeting */}
                <div className="space-y-3">
                  <h1 className="text-4xl text-foreground">Welcome to <span className="text-accent font-bold">ProcureFlow</span></h1>
                  <p className="text-3xl font-medium">
                    How can I <span className="text-accent">assist you today</span>?
                  </p>
                </div>
              </div>

              {/* Chat input (centered by container) */}
              <div className="mt-8">
                <SharedPromptInput
                  onSubmit={handleSubmit}
                  textareaRef={textareaRef}
                  accept="image/*"
                  multiple
                  status={status}
                />
              </div>

              {/* Suggestion cards directly under the chat input */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => textInput.setInput("Show me ")}
                >
                  <List className="w-5 h-5" />
                  <span className="text-sm font-medium">Search Catalog</span>
                  <span className="text-xs text-muted-foreground">Find materials & services</span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setRegisterOpen(true)}
                >
                  <Package className="w-5 h-5" />
                  <span className="text-sm font-medium">Register Item</span>
                  <span className="text-xs text-muted-foreground">Add new procurement item</span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => openCart()}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">View Cart</span>
                  <span className="text-xs text-muted-foreground">
                    {totalCount} item{totalCount !== 1 ? "s" : ""}
                  </span>
                </Button>
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Smart Checkout</span>
                  <span className="text-xs text-muted-foreground">Process your order</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register New Item</DialogTitle>
          </DialogHeader>
          <RegisterItemForm onSuccess={onRegistered} showTitle={false} />
        </DialogContent>
      </Dialog>
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <CheckoutPanel onSuccess={() => setCheckoutOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ChatInterface() {
  return (
    <PromptInputProvider>
      <ChatContent />
    </PromptInputProvider>
  );
}
