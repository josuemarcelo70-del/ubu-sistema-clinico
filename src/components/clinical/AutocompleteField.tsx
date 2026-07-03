"use client";

import { useMemo, useState } from "react";

import { normalizeSearchText } from "@/lib/cie10-catalog";

export type AutocompleteOption = {
  value: string;
  label: string;
  helper?: string;
};

export function AutocompleteField({
  value,
  options,
  onChange,
  placeholder = "Buscar...",
  limit = 8,
  disabled,
  hideOptionsUntilSearch,
}: {
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string, option?: AutocompleteOption) => void;
  placeholder?: string;
  limit?: number;
  disabled?: boolean;
  hideOptionsUntilSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => {
    const term = normalizeSearchText(value);
    if (hideOptionsUntilSearch && !term) return [];
    const source = term
      ? options.filter((option) =>
          normalizeSearchText(`${option.label} ${option.value} ${option.helper ?? ""}`).includes(term),
        )
      : options;
    return source.slice(0, limit);
  }, [hideOptionsUntilSearch, limit, options, value]);

  function select(option: AutocompleteOption) {
    onChange(option.value, option);
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div className="relative">
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && filtered[activeIndex]) {
            event.preventDefault();
            select(filtered[activeIndex]);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#D7E3EC] bg-white px-3 py-2 text-sm font-normal text-[#0F2F44] outline-none transition focus:border-[#005B84] focus:ring-2 focus:ring-[#005B84]/15 disabled:bg-[#F1F5F9]"
      />
      {open && !disabled && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-[#BFD2DE] bg-white py-1 text-sm shadow-lg">
          {filtered.map((option, index) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
              className={`block w-full px-3 py-2 text-left transition ${
                index === activeIndex ? "bg-[#EEF6FA] text-[#005B84]" : "text-[#082F49] hover:bg-[#F8FBFD]"
              }`}
            >
              <span className="font-medium">{option.label}</span>
              {option.helper && <span className="ml-2 text-xs text-[#64748B]">{option.helper}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
