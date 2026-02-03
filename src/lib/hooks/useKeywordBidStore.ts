import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface KeywordEdit {
  keyword_id: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface KeywordBidState {
  serverData: any[] | null;
  editedKeywords: Map<string, Record<string, any>>;
  dirtyKeywords: Set<string>;
  pushedKeywords: Set<string>;
  selectedKeywords: Set<string>;

  historyStack: KeywordEdit[][];
  historyIndex: number;

  filters: Record<string, any>;
  sorts: any[];
  expandedRows: Set<string>;
}

export interface KeywordBidActions {
  setServerData: (data: any[]) => void;
  updateKeyword: (keywordId: string, field: string, value: any) => void;
  revertKeyword: (keywordId: string) => void;
  markAsPushed: (keywordIds: string[]) => void;
  toggleSelection: (keywordId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  batchUpdate: (
    updates: Array<{ keywordId: string; field: string; value: any }>,
  ) => void;

  setFilters: (filters: Record<string, any>) => void;
  setSorts: (sorts: any[]) => void;
  toggleExpanded: (rowId: string) => void;

  getDisplayData: () => any[];
  getPendingChanges: () => any[];
  getKeywordById: (id: string) => any | null;

  reset: () => void;
}

type KeywordBidStore = KeywordBidState & KeywordBidActions;

const initialState: KeywordBidState = {
  serverData: null,
  editedKeywords: new Map(),
  dirtyKeywords: new Set(),
  pushedKeywords: new Set(),
  selectedKeywords: new Set(),
  historyStack: [],
  historyIndex: -1,
  filters: {},
  sorts: [],
  expandedRows: new Set(),
};

export const useKeywordBidStore = create<KeywordBidStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setServerData: (data) => {
        console.log('🗄️ setServerData called with:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: data?.length,
          firstItem: data?.[0]
        });
        
        set({
          serverData: data,
          editedKeywords: new Map(),
          dirtyKeywords: new Set(),
          selectedKeywords: new Set(),
          historyStack: [],
          historyIndex: -1,
        });
      },

      updateKeyword: (keywordId, field, value) =>
        set((state) => {
          const newEdited = new Map(state.editedKeywords);
          const existing = newEdited.get(keywordId) || {};

          // Find original value from server data
          const original = state.serverData
            ?.flatMap((g) => g._children || [])
            .find((k) => k.keyword_id === keywordId);

          if (!original) {
            console.warn('⚠️ Cannot find keyword in server data:', keywordId);
            return state;
          }

          const oldValue = existing[field] ?? original[field];

          // ✅ FIX: Convert string to number for numeric fields
          const processedValue = 
            field === 'keyword_bid' || original[field] !== undefined && typeof original[field] === 'number'
              ? Number(value)
              : value;

          // Check if value actually changed
          if (oldValue === processedValue) {
            console.log('ℹ️ Value unchanged, skipping update');
            return state;
          }

          newEdited.set(keywordId, { ...existing, [field]: processedValue });

          const newDirty = new Set(state.dirtyKeywords);
          newDirty.add(keywordId);

          const edit: KeywordEdit = {
            keyword_id: keywordId,
            field,
            oldValue,
            newValue: processedValue,
            timestamp: Date.now(),
          };

          const newHistory = state.historyStack.slice(
            0,
            state.historyIndex + 1,
          );
          newHistory.push([edit]);

          console.log('✅ Keyword updated:', {
            keywordId,
            field,
            oldValue,
            newValue: processedValue,
            dirtyCount: newDirty.size
          });

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
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

          const newSelected = new Set(state.selectedKeywords);
          newSelected.delete(keywordId);

          console.log('✅ Keyword reverted:', keywordId);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            selectedKeywords: newSelected,
          };
        }),

      markAsPushed: (keywordIds) =>
        set((state) => {
          const newPushed = new Set(state.pushedKeywords);
          keywordIds.forEach((id) => newPushed.add(id));

          const newDirty = new Set(state.dirtyKeywords);
          keywordIds.forEach((id) => newDirty.delete(id));

          // Also remove from edited keywords after successful push
          const newEdited = new Map(state.editedKeywords);
          keywordIds.forEach((id) => newEdited.delete(id));

          console.log('✅ Keywords marked as pushed:', keywordIds.length);

          return {
            pushedKeywords: newPushed,
            dirtyKeywords: newDirty,
            editedKeywords: newEdited,
          };
        }),

      toggleSelection: (keywordId) =>
        set((state) => {
          const newSelected = new Set(state.selectedKeywords);
          if (newSelected.has(keywordId)) {
            newSelected.delete(keywordId);
          } else {
            newSelected.add(keywordId);
          }
          return { selectedKeywords: newSelected };
        }),

      clearSelection: () => set({ selectedKeywords: new Set() }),

      selectAll: () =>
        set((state) => {
          const allKeywordIds =
            state.serverData
              ?.flatMap((g) => g._children || [])
              .map((k) => k.keyword_id) || [];
          return { selectedKeywords: new Set(allKeywordIds) };
        }),

      undo: () =>
        set((state) => {
          if (state.historyIndex < 0) {
            console.log('ℹ️ Nothing to undo');
            return state;
          }

          const editsToUndo = state.historyStack[state.historyIndex];
          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);

          editsToUndo.forEach((edit) => {
            const current = newEdited.get(edit.keyword_id) || {};
            
            if (edit.oldValue === undefined) {
              // This was a new field, remove it
              delete current[edit.field];
              if (Object.keys(current).length === 0) {
                newEdited.delete(edit.keyword_id);
                newDirty.delete(edit.keyword_id);
              } else {
                newEdited.set(edit.keyword_id, current);
              }
            } else {
              // Restore old value
              newEdited.set(edit.keyword_id, {
                ...current,
                [edit.field]: edit.oldValue,
              });
            }
          });

          console.log('✅ Undo performed, new index:', state.historyIndex - 1);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            historyIndex: state.historyIndex - 1,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.historyStack.length - 1) {
            console.log('ℹ️ Nothing to redo');
            return state;
          }

          const nextIndex = state.historyIndex + 1;
          const editsToRedo = state.historyStack[nextIndex];
          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);

          editsToRedo.forEach((edit) => {
            const current = newEdited.get(edit.keyword_id) || {};
            newEdited.set(edit.keyword_id, {
              ...current,
              [edit.field]: edit.newValue,
            });
            newDirty.add(edit.keyword_id);
          });

          console.log('✅ Redo performed, new index:', nextIndex);

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            historyIndex: nextIndex,
          };
        }),

      canUndo: () => get().historyIndex >= 0,
      canRedo: () => get().historyIndex < get().historyStack.length - 1,

      batchUpdate: (updates) =>
        set((state) => {
          const newEdited = new Map(state.editedKeywords);
          const newDirty = new Set(state.dirtyKeywords);
          const batchEdits: KeywordEdit[] = [];

          updates.forEach(({ keywordId, field, value }) => {
            const existing = newEdited.get(keywordId) || {};
            const original = state.serverData
              ?.flatMap((g) => g._children || [])
              .find((k) => k.keyword_id === keywordId);

            const oldValue = existing[field] ?? original?.[field];

            newEdited.set(keywordId, { ...existing, [field]: value });
            newDirty.add(keywordId);

            batchEdits.push({
              keyword_id: keywordId,
              field,
              oldValue,
              newValue: value,
              timestamp: Date.now(),
            });
          });

          const newHistory = state.historyStack.slice(
            0,
            state.historyIndex + 1,
          );
          newHistory.push(batchEdits);

          console.log('✅ Batch update performed:', updates.length, 'keywords');

          return {
            editedKeywords: newEdited,
            dirtyKeywords: newDirty,
            historyStack: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      setFilters: (filters) => set({ filters }),
      setSorts: (sorts) => set({ sorts }),

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

      getDisplayData: () => {
        const state = get();
        
        console.log('🔍 getDisplayData called:', {
          hasServerData: !!state.serverData,
          serverDataLength: state.serverData?.length,
          serverDataType: typeof state.serverData,
          isArray: Array.isArray(state.serverData),
        });

        // ✅ FIX: Return empty array if no server data
        if (!state.serverData || !Array.isArray(state.serverData)) {
          console.warn('⚠️ No server data available, returning empty array');
          return [];
        }

        const result = state.serverData.map((group) => {
          if (!group._children) {
            console.log('ℹ️ Group has no children:', group.id || group.name);
            return group;
          }

          const children = group._children.map((keyword: any) => {
            const edits = state.editedKeywords.get(keyword.keyword_id);
            const isPushed = state.pushedKeywords.has(keyword.keyword_id);
            const isDirty = state.dirtyKeywords.has(keyword.keyword_id);

            return {
              ...keyword,
              ...edits, // ✅ Apply edits on top of original data
              _isDirty: isDirty,
              _isPushed: isPushed,
              _highlighted: isDirty && !isPushed,
              is_editable: keyword.is_editable !== false,
            };
          });

          return { ...group, _children: children };
        });

        console.log('✅ getDisplayData returning:', {
          length: result.length,
          firstItem: result[0],
          hasChildren: result[0]?._children?.length,
        });

        return result;
      },

      getPendingChanges: () => {
        const state = get();
        const changes: any[] = [];

        // ✅ FIX: Only include keywords that are dirty AND not pushed
        state.editedKeywords.forEach((edits, keywordId) => {
          if (state.pushedKeywords.has(keywordId)) {
            // Skip already pushed changes
            return;
          }

          if (!state.dirtyKeywords.has(keywordId)) {
            // Skip non-dirty keywords (shouldn't happen, but safety check)
            return;
          }

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

        console.log('📊 Pending changes:', changes.length);
        return changes;
      },

      getKeywordById: (id) => {
        const state = get();
        const original = state.serverData
          ?.flatMap((g) => g._children || [])
          .find((k) => k.keyword_id === id);

        if (!original) return null;

        const edits = state.editedKeywords.get(id);
        return { ...original, ...edits };
      },

      reset: () => set(initialState),
    }),
    { name: "KeywordBidStore" },
  ),
);