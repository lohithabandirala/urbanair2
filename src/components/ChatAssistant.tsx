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
import { IconAlert, IconSend, IconShield } from "./icons";

interface SourceReference {
  id: string;
  publisher: string;
  title: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  provider?: string;
  noticeKey?: string;
  sources?: SourceReference[];
}

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

  function providerLabel(provider?: string): string | null {
    if (provider === "gemini") return dict.assistant.providerGemini;
    if (provider === "guard") return dict.assistant.providerGuard;
    if (provider === "grounded-fallback") return dict.assistant.providerGrounded;
    return null;
  }

  function noticeText(noticeKey?: string): string | null {
    if (noticeKey === "assistant.offlineNotice") {
      return dict.assistant.offlineNotice;
    }
    if (noticeKey === "assistant.fallbackNotice") {
      return dict.assistant.fallbackNotice;
    }
    return null;
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

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={pending}
        aria-label={dict.assistant.answerLabel}
        className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        {messages.length === 0 ? (
          <div>
            <p className="text-sm text-slate-600">{dict.assistant.empty}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {dict.assistant.suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";
            const provider = providerLabel(message.provider);
            const notice = noticeText(message.noticeKey);

            return (
              <article
                key={message.id}
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
          })
        )}

        {pending ? (
          <p role="status" className="text-sm font-medium text-sky-900">
            {dict.assistant.thinking}
          </p>
        ) : null}
      </div>

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
