import { useState, useEffect, useCallback, useMemo } from 'react';

export function useTableSelection<T extends { id: string }>(
  data: T[],
  onChange: (selectedIds: string[]) => void
): {
  selectedItems: Set<string>;
  handleItemSelect: (id: string, checked: boolean) => void;
  handleSelectAll: (checked: boolean) => void;
  getHeaderCheckboxState: () => boolean | 'indeterminate';
} {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const dataIds = useMemo(() => new Set(data.map((item) => item.id)), [data]);

  useEffect(() => {
    onChange(Array.from(selectedItems));
  }, [selectedItems, onChange]);

  useEffect(() => {
    const shouldReset = Array.from(selectedItems).some(
      (id) => !dataIds.has(id)
    );

    if (shouldReset) {
      setSelectedItems(
        (prev) => new Set(Array.from(prev).filter((id) => dataIds.has(id)))
      );
    }
  }, [dataIds, selectedItems]);

  const handleItemSelect = useCallback((id: string, checked: boolean): void => {
    setSelectedItems((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean): void => {
      setSelectedItems(new Set(checked ? data.map((item) => item.id) : []));
    },
    [data]
  );

  const getHeaderCheckboxState = useCallback((): boolean | 'indeterminate' => {
    if (selectedItems.size === 0) return false;
    if (selectedItems.size === data.length) return true;
    return 'indeterminate';
  }, [selectedItems.size, data.length]);

  return {
    selectedItems,
    handleItemSelect,
    handleSelectAll,
    getHeaderCheckboxState,
  };
}
