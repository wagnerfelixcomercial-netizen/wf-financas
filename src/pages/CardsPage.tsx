import { useState } from 'react';
import { CreditCard, Plus, Trash2, Edit3, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Card, Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface CardsPageProps {
  cards: Card[];
  transactions?: Transaction[];
  onReload: () => void;
}

export function CardsPage({ cards, transactions = [], onReload }: CardsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [usedAmount, setUsedAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [closingDay, setClosingDay] = useState('5');
  const [color, setColor] = useState('#6C5CE7');
  const [loading, setLoading] = useState(false);

  const openNew = () => {
    setEditId(null);
    setName('');
    setBank('');
    setLastFour('');
    setCreditLimit('');
    setUsedAmount('');
    setDueDay('10');
    setClosingDay('5');
    setColor('#6C5CE7');
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setName(c.name);
    setBank(c.bank);
    setLastFour(c.last_four);
    setCreditLimit(String(c.limit_amount ?? c.credit_limit ?? ''));
    setUsedAmount(String(c.used_amount));
    setDueDay(String(c.due_day));
    setClosingDay(String(c.closing_day ?? '5'));
    setColor(c.color);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      name,
      bank,
      last_four: lastFour || '0000',
      limit_amount: parseFloat(creditLimit) || 0,
      used_amount: parseFloat(usedAmount) || 0,
      due_day: parseInt(dueDay) || 10,
      closing_day: parseInt(closingDay) || 5,
      color,
    };

    let error = null;

    if (editId) {
      const res = await supabase.from('cards').update(payload).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('cards').insert([payload]);
      error = res.error;
    }

    if (error) {
      console.error('Erro ao salvar cartão no Supabase:', error.message);
      alert(`Erro ao salvar cartão: ${error.message}`);
    } else {
      setModalOpen(false);
      onReload();
    }

    setLoading(false);
  };

  const remove = async (id: string) => {
    await supabase.from('cards').delete().eq('id', id);
    onReload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Meus Cartões</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          <Plus size={16} />
          Novo Cartão
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#121824] p-12 text-center">
          <CreditCard size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Nenhum cartão cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c: any) => {
            const limit = Number(c.limit_amount ?? c.credit_limit ?? 0);
            
            // CORREÇÃO INTELIGENTE: Verifica se a conta da transação contém o nome do cartão ou do banco
            const cardName = (c.name || '').toLowerCase().trim();
            const cardBank = (c.bank || '').toLowerCase().trim();

            const calculatedUsed = transactions
              .filter((t) => {
                if (t.type !== 'expense') return false;
                const acc = (t.account || '').toLowerCase().trim();
                return (
                  acc === cardName ||
                  acc.includes(cardName) ||
                  (cardBank && acc.includes(cardBank))
                );
              })
              .reduce((acc, t) => acc + Number(t.amount), 0);

            const manualUsed = Number(c.used_amount ?? 0);
            const used = calculatedUsed > 0 ? calculatedUsed : manualUsed;
            
            const available = limit - used;
            const usagePct = limit > 0 ? (used / limit) * 100 : 0;

            return (
              <div key={c.id} className="rounded-2xl border border-slate-800 bg-[#121824] p-5 transition hover:border-slate-700">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded-lg" style={{ background: c.color || '#6C5CE7' }}>
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.bank} · {c.last_four}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-400 hover:bg-[#6C5CE7]/20 hover:text-[#A29BFE]">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => remove(c.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Limite total</span>
                    <span className="font-medium text-white">{formatCurrency(limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Utilizado</span>
                    <span className="font-medium text-red-400">{formatCurrency(used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disponível</span>
                    <span className="font-medium text-green-400">{formatCurrency(available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fechamento / Venc.</span>
                    <span className="font-medium text-white">Dia {c.closing_day || '-'} / {c.due_day}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(usagePct, 100)}%`, background: usagePct > 80 ? '#E17055' : (c.color || '#6C5CE7') }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{usagePct.toFixed(0)}% do limite usado</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editId ? 'Editar Cartão' : 'Novo Cartão'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cartão" className="input-field" required />
              <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Banco" className="input-field" required />
              <div className="grid grid-cols-2 gap-3">
                <input value={lastFour} onChange={(e) => setLastFour(e.target.value)} placeholder="Últimos 4 dígitos" maxLength={4} className="input-field" />
                <input value={closingDay} onChange={(e) => setClosingDay(e.target.value)} type="number" min="1" max="31" placeholder="Dia fecho." className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" min="1" max="31" placeholder="Dia venc." className="input-field" required />
                <input value={usedAmount} onChange={(e) => setUsedAmount(e.target.value)} type="number" step="0.01" placeholder="Usado (R$) (Opcional)" className="input-field" />
              </div>
              <div>
                <input value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} type="number" step="0.01" placeholder="Limite Total (R$)" className="input-field" required />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300">Cor</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded border border-slate-700 bg-transparent" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] py-3 font-semibold text-white disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}