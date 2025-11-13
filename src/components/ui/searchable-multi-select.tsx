"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { toPersianNumber } from "@/utils/numberUtils";

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface SearchableMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxInitialDisplay?: number;
}

export function SearchableMultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "انتخاب کنید",
  disabled = false,
  className = "",
  maxInitialDisplay = 30,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((option) => value.includes(option.value));

  // Sort options by count (descending) if available, then by label
  const sortedOptions = React.useMemo(() => {
    return [...options].sort((a, b) => {
      if (a.count !== undefined && b.count !== undefined) {
        return b.count - a.count;
      }
      if (a.count !== undefined) return -1;
      if (b.count !== undefined) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) {
      // When not searching, show selected items first, then top items
      const selected = sortedOptions.filter((option) => value.includes(option.value));
      const unselected = sortedOptions.filter((option) => !value.includes(option.value));
      return [...selected, ...unselected];
    }
    // When searching, show all matching results
    return sortedOptions.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedOptions, searchQuery, value]);

  // Determine which options to display
  const displayedOptions = React.useMemo(() => {
    if (searchQuery) {
      // When searching, show all matching results
      return filteredOptions;
    }
    // When not searching, limit display unless "show all" is clicked
    if (showAll || filteredOptions.length <= maxInitialDisplay) {
      return filteredOptions;
    }
    // Show selected items + top N unselected items
    const selected = filteredOptions.filter((option) => value.includes(option.value));
    const unselected = filteredOptions.filter((option) => !value.includes(option.value));
    const topUnselected = unselected.slice(0, maxInitialDisplay - selected.length);
    return [...selected, ...topUnselected];
  }, [filteredOptions, searchQuery, showAll, maxInitialDisplay, value]);

  const hasMoreOptions = !searchQuery && filteredOptions.length > maxInitialDisplay && !showAll;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  React.useEffect(() => {
    // Reset showAll when dropdown closes or search changes
    if (!open) {
      setShowAll(false);
    }
    if (searchQuery) {
      setShowAll(false);
    }
  }, [open, searchQuery]);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter((v) => v !== optionValue);
    onChange(newValue);
  };

  const displayText = selectedOptions.length > 0
    ? selectedOptions.length === 1
      ? selectedOptions[0].label
      : `${selectedOptions.length} مورد انتخاب شده`
    : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-right flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
        dir="rtl"
      >
        <span className="text-gray-900 flex-1 text-right truncate">
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 mr-2 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden" dir="rtl">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {displayedOptions.length > 0 ? (
              <>
                {displayedOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      className="w-full px-3 py-2 text-right hover:bg-gray-100 flex items-center justify-between"
                      dir="rtl"
                    >
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-gray-900">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-gray-500">({toPersianNumber(option.count)})</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary-500" />}
                    </button>
                  );
                })}
                {hasMoreOptions && (
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="w-full px-3 py-2 text-right hover:bg-gray-100 border-t border-gray-200 text-primary-600 font-medium text-sm"
                    dir="rtl"
                  >
                    نمایش همه ({filteredOptions.length} مورد)
                  </button>
                )}
              </>
            ) : (
              <div className="px-3 py-2 text-center text-gray-500">نتیجه‌ای یافت نشد</div>
            )}
          </div>
        </div>
      )}

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => handleRemove(option.value, e)}
                className="mr-1 hover:text-primary-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

