import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSearch, FaTimes, FaLayerGroup } from 'react-icons/fa';

interface SearchableAsinDropdownProps {
  asins: string[];
  selectedAsin: string;
  totalAsins: number;
  onSelect: (asin: string) => void;
  onSelectAll: () => void;
  disabled?: boolean;
  view: 'all' | 'individual';
}

export default function SearchableAsinDropdown({
  asins,
  selectedAsin,
  totalAsins,
  onSelect,
  onSelectAll,
  disabled = false,
  view
}: SearchableAsinDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter ASINs based on search query
  const filteredAsins = asins.filter(asin =>
    asin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectAsin = (asin: string) => {
    onSelect(asin);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectAll = () => {
    onSelectAll();
    setIsOpen(false);
    setSearchQuery('');
  };

  // Display text for the button
  const displayText = view === 'all' 
    ? `Top 30 ASINs (Last Year)`
    : selectedAsin || 'Select ASIN';

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm">
      {/* Dropdown Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 text-left text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 transition-colors font-medium"
      >
        <span className="block truncate">
          {displayText}
        </span>
        <FaChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* All ASINs Option - Highlighted at top */}
          <button
            onClick={handleSelectAll}
            className={`w-full text-left px-4 py-3 font-medium border-b-2 border-gray-200 transition-colors flex items-center gap-2 ${
              view === 'all'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
            }`}
          >
            <FaLayerGroup className={view === 'all' ? 'text-white' : 'text-blue-500'} />
            <span>All {totalAsins} ASINs (Last Year)</span>
          </button>

          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Top 30 ASINs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* ASIN List */}
          <div className="overflow-y-auto max-h-64">
            {filteredAsins.length > 0 ? (
              <>
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Top 30 ASINs
                </div>
                {filteredAsins.map((asin) => (
                  <button
                    key={asin}
                    onClick={() => handleSelectAsin(asin)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${
                      selectedAsin === asin && view === 'individual'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {asin}
                  </button>
                ))}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <FaSearch className="mx-auto mb-2 text-2xl text-gray-400" />
                <p className="font-medium">No ASINs found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Results Count */}
          {searchQuery && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
              Showing {filteredAsins.length} of {asins.length} ASINs
            </div>
          )}
        </div>
      )}
    </div>
  );
}