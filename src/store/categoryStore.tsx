import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { Category } from '../types';
import type {
  CategoryApi,
  CategoryTypeApi,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category.types';
import * as categoryService from '../services/category.service';

function mapApiTypeToLocal(type: string): 'income' | 'expense' | 'transfer' {
  const lower = type.toLowerCase();
  if (lower === 'income') return 'income';
  if (lower === 'expense') return 'expense';
  if (lower === 'transfer') return 'transfer';
  return 'expense';
}

function mapToLocal(api: CategoryApi): Category & { type: 'income' | 'expense' | 'transfer' } {
  return {
    id: String(api.id),
    name: api.name,
    type: mapApiTypeToLocal(api.type),
    color: api.color,
    isDefault: api.isDefault,
  };
}

interface CategoryState {
  categories: (Category & { type: 'income' | 'expense' | 'transfer' })[];
  loading: boolean;
  error: string | null;
}

interface CategoryContextValue extends CategoryState {
  fetchCategories: (type?: CategoryTypeApi) => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<CategoryApi>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<CategoryApi>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<(Category & { type: 'income' | 'expense' | 'transfer' })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchCategories = useCallback(async (type?: CategoryTypeApi) => {
    setLoading(true);
    setError(null);
    try {
      const list = await categoryService.fetchCategories(type);
      setCategories(list.map(mapToLocal));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(async (data: CreateCategoryRequest): Promise<CategoryApi> => {
    setError(null);
    try {
      const created = await categoryService.createCategory(data);
      setCategories((prev) => [...prev, mapToLocal(created)]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryRequest): Promise<CategoryApi> => {
    setError(null);
    try {
      const updated = await categoryService.updateCategory(id, data);
      const mapped = mapToLocal(updated);
      setCategories((prev) => prev.map((c) => (c.id === String(id) ? mapped : c)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setError(message);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await categoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setError(message);
      throw err;
    }
  }, []);

  const value = useMemo<CategoryContextValue>(
    () => ({
      categories,
      loading,
      error,
      fetchCategories,
      createCategory,
      updateCategory,
      deleteCategory,
      clearError,
    }),
    [categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory, clearError]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories(): CategoryContextValue {
  const ctx = React.useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used within CategoryProvider');
  return ctx;
}
