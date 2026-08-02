import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableDropdownProps {
  id: string;
  label?: string;
  options: string[];
  selected: string | string[]; // Can be single string or string[]
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
  placeholder = "Select option...",
  className = ""
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
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

  const handleRemove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div id={`dropdown-container-${id}`} className={`relative space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-mono font-black text-zinc-400 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Main trigger button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[40px] w-full bg-white border border-zinc-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs font-sans text-zinc-800 focus-within:border-[#34D399] focus-within:ring-1 focus-within:ring-[#34D399] transition-all cursor-pointer shadow-xs select-none"
      >
        <div className="flex flex-wrap gap-1.5 items-center mr-2">
          {multiple ? (
            Array.isArray(selected) && selected.length > 0 ? (
              selected.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#10B981] rounded-md text-[10px] font-mono font-bold uppercase transition-all"
                >
                  {item}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(item, e)}
                    className="hover:bg-[#34D399] hover:text-white rounded-full p-0.5 transition-all cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-zinc-400 font-medium">{placeholder}</span>
            )
          ) : (
            selected ? (
              <span className="text-zinc-800 font-semibold">{selected as string}</span>
            ) : (
              <span className="text-zinc-400 font-medium">{placeholder}</span>
            )
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
      </div>

      {/* Floating Dropdown options list */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-zinc-200 rounded-xl shadow-xl z-50 mt-1 max-h-60 overflow-hidden flex flex-col font-sans animate-fade-in">
          {/* Inner Search bar */}
          <div className="p-2 border-b border-zinc-100 relative bg-zinc-50 flex items-center">
            <Search className="absolute left-4 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to filter..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs placeholder-zinc-400 focus:outline-none focus:border-[#34D399] transition-all"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List items */}
          <div className="overflow-y-auto flex-1 py-1 divide-y divide-zinc-50 max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const selectedState = isSelected(option);
                return (
                  <div
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2.5 text-xs text-zinc-700 hover:bg-emerald-50/40 hover:text-zinc-900 flex items-center justify-between cursor-pointer transition-all ${
                      selectedState ? 'bg-emerald-50/20 font-bold text-[#10B981]' : ''
                    }`}
                  >
                    <span>{option}</span>
                    {selectedState && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-zinc-400 text-center font-mono">
                No matching results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
