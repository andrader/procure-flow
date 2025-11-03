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
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

type SharedPromptInputProps = {
  onSubmit: (message: PromptInputMessage, e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
};

export function SharedPromptInput({
  onSubmit,
  textareaRef,
  placeholder = "Search or register new products, add to cart and buy, or ask anything...",
  accept,
  multiple,
}: SharedPromptInputProps) {
  return (
    <PromptInput onSubmit={onSubmit} accept={accept} multiple={multiple}>
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
  );
}
