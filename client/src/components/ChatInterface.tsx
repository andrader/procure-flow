import { useState, useRef, useEffect, type FC, useRef as useReactRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { InlineCartView } from "@/components/chat-tools/InlineCartView";
import { CheckoutSummary } from "@/components/chat-tools/CheckoutSummary";
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

interface ChatInterfaceProps {
  /** Optional chat id for persistence */
  id?: string;
  /** Optional initial messages to hydrate the chat */
  initialMessages?: UIMessage[];
  /** Optional message to auto-send on mount (used when navigating from /chat to /chat/:id) */
  initialSubmit?: PromptInputMessage;
}

function ChatContent({ id, initialMessages, initialSubmit }: ChatInterfaceProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { textInput } = usePromptInputController();
  const { cart, open: openCart, totalCount, addToCart } = useCart();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const processedToolCalls = useRef<Set<string>>(new Set());
  const sentInitialRef = useReactRef(false);
  const seenMessageIds = useRef<Set<string>>(new Set((initialMessages ?? []).map((m) => m.id)));
  const [toolStatus, setToolStatus] = useState<Record<string, "confirmed" | "canceled" | undefined>>({});

  const { messages, sendMessage, status, setMessages } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${API_BASE}/api/chat`,
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  useEffect(() => {
    if (initialSubmit && !sentInitialRef.current) {
      const key = id ? `pf:init:${id}` : undefined;
      const payload = JSON.stringify({ t: initialSubmit.text ?? "", f: (initialSubmit.files ?? []).length });
      if (!key || sessionStorage.getItem(key) !== payload) {
        sentInitialRef.current = true;
        sendMessage({ text: initialSubmit.text ?? "", files: initialSubmit.files });
        textInput.setInput("");
        if (key) sessionStorage.setItem(key, payload);
      }
    }
  }, [id, initialSubmit, sendMessage, textInput, sentInitialRef]);

  useEffect(() => {
    for (const m of messages) seenMessageIds.current.add(m.id);
  }, [messages]);

  const handleSubmit = async (message: PromptInputMessage, e: React.FormEvent<HTMLFormElement>) => {
    if (!message.text?.trim() && (!message.files || message.files.length === 0)) return;
    if (!id) {
      try {
        const res = await fetch(`${API_BASE}/api/chat/create`, { method: "POST" });
        const data = await res.json();
        if (data.id) {
          navigate(`/chat/${data.id}`, { state: { initialSubmit: { text: message.text ?? "", files: message.files } } });
          return;
        }
      } catch (err) {
        console.error("[ChatInterface] Failed to create chat id", err);
      }
    }
    sendMessage({ text: message.text ?? "", files: message.files });
    textInput.setInput("");
  };

  const onRegistered = (product?: Product) => {
    setRegisterOpen(false);
    if (product) {
      sendMessage({ text: `I just registered a new item: ${product.name}. Can you confirm?` });
    }
  };

  useEffect(() => {
    const handler = () => {
      setMessages([]);
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
          <Conversation>
            <AutoScroll messages={messages} />
            <ConversationContent>
              <div className="w-full px-4 md:px-6 space-y-6">
                {messages.map((message) => {
                  const isNewMsg = !seenMessageIds.current.has(message.id);
                  const inside: ReactNode[] = [];
                  const outside: ReactNode[] = [];

                  if (message.role === "user") {
                    message.parts.forEach((part, i) => {
                      switch (part.type) {
                        case "text":
                          inside.push(<p key={i}>{part.text}</p>);
                          break;
                        case "file": {
                          const media: string | undefined =
                            "mediaType" in part ? (part as { mediaType?: string }).mediaType : undefined;
                          if (media?.startsWith("image/")) {
                            inside.push(<img key={i} src={part.url} alt={part.filename ?? "uploaded image"} className="max-w-xs rounded-lg mt-2" />);
                          } else if (media?.startsWith("audio/")) {
                            inside.push(
                              <audio key={i} controls className="w-full max-w-xs mt-2">
                                <source src={part.url} type={media} />
                                Your browser does not support the audio element.
                              </audio>
                            );
                          } else {
                            inside.push(
                              <a key={i} href={part.url} target="_blank" rel="noreferrer" className="underline mt-2 inline-block">
                                {part.filename ?? "attachment"}
                              </a>
                            );
                          }
                          break;
                        }
                        default:
                          break;
                      }
                    });
                  } else {
                    message.parts.forEach((part, i) => {
                      switch (part.type) {
                        case "text":
                          inside.push(<Response key={i}>{part.text}</Response>);
                          break;
                        case "reasoning":
                          inside.push(<pre key={i} className="text-xs opacity-70 whitespace-pre-wrap">{part.text}</pre>);
                          break;
                        case "file": {
                          const media: string | undefined =
                            "mediaType" in part ? (part as { mediaType?: string }).mediaType : undefined;
                          if (media?.startsWith("image/")) {
                            inside.push(<img key={i} src={part.url} alt={part.filename ?? "image"} className="max-w-xs rounded-lg mt-2" />);
                          } else if (media?.startsWith("audio/")) {
                            inside.push(
                              <audio key={i} controls className="w-full max-w-xs mt-2">
                                <source src={part.url} type={media} />
                                Your browser does not support the audio element.
                              </audio>
                            );
                          } else {
                            inside.push(
                              <a key={i} href={part.url} target="_blank" rel="noreferrer" className="underline mt-2 inline-block">
                                {part.filename ?? "attachment"}
                              </a>
                            );
                          }
                          break;
                        }
                        case "tool-searchProducts": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="searchProducts" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && <ToolInput input={part.input} />}
                                {(part.state === "output-available" || part.state === "output-error") && (
                                  <ToolOutput output={part.output} errorText={part.errorText} />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          if (part.state === "output-available") {
                            const output = part.output as { count: number; products: Product[]; message: string };
                            if (output.products?.length) {
                              outside.push(
                                <div key={`grid-${callId}-${i}`} className="w-full">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full mt-2">
                                    {output.products.map((product) => (
                                      <ProductCard key={product.id} product={product} />
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          }
                          break;
                        }
                        case "tool-addToCart": {
                          const callId = part.toolCallId;
                          if (part.state === "output-available" && !processedToolCalls.current.has(callId) && isNewMsg) {
                            const output = part.output as
                              | { success: true; message: string; quantity: number; product: Product }
                              | { success: false; message: string };
                            if (output && "success" in output && output.success) {
                              try {
                                const ok = output as { success: true; quantity: number; product: Product };
                                addToCart(ok.product, ok.quantity);
                              } finally {
                                processedToolCalls.current.add(callId);
                              }
                            }
                          }
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="addToCart" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && <ToolInput input={part.input} />}
                                {(part.state === "output-available" || part.state === "output-error") && (
                                  <ToolOutput output={part.output} errorText={part.errorText} />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-removeFromCart": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="removeFromCart" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && <ToolInput input={part.input} />}
                                {(part.state === "output-available" || part.state === "output-error") && (
                                  <ToolOutput output={part.output} errorText={part.errorText} />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-viewCart": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="viewCart" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "output-available" && (
                                  <InlineCartView cart={cart} live={isNewMsg} />
                                )}
                                {part.state === "output-error" && (
                                  <div className="text-sm text-destructive">Error: {part.errorText}</div>
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-registerProduct": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="registerProduct" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && (
                                  <div className="text-sm text-muted-foreground italic">Registering new product...</div>
                                )}
                                {part.state === "output-available" && (
                                  <div>
                                    {(() => {
                                      const output = part.output as { success: boolean; message: string; product?: Product };
                                      return (
                                        <>
                                          <div className="text-sm mb-2">{output.message}</div>
                                          {output.product && (
                                            <div className="mt-2">
                                              <ProductCard product={output.product} />
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                                {part.state === "output-error" && (
                                  <div className="text-sm text-destructive">Failed to register product: {part.errorText}</div>
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-addPaymentMethod":
                        case "tool-changePaymentMethod":
                        case "tool-removePaymentMethod": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title={part.type.replace("tool-", "")} type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && <ToolInput input={part.input} />}
                                {(part.state === "output-available" || part.state === "output-error") && (
                                  <ToolOutput output={part.output} errorText={part.errorText} />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-addShippingAddress":
                        case "tool-changeShippingAddress":
                        case "tool-removeShippingAddress": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title={part.type.replace("tool-", "")} type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && <ToolInput input={part.input} />}
                                {(part.state === "output-available" || part.state === "output-error") && (
                                  <ToolOutput output={part.output} errorText={part.errorText} />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        case "tool-finalizePurchase": {
                          const callId = part.toolCallId;
                          inside.push(
                            <Tool key={`tool-${callId}-${i}`}>
                              <ToolHeader title="finalizePurchase" type={part.type} state={part.state} />
                              <ToolContent>
                                {part.state === "input-available" && (
                                  <div className="text-sm text-muted-foreground italic">Preparing checkout...</div>
                                )}
                                {part.state === "output-available" && (
                                  <CheckoutSummary
                                    cart={cart}
                                    live={isNewMsg}
                                    status={toolStatus[callId]}
                                    onConfirm={() => setToolStatus((s) => ({ ...s, [callId]: "confirmed" }))}
                                    onCancel={() => setToolStatus((s) => ({ ...s, [callId]: "canceled" }))}
                                  />
                                )}
                                {part.state === "output-error" && (
                                  <div className="text-sm text-destructive">Error finalizing purchase: {part.errorText}</div>
                                )}
                              </ToolContent>
                            </Tool>
                          );
                          break;
                        }
                        default:
                          break;
                      }
                    });
                  }

                  return (
                    <Message key={message.id} from={message.role}>
                      <MessageContent>
                        {inside}
                      </MessageContent>
                      {outside.length > 0 && <div className="w-full mt-2 space-y-2">{outside}</div>}
                    </Message>
                  );
                })}
                
              </div>
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <SharedPromptInput onSubmit={handleSubmit} textareaRef={textareaRef} accept="image/*" multiple status={status} />
              <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" onClick={() => setRegisterOpen(true)}>
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Register Item
                </Button>
                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" onClick={() => openCart()}>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  Cart ({totalCount})
                </Button>
                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 md:px-6">
            <div className="max-w-3xl mx-auto h-full flex flex-col items-stretch justify-center py-8">
              <div className="space-y-8 text-center">
                <div className="relative mx-auto w-40 h-40 mb-4">
                  <div className="absolute inset-0 gradient-orb rounded-full shadow-glow animate-pulse"></div>
                  <div className="absolute inset-4 bg-background rounded-full"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/50 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl text-foreground">Welcome to <span className="text-accent font-bold">ProcureFlow</span></h1>
                  <p className="text-3xl font-medium">How can I <span className="text-accent">assist you today</span>?</p>
                </div>
              </div>
              <div className="mt-8">
                <SharedPromptInput onSubmit={handleSubmit} textareaRef={textareaRef} accept="image/*" multiple status={status} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button variant="action" className="h-auto py-4 px-5 flex-col items-start gap-2" onClick={() => textInput.setInput("Show me ")}>
                  <List className="w-5 h-5" />
                  <span className="text-sm font-medium">Search Catalog</span>
                  <span className="text-xs text-muted-foreground">Find materials & services</span>
                </Button>
                <Button variant="action" className="h-auto py-4 px-5 flex-col items-start gap-2" onClick={() => setRegisterOpen(true)}>
                  <Package className="w-5 h-5" />
                  <span className="text-sm font-medium">Register Item</span>
                  <span className="text-xs text-muted-foreground">Add new procurement item</span>
                </Button>
                <Button variant="action" className="h-auto py-4 px-5 flex-col items-start gap-2" onClick={() => openCart()}>
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">View Cart</span>
                  <span className="text-xs text-muted-foreground">{totalCount} item{totalCount !== 1 ? "s" : ""}</span>
                </Button>
                <Button variant="action" className="h-auto py-4 px-5 flex-col items-start gap-2" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">Smart Checkout</span>
                  <span className="text-xs text-muted-foreground">Process your order</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export const ChatInterface: FC<ChatInterfaceProps> = (props) => {
  return (
    <PromptInputProvider>
      <ChatContent {...props} />
    </PromptInputProvider>
  );
};
