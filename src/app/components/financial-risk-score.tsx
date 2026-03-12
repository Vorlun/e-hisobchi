import React from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface RiskFactor {
  name: string;
  impact: 'high' | 'medium' | 'low';
  value: string;
}

interface FinancialRiskScoreProps {
  score: number;
  factors: RiskFactor[];
}

export function FinancialRiskScore({ score, factors }: FinancialRiskScoreProps) {
  const getRiskLevel = () => {
    if (score <= 30) return { level: 'Low Risk', color: 'success', bg: 'bg-[#D1FAE5]', border: 'border-[#10B981]', text: 'text-[#10B981]', icon: CheckCircle2 };
    if (score <= 60) return { level: 'Medium Risk', color: 'warning', bg: 'bg-[#FEF3C7]', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]', icon: AlertTriangle };
    return { level: 'High Risk', color: 'danger', bg: 'bg-[#FEE2E2]', border: 'border-[#DC2626]', text: 'text-[#DC2626]', icon: AlertTriangle };
  };

  const risk = getRiskLevel();
  const RiskIcon = risk.icon;

  const getScoreColor = () => {
    if (score <= 30) return 'text-[#10B981]';
    if (score <= 60) return 'text-[#F59E0B]';
    return 'text-[#DC2626]';
  };

  const getProgressColor = () => {
    if (score <= 30) return 'bg-[#10B981]';
    if (score <= 60) return 'bg-[#F59E0B]';
    return 'bg-[#DC2626]';
  };

  const getExplanationText = () => {
    const highImpactFactors = factors.filter(f => f.impact === 'high');
    const mediumImpactFactors = factors.filter(f => f.impact === 'medium');
    
    if (score <= 30) {
      return "Your financial health is strong. Keep maintaining good spending habits and continue building your savings.";
    } else if (score <= 60) {
      const reasons = [];
      if (highImpactFactors.length > 0) {
        reasons.push(highImpactFactors[0].value);
      }
      if (mediumImpactFactors.length > 0) {
        reasons.push(mediumImpactFactors[0].value);
      }
      return `Medium risk due to ${reasons.join(' and ')}. Consider optimizing your budget.`;
    } else {
      const reasons = [];
      if (highImpactFactors.length > 0) {
        reasons.push(highImpactFactors[0].value);
      }
      if (highImpactFactors.length > 1) {
        reasons.push(highImpactFactors[1].value);
      }
      return `High risk due to ${reasons.join(' and ')}. Immediate action recommended.`;
    }
  };

  return (
    <Card className={`${risk.bg} border-2 ${risk.border}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${risk.bg} ring-2 ${risk.border} flex items-center justify-center`}>
              <Shield className={`w-6 h-6 ${risk.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">Financial Risk Score</h3>
              <p className="text-xs text-[#64748B]">Real-time financial stability assessment</p>
            </div>
          </div>
          <Badge variant={risk.color as any}>
            {risk.level}
          </Badge>
        </div>

        {/* Score Display */}
        <div className="text-center py-6">
          <div className="relative inline-block">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke={score <= 30 ? '#10B981' : score <= 60 ? '#F59E0B' : '#DC2626'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 534} 534`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl font-bold ${getScoreColor()}`}>
                {score}
              </div>
              <div className="text-sm text-[#64748B] mt-1">out of 100</div>
            </div>
          </div>
        </div>

        {/* Risk Level Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-[#64748B]">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <div className="relative h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
            {/* Gradient background zones */}
            <div className="absolute inset-0 flex">
              <div className="w-[30%] bg-[#10B981]/20" />
              <div className="w-[30%] bg-[#F59E0B]/20" />
              <div className="w-[40%] bg-[#DC2626]/20" />
            </div>
            {/* Zone markers */}
            <div className="absolute left-[30%] h-full w-0.5 bg-white" />
            <div className="absolute left-[60%] h-full w-0.5 bg-white" />
            {/* Current position indicator */}
            <div
              className={`absolute h-full w-2 ${getProgressColor()} rounded-full shadow-lg`}
              style={{ left: `calc(${score}% - 4px)` }}
            />
          </div>
        </div>

        {/* Explanation */}
        <div className={`p-4 rounded-xl border ${risk.border} bg-white/50`}>
          <div className="flex items-start gap-3">
            <RiskIcon className={`w-5 h-5 ${risk.text} flex-shrink-0 mt-0.5`} />
            <p className="text-sm text-[#0F172A] leading-relaxed">
              {getExplanationText()}
            </p>
          </div>
        </div>

        {/* Risk Factors Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#0F172A]">Contributing Factors</h4>
          <div className="space-y-2">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  {factor.impact === 'high' ? (
                    <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  ) : factor.impact === 'medium' ? (
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  )}
                  <span className="text-sm text-[#0F172A]">{factor.name}</span>
                </div>
                <span className="text-xs font-medium text-[#64748B]">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {score > 30 && (
          <div className="p-4 bg-[#DBEAFE] rounded-xl border border-[#1E40AF]/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Recommended Actions</h4>
                <ul className="text-xs text-[#64748B] space-y-1.5">
                  {score > 60 && (
                    <>
                      <li>• Reduce spending in high-expense categories</li>
                      <li>• Address outstanding debts as priority</li>
                      <li>• Create an emergency fund if not available</li>
                    </>
                  )}
                  {score > 30 && score <= 60 && (
                    <>
                      <li>• Review and optimize monthly budgets</li>
                      <li>• Maintain consistent income streams</li>
                      <li>• Monitor spending patterns weekly</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
