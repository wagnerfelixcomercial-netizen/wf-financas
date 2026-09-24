import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';

interface OverviewProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function Overview({ transactions, onEdit, onDelete }: OverviewProps) {
  const { totalIncome, totalExpense, freeMoney, savingsRate, byCategory, flowData } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const catMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'income') totalIncome += Number(t.amount);
      else {
        totalExpense += Number(t.amount);
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
      }
    });

    const freeMoney = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (freeMoney / totalIncome) * 100 : 0;

    const byCategory = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const flowData = [
      { name: 'Receitas', value: totalIncome, fill: '#00B894' },
      { name: 'Despesas', value: totalExpense, fill: '#E17055' },
      { name: 'Livre', value: freeMoney, fill: '#6C5CE7' },
    ];

    return { totalIncome, totalExpense, freeMoney, savingsRate, byCategory, flowData };
  }, [transactions]);

  const PIE_COLORS = ['#6C5CE7', '#00B894', '#E17055', '#FDCB6E', '#0984E3', '#A29BFE', '#00CEC9', '#FD79A8'];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Receita"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp size={20} />}
          color="text-green-400"
          bg="bg-green-500/10"
        />
        <KpiCard
          label="Despesas"
          value={formatCurrency(totalExpense)}
          icon={<TrendingDown size={20} />}
          color="text-red-400"
          bg="bg-red-500/10"
        />
        <KpiCard
          label="Dinheiro Livre"
          value={formatCurrency(freeMoney)}
          icon={<Wallet size={20} />}
          color="text-[#A29BFE]"
          bg="bg-[#6C5CE7]/10"
        />
        <KpiCard
          label="Taxa de Poupança"
          value={`${savingsRate.toFixed(1)}%`}
          icon={<PiggyBank size={20} />}
          color="text-yellow-400"
          bg="bg-yellow-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Fluxo de Caixa">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#121824', border: '1px solid #2a3344', borderRadius: 8, color: '#fff' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Despesas por Categoria">
          {byCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#121824', border: '1px solid #2a3344', borderRadius: 8, color: '#fff' }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent transactions preview */}
      <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
        <h3 className="mb-4 text-lg font-bold text-white">Lançamentos Recentes</h3>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-slate-500">Nenhum lançamento neste mês ainda.</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-[#0B0E14]">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {t.type === 'income' ? <ArrowUpRight className="text-green-400" size={18} /> : <ArrowDownRight className="text-red-400" size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category} · {formatDate(t.transaction_date)}{t.installment_total ? ` · ${t.installment_number}/${t.installment_total}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                  </span>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(t)}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(t.id)}
                        className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, bg }: { label: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121824] p-5 transition hover:border-slate-700">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
      <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-slate-500">
      Sem despesas para exibir
    </div>
  );
}