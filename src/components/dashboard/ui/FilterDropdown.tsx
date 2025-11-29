"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Check } from "lucide-react";

interface FilterItem {
  id: string | number;
  label: string;
}

interface FilterDropdownProps {
  items: FilterItem[];
  selectedItems?: (string | number)[];
  onApply?: (selectedIds: (string | number)[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  maxHeight?: string;
  width?: string;
}

export function FilterDropdown({
  items,
  selectedItems: initialSelected = [],
  onApply,
  onCancel,
  placeholder = "Search items...",
  maxHeight = "max-h-80",
  width = "w-full",
}: FilterDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelected, setLocalSelected] = useState<Set<string | number>>(
    new Set(initialSelected)
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync local state with parent's selected items when they change
  useEffect(() => {
    setLocalSelected(new Set(initialSelected));
  }, [initialSelected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSelectAll = () => {
    if (localSelected.size === items.length) {
      setLocalSelected(new Set());
    } else {
      setLocalSelected(new Set(items.map((item) => item.id)));
    }
  };

  const handleToggleItem = (itemId: string | number) => {
    const newSelected = new Set(localSelected);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setLocalSelected(newSelected);
  };

  const handleRemoveTag = (itemId: string | number) => {
    const newSelected = new Set(localSelected);
    newSelected.delete(itemId);
    setLocalSelected(newSelected);
    onApply?.(Array.from(newSelected));
  };

  const handleApply = () => {
    onApply?.(Array.from(localSelected));
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCancel = () => {
    setSearchQuery("");
    setLocalSelected(new Set(initialSelected));
    setIsOpen(false);
    onCancel?.();
  };

  const isAllSelected = localSelected.size === items.length && items.length > 0;

  return (
    <div className="space-y-3" ref={dropdownRef}>
      <div className="relative">
        <div className="flex p-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="border-0 outline-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 text-gray-900 flex-grow"
          />
        </div>
        {isOpen && (
          <div
            className={`absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 ${width}`}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 bg-white cursor-pointer"
              />
              <span className="text-sm text-gray-700 flex-1">All</span>
              <button
                onClick={handleApply}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Apply"
                aria-label="Apply filter"
              >
                <Check className="w-4 h-4 text-green-600" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Cancel"
                aria-label="Cancel filter"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
            <div className={`overflow-y-auto ${maxHeight}`}>
              {items.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No items available
                </div>
              ) : filteredItems.length === 0 && searchQuery ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No items match your search
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors ${
                      localSelected.has(item.id) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={localSelected.has(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      className="w-4 h-4 rounded border-gray-300 bg-white cursor-pointer"
                    />
                    <span
                      className={`text-sm select-none ${
                        localSelected.has(item.id)
                          ? "text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {localSelected.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(localSelected).map((id) => {
            const item = items.find((i) => i.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm whitespace-nowrap"
              >
                <span>{item?.label}</span>
                <button
                  onClick={() => handleRemoveTag(id)}
                  className="hover:bg-blue-200 p-0.5 rounded transition-colors flex-shrink-0 ml-1"
                  aria-label={`Remove ${item?.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}