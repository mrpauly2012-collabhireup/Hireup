import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableDropdownProps {
  id: string;
  label?: string;
  options: string[];
  selected: string | string[];
  onChange: (selected: any) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export default function SearchableDropdown({
  id,
  label,
  options,
  selected,
  onChange,
  multiple = false,
  placeholder = 'Select option...',
  className = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    if (multiple) {
      const currentSelected = Array.isArray(selected) ? selected : [];

      if (currentSelected.includes(option)) {
        onChange(currentSelected.filter(item => item !== option));
      } else {
        onChange([...currentSelected, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }

    setSearchQuery('');
  };

  const handleRemove = (option: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (multiple && Array.isArray(selected)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange('');
    }
  };

  const isSelected = (option: string) => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(option);
    }

    return selected === option;
  };

  return (
    <div
      id={`dropdown-container-${id}`}
      className={`relative space-y-1.5 ${className}`}
      ref={dropdownRef}
    >
      {label && (
        <label
          htmlFor={`${id}-search`}
          className="block text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(current => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="min-h-[42px] w-full bg-white border border-zinc-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-sans text-zinc-800 transition-all duration-200 ease-out cursor-pointer shadow-sm hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 active:scale-[0.99] select-none"
      >
        <div className="flex flex-wrap gap-1.5 items-center mr-2 min-w-0">
          {multiple ? (
            Array.isArray(selected) && selected.length > 0 ? (
              selected.map(item => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 ease-out"
                >
                  <span className="truncate max-w-[180px]">{item}</span>
                  <button
                    type="button"
                    onClick={event => handleRemove(item, event)}
                    className="hover:bg-[#34D399] hover:text-white rounded-full p-0.5 transition-all duration-200 ease-out cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                    aria-label={`Remove ${item}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-zinc-400 font-medium">{placeholder}</span>
            )
          ) : selected ? (
            <span className="text-zinc-900 font-semibold truncate">
              {selected as string}
            </span>
          ) : (
            <span className="text-zinc-400 font-medium">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180' : ''
          } flex-shrink-0`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-zinc-200/80 rounded-2xl shadow-2xl z-50 mt-2 max-h-72 overflow-hidden flex flex-col font-sans animate-fade-in">
          <div className="p-2.5 border-b border-zinc-100 relative bg-zinc-50/80 flex items-center">
            <Search className="absolute left-4 text-zinc-400 w-4 h-4" />
            <input
              id={`${id}-search`}
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Type to filter..."
              className="w-full pl-8 pr-8 py-2 bg-white border border-zinc-200/80 rounded-xl text-xs placeholder-zinc-400 focus:outline-none focus:border-[#34D399] focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 ease-out"
              onClick={event => event.stopPropagation()}
              autoFocus
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors duration-200 ease-out"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            role="listbox"
            className="overflow-y-auto flex-1 py-1.5 max-h-52"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const selectedState = isSelected(option);

                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={selectedState}
                    className={`w-full px-4 py-2.5 text-xs text-left flex items-center justify-between cursor-pointer transition-all duration-200 ease-out ${
                      selectedState
                        ? 'bg-emerald-50 text-[#10B981] font-bold'
                        : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                    }`}
                  >
                    <span>{option}</span>
                    {selectedState && (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-xs text-zinc-400 text-center font-mono">
                No matching results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}