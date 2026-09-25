import { useState } from 'react';
import { PiggyBank, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, X, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Goal } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface GoalsPageProps {
  goals: Goal[];
  onReload: () => void;
}

export function GoalsPage({ goals, onReload }: GoalsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [color, setColor] = useState('#6C5CE7');
  const [actionGoal, setActionGoal] = useState<Goal | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [loading, setLoading] = useState(false);

  const openNew = () => {
    setEditId(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setColor('#6C5CE7');
    setModalOpen(true);
  };

  const openEdit = (g: Goal & { title?: string }) => {
    setEditId(g.id);
    setName(g.name || g.title || '');
    setTargetAmount(String(g.target_amount));
    setCurrentAmount(String(g.current_amount));
    setColor(g.color || '#6C5CE7');
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

    // A base de dados exige 'title' em vez de 'name'
    const payload = {
      user_id: user.id,
      title: name,
      target_amount: parseFloat(targetAmount) || 0,
      current_amount: parseFloat(currentAmount) || 0,
      color,
    };

    let error = null;

    if (editId) {
      const res = await supabase.from('goals').update(payload).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('goals').insert([payload]);
      error = res.error;
    }

    if (error) {
      console.error('Erro ao salvar cofrinho:', error.message);
      alert(`Erro ao salvar cofrinho: ${error.message}`);
    } else {
      setModalOpen(false);
      onReload();
    }

    setLoading(false);
  };

  const remove = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    onReload();
  };

  const doAction = async () => {
    if (!actionGoal) return;
    const amt = parseFloat(actionAmount) || 0;
    let newVal = Number(actionGoal.current_amount);
    if (actionType === 'deposit') newVal += amt;
    else newVal = Math.max(0, newVal - amt);

    const { error } = await supabase.from('goals').update({ current_amount: newVal }).eq('id', actionGoal.id);

    if (error) {
      alert(`Erro ao atualizar valor: ${error.message}`);
    } else {
      setActionGoal(null);
      setActionAmount('');
      onReload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Cofrinhos</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
        >
          <Plus size={16} />
          Novo Cofrinho
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#121824] p-12 text-center">
          <PiggyBank size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Crie seu primeiro cofrinho e comece a poupar!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g: any) => {
            const goalName = g.name || g.title || 'Cofrinho';
            const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
            return (
              <div key={g.id} className="rounded-2xl border border-slate-800 bg-[#121824] p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: g.color || '#6C5CE7' }}>
                      <PiggyBank size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{goalName}</p>
                      <p className="text-xs text-slate-500">{pct.toFixed(0)}% da meta</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="rounded p-1.5 text-slate-400 hover:bg-[#6C5CE7]/20 hover:text-[#A29BFE]">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => remove(g.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: g.color || '#6C5CE7' }} />
                </div>
                <div className="mb-4 flex justify-between text-sm">
                  <span className="text-slate-400">{formatCurrency(Number(g.current_amount))}</span>
                  <span className="font-medium text-white">{formatCurrency(Number(g.target_amount))}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setActionGoal(g); setActionType('deposit'); setActionAmount(''); }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 transition hover:bg-green-500/20"
                  >
                    <ArrowUpCircle size={16} />
                    Guardar
                  </button>
                  <button
                    onClick={() => { setActionGoal(g); setActionType('withdraw'); setActionAmount(''); }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  >
                    <ArrowDownCircle size={16} />
                    Resgatar
                  </button>
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
              <h3 className="text-lg font-bold text-white">{editId ? 'Editar Cofrinho' : 'Novo Cofrinho'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da meta" className="input-field" required />
              <input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} type="number" step="0.01" placeholder="Meta final (R$)" className="input-field" required />
              <input value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} type="number" step="0.01" placeholder="Valor atual (R$)" className="input-field" />
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

      {actionGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActionGoal(null)} />
          <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              {actionType === 'deposit' ? 'Guardar em' : 'Resgatar de'} {actionGoal.name || actionGoal.title}
            </h3>
            <input
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              className="input-field"
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setActionGoal(null)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300">
                Cancelar
              </button>
              <button onClick={doAction} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white ${actionType === 'deposit' ? 'bg-green-500/80 hover:bg-green-500' : 'bg-red-500/80 hover:bg-red-500'}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}