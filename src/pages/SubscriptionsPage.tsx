import { useState } from 'react';
import { Plus, Trash2, Edit3, X, Repeat, Power } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface SubscriptionsPageProps {
  subscriptions: Subscription[];
  onReload: () => void;
}

export function SubscriptionsPage({ subscriptions, onReload }: SubscriptionsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('1');
  const [loading, setLoading] = useState(false);

  const openNew = () => {
    setEditId(null);
    setName('');
    setCategory('Streaming');
    setAmount('');
    setBillingDay('1');
    setModalOpen(true);
  };

  const openEdit = (s: Subscription) => {
    setEditId(s.id);
    setName(s.name);
    setCategory(s.category);
    setAmount(String(s.amount));
    setBillingDay(String(s.billing_day));
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name,
      category,
      amount: parseFloat(amount) || 0,
      billing_day: parseInt(billingDay) || 1,
    };
    if (editId) {
      await supabase.from('subscriptions').update(payload).eq('id', editId);
    } else {
      await supabase.from('subscriptions').insert(payload);
    }
    setLoading(false);
    setModalOpen(false);
    onReload();
  };

  const remove = async (id: string) => {
    await supabase.from('subscriptions').delete().eq('id', id);
    onReload();
  };

  const toggleActive = async (s: Subscription) => {
    await supabase.from('subscriptions').update({ active: !s.active }).eq('id', s.id);
    onReload();
  };

  const totalMonthly = subscriptions.filter((s) => s.active).reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Assinaturas & Recorrências</h2>
          <p className="text-sm text-slate-400 mt-1">Total mensal ativo: <span className="font-semibold text-[#A29BFE]">{formatCurrency(totalMonthly)}</span></p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          <Plus size={16} />
          Nova Assinatura
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#121824] p-12 text-center">
          <Repeat size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Nenhuma assinatura cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subscriptions.map((s) => (
            <div key={s.id} className={`rounded-2xl border bg-[#121824] p-5 transition ${s.active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6C5CE7]/15">
                    <Repeat size={20} className="text-[#A29BFE]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.category} · Dia {s.billing_day}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(s)} className="rounded p-1.5 text-slate-400 hover:bg-[#6C5CE7]/20 hover:text-[#A29BFE]" title={s.active ? 'Pausar' : 'Ativar'}>
                    <Power size={14} />
                  </button>
                  <button onClick={() => openEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-[#6C5CE7]/20 hover:text-[#A29BFE]">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => remove(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {s.active ? 'Ativa' : 'Pausada'}
                </span>
                <span className="text-lg font-bold text-white">{formatCurrency(Number(s.amount))}<span className="text-xs text-slate-500">/mês</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editId ? 'Editar Assinatura' : 'Nova Assinatura'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (ex: Netflix, Spotify)" className="input-field" required />
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="Valor (R$)" className="input-field" required />
                <input value={billingDay} onChange={(e) => setBillingDay(e.target.value)} type="number" min="1" max="31" placeholder="Dia cobrança" className="input-field" />
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
