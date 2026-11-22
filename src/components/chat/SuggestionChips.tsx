import type { Dictionary } from "@/lib/i18n";

interface SuggestionChipsProps {
  dict: Dictionary;
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ dict, onSelect }: SuggestionChipsProps) {
  return (
    <div>
      <p className="text-sm text-slate-600">{dict.assistant.empty}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {dict.assistant.suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
              onClick={() => onSelect(suggestion)}
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
