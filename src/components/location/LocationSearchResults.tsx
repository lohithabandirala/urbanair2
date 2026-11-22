import { IconClose } from "../icons";
import type { LocationPlace } from "./types";

interface LocationSearchResultsProps {
  results: LocationPlace[];
  title: string;
  onSelect: (place: LocationPlace) => void;
}

function placeLabel(place: LocationPlace): string {
  return [place.region, place.country].filter(Boolean).join(", ");
}

export function LocationSearchResults({
  results,
  title,
  onSelect,
}: LocationSearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      <ul className="mt-1 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {results.map((place) => (
          <li key={`${place.name}-${place.latitude}-${place.longitude}`}>
            <button
              type="button"
              onClick={() => onSelect(place)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span>
                <span className="font-semibold text-slate-900">
                  {place.name}
                </span>
                <span className="block text-xs text-slate-600">
                  {placeLabel(place)}
                </span>
              </span>
              <IconClose className="h-4 w-4 rotate-45 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
