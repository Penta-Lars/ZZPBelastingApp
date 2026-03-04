import { useState, useCallback } from 'react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types/gage.types';

const STORAGE_KEY = 'zzp-custom-expense-categories';

function loadCustom(): { value: string; label: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustom(cats: { value: string; label: string }[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

export function useCategories() {
  const [custom, setCustom] = useState<{ value: string; label: string }[]>(loadCustom);

  const allCategories = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...custom.filter(c => !DEFAULT_EXPENSE_CATEGORIES.some(d => d.value === c.value)),
  ];

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    // Voorkom duplicaten
    if (allCategories.some(c => c.value.toLowerCase() === trimmed.toLowerCase())) return false;
    const newCat = { value: trimmed, label: `🏷️ ${trimmed}` };
    const updated = [...custom, newCat];
    saveCustom(updated);
    setCustom(updated);
    return true;
  }, [custom, allCategories]);

  const removeCustomCategory = useCallback((value: string) => {
    const updated = custom.filter(c => c.value !== value);
    saveCustom(updated);
    setCustom(updated);
  }, [custom]);

  return { allCategories, custom, addCategory, removeCustomCategory };
}
