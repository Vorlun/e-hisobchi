import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import type { FinancialAlert, AlertSeverity } from '../../services/smartAlerts';

interface SmartAlertsPanelProps {
  alerts: FinancialAlert[];
  className?: string;
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ComponentType<{ className?: string }>; bg: string; border: string; iconColor: string }
> = {
  info: {
    icon: Info,
    bg: 'bg-[#EFF6FF]',
    border: 'border-[#BFDBFE]',
    iconColor: 'text-[#1E40AF]',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
    iconColor: 'text-[#D97706]',
  },
  danger: {
    icon: AlertCircle,
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#FECACA]',
    iconColor: 'text-[#DC2626]',
  },
};

export function SmartAlertsPanel({ alerts, className = '' }: SmartAlertsPanelProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Financial alerts">
      <h3 className="text-lg font-semibold text-[#0F172A]">Smart Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}
              role="alert"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#0F172A] text-sm">{alert.title}</p>
                <p className="text-sm text-[#64748B] mt-0.5">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
