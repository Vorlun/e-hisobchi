import React from 'react';
import { Card } from './card';
import { TrendingDown, Calendar, Wallet, AlertCircle, Clock } from 'lucide-react';

interface SpendingPredictionProps {
  currentBalance: number;
  averageDailySpending: number;
  currency?: string;
}

export function SpendingPrediction({ 
  currentBalance, 
  averageDailySpending,
  currency = 'UZS'
}: SpendingPredictionProps) {
  const daysRemaining = Math.floor(currentBalance / averageDailySpending);
  const weeksRemaining = Math.floor(daysRemaining / 7);
  
  // Calculate status
  const getStatus = () => {
    if (daysRemaining >= 30) return { color: '#10B981', bg: '#D1FAE5', label: 'Healthy', icon: '✓' };
    if (daysRemaining >= 14) return { color: '#F59E0B', bg: '#FEF3C7', label: 'Moderate', icon: '!' };
    return { color: '#DC2626', bg: '#FEE2E2', label: 'Low', icon: '⚠' };
  };

  const status = getStatus();
  const progressPercentage = Math.min((daysRemaining / 60) * 100, 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount);
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: status.bg }}
            >
              <TrendingDown className="w-4 h-4" style={{ color: status.color }} />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Balance Duration Prediction</h3>
          </div>
          <p className="text-sm text-[#64748B]">
            Estimated time until balance depletion based on spending patterns
          </p>
        </div>
        <div 
          className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ backgroundColor: status.bg }}
        >
          <span className="text-lg">{status.icon}</span>
          <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#1E40AF]" />
            <p className="text-xs text-[#64748B] font-medium">Current Balance</p>
          </div>
          <p className="text-xl font-bold text-[#0F172A]">
            {formatCurrency(currentBalance)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">{currency}</p>
        </div>

        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-[#DC2626]" />
            <p className="text-xs text-[#64748B] font-medium">Avg Daily Spending</p>
          </div>
          <p className="text-xl font-bold text-[#0F172A]">
            {formatCurrency(averageDailySpending)}
          </p>
          <p className="text-xs text-[#64748B] mt-1">{currency}/day</p>
        </div>

        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#10B981]" />
            <p className="text-xs text-[#64748B] font-medium">Est. Duration</p>
          </div>
          <p className="text-xl font-bold text-[#0F172A]">
            {daysRemaining} days
          </p>
          <p className="text-xs text-[#64748B] mt-1">≈ {weeksRemaining} weeks</p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#64748B]">Balance Timeline</span>
          <span className="text-[#0F172A] font-semibold">{daysRemaining} days remaining</span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-[#E2E8F0] rounded-full h-3">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${progressPercentage}%`,
                background: `linear-gradient(to right, ${status.color}, ${status.color}CC)`
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#64748B]">
            <span>Today</span>
            <span className="font-medium" style={{ color: status.color }}>
              {new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Warning/Info Message */}
      {daysRemaining < 30 && (
        <div 
          className="mt-4 p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: status.bg }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: status.color }} />
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: status.color }}>
              {daysRemaining < 14 
                ? 'Your balance may run low soon. Consider reducing non-essential spending.' 
                : 'Your balance is moderate. Monitor your spending to ensure sustainability.'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
        <p className="text-xs text-[#64748B]">
          <span className="font-semibold">AI Analysis:</span> Prediction based on your last 30 days of spending behavior and recurring patterns.
        </p>
      </div>
    </Card>
  );
}
