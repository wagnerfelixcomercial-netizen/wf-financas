import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, monthKey, parseMonthKey, addMonths, toISODate, MONTHS } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ReportsPage() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [rangeMonths, setRangeMonths] = useState(6);

  const [loadedData, setLoadedData] = useState<{ month: string; receita: number; despesa: number; saldo: number; transactions: Transaction[] }[]>([]);

  useEffect(() => {
    if (user) loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, rangeMonths]);

  async function loadReportData() {
    if (!user) return;
    const now = new Date();
    const start = addMonths(now, -(rangeMonths - 1));
    const startISO = toISODate(new Date(start.getFullYear(), start.getMonth(), 1));
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', startISO)
      .order('transaction_date', { ascending: true });

    const txs = (data as Transaction[]) || [];
    const byMonth: Record<string, { receita: number; despesa: number; transactions: Transaction[] }> = {};

    for (let i = 0; i < rangeMonths; i++) {
      const d = addMonths(start, i);
      byMonth[monthKey(d)] = { receita: 0, despesa: 0, transactions: [] };
    }

    txs.forEach((t) => {
      const [y, m] = t.transaction_date.split('-').map(Number);
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { receita: 0, despesa: 0, transactions: [] };
      if (t.type === 'income') byMonth[key].receita += Number(t.amount);
      else byMonth[key].despesa += Number(t.amount);
      byMonth[key].transactions.push(t);
    });

    const result = Object.entries(byMonth).map(([key, v]) => {
      const d = parseMonthKey(key);
      return {
        month: `${MONTHS[d.getMonth()].substring(0, 3)}/${String(d.getFullYear()).substring(2)}`,
        receita: v.receita,
        despesa: v.despesa,
        saldo: v.receita - v.despesa,
        transactions: v.transactions,
      };
    });
    setLoadedData(result);
  }

  const chartData = loadedData.map((d) => ({ month: d.month, Receita: d.receita, Despesa: d.despesa, Saldo: d.saldo }));

  const exportPDF = () => {
    setGenerating(true);
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('WF Finanças - Relatorio Financeiro', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    const allTx = loadedData.flatMap((d) => d.transactions);
    autoTable(doc, {
      startY: 36,
      head: [['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor']],
      body: allTx.map((t) => [
        t.transaction_date,
        t.description,
        t.category,
        t.type === 'income' ? 'Receita' : 'Despesa',
        formatCurrency(Number(t.amount)),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 92, 231] },
    });

    doc.save('wf-financas-relatorio.pdf');
    setGenerating(false);
  };

  const exportCSV = () => {
    const allTx = loadedData.flatMap((d) => d.transactions);
    const headers = ['Data', 'Descricao', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Frequencia'];
    const rows = allTx.map((t) => [
      t.transaction_date,
      t.description,
      t.category,
      t.account,
      t.type === 'income' ? 'Receita' : 'Despesa',
      String(t.amount),
      t.frequency,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wf-financas-dados.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Relatórios</h2>
          <p className="text-sm text-slate-400 mt-1">Análise dos últimos {rangeMonths} meses</p>
        </div>
        <div className="flex gap-3">
          <select
            value={rangeMonths}
            onChange={(e) => { setRangeMonths(Number(e.target.value)); setTimeout(loadReportData, 100); }}
            className="rounded-lg border border-slate-700 bg-[#0B0E14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#6C5CE7]"
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
          <button onClick={loadReportData} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#6C5CE7]">
            Atualizar
          </button>
          <button onClick={exportPDF} disabled={generating} className="flex items-center gap-2 rounded-lg bg-red-500/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
            <FileText size={16} />
            PDF
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg bg-green-500/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500">
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      {/* Monthly comparison */}
      <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <BarChart3 size={20} className="text-[#A29BFE]" />
          Comparação Mensal
        </h3>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Clique em "Atualizar" para carregar os dados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#121824', border: '1px solid #2a3344', borderRadius: 8, color: '#fff' }} formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Receita" fill="#00B894" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesa" fill="#E17055" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Patrimonial evolution */}
      <div className="rounded-2xl border border-slate-800 bg-[#121824] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp size={20} className="text-[#A29BFE]" />
          Evolução Patrimonial (Saldo Acumulado)
        </h3>
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Sem dados para exibir.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData.map((d, i, arr) => {
              const cumulative = arr.slice(0, i + 1).reduce((sum, x) => sum + x.Saldo, 0);
              return { month: d.month, Patrimonio: cumulative };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#121824', border: '1px solid #2a3344', borderRadius: 8, color: '#fff' }} formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="Patrimonio" stroke="#6C5CE7" strokeWidth={3} dot={{ fill: '#6C5CE7', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
