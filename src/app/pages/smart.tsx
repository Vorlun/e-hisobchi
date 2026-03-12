import React, { useState } from 'react';
import { Card } from '../components/card';
import { Badge } from '../components/badge';
import { 
  Sparkles, 
  Bell, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb,
  Zap,
  Brain,
  Target
} from 'lucide-react';

const smartNotifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Unusual Spending Detected',
    message: 'You spent 45% more on Food & Dining this month compared to your average',
    time: '2 hours ago',
    icon: AlertCircle,
  },
  {
    id: 2,
    type: 'success',
    title: 'Budget Goal Achieved',
    message: 'Great job! You stayed under your Transportation budget this month',
    time: '1 day ago',
    icon: Target,
  },
  {
    id: 3,
    type: 'info',
    title: 'Bill Reminder',
    message: 'Your Electric Bill payment of $120 is due in 3 days',
    time: '2 days ago',
    icon: Bell,
  },
  {
    id: 4,
    type: 'insight',
    title: 'Savings Opportunity',
    message: 'Based on your income, you could save an additional $200 this month',
    time: '3 days ago',
    icon: Lightbulb,
  },
];

const categoryPredictions = [
  { category: 'Food & Dining', currentMonth: 1200, predicted: 1350, trend: 'up' },
  { category: 'Transportation', currentMonth: 450, predicted: 420, trend: 'down' },
  { category: 'Shopping', currentMonth: 920, predicted: 850, trend: 'down' },
  { category: 'Entertainment', currentMonth: 280, predicted: 320, trend: 'up' },
];

export default function Smart() {
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(true);
  const [smartAlertsEnabled, setSmartAlertsEnabled] = useState(true);
  const [predictiveInsights, setPredictiveInsights] = useState(true);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">Smart Features</h1>
        <p className="text-[#64748B] mt-1">AI-powered insights and automation for smarter finance management</p>
      </div>

      {/* Feature Banner */}
      <Card className="bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">AI-Powered Financial Assistant</h2>
            <p className="text-white/90">
              Get intelligent suggestions, automatic categorization, and predictive insights 
              to make better financial decisions.
            </p>
          </div>
        </div>
      </Card>

      {/* Smart Features Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-[#1E40AF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-1">Auto Categorization</h3>
              <p className="text-sm text-[#64748B]">
                Automatically suggest categories based on transaction descriptions
              </p>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-[#0F172A]">
              {autoCategorizationEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoCategorizationEnabled}
                onChange={() => setAutoCategorizationEnabled(!autoCategorizationEnabled)}
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </div>
          </label>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-1">Smart Alerts</h3>
              <p className="text-sm text-[#64748B]">
                Get notified about unusual spending patterns and opportunities
              </p>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-[#0F172A]">
              {smartAlertsEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={smartAlertsEnabled}
                onChange={() => setSmartAlertsEnabled(!smartAlertsEnabled)}
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </div>
          </label>
        </Card>

        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#0F172A] mb-1">Predictive Insights</h3>
              <p className="text-sm text-[#64748B]">
                AI predictions for future spending based on your patterns
              </p>
            </div>
          </div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-[#0F172A]">
              {predictiveInsights ? 'Enabled' : 'Disabled'}
            </span>
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={predictiveInsights}
                onChange={() => setPredictiveInsights(!predictiveInsights)}
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1E40AF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </div>
          </label>
        </Card>
      </div>

      {/* Smart Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Smart Notifications</h3>
        <div className="space-y-3">
          {smartNotifications.map((notification) => {
            const Icon = notification.icon;
            const bgColor = {
              warning: 'bg-[#FEF3C7]',
              success: 'bg-[#D1FAE5]',
              info: 'bg-[#DBEAFE]',
              insight: 'bg-[#F3E8FF]',
            }[notification.type];
            
            const iconColor = {
              warning: 'text-[#F59E0B]',
              success: 'text-[#10B981]',
              info: 'text-[#1E40AF]',
              insight: 'text-[#8B5CF6]',
            }[notification.type];

            return (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-[#0F172A]">{notification.title}</h4>
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-[#64748B]">{notification.message}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Spending Predictions */}
      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Spending Predictions</h3>
        <div className="space-y-4">
          {categoryPredictions.map((pred) => (
            <div key={pred.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#0F172A]">{pred.category}</span>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-[#64748B]">Current: ${pred.currentMonth}</p>
                    <p className="text-sm font-medium text-[#0F172A]">
                      Predicted: ${pred.predicted}
                    </p>
                  </div>
                  <Badge variant={pred.trend === 'up' ? 'warning' : 'success'}>
                    {pred.trend === 'up' ? '↑' : '↓'} {Math.abs(((pred.predicted - pred.currentMonth) / pred.currentMonth) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 h-2">
                <div 
                  className="bg-[#1E40AF] rounded-full"
                  style={{ width: `${(pred.currentMonth / 1500) * 100}%` }}
                />
                <div 
                  className={`rounded-full ${pred.trend === 'up' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`}
                  style={{ width: `${Math.abs(pred.predicted - pred.currentMonth) / 1500 * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Coming Soon</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Receipt Scanning', description: 'Scan receipts and auto-fill transaction details' },
            { title: 'Financial Goals Assistant', description: 'AI-powered recommendations to reach your goals faster' },
            { title: 'Smart Savings Plans', description: 'Automated savings based on your spending patterns' },
            { title: 'Investment Suggestions', description: 'Personalized investment recommendations' },
          ].map((feature, index) => (
            <div key={index} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#0F172A] mb-1">{feature.title}</h4>
                  <p className="text-sm text-[#64748B]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
