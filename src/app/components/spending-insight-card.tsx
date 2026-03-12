import React from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface SpendingInsight {
  category: string;
  currentPercentage: number;
  recommendedPercentage: number;
  amount: number;
  income: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'danger';
}

interface SpendingInsightCardProps {
  insight: SpendingInsight;
}

export function SpendingInsightCard({ insight }: SpendingInsightCardProps) {
  const difference = insight.currentPercentage - insight.recommendedPercentage;
  const isOverBudget = difference > 0;
  
  const getStatusColor = () => {
    switch (insight.status) {
      case 'healthy':
        return {
          bg: 'bg-[#D1FAE5]',
          border: 'border-[#10B981]/20',
          text: 'text-[#10B981]',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-[#FEF3C7]',
          border: 'border-[#F59E0B]/20',
          text: 'text-[#F59E0B]',
          icon: AlertTriangle,
        };
      case 'danger':
        return {
          bg: 'bg-[#FEE2E2]',
          border: 'border-[#DC2626]/20',
          text: 'text-[#DC2626]',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-[#F1F5F9]',
          border: 'border-[#94A3B8]/20',
          text: 'text-[#64748B]',
          icon: CheckCircle2,
        };
    }
  };

  const statusStyle = getStatusColor();
  const StatusIcon = statusStyle.icon;
  const TrendIcon = insight.trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <Card className={`${statusStyle.bg} ${statusStyle.border} border-2`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">Smart Financial Insight</h3>
              <p className="text-xs text-[#64748B]">AI-powered recommendation</p>
            </div>
          </div>
          <Badge variant={insight.status === 'healthy' ? 'success' : insight.status === 'warning' ? 'warning' : 'danger'}>
            {insight.status === 'healthy' ? 'On Track' : insight.status === 'warning' ? 'Review' : 'Action Needed'}
          </Badge>
        </div>

        {/* Category Focus */}
        <div className={`p-4 bg-white rounded-xl border ${statusStyle.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#64748B] mb-1">Category</p>
              <p className="text-lg font-bold text-[#0F172A]">{insight.category}</p>
            </div>
            <div className={`flex items-center gap-1 ${statusStyle.text}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {insight.trend === 'up' ? '+' : insight.trend === 'down' ? '-' : ''}
                {Math.abs(difference).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Current vs Recommended */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#64748B] mb-1">Your Spending</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-2xl font-bold ${statusStyle.text}`}>
                  {insight.currentPercentage}%
                </p>
                <p className="text-xs text-[#94A3B8]">of income</p>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                ${insight.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] mb-1">Recommended</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-[#10B981]">
                  {insight.recommendedPercentage}%
                </p>
                <p className="text-xs text-[#94A3B8]">of income</p>
              </div>
              <p className="text-xs text-[#64748B] mt-1">
                ${Math.round((insight.income * insight.recommendedPercentage) / 100).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Visual Comparison Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Current</span>
              <span>Recommended Limit</span>
            </div>
            <div className="relative h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`absolute h-full rounded-full transition-all ${
                  isOverBudget ? 'bg-[#DC2626]' : 'bg-[#10B981]'
                }`}
                style={{ width: `${Math.min(insight.currentPercentage, 100)}%` }}
              />
              <div
                className="absolute h-full border-r-2 border-[#1E40AF]"
                style={{ left: `${insight.recommendedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recommendation Text */}
        <div className={`p-4 rounded-xl border ${statusStyle.border} bg-white/50`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`w-5 h-5 ${statusStyle.text} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm text-[#0F172A] leading-relaxed">
                {isOverBudget ? (
                  <>
                    You are spending <span className="font-semibold">{insight.currentPercentage}%</span> of your income on{' '}
                    <span className="font-semibold">{insight.category}</span>. 
                    The recommended threshold is <span className="font-semibold">{insight.recommendedPercentage}%</span>.
                    {difference >= 10 && (
                      <> Consider reducing this category by <span className="font-semibold">
                        ${Math.round((insight.amount - (insight.income * insight.recommendedPercentage) / 100)).toLocaleString()}
                      </span> to stay within budget.</>
                    )}
                  </>
                ) : (
                  <>
                    Great job! You are spending <span className="font-semibold">{insight.currentPercentage}%</span> of your income on{' '}
                    <span className="font-semibold">{insight.category}</span>, which is within the recommended{' '}
                    <span className="font-semibold">{insight.recommendedPercentage}%</span> threshold.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
