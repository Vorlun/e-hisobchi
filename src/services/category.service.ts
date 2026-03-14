/**
 * Category service — single entry for categories API.
 */

import * as categoriesApi from './categories.api';
import type {
  CategoryApi,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryTypeApi,
} from '../types/category.types';

export type { CategoryApi, CreateCategoryRequest, UpdateCategoryRequest, CategoryTypeApi } from '../types/category.types';

export async function fetchCategories(type?: CategoryTypeApi): Promise<CategoryApi[]> {
  const list = await categoriesApi.getCategories(type);
  return list.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as CategoryTypeApi,
    color: c.color ?? '#64748B',
    isDefault: c.isDefault ?? false,
  }));
}

export async function createCategory(data: CreateCategoryRequest): Promise<CategoryApi> {
  return categoriesApi.createCategory(data);
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<CategoryApi> {
  return categoriesApi.updateCategory(id, data);
}

export async function deleteCategory(id: string): Promise<void> {
  await categoriesApi.deleteCategory(id);
}
