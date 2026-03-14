import React, { useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Badge } from '../components/badge';
import { User, Bell, Lock, CreditCard, Globe } from 'lucide-react';
import { useAuth } from '../../store/authStore';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const fullName = user?.fullName ?? '';
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ') || '';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[#64748B] mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <Card className="h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1E40AF] text-white'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <>
              <Card>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Personal Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                      {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <Button variant="secondary" size="sm">Change Photo</Button>
                      <p className="text-xs text-[#94A3B8] mt-2">JPG, PNG or GIF. Max 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name" defaultValue={firstName} />
                    <Input label="Last Name" defaultValue={lastName} />
                  </div>
                  <Input label="Email Address" type="email" defaultValue={user?.email ?? ''} />
                  <Input label="Phone Number" type="tel" defaultValue={user?.phoneNumber ?? ''} />
                  <div>
                    <label className="block text-sm mb-2 text-[#0F172A]">Bio</label>
                    <textarea
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent transition-all"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      defaultValue="Financial analyst and investor passionate about personal finance."
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6 pt-6 border-t border-[#E2E8F0]">
                  <Button>Save Changes</Button>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { title: 'Transaction Alerts', description: 'Get notified for every transaction' },
                  { title: 'Weekly Summary', description: 'Receive weekly financial summary reports' },
                  { title: 'Budget Warnings', description: 'Alert when approaching budget limits' },
                  { title: 'Bill Reminders', description: 'Remind me before bills are due' },
                  { title: 'Debt Updates', description: 'Track debt payment progress' },
                  { title: 'Marketing Emails', description: 'Receive product updates and offers' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-[#E2E8F0] last:border-0">
                    <div>
                      <p className="font-medium text-[#0F172A]">{item.title}</p>
                      <p className="text-sm text-[#64748B]">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 4} />
                      <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <>
              <Card>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Change Password</h3>
                <div className="space-y-4">
                  <Input label="Current Password" type="password" />
                  <Input label="New Password" type="password" />
                  <Input label="Confirm New Password" type="password" />
                </div>
                <div className="flex justify-end mt-6 pt-6 border-t border-[#E2E8F0]">
                  <Button>Update Password</Button>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#0F172A]">Enable 2FA</p>
                    <p className="text-sm text-[#64748B]">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="warning">Not Enabled</Badge>
                </div>
                <div className="mt-6">
                  <Button variant="secondary">Enable 2FA</Button>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'billing' && (
            <>
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F172A]">Account Plan</h3>
                    <p className="text-sm text-[#64748B]">Current subscription status</p>
                  </div>
                  <Badge variant="success">Free Plan</Badge>
                </div>
                <div className="p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <h4 className="text-lg font-semibold text-[#0F172A] mb-2">e-hisobchi MVP</h4>
                  <p className="text-[#64748B] mb-4">
                    Full access to all features including accounts, budgets, analytics, and family sharing.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Unlimited transactions
                    </li>
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Multiple accounts & cards
                    </li>
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Budget planning & tracking
                    </li>
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Advanced analytics
                    </li>
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Family sharing
                    </li>
                    <li className="flex items-center gap-2 text-[#64748B]">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center text-xs text-[#10B981]">✓</span>
                      Smart AI features
                    </li>
                  </ul>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Application Preferences</h3>
              <div className="space-y-6">
                <Select
                  label="Currency"
                  options={[
                    { value: 'usd', label: 'USD - US Dollar' },
                    { value: 'uzs', label: 'UZS - Uzbek Som' },
                    { value: 'eur', label: 'EUR - Euro' },
                    { value: 'rub', label: 'RUB - Russian Ruble' },
                  ]}
                  defaultValue="usd"
                />

                <Select
                  label="Language"
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'uz', label: 'Uzbek' },
                    { value: 'ru', label: 'Russian' },
                  ]}
                  defaultValue="en"
                />

                <Select
                  label="Date Format"
                  options={[
                    { value: 'mm-dd-yyyy', label: 'MM/DD/YYYY' },
                    { value: 'dd-mm-yyyy', label: 'DD/MM/YYYY' },
                    { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
                  ]}
                  defaultValue="mm-dd-yyyy"
                />

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#0F172A]">Dark Mode</p>
                      <p className="text-sm text-[#64748B]">Switch to dark theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-6 border-t border-[#E2E8F0]">
                <Button>Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}