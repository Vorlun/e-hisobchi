import React, { useState, useCallback } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { Users, Plus, Mail, Shield, Trash2, Link2, LogOut, Loader2, Copy, Check } from 'lucide-react';
import { useFamily } from '../../store/familyStore';
import { useAuth } from '../../store/authStore';
import type { FamilyMember } from '../../types/family.types';

function formatUzs(n: number): string {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(n) + " so'm";
}

function isOwner(member: FamilyMember, ownerId?: string): boolean {
  const role = member.role?.toUpperCase?.() ?? member.role;
  return role === 'OWNER' || member.id === ownerId || (member as { userId?: string }).userId === ownerId;
}

export default function Family() {
  const {
    family,
    members,
    stats,
    transactions,
    transactionPagination,
    loading,
    loadingStats,
    loadingTransactions,
    error,
    createFamily,
    updateFamilyName,
    deleteFamily,
    generateInviteLink,
    leaveFamily,
    removeMember,
    setFamilyPage,
    loadFamily,
    clearError,
  } = useFamily();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sharingMode, setSharingMode] = useState<'personal' | 'shared'>('personal');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const { user } = useAuth();
  const ownerId = family?.owner?.id != null ? String(family.owner.id) : undefined;
  const currentUserId = user?.id != null ? String(user.id) : undefined;
  const currentUserIsOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  const activeMembers = members.filter(m => (m.status ?? 'active') === 'active').length;
  const pendingMembers = members.filter(m => m.status === 'pending').length;

  const handleGenerateInviteLink = useCallback(async () => {
    setInviteLinkLoading(true);
    try {
      const url = await generateInviteLink();
      setInviteLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard may fail in some contexts
      }
    } catch {
      setInviteLink(null);
    } finally {
      setInviteLinkLoading(false);
    }
  }, [generateInviteLink]);

  const handleCopyInviteLink = useCallback(() => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteLink]);

  const handleCreateFamily = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setCreateSubmitting(true);
    try {
      await createFamily(name);
      setIsCreateModalOpen(false);
      setCreateName('');
    } catch {
      // error in store
    } finally {
      setCreateSubmitting(false);
    }
  }, [createName, createFamily]);

  const handleDeleteFamily = useCallback(async () => {
    setDeleteSubmitting(true);
    try {
      await deleteFamily();
      setIsDeleteModalOpen(false);
    } catch {
      // error in store
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deleteFamily]);

  const handleLeaveFamily = useCallback(async () => {
    setLeaveSubmitting(true);
    try {
      await leaveFamily();
      setIsLeaveModalOpen(false);
    } catch {
      // error in store
    } finally {
      setLeaveSubmitting(false);
    }
  }, [leaveFamily]);

  const handleRemoveMember = useCallback(async (userId: string) => {
    if (!window.confirm('Remove this member from the family?')) return;
    try {
      await removeMember(userId);
    } catch {
      // error in store
    }
  }, [removeMember]);

  const startEditName = useCallback(() => {
    setEditNameValue(family?.name ?? '');
    setEditingName(true);
  }, [family?.name]);

  const saveEditName = useCallback(async () => {
    const name = editNameValue.trim();
    if (!family || !name || name === family.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateFamilyName(name);
      setEditingName(false);
    } catch {
      // error in store
    }
  }, [family, editNameValue, updateFamilyName]);


  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Family Sharing</h1>
          <p className="text-[#64748B] mt-1">Share and manage finances with your family</p>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#DC2626] flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-red-600 hover:underline">Dismiss</button>
          </div>
        )}
        <Card className="bg-gradient-to-br from-[#DBEAFE] to-[#D1FAE5] border-[#1E40AF]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-[#1E40AF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-1">Create a family</h3>
              <p className="text-sm text-[#64748B] mb-4">
                You don&apos;t have a family yet. Create one to invite members and share finances.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Family
              </Button>
            </div>
          </div>
        </Card>

        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Family" size="md">
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <Input
              label="Family Name"
              type="text"
              placeholder="e.g. Smith Family"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)} type="button">
                Cancel
              </Button>
              <Button className="flex-1" type="submit" disabled={createSubmitting || !createName.trim()}>
                {createSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {createSubmitting ? 'Creating…' : 'Create Family'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Family Sharing</h1>
          <p className="text-[#64748B] mt-1">Share and manage finances with your family</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Invite Member
          </Button>
          {currentUserIsOwner && (
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 text-[#DC2626]">
              <Trash2 className="w-4 h-4" />
              Delete Family
            </Button>
          )}
          {!currentUserIsOwner && (
            <Button variant="secondary" onClick={() => setIsLeaveModalOpen(true)} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Leave Family
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[#DC2626] flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="text-red-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Info Banner */}
      <Card className="bg-gradient-to-br from-[#DBEAFE] to-[#D1FAE5] border-[#1E40AF]/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="px-2 py-1 border border-[#E2E8F0] rounded-lg text-[#0F172A] font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={saveEditName}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingName(false)}>Cancel</Button>
              </div>
            ) : (
              <h3 className="font-semibold text-[#0F172A] mb-1">
                {family.name}
                {currentUserIsOwner && (
                  <button type="button" onClick={startEditName} className="ml-2 text-sm text-[#64748B] hover:underline">Edit</button>
                )}
              </h3>
            )}
            <p className="text-sm text-[#64748B] mb-1">
              Owner: {family.owner?.fullName ?? '—'}
            </p>
            <p className="text-sm text-[#64748B] mb-4">
              {family.memberCount} member{family.memberCount !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <Badge variant="info">{activeMembers} Active Members</Badge>
              {pendingMembers > 0 && <Badge variant="warning">{pendingMembers} Pending Invites</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Family Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm text-[#64748B] mb-1">Total Balance</p>
              <p className="text-xl font-semibold text-[#0F172A]">{loadingStats ? '—' : formatUzs(stats.totalBalance)}</p>
            </Card>
            <Card>
              <p className="text-sm text-[#64748B] mb-1">Monthly Income</p>
              <p className="text-xl font-semibold text-[#0F172A]">{loadingStats ? '—' : formatUzs(stats.totalIncomeThisMonth)}</p>
            </Card>
            <Card>
              <p className="text-sm text-[#64748B] mb-1">Monthly Expense</p>
              <p className="text-xl font-semibold text-[#0F172A]">{loadingStats ? '—' : formatUzs(stats.totalExpenseThisMonth)}</p>
            </Card>
          </div>
          {stats.memberExpenses && stats.memberExpenses.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Member analytics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="text-left py-2 text-[#64748B] font-medium">Name</th>
                      <th className="text-right py-2 text-[#64748B] font-medium">Expense</th>
                      <th className="text-right py-2 text-[#64748B] font-medium">Income</th>
                      <th className="text-right py-2 text-[#64748B] font-medium">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.memberExpenses.map((row, i) => (
                      <tr key={row.memberId ?? i} className="border-b border-[#E2E8F0]">
                        <td className="py-2 text-[#0F172A]">{row.memberName}</td>
                        <td className="py-2 text-right text-[#0F172A]">{formatUzs(row.expense ?? 0)}</td>
                        <td className="py-2 text-right text-[#0F172A]">{formatUzs(row.income ?? 0)}</td>
                        <td className="py-2 text-right text-[#0F172A]">{row.transactionCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Sharing Mode Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-1">Sharing Mode</h3>
            <p className="text-sm text-[#64748B]">
              Switch between personal and shared financial view
            </p>
          </div>
          <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-xl">
            <button
              onClick={() => setSharingMode('personal')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${sharingMode === 'personal' ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-[#64748B]'}`}
            >
              Personal
            </button>
            <button
              onClick={() => setSharingMode('shared')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${sharingMode === 'shared' ? 'bg-white text-[#10B981] shadow-sm' : 'text-[#64748B]'}`}
            >
              Shared
            </button>
          </div>
        </div>
      </Card>

      {/* Family Members */}
      <div>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Family Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.length === 0 ? (
            <p className="text-[#64748B]">No members yet. Invite someone using the invite link.</p>
          ) : (
            members.map((member) => {
              const isOwnerRole = isOwner(member, ownerId);
              const roleDisplay = isOwnerRole ? 'OWNER' : (member.role ?? 'member');
              const memberId = (member as { userId?: string }).userId ?? member.id;
              const canRemove = currentUserIsOwner && !isOwner(member, ownerId);
              return (
                <Card key={member.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center text-white font-semibold">
                        {(member.fullName || '?').split(' ').map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#0F172A]">{member.fullName}</h4>
                        <p className="text-sm text-[#64748B]">{member.email ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Role</span>
                      <Badge variant={roleDisplay === 'OWNER' ? 'info' : 'default'}>{roleDisplay}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Status</span>
                      <Badge variant={(member.status ?? 'active') === 'active' ? 'success' : 'warning'}>
                        {member.status ?? 'active'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748B]">Joined</span>
                      <span className="text-sm font-medium text-[#0F172A]">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 text-[#DC2626]"
                        onClick={() => handleRemoveMember(memberId)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Family Transactions */}
      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Family Transactions</h3>
        {loadingTransactions ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-[#64748B] py-4">No family transactions yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    <th className="text-left py-2 text-[#64748B] font-medium">Member</th>
                    <th className="text-left py-2 text-[#64748B] font-medium">Account</th>
                    <th className="text-left py-2 text-[#64748B] font-medium">Category</th>
                    <th className="text-right py-2 text-[#64748B] font-medium">Amount</th>
                    <th className="text-left py-2 text-[#64748B] font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={tx.id ?? i} className="border-b border-[#E2E8F0]">
                      <td className="py-2 text-[#0F172A]">{tx.memberName}</td>
                      <td className="py-2 text-[#0F172A]">{tx.accountName}</td>
                      <td className="py-2 text-[#0F172A]">{tx.categoryName}</td>
                      <td className="py-2 text-right font-medium text-[#0F172A]">{formatUzs(tx.amount)}</td>
                      <td className="py-2 text-[#64748B]">{tx.date ? new Date(tx.date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactionPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E2E8F0]">
                <p className="text-sm text-[#64748B]">
                  Page {transactionPagination.page + 1} of {transactionPagination.totalPages} ({transactionPagination.totalElements} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={transactionPagination.page <= 0}
                    onClick={() => setFamilyPage(transactionPagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={transactionPagination.page >= transactionPagination.totalPages - 1}
                    onClick={() => setFamilyPage(transactionPagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Permissions */}
      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Member Permissions</h3>
        <div className="space-y-4">
          {[
            { title: 'View Transactions', description: 'Members can view all family transactions', enabled: true },
            { title: 'Add Expenses', description: 'Members can add and edit expenses', enabled: true },
            { title: 'Manage Budgets', description: 'Members can create and modify budgets', enabled: false },
            { title: 'View Analytics', description: 'Members can access financial reports', enabled: true },
            { title: 'Manage Accounts', description: 'Members can add and remove accounts', enabled: false },
          ].map((permission, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-[#E2E8F0] last:border-0">
              <div>
                <p className="font-medium text-[#0F172A]">{permission.title}</p>
                <p className="text-sm text-[#64748B]">{permission.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={permission.enabled} />
                <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Modal — Generate link + Copy */}
      <Modal isOpen={isInviteModalOpen} onClose={() => { setIsInviteModalOpen(false); setInviteLink(null); }} title="Invite Family Member" size="md">
        <div className="space-y-4">
          <div className="p-4 bg-[#DBEAFE] rounded-xl border border-[#1E40AF]/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0F172A] mb-1">Secure Sharing</p>
                <p className="text-xs text-[#64748B]">
                  Share the link below. Invited members will join after opening it.
                </p>
              </div>
            </div>
          </div>
          {!inviteLink ? (
            <Button onClick={handleGenerateInviteLink} disabled={inviteLinkLoading} className="w-full flex items-center justify-center gap-2">
              {inviteLinkLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
              {inviteLinkLoading ? 'Generating…' : 'Generate Invite Link'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[#64748B]">Invite link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A]"
                />
                <Button onClick={handleCopyInviteLink} className="flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => { setIsInviteModalOpen(false); setInviteLink(null); }} type="button">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Family confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Family" size="md">
        <p className="text-[#64748B] mb-4">Are you sure you want to delete this family? All members will lose access.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)} type="button">Cancel</Button>
          <Button className="flex-1 text-[#DC2626]" onClick={handleDeleteFamily} disabled={deleteSubmitting}>
            {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {deleteSubmitting ? 'Deleting…' : 'Delete Family'}
          </Button>
        </div>
      </Modal>

      {/* Leave Family confirmation */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Leave Family" size="md">
        <p className="text-[#64748B] mb-4">Are you sure you want to leave this family?</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setIsLeaveModalOpen(false)} type="button">Cancel</Button>
          <Button className="flex-1" onClick={handleLeaveFamily} disabled={leaveSubmitting}>
            {leaveSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {leaveSubmitting ? 'Leaving…' : 'Leave Family'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
