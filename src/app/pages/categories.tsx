import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { Tag, Pencil, Trash2, Plus } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import type { CategoryTypeApi } from '../../types/category.types';

type TabFilter = 'ALL' | CategoryTypeApi;

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'DAROMAD',
  EXPENSE: 'XARAJAT',
  TRANSFER: "O'TKAZMA",
};

const COLOR_OPTIONS = [
  '#1E40AF', '#059669', '#7C3AED', '#DC2626', '#D97706',
  '#64748B', '#0EA5E9', '#84CC16',
];

type CategoryLike = { id: string; name: string; type: string; color?: string; isDefault?: boolean };

export default function Categories() {
  const { categories, loadCategories, createCategory, updateCategory, deleteCategory } = useFinance();
  const [typeFilter, setTypeFilter] = useState<TabFilter>('ALL');
  const [editingCategory, setEditingCategory] = useState<CategoryLike | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<CategoryTypeApi>('EXPENSE');
  const [createColor, setCreateColor] = useState(COLOR_OPTIONS[0]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const list = useMemo(() => (categories ?? []) as CategoryLike[], [categories]);

  const filtered = useMemo(() => {
    if (typeFilter === 'ALL') return list;
    return list.filter((c) => c.type?.toUpperCase() === typeFilter);
  }, [list, typeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, CategoryLike[]> = { INCOME: [], EXPENSE: [], TRANSFER: [] };
    filtered.forEach((c) => {
      const key = (c.type?.toUpperCase() || 'EXPENSE') as keyof typeof groups;
      if (groups[key]) groups[key].push(c);
    });
    return groups;
  }, [filtered]);

  const totalCount = filtered.length;

  const openEdit = useCallback((c: CategoryLike) => {
    setEditingCategory(c);
    setEditName(c.name);
    setEditColor(c.color || '#64748B');
  }, []);

  const closeEdit = useCallback(() => {
    setEditingCategory(null);
    setEditSubmitting(false);
  }, []);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setEditSubmitting(true);
    try {
      await updateCategory(editingCategory.id, {
        name: editName.trim(),
        type: (editingCategory.type?.toUpperCase() || 'EXPENSE') as CategoryTypeApi,
        color: editColor,
      });
      closeEdit();
    } finally {
      setEditSubmitting(false);
    }
  }, [editingCategory, editName, editColor, updateCategory, closeEdit]);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setCreateSubmitting(true);
    try {
      await createCategory({ name, type: createType, color: createColor });
      setIsCreateOpen(false);
      setCreateName('');
      setCreateType('EXPENSE');
      setCreateColor(COLOR_OPTIONS[0]);
    } finally {
      setCreateSubmitting(false);
    }
  }, [createName, createType, createColor, createCategory]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  }, [deleteCategory]);

  const tabs: { value: TabFilter; label: string }[] = [
    { value: 'ALL', label: 'Barchasi' },
    { value: 'INCOME', label: TYPE_LABELS.INCOME },
    { value: 'EXPENSE', label: TYPE_LABELS.EXPENSE },
    { value: 'TRANSFER', label: TYPE_LABELS.TRANSFER },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Kategoriyalar</h1>
          <p className="text-[#64748B] mt-1">
            {totalCount} ta kategoriya
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          Kategoriya qo&apos;shish
        </Button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === tab.value ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="p-8 text-center">
          <Tag className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" aria-hidden />
          <p className="text-[#64748B]">No categories yet. Categories are loaded from the server.</p>
        </Card>
      )}

      {filtered.length === 0 && list.length > 0 && (
        <p className="text-[#64748B]">No categories for this filter.</p>
      )}

      {filtered.length > 0 && (
        <div className="space-y-8">
          {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((typeKey) => {
            const items = grouped[typeKey];
            if (!items || items.length === 0) return null;
            return (
              <div key={typeKey}>
                <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                  {TYPE_LABELS[typeKey]}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => (
                    <Card
                      key={c.id}
                      className="p-4 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color || '#64748B' }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#0F172A] truncate">{c.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#64748B] capitalize">{c.type}</span>
                            {c.isDefault && (
                              <span className="text-xs font-medium text-[#1E40AF] bg-[#EFF6FF] px-1.5 py-0.5 rounded">
                                Standart
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-2 text-[#64748B] hover:text-[#1E40AF] hover:bg-[#F8FAFC] rounded-lg"
                          aria-label="Edit category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!c.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c.id)}
                            className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg"
                            aria-label="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={Boolean(editingCategory)} onClose={closeEdit} title="Tahrirlash" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nomi"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Rang</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    editColor === color ? 'border-[#1E40AF] scale-110' : 'border-[#E2E8F0]'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeEdit}>
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1" disabled={editSubmitting || !editName.trim()}>
              {editSubmitting ? 'Saqlanmoqda…' : 'Saqlash'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Kategoriya qo'shish" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nomi"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g. Oziq-ovqat"
            required
          />
          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Turi</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as CategoryTypeApi)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            >
              <option value="INCOME">{TYPE_LABELS.INCOME}</option>
              <option value="EXPENSE">{TYPE_LABELS.EXPENSE}</option>
              <option value="TRANSFER">{TYPE_LABELS.TRANSFER}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Rang</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCreateColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    createColor === color ? 'border-[#1E40AF] scale-110' : 'border-[#E2E8F0]'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1" disabled={createSubmitting || !createName.trim()}>
              {createSubmitting ? 'Qo\'shilmoqda…' : 'Qo\'shish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Kategoriyani o'chirish"
        size="sm"
      >
        <p className="text-[#64748B] mb-4">Ushbu kategoriyani o&apos;chirishni xohlaysizmi?</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
            Bekor qilish
          </Button>
          <Button
            className="flex-1 text-[#DC2626]"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            disabled={deletingId === deleteConfirmId}
          >
            {deletingId === deleteConfirmId ? 'O\'chirilmoqda…' : 'O\'chirish'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
