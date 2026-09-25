import { useState } from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, Search, CheckCircle2, Clock } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface TransactionsListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onTogglePaid: (tx: Transaction) => void;
}

export function TransactionsList({ transactions, onEdit, onDelete, onTogglePaid }: TransactionsListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filtered = transactions.filter((t) => {
    const description = t.description || '';
    const category = t.category || '';
    const matchSearch =
      description.toLowerCase().includes(search.toLowerCase()) ||
      category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-white">Lançamentos do Mês</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-slate-700 bg-[#0B0E14] py-2 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#6C5CE7] sm:w-48"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="rounded-lg border border-slate-700 bg-[#0B0E14] px-3 py-2 text-sm text-white outline-none focus:border-[#6C5CE7]"
          >
            <option value="all">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-500">Nenhum lançamento encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Descrição</th>
                <th className="pb-3 pr-4 font-medium">Categoria</th>
                <th className="pb-3 pr-4 font-medium">Conta</th>
                <th className="pb-3 pr-4 font-medium">Data</th>
                <th className="pb-3 pr-4 font-medium">Freq.</th>
                <th className="pb-3 pr-4 text-right font-medium">Valor</th>
                <th className="pb-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isPaid = (t as any).is_paid === true || (t as any).paid === true;
                return (
                  <tr key={t.id} className="border-b border-slate-800/50 transition hover:bg-[#0B0E14]/50">
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => onTogglePaid(t)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          isPaid
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        }`}
                        title="Alternar Status (Pago / Pendente)"
                      >
                        {isPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        <span>{isPaid ? 'Pago' : 'Pendente'}</span>
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {t.type === 'income' ? (
                          <ArrowUpRight className="shrink-0 text-green-400" size={16} />
                        ) : (
                          <ArrowDownRight className="shrink-0 text-red-400" size={16} />
                        )}
                        <span className="text-sm font-medium text-white">{t.description}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-400">{t.category}</td>
                    <td className="py-3 pr-4 text-sm text-slate-400">{t.account}</td>
                    <td className="py-3 pr-4 text-sm text-slate-400">{formatDate(t.transaction_date)}</td>
                    <td className="py-3 pr-4 text-sm text-slate-400">
                      {t.frequency === 'single' ? 'Única' : t.frequency === 'recurring' ? 'Fixa' : `${t.installment_number}/${t.installment_total}`}
                    </td>
                    <td className={`py-3 pr-4 text-right text-sm font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(t)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-[#6C5CE7]/20 hover:text-[#A29BFE]"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(t.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                          title="Excluir"
                          aria-label="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}