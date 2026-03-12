/**
 * Categories API — transport layer for backend categories.
 * Categories change rarely; they are loaded once on app init and cached in the store.
 */

import { api } from './api';

/** Backend category response. */
export interface Category {
  id: string;
  name: string;
  type: string; // INCOME | EXPENSE | TRANSFER (backend enum)
  color: string;
  isDefault: boolean;
}

export type CategoryTypeApi = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface CreateCategoryRequest {
  name: string;
  type: CategoryTypeApi;
  color: string;
}

export interface UpdateCategoryRequest {
  name: string;
  type: CategoryTypeApi;
  color: string;
}

function checkSuccess<T>(res: T & { success?: boolean }): T {
  if (res && typeof res === 'object' && (res as { success?: boolean }).success === false) {
    throw new Error('Request failed');
  }
  return res;
}

export async function getCategories(type?: CategoryTypeApi): Promise<Category[]> {
  const search = new URLSearchParams();
  if (type) search.set('type', type);
  const q = search.toString();
  const res = await api<Category[] | { success: boolean; data?: Category[] }>(
    `/categories${q ? `?${q}` : ''}`
  );
  checkSuccess(res as { success?: boolean });
  const list = Array.isArray(res) ? res : (res as { data?: Category[] }).data;
  if (!Array.isArray(list)) throw new Error('Invalid categories response');
  return list;
}

export async function getCategoriesByType(type: CategoryTypeApi): Promise<Category[]> {
  return getCategories(type);
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const res = await api<Category | { success: boolean; data?: Category }>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const cat = (res as { data?: Category }).data ?? (res as Category);
  if (!cat?.id) throw new Error('Invalid create category response');
  return cat;
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const res = await api<Category | { success: boolean; data?: Category }>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  checkSuccess(res as { success?: boolean });
  const cat = (res as { data?: Category }).data ?? (res as Category);
  if (!cat?.id) throw new Error('Invalid update category response');
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await api<unknown>(`/categories/${id}`, { method: 'DELETE' });
  checkSuccess(res as { success?: boolean });
}

