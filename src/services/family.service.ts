/**
 * Family API — create, update, delete, invite link, join, leave, members, stats, transactions.
 */

import { api } from './api';
import type { Family, FamilyMember, FamilyStats, FamilyTransaction, FamilyTransactionsPagination } from '../types/family.types';

const FAMILY_BASE = '/family';

interface WrappedResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface CreateFamilyData {
  id: string;
  name: string;
  inviteToken: string;
  inviteTokenExpiresAt: string;
  owner: { id?: string; fullName: string; email?: string };
  memberCount: number;
  createdAt: string;
}

interface GetMyFamilyData {
  id: string;
  name: string;
  inviteToken?: string;
  inviteTokenExpiresAt?: string;
  owner: { id?: string; fullName: string; email?: string };
  memberCount?: number;
  createdAt?: string;
  members?: FamilyMember[];
}

interface InviteLinkData {
  inviteToken: string;
  inviteTokenExpiresAt?: string;
}

interface PaginatedFamilyTransactions {
  content: FamilyTransaction[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

function unwrap<T>(res: WrappedResponse<T> | T, key: keyof WrappedResponse<T> = 'data'): T {
  const raw = res as WrappedResponse<T>;
  if (raw && typeof raw === 'object' && key in raw && raw[key] !== undefined) {
    return raw[key] as T;
  }
  return res as T;
}

export async function createFamily(name: string): Promise<Family> {
  const res = await api<WrappedResponse<CreateFamilyData>>(FAMILY_BASE, {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  });
  const data = unwrap(res);
  if (!data?.id) throw new Error('Invalid create family response');
  return {
    id: data.id,
    name: data.name,
    inviteToken: data.inviteToken,
    inviteTokenExpiresAt: data.inviteTokenExpiresAt,
    owner: data.owner,
    memberCount: data.memberCount ?? 1,
    createdAt: data.createdAt,
  };
}

export async function updateFamilyName(name: string): Promise<Family> {
  const res = await api<WrappedResponse<GetMyFamilyData> | GetMyFamilyData>(FAMILY_BASE, {
    method: 'PUT',
    body: JSON.stringify({ name: name.trim() }),
  });
  const data = unwrap(res as WrappedResponse<GetMyFamilyData>);
  if (!data?.id) throw new Error('Invalid update family response');
  return {
    id: data.id,
    name: data.name,
    inviteToken: data.inviteToken,
    inviteTokenExpiresAt: data.inviteTokenExpiresAt,
    owner: data.owner,
    memberCount: data.memberCount ?? (data.members?.length ?? 0),
    createdAt: data.createdAt ?? '',
    members: data.members,
  };
}

export async function deleteFamily(): Promise<void> {
  await api(`${FAMILY_BASE}`, { method: 'DELETE' });
}

export async function generateInviteLink(): Promise<string> {
  const res = await api<WrappedResponse<InviteLinkData> | InviteLinkData>(
    `${FAMILY_BASE}/invite-link`,
    { method: 'PATCH' }
  );
  const data = (res && typeof res === 'object' && 'data' in res ? (res as WrappedResponse<InviteLinkData>).data : res) as InviteLinkData | undefined;
  const token = data?.inviteToken ?? (res as InviteLinkData)?.inviteToken;
  if (!token || typeof token !== 'string') throw new Error('Invalid invite link response');
  return token;
}

export async function joinFamily(token: string): Promise<void> {
  const params = new URLSearchParams({ token });
  await api<WrappedResponse<unknown>>(`${FAMILY_BASE}/join?${params.toString()}`, {
    method: 'POST',
  });
}

export async function leaveFamily(): Promise<void> {
  await api(`${FAMILY_BASE}/leave`, { method: 'DELETE' });
}

export async function getMyFamily(): Promise<Family | null> {
  const res = await api<WrappedResponse<GetMyFamilyData> | GetMyFamilyData>(`${FAMILY_BASE}/me`);
  const data = (res && typeof res === 'object' && 'data' in res ? (res as WrappedResponse<GetMyFamilyData>).data : res) as GetMyFamilyData | undefined;
  if (!data?.id) return null;
  const members: FamilyMember[] = (data.members ?? []).map((m: Partial<FamilyMember>) => ({
    id: m.id ?? (m as { userId?: string }).userId ?? '',
    userId: (m as { userId?: string }).userId ?? m.id,
    fullName: m.fullName ?? '',
    email: m.email,
    role: m.role ?? 'MEMBER',
    joinedAt: m.joinedAt ?? '',
    status: m.status ?? 'active',
  }));
  return {
    id: data.id,
    name: data.name,
    inviteToken: data.inviteToken,
    inviteTokenExpiresAt: data.inviteTokenExpiresAt,
    owner: data.owner,
    memberCount: data.memberCount ?? members.length,
    createdAt: data.createdAt ?? '',
    members,
  };
}

export async function removeMember(userId: string): Promise<void> {
  await api(`${FAMILY_BASE}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}

export async function getFamilyStats(): Promise<FamilyStats | null> {
  const res = await api<WrappedResponse<FamilyStats> | FamilyStats>(`${FAMILY_BASE}/stats`);
  const data = (res && typeof res === 'object' && 'data' in res ? (res as WrappedResponse<FamilyStats>).data : res) as FamilyStats | undefined;
  if (!data || typeof data !== 'object') return null;
  return {
    totalBalance: data.totalBalance ?? 0,
    totalExpenseThisMonth: data.totalExpenseThisMonth ?? 0,
    totalIncomeThisMonth: data.totalIncomeThisMonth ?? 0,
    memberExpenses: data.memberExpenses ?? [],
  };
}

export async function getFamilyTransactions(params?: { page?: number; size?: number }): Promise<{
  content: FamilyTransaction[];
  pagination: FamilyTransactionsPagination;
}> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.size != null) search.set('size', String(params.size));
  const query = search.toString();
  const res = await api<WrappedResponse<PaginatedFamilyTransactions> | PaginatedFamilyTransactions>(
    `${FAMILY_BASE}/transactions${query ? `?${query}` : ''}`
  );
  const wrapped = res as WrappedResponse<PaginatedFamilyTransactions>;
  const raw = (wrapped?.data ?? res) as PaginatedFamilyTransactions;
  const content = Array.isArray(raw?.content) ? raw.content : [];
  return {
    content,
    pagination: {
      page: raw?.page ?? 0,
      size: raw?.size ?? 20,
      totalPages: raw?.totalPages ?? 0,
      totalElements: raw?.totalElements ?? 0,
    },
  };
}
