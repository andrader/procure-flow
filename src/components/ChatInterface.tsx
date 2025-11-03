import { useState, useRef, useEffect } from "react";
import axios from "axios";
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
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputProvider,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputSpeechButton,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { useStickToBottomContext } from "use-stick-to-bottom";

// Chat message model with strong typing for assistant payloads
type BaseMessage = {
  id: string;
  content: string;
};

type UserMessage = BaseMessage & {
  role: "user";
};

type AssistantTextMessage = BaseMessage & {
  role: "assistant";
  type?: "text"; // default assistant text message
};

type AssistantProductsMessage = BaseMessage & {
  role: "assistant";
  type: "products";
  data: Product[];
};

type Message = UserMessage | AssistantTextMessage | AssistantProductsMessage;

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
function AutoScroll({ messages }: { messages: Message[] }) {
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
  const [messages, setMessages] = useState<Message[]>([]);
  const { cart, addToCart, open: openCart } = useCart();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Type guard to narrow assistant product messages
  const isProductsMessage = (
    m: Message
  ): m is AssistantProductsMessage => m.role === "assistant" && m.type === "products";

  const handleSubmit = async (
    message: PromptInputMessage,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    if (!message.text?.trim() && (!message.files || message.files.length === 0)) return;

    const userMessage: UserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.text || "",
    };

    setMessages((prev) => [...prev, userMessage]);

    // Call backend to search products
    try {
      const res = await axios.get(`${API_BASE}/api/products`, {
        params: { q: message.text || "" },
      });
      const data: Product[] = Array.isArray(res.data?.data) ? res.data.data : [];
      const aiMessage: AssistantProductsMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I found ${data.length} items matching "${message.text || ""}"`,
        type: "products",
        data,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      // Fallback message
      // eslint-disable-next-line no-console
      console.error("Search error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't search the catalog right now.",
        },
      ]);
    }
  };

  const onRegistered = (product?: Product) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: product
          ? `Item "${product.name}" has been registered successfully and is pending approval.`
          : "Item registered.",
      },
    ]);
    setRegisterOpen(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages Area */}
      <Conversation>
        <AutoScroll messages={messages} />
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="Welcome to ProcureFlow"
            description="How Can I Assist You Today?"
            className="max-w-2xl mx-auto"
          >
            <div className="space-y-8">
              {/* Orbital Gradient */}
              <div className="relative mx-auto w-40 h-40 mb-8">
                <div className="absolute inset-0 gradient-orb rounded-full shadow-glow animate-pulse"></div>
                <div className="absolute inset-4 bg-background rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/50 rounded-full"></div>
              </div>

              {/* Greeting */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground">
                  Welcome to ProcureFlow
                </h1>
                <p className="text-3xl font-medium">
                  How Can I{" "}
                  <span className="text-accent">Assist You Today</span>?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-12 max-w-lg mx-auto">
                <Button
                  variant="action"
                  className="h-auto py-4 px-5 flex-col items-start gap-2"
                  onClick={() => textInput.setInput("Show me USB-C cables")}
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
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
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
          </ConversationEmptyState>
        ) : (
          <ConversationContent>
            <div className="w-full px-4 md:px-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "user" ? (
                    <div className="max-w-2xl rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                      <p>{message.content}</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-full space-y-3">
                      <p className="text-foreground">{message.content}</p>
                      {isProductsMessage(message) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                          {message.data.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={addToCart}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <PromptInput
              onSubmit={handleSubmit}
              accept="image/*"
              multiple
            >
              <PromptInputHeader>
                <PromptInputTools>
                  <PromptInputAttachments>
                    {(attachment) => (
                      <PromptInputAttachment data={attachment} />
                    )}
                  </PromptInputAttachments>
                </PromptInputTools>
              </PromptInputHeader>
              <PromptInputTextarea
                placeholder="Ask me anything..."
                ref={textareaRef}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <PromptInputSpeechButton textareaRef={textareaRef} />
                </PromptInputTools>
                <PromptInputSubmit />
              </PromptInputFooter>
            </PromptInput>

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
                Cart ({cart.length})
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
