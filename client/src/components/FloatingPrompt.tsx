import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

type FloatingPromptProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: PromptInputMessage) => void | Promise<void>;
  placeholder?: string;
};

export function FloatingPrompt({
  isOpen,
  onClose,
  onSubmit,
  placeholder = "Ask AI to help you search...",
}: FloatingPromptProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <div className="bg-background border rounded-lg shadow-xl">
        <PromptInput
          onSubmit={(message) => {
            onSubmit(message);
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder={placeholder} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
