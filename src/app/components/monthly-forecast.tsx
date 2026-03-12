import React from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { TrendingUp, TrendingDown, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface PredictedExpense {
  category: string;
  amount: number;
  confidence: number;
  recurring: boolean;
}

interface MonthlyForecastProps {
  currentMonthSpending: number;
  predictedExpenses: PredictedExpense[];
  historicalData: Array<{ month: string; actual: number | null; predicted: number | null }>;
}

export function MonthlyForecast({ 
  currentMonthSpending, 
  predictedExpenses,
  historicalData 
}: MonthlyForecastProps) {
  const totalPredicted = predictedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const difference = totalPredicted - currentMonthSpending;
  const percentageChange = ((difference / currentMonthSpending) * 100).toFixed(1);
  const isIncreasing = difference > 0;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#F59E0B',
      'Transportation': '#8B5CF6',
      'Shopping': '#EC4899',
      'Bills & Utilities': '#1E40AF',
      'Entertainment': '#10B981',
      'Healthcare': '#DC2626',
      'Other': '#64748B',
    };
    return colors[category] || '#64748B';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-[#10B981]';
    if (confidence >= 70) return 'text-[#F59E0B]';
    return 'text-[#DC2626]';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return { variant: 'success' as const, label: 'High' };
    if (confidence >= 70) return { variant: 'warning' as const, label: 'Medium' };
    return { variant: 'danger' as const, label: 'Low' };
  };

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">Next Month Forecast</h3>
              <p className="text-sm text-[#64748B]">AI-predicted expenses based on your patterns</p>
            </div>
          </div>
          <Badge variant="info" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            March 2026
          </Badge>
        </div>

        {/* Total Prediction Summary */}
        <div className={`p-4 rounded-xl border-2 ${
          isIncreasing 
            ? 'bg-[#FEF3C7] border-[#F59E0B]/20' 
            : 'bg-[#D1FAE5] border-[#10B981]/20'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-[#64748B] mb-1">Predicted Total Spending</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-[#0F172A]">
                  ${totalPredicted.toLocaleString()}
                </h3>
                <div className={`flex items-center gap-1 ${
                  isIncreasing ? 'text-[#F59E0B]' : 'text-[#10B981]'
                }`}>
                  {isIncreasing ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {isIncreasing ? '+' : ''}{percentageChange}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#64748B] mb-1">Current Month</p>
              <p className="text-lg font-semibold text-[#0F172A]">
                ${currentMonthSpending.toLocaleString()}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {isIncreasing ? 'Expected increase' : 'Expected decrease'}
              </p>
            </div>
          </div>

          {/* Comparison Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#64748B]">
              <span>Current</span>
              <span>Predicted</span>
            </div>
            <div className="relative h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-[#94A3B8] rounded-full"
                style={{ width: '100%' }}
              />
              <div
                className={`absolute h-full rounded-full ${
                  isIncreasing ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                }`}
                style={{ width: `${(totalPredicted / currentMonthSpending) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div>
          <h4 className="text-sm font-semibold text-[#0F172A] mb-4">Spending Trend & Projection</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historicalData} id="monthly-forecast-chart">
              <CartesianGrid key="grid-forecast" strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                key="xaxis-forecast"
                dataKey="month" 
                stroke="#64748B" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                key="yaxis-forecast"
                stroke="#64748B" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                key="tooltip-forecast"
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine 
                key="refline-forecast"
                x="Feb" 
                stroke="#94A3B8" 
                strokeDasharray="3 3" 
                label={{ value: 'Today', position: 'top', fill: '#64748B', fontSize: 11 }}
              />
              <Line 
                key="actual-line-forecast"
                type="monotone" 
                dataKey="actual" 
                stroke="#1E40AF" 
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#1E40AF' }}
                name="Historical"
                connectNulls
              />
              <Line 
                key="predicted-line-forecast"
                type="monotone" 
                dataKey="predicted" 
                stroke="#10B981" 
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#10B981' }}
                name="Forecast"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#1E40AF]" />
              <span className="text-xs text-[#64748B]">Historical Spending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-[#10B981] border-dashed" style={{ borderTop: '2px dashed #10B981', height: 0 }} />
              <span className="text-xs text-[#64748B]">Predicted Spending</span>
            </div>
          </div>
        </div>

        {/* Predicted Expenses List */}
        <div>
          <h4 className="text-sm font-semibold text-[#0F172A] mb-4">Predicted Expense Breakdown</h4>
          <div className="space-y-3">
            {predictedExpenses.map((expense, index) => {
              const confidenceBadge = getConfidenceBadge(expense.confidence);
              return (
                <div 
                  key={index}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#1E40AF]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(expense.category) }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#0F172A]">{expense.category}</p>
                          {expense.recurring && (
                            <Badge variant="secondary" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Based on historical pattern
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0F172A]">
                        ${expense.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748B]">Confidence:</span>
                      <Badge variant={confidenceBadge.variant} className="text-xs">
                        {confidenceBadge.label}
                      </Badge>
                      <span className={`text-xs font-semibold ${getConfidenceColor(expense.confidence)}`}>
                        {expense.confidence}%
                      </span>
                    </div>
                    <div className="w-24 bg-[#E2E8F0] rounded-full h-1.5">
                      <div
                        className={`h-full rounded-full ${
                          expense.confidence >= 85 ? 'bg-[#10B981]' :
                          expense.confidence >= 70 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
                        }`}
                        style={{ width: `${expense.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="p-4 bg-[#DBEAFE] rounded-xl border border-[#1E40AF]/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#1E40AF]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] mb-2">AI Insight</h4>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {isIncreasing ? (
                  <>
                    Your predicted spending is <span className="font-semibold text-[#0F172A]">
                      ${Math.abs(difference).toLocaleString()}
                    </span> higher than this month. Consider reviewing high-confidence recurring expenses.
                  </>
                ) : (
                  <>
                    Great news! Your predicted spending is <span className="font-semibold text-[#0F172A]">
                      ${Math.abs(difference).toLocaleString()}
                    </span> lower than this month. You're on track for better savings.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Want to reduce predicted spending?</p>
            <p className="text-xs text-[#64748B] mt-0.5">Review and adjust your upcoming budgets</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:bg-[#1E40AF]/90 transition-all text-sm font-medium">
            Adjust Budget
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
