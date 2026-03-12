import React from 'react';
import { Card } from './card';
import { Brain, ArrowRight, Sparkles } from 'lucide-react';

export function AutoCategoryDetection() {
  const examples = [
    { 
      input: '120 ming ovqatga sarfladim', 
      category: 'Food & Dining',
      color: '#F59E0B',
      confidence: 95
    },
    { 
      input: 'Metro uchun 5000 to\'ldirdim', 
      category: 'Transportation',
      color: '#10B981',
      confidence: 98
    },
    { 
      input: 'Elektr va gaz uchun 250 ming', 
      category: 'Bills & Utilities',
      color: '#1E40AF',
      confidence: 92
    },
  ];

  return (
    <Card>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#10B981] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Auto Category Detection</h3>
          </div>
          <p className="text-sm text-[#64748B]">
            Transactions written in natural language are automatically categorized using machine learning.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1E40AF]/10 to-[#10B981]/10 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span className="text-xs font-medium text-[#1E40AF]">AI Powered</span>
        </div>
      </div>

      <div className="space-y-3">
        {examples.map((example, index) => (
          <div 
            key={index}
            className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#1E40AF]/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-[#475569] font-medium mb-1">User Input</p>
                <p className="text-sm text-[#0F172A]">&quot;{example.input}&quot;</p>
              </div>
              
              <ArrowRight className="w-5 h-5 text-[#CBD5E1] flex-shrink-0" />
              
              <div className="flex-1">
                <p className="text-sm text-[#475569] font-medium mb-1">Detected Category</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: example.color }}
                    />
                    <span className="text-sm font-semibold text-[#0F172A]">{example.category}</span>
                  </div>
                  <span className="text-xs font-medium text-[#10B981] bg-[#D1FAE5] px-2 py-0.5 rounded">
                    {example.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[#DBEAFE] rounded-lg">
        <p className="text-xs text-[#1E40AF]">
          <span className="font-semibold">Smart Detection:</span> The AI learns from your spending patterns to improve accuracy over time.
        </p>
      </div>
    </Card>
  );
}
