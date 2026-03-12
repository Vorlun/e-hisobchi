import React from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { formatUzs } from '../../utils/currency';
import type { PredictionResult } from '../../services/predictiveInsights';

interface PredictiveInsightsWidgetProps {
  result: PredictionResult;
  className?: string;
}

export function PredictiveInsightsWidget({ result, className = '' }: PredictiveInsightsWidgetProps) {
  const { predictions, advice, budgetWarning } = result;
  if (predictions.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Spending forecast">
      <h3 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#1E40AF]" aria-hidden />
        Spending Forecast
      </h3>
      <div className="space-y-2">
        {predictions.map((p) => (
          <div
            key={p.category}
            className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
          >
            <span className="text-sm font-medium text-[#0F172A]">{p.category}</span>
            <span className="text-sm text-[#64748B]">
              {formatUzs(p.predicted)}
              <span className="text-xs text-[#94A3B8] ml-1">predicted</span>
            </span>
          </div>
        ))}
      </div>
      {budgetWarning && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-sm text-[#92400E]"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D97706]" aria-hidden />
          <p>{budgetWarning}</p>
        </div>
      )}
      {advice && (
        <p className="text-sm text-[#64748B] italic">{advice}</p>
      )}
    </div>
  );
}
