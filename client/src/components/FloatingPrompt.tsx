import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PromptInputProvider, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { SharedPromptInput } from "@/components/ai-elements/shared-prompt-input";

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
      <div className="bg-background border rounded-lg shadow-xl p-2">
        <PromptInputProvider>
          <SharedPromptInput
            onSubmit={(message) => {
              onSubmit(message);
            }}
            textareaRef={textareaRef}
            placeholder={placeholder}
            accept="image/*"
            multiple
          />
          <div className="flex justify-end mt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </PromptInputProvider>
      </div>
    </div>
  );
}
