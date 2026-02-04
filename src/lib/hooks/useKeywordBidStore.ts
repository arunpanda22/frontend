import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

export interface KeywordEdit {
  keyword_id: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

interface KeywordBidState {
  serverData: any[] | null;
  editedKeywords: Map<string, Record<string, any>>;
  dirtyKeywords: Set<string>;
  pushedKeywords: Set<string>;
  pushedValues: Map<string, Record<string, any>>;
  selectedKeywords: Set<string>;
  historyStack: KeywordEdit[][];
  historyIndex: number;
  expandedRows: Set<string>;
}

interface KeywordBidActions {
  // Data management
  setServerData: (data: any[]) => void;
  updateKeyword: (keywordId: string, field: string, value: any) => void;
  revertKeyword: (keywordId: string) => void;
  markAsPushed: (keywordIds: string[]) => void;
  
  // Selection management
  toggleSelection: (keywordId: string) => void;
  clearSelection: () => void;
  selectMultiple: (keywordIds: string[]) => void;
  
  // Bulk operations
  applyPercentageChange: (percentage: number, keywordIds?: string[]) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // UI state
  toggleExpanded: (rowId: string) => void;
  
  // Getters
  getDisplayData: () => any[];
  getPendingChanges: () => any[];
  getSelectedKeywords: () => string[];
  
  // Utility
  reset: () => void;
}

type KeywordBidStore = KeywordBidState & KeywordBidActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: KeywordBidState = {
  serverData: null,
  editedKeywords: new Map(),
  dirtyKeywords: new Set(),
  pushedKeywords: new Set(),
  pushedValues: new Map(),
  selectedKeywords: new Set(),
  historyStack: [],
  historyIndex: -1,
  expandedRows: new Set(),
};

// ============================================================================
// STORE
// ============================================================================

export const useKeywordBidStore = create<KeywordBidStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // DATA MANAGEMENT
      // ========================================================================

      setServerData: (data) => {
        const state = get();
        const newPushedValues = new Map(state.pushedValues);
        const newPushedKeywords = new Set(state.pushedKeywords);
        
        // Clear pushed values if server now has them
        state.pushedValues.forEach((pushedEdits, keywordId) => {
          const serverKeyword = data
            ?.flatMap((g) => g._children || [])
            .find((k) => k.keyword_id === keywordId);
          
          if (serverKeyword) {
            const allMatched = Object.entries(pushedEdits).every(
              ([field, value]) => serverKeyword[field] === value
            );
            
            if (allMatched) {
              newPushedValues.delete(keywordId);
              newPushedKeywords.delete(keywordId);
            }
          }
        });
        
        set({
          serverData: data,
          editedKeywords: new Map(),
          dirtyKeywords: new Set(),
          pushedValues: newPushedValues,
          pushedKeywords: newPushedKeywords,
          historyStack: [],
          historyIndex: -1,
          // Keep selectedKeywords and expandedRows
        });
      },

      updateKeyword: (keywordId, field, value) =>
        set((state) => {
          const newEdited = new Map(state.editedKeywords);
          const existing = newEdited.get(keywordId) || {};

          // Find original keyword
          const original = state.serverData
            ?.flatMap((g) => g._children || [])
            .find((k) => k.keyword_id === keywordId);

          if (!original) return state;

          const oldValue = existing[field] ?? original[field];
          
          // Type conversion for numeric fields
          const processedValue = 
            typeof original[field] === 'number' ? Number(value) : value;

          // Skip if unchanged
          if (oldValue === processedValue) return state;

          // Update edited keywords
          newEdited.set(keywordId, { ...existing, [field]: processedValue });

          // Mark as dirty
          const newDirty = new Set(state.dirtyKeywords);
          newDirty.add(keywordId);

          // ✅ Auto-select when edited (but allow manual deselection)
          const newSelected = new Set(state.selectedKeywords);
          newSelected.add(keywordId);

          // Add to history
          const edit: KeywordEdit = {
            keyword_id: keywordId,
            field,
            oldValue,
            newValue: processedValue,
            timestamp: Date.now(),
          };

          const newHistory = state.historyStack.slice(0, state.historyIndex + 1);
          newHistory.push([edit]);

          console.log('✅ Updated keyword:', keywordId, field, processedValue);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            selectedKeywords: newSelected,
            historyStack: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      revertKeyword: (keywordId) =>
        set((state) => {
          const newEdited = new Map(state.editedKeywords);
          newEdited.delete(keywordId);

          const newDirty = new Set(state.dirtyKeywords);
          newDirty.delete(keywordId);

          // ✅ Deselect when reverted
          const newSelected = new Set(state.selectedKeywords);
          newSelected.delete(keywordId);

          console.log('✅ Reverted keyword:', keywordId);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            selectedKeywords: newSelected,
          };
        }),

      markAsPushed: (keywordIds) =>
        set((state) => {
          const newPushed = new Set(state.pushedKeywords);
          const newDirty = new Set(state.dirtyKeywords);
          const newPushedValues = new Map(state.pushedValues);
          const newEdited = new Map(state.editedKeywords);
          
          // ✅ Clear selection after push
          const newSelected = new Set(state.selectedKeywords);

          keywordIds.forEach((id) => {
            newPushed.add(id);
            newDirty.delete(id);
            newSelected.delete(id);
            
            // Save pushed values
            const edits = state.editedKeywords.get(id);
            if (edits) {
              newPushedValues.set(id, edits);
            }
            
            newEdited.delete(id);
          });

          console.log('✅ Marked as pushed:', keywordIds.length, 'keywords');

          return {
            pushedKeywords: newPushed,
            dirtyKeywords: newDirty,
            editedKeywords: newEdited,
            pushedValues: newPushedValues,
            selectedKeywords: newSelected,
          };
        }),

      // ========================================================================
      // SELECTION MANAGEMENT
      // ========================================================================

      toggleSelection: (keywordId) =>
        set((state) => {
          const newSelected = new Set(state.selectedKeywords);
          
          if (newSelected.has(keywordId)) {
            newSelected.delete(keywordId);
            console.log('✅ Deselected:', keywordId);
          } else {
            newSelected.add(keywordId);
            console.log('✅ Selected:', keywordId);
          }
          
          return { selectedKeywords: newSelected };
        }),

      clearSelection: () => {
        console.log('✅ Cleared selection');
        return set({ selectedKeywords: new Set() });
      },

      selectMultiple: (keywordIds) =>
        set((state) => {
          const newSelected = new Set(state.selectedKeywords);
          keywordIds.forEach(id => newSelected.add(id));
          console.log('✅ Selected multiple:', keywordIds.length, 'keywords');
          return { selectedKeywords: newSelected };
        }),

      // ========================================================================
      // BULK OPERATIONS
      // ========================================================================

      applyPercentageChange: (percentage, keywordIds) =>
        set((state) => {
          const idsToUpdate = keywordIds || Array.from(state.selectedKeywords);
          
          if (idsToUpdate.length === 0) {
            console.warn('No keywords selected for percentage change');
            return state;
          }

          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);
          const edits: KeywordEdit[] = [];

          idsToUpdate.forEach((keywordId) => {
            const original = state.serverData
              ?.flatMap((g) => g._children || [])
              .find((k) => k.keyword_id === keywordId);

            if (!original || !original.is_editable) return;

            const existing = newEdited.get(keywordId) || {};
            const currentBid = existing.keyword_bid ?? original.keyword_bid;
            
            if (currentBid === null || currentBid === undefined) return;

            // Calculate new bid
            const multiplier = 1 + (percentage / 100);
            const newBid = Number((currentBid * multiplier).toFixed(2));

            // Respect min/max bounds
            const bid_min = original.bid_min || 0.02;
            const bid_max = original.bid_max || 1000;
            const boundedBid = Math.max(bid_min, Math.min(bid_max, newBid));

            // Update
            newEdited.set(keywordId, { ...existing, keyword_bid: boundedBid });
            newDirty.add(keywordId);

            // Track in history
            edits.push({
              keyword_id: keywordId,
              field: 'keyword_bid',
              oldValue: currentBid,
              newValue: boundedBid,
              timestamp: Date.now(),
            });
          });

          if (edits.length === 0) {
            console.warn('No editable keywords found');
            return state;
          }

          // Add batch to history
          const newHistory = state.historyStack.slice(0, state.historyIndex + 1);
          newHistory.push(edits);

          console.log(`✅ Applied ${percentage}% change to ${edits.length} keywords`);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            historyStack: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      // ========================================================================
      // HISTORY
      // ========================================================================

      undo: () =>
        set((state) => {
          if (state.historyIndex < 0) {
            console.warn('Nothing to undo');
            return state;
          }

          const editsToUndo = state.historyStack[state.historyIndex];
          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);
          const newSelected = new Set(state.selectedKeywords);

          editsToUndo.forEach((edit) => {
            const current = newEdited.get(edit.keyword_id) || {};
            
            if (edit.oldValue === undefined || edit.oldValue === null) {
              delete current[edit.field];
              if (Object.keys(current).length === 0) {
                newEdited.delete(edit.keyword_id);
                newDirty.delete(edit.keyword_id);
                newSelected.delete(edit.keyword_id);
              } else {
                newEdited.set(edit.keyword_id, current);
              }
            } else {
              newEdited.set(edit.keyword_id, {
                ...current,
                [edit.field]: edit.oldValue,
              });
            }
          });

          console.log('✅ Undo applied:', editsToUndo.length, 'changes');

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            selectedKeywords: newSelected,
            historyIndex: state.historyIndex - 1,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.historyStack.length - 1) {
            console.warn('Nothing to redo');
            return state;
          }

          const nextIndex = state.historyIndex + 1;
          const editsToRedo = state.historyStack[nextIndex];
          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);
          const newSelected = new Set(state.selectedKeywords);

          editsToRedo.forEach((edit) => {
            const current = newEdited.get(edit.keyword_id) || {};
            newEdited.set(edit.keyword_id, {
              ...current,
              [edit.field]: edit.newValue,
            });
            newDirty.add(edit.keyword_id);
            newSelected.add(edit.keyword_id);
          });

          console.log('✅ Redo applied:', editsToRedo.length, 'changes');

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            selectedKeywords: newSelected,
            historyIndex: nextIndex,
          };
        }),

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().historyStack.length - 1,

      // ========================================================================
      // UI STATE
      // ========================================================================

      toggleExpanded: (rowId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedRows);
          
          if (newExpanded.has(rowId)) {
            newExpanded.delete(rowId);
          } else {
            newExpanded.add(rowId);
          }
          
          return { expandedRows: newExpanded };
        }),

      // ========================================================================
      // GETTERS
      // ========================================================================

      getDisplayData: () => {
        const state = get();
        
        if (!state.serverData || !Array.isArray(state.serverData)) {
          return [];
        }

        return state.serverData.map((group) => {
          if (!group._children) return group;

          const children = group._children.map((keyword: any) => {
            const pushedEdits = state.pushedValues.get(keyword.keyword_id);
            const edits = state.editedKeywords.get(keyword.keyword_id);
            const isPushed = state.pushedKeywords.has(keyword.keyword_id);
            const isDirty = state.dirtyKeywords.has(keyword.keyword_id);
            const isSelected = state.selectedKeywords.has(keyword.keyword_id);

            return {
              ...keyword,
              ...pushedEdits,
              ...edits,
              _isDirty: isDirty,
              _isPushed: isPushed,
              _isSelected: isSelected,
              _highlighted: isDirty && !isPushed,
              is_editable: keyword.is_editable !== false,
            };
          });

          return { ...group, _children: children };
        });
      },

      // ✅ FIXED: Only return pending changes for SELECTED keywords
      getPendingChanges: () => {
        const state = get();
        const changes: any[] = [];

        state.editedKeywords.forEach((edits, keywordId) => {
          // Skip if pushed
          if (state.pushedKeywords.has(keywordId)) return;
          
          // Skip if not dirty
          if (!state.dirtyKeywords.has(keywordId)) return;
          
          // ✅ NEW: Skip if not selected
          if (!state.selectedKeywords.has(keywordId)) return;

          const original = state.serverData
            ?.flatMap((g) => g._children || [])
            .find((k) => k.keyword_id === keywordId);

          if (!original) return;

          Object.entries(edits).forEach(([field, newValue]) => {
            changes.push({
              keyword_id: keywordId,
              keyword: original.keyword || original.name,
              campaign_id: original.campaign_id,
              ad_group_id: original.ad_group_id,
              match_type: original.match_type,
              source: original.source,
              field,
              oldValue: original[field],
              newValue,
            });
          });
        });

        return changes;
      },

      getSelectedKeywords: () => {
        return Array.from(get().selectedKeywords);
      },

      // ========================================================================
      // UTILITY
      // ========================================================================

      reset: () => set(initialState),
    }),
    { name: "KeywordBidStore" },
  ),
);