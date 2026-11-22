"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type {
  AqiCategory,
  ResolvedLocation,
  UserProfile,
} from "@/domain/types";
import { localizeApiError } from "@/lib/errors";
import { formatNumber, localeFor } from "@/lib/format";
import { interpolate } from "@/lib/i18n";
import { useI18n } from "./LanguageProvider";
import { ChatMessageList } from "./chat/ChatMessageList";
import type { ChatMessage, SourceReference } from "./chat/types";
import { IconAlert, IconSend, IconShield } from "./icons";

interface ChatAssistantProps {
  location: ResolvedLocation;
  profile: UserProfile;
  currentAqi: number | null;
  currentCategory: AqiCategory;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ChatAssistant({
  location,
  profile,
  currentAqi,
  currentCategory,
}: ChatAssistantProps) {
  const { dict, language } = useI18n();
  const locale = localeFor(language);
  const inputId = useId();
  const charId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (question.length < 2 || pending) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      text: question,
    };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ question, language, location, profile }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        data?: {
          answer?: string;
          provider?: string;
          noticeKey?: string;
          sources?: SourceReference[];
        };
        error?: { code?: string; message?: string };
      };

      if (!response.ok || body.ok !== true || !body.data?.answer) {
        const failure = new Error(
          body.error?.message || dict.assistant.error,
        ) as Error & { code?: string };
        failure.code = body.error?.code ?? "assistant_error";
        throw failure;
      }

      setMessages((previous) => [
        ...previous,
        {
          id: newId(),
          role: "assistant",
          text: body.data?.answer ?? "",
          provider: body.data?.provider,
          noticeKey: body.data?.noticeKey,
          sources: body.data?.sources,
        },
      ]);
    } catch (caught) {
      const code =
        (caught as { code?: string }).code ??
        (caught instanceof TypeError ? "network" : "assistant_error");
      const fallback =
        caught instanceof Error ? caught.message : dict.assistant.error;
      setError(localizeApiError(dict, code, fallback, language === "en"));
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function handleSelectSuggestion(suggestion: string) {
    setInput(suggestion);
    inputRef.current?.focus();
  }

  function clearConversation() {
    setMessages([]);
    setError(null);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <section
      id="assistant"
      aria-labelledby="assistant-heading"
      className="card scroll-mt-24"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="assistant-heading"
            className="flex items-center gap-2 text-xl font-bold text-slate-900"
          >
            <IconShield className="h-5 w-5 text-sky-800" />
            {dict.assistant.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {dict.assistant.subtitle}
          </p>
        </div>
        <p className="badge bg-slate-100 text-slate-800">
          {dict.assistant.groundedOn}:{" "}
          {currentAqi === null
            ? dict.dashboard.unavailable
            : `AQI ${formatNumber(currentAqi, locale)}`}{" "}
          · {dict.categories[currentCategory]}
        </p>
      </div>

      <ChatMessageList
        messages={messages}
        pending={pending}
        dict={dict}
        onSelectSuggestion={handleSelectSuggestion}
      />

      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-950"
        >
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor={inputId} className="sr-only">
          {dict.assistant.placeholder}
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          rows={3}
          maxLength={500}
          className="input resize-y"
          placeholder={dict.assistant.placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-describedby={charId}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span id={charId} className="text-xs tabular-nums text-slate-600">
            {interpolate(dict.assistant.charCount, { count: input.length })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn px-3 py-2 text-xs"
              onClick={clearConversation}
              disabled={messages.length === 0 && !error}
            >
              {dict.assistant.clear}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending || input.trim().length < 2}
            >
              <IconSend className="h-4 w-4" />
              {pending ? dict.assistant.sending : dict.assistant.send}
            </button>
          </div>
        </div>
      </form>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        {dict.assistant.disclaimer}
      </p>
    </section>
  );
}
