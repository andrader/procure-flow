import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Minimize2,
  Maximize2,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: () => void;
  initialMessage?: string;
};

export function ChatWindow({
  isOpen,
  onClose,
  onOpenFullPage,
  initialMessage,
}: ChatWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessage) {
      return [
        {
          id: "1",
          role: "user",
          content: initialMessage,
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: "I'm processing your request. How can I help you further?",
          timestamp: new Date(),
        },
      ];
    }
    return [];
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message.text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Thank you for your message. I'm here to help!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

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
          {onOpenFullPage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onOpenFullPage}
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
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
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
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with AI</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-2">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  placeholder="Type your message..."
                  className="min-h-[60px] max-h-32"
                />
              </PromptInputBody>
              <PromptInputFooter>
                <div />
                <PromptInputSubmit />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
