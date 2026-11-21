/**
 * Text safety helpers.
 *
 * Two separate threats are handled here:
 *  1. Prompt injection — user text trying to override the assistant's rules.
 *  2. Markup injection — HTML/script content in model output. The UI always
 *     renders plain text, but stripping tags here is defence in depth.
 */

const INJECTION_PATTERNS: ReadonlyArray<{
  id: string;
  pattern: RegExp;
}> = [
  {
    id: "ignore-instructions",
    pattern:
      /ignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules|messages)/i,
  },
  {
    id: "disregard-instructions",
    pattern:
      /disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier)/i,
  },
  {
    id: "reveal-system-prompt",
    pattern:
      /(reveal|show|print|repeat|leak|output)\s+.{0,40}(system|developer|hidden)\s+(prompt|message|instruction)/i,
  },
  {
    id: "role-override",
    pattern:
      /(you\s+are\s+now|from\s+now\s+on\s+you\s+are|act\s+as)\s+(a\s+|an\s+|the\s+)?(dan|developer\s+mode|jailbreak|unrestricted|evil)/i,
  },
  {
    id: "jailbreak",
    pattern: /(jailbreak|developer\s+mode|do\s+anything\s+now|dan\s+mode)/i,
  },
  {
    id: "chat-template-token",
    pattern: /<\|?\s*(system|assistant|user|tool)\s*\|?>/i,
  },
  {
    id: "bypass-guardrails",
    pattern:
      /(override|bypass|disable|turn\s+off)\s+.{0,30}(safety|guardrail|policy|filter|instruction)/i,
  },
  {
    id: "system-label",
    pattern: /(^|\n)\s*\[?\s*(system|developer)\s*\]?\s*:/i,
  },
];

export interface InjectionCheck {
  suspicious: boolean;
  matches: string[];
}

export function detectPromptInjection(input: string): InjectionCheck {
  const normalized = input.normalize("NFKC");
  const matches = INJECTION_PATTERNS.filter(({ pattern }) =>
    pattern.test(normalized),
  ).map(({ id }) => id);
  return { suspicious: matches.length > 0, matches };
}

/**
 * Normalizes a user question: Unicode NFKC, strips control characters and
 * HTML tags, collapses whitespace and caps the length.
 */
export function sanitizeQuestion(input: string, maxLength = 500): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Cleans model output before display. The React tree renders this as a text
 * node, so this is belt-and-braces rather than the only defence.
 */
export function sanitizeModelOutput(input: string, maxLength = 4000): string {
  return input
    .normalize("NFKC")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript\s*:/gi, "javascript :")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function containsHtml(input: string): boolean {
  return /<[a-z][^>]*>/i.test(input);
}

/** Escapes the five XML-significant characters for prompt templates. */
export function escapeForPrompt(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
