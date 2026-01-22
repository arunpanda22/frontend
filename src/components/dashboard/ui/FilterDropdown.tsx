import React, { useState, useMemo } from 'react';

interface FilterDropdownProps {
  items: Array<{ id: string | number; label: string }>;
  selectedItems: (string | number)[];
  onApply: (selectedIds: (string | number)[]) => void;
  placeholder?: string;
  maxHeight?: string;
  width?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  items,
  selectedItems,
  onApply,
  placeholder = "Search...",
  maxHeight = "max-h-80",
  width = "w-full"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState<(string | number)[]>(selectedItems);
  const [isOpen, setIsOpen] = useState(false);

  // Filter and sort items: selected first, then by search term
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = items.filter(item => 
        item.label.toLowerCase().includes(term)
      );
    }
    
    // Sort: selected items first, then unselected
    return filtered.sort((a, b) => {
      const aSelected = localSelected.includes(a.id);
      const bSelected = localSelected.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [items, searchTerm, localSelected]);

  // Handle Select All - IMPORTANT: Use filteredItems, not all items
  const handleSelectAll = () => {
    if (filteredItems.length === localSelected.length) {
      // Deselect all filtered items
      setLocalSelected(prev => 
        prev.filter(id => !filteredItems.some(item => item.id === id))
      );
    } else {
      // Select all filtered items (merge with existing selections)
      const filteredIds = filteredItems.map(item => item.id);
      setLocalSelected(prev => {
        const newSet = new Set([...prev, ...filteredIds]);
        return Array.from(newSet);
      });
    }
  };

  // Check if all filtered items are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every(item => localSelected.includes(item.id));
  }, [filteredItems, localSelected]);

  const handleToggleItem = (id: string | number) => {
    setLocalSelected(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleApply = () => {
    console.log('FilterDropdown: Applying selection', {
      total_selected: localSelected.length,
      filtered_count: filteredItems.length,
      search_term: searchTerm,
      selected_items: localSelected.slice(0, 5)
    });
    onApply(localSelected);
    setIsOpen(false);
  };

  const handleClear = () => {
    console.log('FilterDropdown: Clearing all selections immediately');
    setLocalSelected([]);
    onApply([]); // Apply immediately with empty array
    setIsOpen(false); // Close the dropdown
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${width} px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50`}
      >
        <span className="text-sm text-gray-700">
          {localSelected.length === 0
            ? 'All campaigns'
            : `${localSelected.length} selected`}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              autoFocus
            />
          </div>

          {/* Select All / Clear All */}
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
              {searchTerm && ` (${filteredItems.length} filtered)`}
            </button>
            <button
              onClick={handleClear}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>

          {/* Items List */}
          <div className={`${maxHeight} overflow-y-auto p-2`}>
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No items found
              </div>
            ) : (
              filteredItems.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
                    localSelected.includes(item.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={localSelected.includes(item.id)}
                    onChange={() => handleToggleItem(item.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className={`text-sm ${
                    localSelected.includes(item.id) 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-200 flex justify-between items-center gap-2">
            <span className="text-xs text-gray-500">
              {localSelected.length} of {items.length} selected
              {searchTerm && ` (${filteredItems.length} visible)`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLocalSelected(selectedItems);
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};