import {
  PromptInput,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputSpeechButton,
  PromptInputAttachments,
  PromptInputAttachment,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useProviderAttachments } from "@/components/ai-elements/prompt-input";
import { ImageIcon } from "lucide-react";
import { PromptInputButton } from "./prompt-input";
import type { ChatStatus } from "ai";

type SharedPromptInputProps = {
  onSubmit: (message: PromptInputMessage, e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  status?: ChatStatus;
};

export function SharedPromptInput({
  onSubmit,
  textareaRef,
  placeholder = "Search or register new products, add to cart and buy, or ask anything...",
  accept,
  multiple,
  status,
}: SharedPromptInputProps) {
  const attachments = useProviderAttachments();
  return (
    <PromptInput
      onSubmit={onSubmit}
      accept={accept}
      multiple={multiple}
      className="rounded-2xl md:rounded-3xl"
    >
      <PromptInputHeader>
        <PromptInputTools>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
        </PromptInputTools>
      </PromptInputHeader>
      <PromptInputTextarea placeholder={placeholder} ref={textareaRef} />
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputButton
            size="sm"
            variant="ghost"
            className="px-2"
            onClick={() => attachments.openFileDialog()}
            aria-label="Add pictures"
            title="Add pictures"
          >
            <ImageIcon className="size-4 mr-1.5" />
            Add pictures
          </PromptInputButton>
        </PromptInputTools>
        <div className="flex items-center gap-1">
          <PromptInputSpeechButton textareaRef={textareaRef} />
          <PromptInputSubmit status={status} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}
