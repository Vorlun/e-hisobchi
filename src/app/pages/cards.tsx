import React, { useState } from 'react';
import { Card } from '../components/card';
import { Button } from '../components/button';
import { CreditCard, Plus } from 'lucide-react';
import { useFinance } from '../../store/FinanceStore';
import { formatUzs } from '../../utils/currency';
import { AddCardModal } from '../components/add-card-modal';

export default function Cards() {
  const { cards, loadingCards } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Bank Kartalar</h1>
          <p className="text-[#64748B] mt-1">Manage your bank cards</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          Karta qo&apos;shish
        </Button>
      </div>
      {loadingCards && (
        <p className="text-sm text-[#64748B]" aria-busy>Loading cards…</p>
      )}
      {!loadingCards && (!cards || cards.length === 0) && (
        <Card className="p-8 text-center">
          <CreditCard className="w-12 h-12 text-[#94A3B8] mx-auto mb-4" aria-hidden />
          <p className="text-[#64748B]">No cards yet. Add cards from Accounts or here when available.</p>
        </Card>
      )}
      {!loadingCards && cards && cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card
              key={c.id}
              className="p-6 border-l-4"
              style={{ borderLeftColor: c.color || '#1E40AF' }}
            >
              <p className="font-medium text-[#0F172A]">{c.name}</p>
              <p className="text-sm text-[#64748B] mt-1">•••• {typeof c.cardNumber === 'string' ? c.cardNumber.slice(-4) : ''}</p>
              <p className="text-lg font-semibold text-[#0F172A] mt-2">{formatUzs(c.balance)}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{c.currency}</p>
            </Card>
          ))}
        </div>
      )}

      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
