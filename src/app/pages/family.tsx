import React, { useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Input } from '../components/input';
import { Modal } from '../components/modal';
import { Users, Plus, Mail, Shield, Trash2, UserCheck } from 'lucide-react';

interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  joinedDate: string;
}

const familyMembers: FamilyMember[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', joinedDate: '2026-01-01' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'member', status: 'active', joinedDate: '2026-01-15' },
  { id: 3, name: 'Mike Doe', email: 'mike@example.com', role: 'member', status: 'pending', joinedDate: '2026-02-20' },
];

export default function Family() {
  const [members, setMembers] = useState<FamilyMember[]>(familyMembers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sharingMode, setSharingMode] = useState<'personal' | 'shared'>('personal');
  const [inviteEmail, setInviteEmail] = useState('');

  const activeMembers = members.filter(m => m.status === 'active').length;
  const pendingMembers = members.filter(m => m.status === 'pending').length;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock invite logic
    setIsInviteModalOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Family Sharing</h1>
          <p className="text-[#64748B] mt-1">Share and manage finances with your family</p>
        </div>
        <Button 
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Invite Member
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-br from-[#DBEAFE] to-[#D1FAE5] border-[#1E40AF]/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#0F172A] mb-1">Family Financial Management</h3>
            <p className="text-sm text-[#64748B] mb-4">
              Collaborate with family members on budgets, expenses, and financial goals. 
              Share accounts and track combined spending in one place.
            </p>
            <div className="flex gap-3">
              <Badge variant="info">{activeMembers} Active Members</Badge>
              {pendingMembers > 0 && (
                <Badge variant="warning">{pendingMembers} Pending Invites</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

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
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                sharingMode === 'personal'
                  ? 'bg-white text-[#1E40AF] shadow-sm'
                  : 'text-[#64748B]'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setSharingMode('shared')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                sharingMode === 'shared'
                  ? 'bg-white text-[#10B981] shadow-sm'
                  : 'text-[#64748B]'
              }`}
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
          {members.map((member) => (
            <Card key={member.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center text-white font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0F172A]">{member.name}</h4>
                    <p className="text-sm text-[#64748B]">{member.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Role</span>
                  <Badge variant={member.role === 'admin' ? 'info' : 'default'}>
                    {member.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Status</span>
                  <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                    {member.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Joined</span>
                  <span className="text-sm font-medium text-[#0F172A]">
                    {new Date(member.joinedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                {member.role !== 'admin' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full flex items-center justify-center gap-2 text-[#DC2626]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

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

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Family Member"
        size="md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="p-4 bg-[#DBEAFE] rounded-xl border border-[#1E40AF]/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#0F172A] mb-1">Secure Sharing</p>
                <p className="text-xs text-[#64748B]">
                  Invited members will need to accept the invitation before accessing shared finances
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="member@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Personal Message (Optional)</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
              rows={3}
              placeholder="Add a personal invitation message..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setIsInviteModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button className="flex-1" type="submit">
              <Mail className="w-4 h-4 mr-2" />
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
