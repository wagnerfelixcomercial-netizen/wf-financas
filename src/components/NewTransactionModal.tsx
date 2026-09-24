import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, CreditCard, Repeat, Split, CheckCircle } from 'lucide-react';
import type { TransactionType, Frequency } from '@/lib/types';
import { toISODate } from '@/lib/format';
import type { Category } from '@/lib/types';

interface NewTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tx: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    account: string;
    transaction_date: string;
    frequency: Frequency;
    installment_number: number | null;
    installment_total: number | null;
  }) => Promise<boolean>;
  categories: Category[];
  editData?: {
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    account: string;
    transaction_date: string;
    frequency: Frequency;
    installment_number: number | null;
    installment_total: number | null;
  } | null;
}

export function NewTransactionModal({ open, onClose, onSave, categories, editData }: NewTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Outros');
  const [account, setAccount] = useState('Conta principal');
  const [date, setDate] = useState(toISODate(new Date()));
  const [frequency, setFrequency] = useState<Frequency>('single');
  const [installmentTotal, setInstallmentTotal] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SINCRONIZA OS DADOS QUANDO O MODAL ABRE (OU QUANDO EDITDATA MUDA)
  useEffect(() => {
    if (open) {
      if (editData) {
        setDescription(editData.description || '');
        setAmount(editData.amount ? String(editData.amount) : '');
        setType(editData.type || 'expense');
        setCategory(editData.category || 'Outros');
        setAccount(editData.account || 'Conta principal');
        setDate(editData.transaction_date || toISODate(new Date()));
        setFrequency(editData.frequency || 'single');
        setInstallmentTotal(editData.installment_total ? String(editData.installment_total) : '1');
      } else {
        // Limpa os campos quando for um novo lançamento
        setDescription('');
        setAmount('');
        setType('expense');
        setCategory('Outros');
        setAccount('Conta principal');
        setDate(toISODate(new Date()));
        setFrequency('single');
        setInstallmentTotal('1');
      }
      setError(null);
    }
  }, [open, editData]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      setError('Preencha descrição e valor válidos.');
      return;
    }

    setLoading(true);
    const ok = await onSave({
      description: description.trim(),
      amount: amt,
      type,
      category,
      account,
      transaction_date: date,
      frequency,
      installment_number: frequency === 'installment' ? 1 : null,
      installment_total: frequency === 'installment' ? parseInt(installmentTotal) || 1 : null,
    });
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setError('Erro ao salvar. Tente novamente.');
    }
  };

  const defaultCats = ['Outros', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Salário', 'Investimentos'];
  const catNames = [...defaultCats, ...categories.map((c) => c.name)].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-2xl border border-slate-800 bg-[#121824] p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {editData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
                type === 'expense'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-[#0B0E14] text-slate-400 border border-slate-700'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 font-semibold transition ${
                type === 'income'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : 'bg-[#0B0E14] text-slate-400 border border-slate-700'
              }`}
            >
              Receita
            </button>
          </div>

          <Field icon={<Tag size={16} />} label="Descrição">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Mercado, Salário..."
              className="input-field"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field icon={<DollarSign size={16} />} label="Valor (R$)">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="input-field"
                required
              />
            </Field>
            <Field icon={<Calendar size={16} />} label="Data">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field icon={<Tag size={16} />} label="Categoria">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                {catNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field icon={<CreditCard size={16} />} label="Conta / Cartão">
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Ex: Itaú, Nubank..."
                className="input-field"
              />
            </Field>
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Frequência</label>
            <div className="grid grid-cols-3 gap-2">
              <FreqButton active={frequency === 'single'} onClick={() => setFrequency('single')} icon={<CheckCircle size={16} />} label="Única" />
              <FreqButton active={frequency === 'recurring'} onClick={() => setFrequency('recurring')} icon={<Repeat size={16} />} label="Fixa" />
              <FreqButton active={frequency === 'installment'} onClick={() => setFrequency('installment')} icon={<Split size={16} />} label="Parcelada" />
            </div>
          </div>

          {frequency === 'installment' && (
            <Field icon={<Split size={16} />} label="Total de parcelas">
              <input
                type="number"
                min="1"
                max="120"
                value={installmentTotal}
                onChange={(e) => setInstallmentTotal(e.target.value)}
                className="input-field"
              />
              <p className="mt-1 text-xs text-slate-500">
                Será lançado como 1/{installmentTotal} e os próximos meses gerados automaticamente.
              </p>
            </Field>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] py-3 font-semibold text-white transition hover:from-[#7C6DF7] hover:to-[#6C5BE7] disabled:opacity-50"
          >
            {loading ? 'Salvando...' : editData ? 'Salvar alterações' : 'Adicionar lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
        <span className="text-slate-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function FreqButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-lg py-3 text-xs font-semibold transition ${
        active ? 'bg-[#6C5CE7]/20 text-[#A29BFE] border border-[#6C5CE7]/40' : 'bg-[#0B0E14] text-slate-400 border border-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}