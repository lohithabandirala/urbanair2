import type { Dictionary } from "@/lib/i18n";
import { ChatMessageItem } from "./ChatMessageItem";
import { SuggestionChips } from "./SuggestionChips";
import type { ChatMessage } from "./types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  pending: boolean;
  dict: Dictionary;
  onSelectSuggestion: (suggestion: string) => void;
}

export function ChatMessageList({
  messages,
  pending,
  dict,
  onSelectSuggestion,
}: ChatMessageListProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={pending}
      aria-label={dict.assistant.answerLabel}
      className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      {messages.length === 0 ? (
        <SuggestionChips dict={dict} onSelect={onSelectSuggestion} />
      ) : (
        messages.map((message) => (
          <ChatMessageItem key={message.id} message={message} dict={dict} />
        ))
      )}

      {pending ? (
        <p role="status" className="text-sm font-medium text-sky-900">
          {dict.assistant.thinking}
        </p>
      ) : null}
    </div>
  );
}
