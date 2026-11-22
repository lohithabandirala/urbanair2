import type { Dictionary } from "@/lib/i18n";
import type { ChatMessage } from "./types";

interface ChatMessageItemProps {
  message: ChatMessage;
  dict: Dictionary;
}

function providerLabel(dict: Dictionary, provider?: string): string | null {
  if (provider === "gemini") return dict.assistant.providerGemini;
  if (provider === "guard") return dict.assistant.providerGuard;
  if (provider === "grounded-fallback") return dict.assistant.providerGrounded;
  return null;
}

function noticeText(dict: Dictionary, noticeKey?: string): string | null {
  if (noticeKey === "assistant.offlineNotice") {
    return dict.assistant.offlineNotice;
  }
  if (noticeKey === "assistant.fallbackNotice") {
    return dict.assistant.fallbackNotice;
  }
  return null;
}

export function ChatMessageItem({ message, dict }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const provider = providerLabel(dict, message.provider);
  const notice = noticeText(dict, message.noticeKey);

  return (
    <article
      className={`rounded-xl border p-3 ${
        isUser
          ? "border-slate-300 bg-white"
          : "border-sky-200 bg-sky-50"
      }`}
    >
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
        {isUser ? dict.assistant.you : dict.assistant.aura}
      </h3>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900">
        {message.text}
      </p>

      {!isUser && (provider || notice) ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {provider ? (
            <span className="badge bg-sky-800 text-white">
              {provider}
            </span>
          ) : null}
          {notice ? (
            <span className="text-xs leading-5 text-slate-600">
              {notice}
            </span>
          ) : null}
        </div>
      ) : null}

      {!isUser && message.sources && message.sources.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs">
          {message.sources.map((source) => (
            <li key={source.id}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
              >
                {source.title}
              </a>{" "}
              <span className="text-slate-500">
                — {source.publisher}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
