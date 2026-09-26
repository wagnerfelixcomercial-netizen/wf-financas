import { useState, useMemo } from 'react';
import {
  LayoutDashboard, CreditCard, PiggyBank, Repeat, BarChart3, Settings,
  Plus, ChevronLeft, ChevronRight, Wallet, LogOut, Users, X, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFinanceData } from '@/hooks/useFinanceData';
import { monthKey, parseMonthKey, addMonths, formatMonthYear } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Overview } from '@/pages/Overview';
import { TransactionsList } from '@/pages/TransactionsList';
import { CardsPage } from '@/pages/CardsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { SubscriptionsPage } from '@/pages/SubscriptionsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { NewTransactionModal } from '@/components/NewTransactionModal';
import { AIChatWidget } from '@/components/AIChatWidget';
import type { Transaction, Category } from '@/lib/types';

type Tab = 'overview' | 'transactions' | 'cards' | 'goals' | 'subscriptions' | 'reports' | 'settings' | 'admin';

export function Dashboard() {
  const { user, profile, signOut, isAdmin, isApproved } = useAuth();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(today));
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const {
    transactions, goals, cards, subscriptions, categories, loading,
    createTransaction, updateTransaction, deleteTransaction, loadData
  } = useFinanceData(selectedMonth);

  const monthDate = useMemo(() => parseMonthKey(selectedMonth), [selectedMonth]);

  const navItems = [
    { id: 'overview' as Tab, label: 'Visão Geral', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions' as Tab, label: 'Lançamentos', icon: <BarChart3 size={20} /> },
    { id: 'cards' as Tab, label: 'Meus Cartões', icon: <CreditCard size={20} /> },
    { id: 'goals' as Tab, label: 'Cofrinhos', icon: <PiggyBank size={20} /> },
    { id: 'subscriptions' as Tab, label: 'Assinaturas', icon: <Repeat size={20} /> },
    { id: 'reports' as Tab, label: 'Relatórios', icon: <BarChart3 size={20} /> },
    { id: 'settings' as Tab, label: 'Configurações', icon: <Settings size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin' as Tab, label: 'Gerenciar Usuários', icon: <Users size={20} /> });
  }

  const handlePrevMonth = () => setSelectedMonth(monthKey(addMonths(monthDate, -1)));
  const handleNextMonth = () => setSelectedMonth(monthKey(addMonths(monthDate, 1)));

  const openNewTx = () => {
    setEditTx(null);
    setTxModalOpen(true);
  };

  const openEditTx = (tx: Transaction) => {
    setEditTx(tx);
    setTxModalOpen(true);
  };

  const handleSaveTx = async (tx: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    account: string;
    transaction_date: string;
    frequency: 'single' | 'recurring' | 'installment';
    installment_number: number | null;
    installment_total: number | null;
  }) => {
    if (editTx) {
      return await updateTransaction(editTx.id, tx);
    }

    return await createTransaction(tx);
  };

  const handleDeleteTx = async (id: string) => {
    if (confirm('Excluir este lançamento?')) {
      await deleteTransaction(id);
    }
  };

  const handleTogglePaid = async (tx: Transaction) => {
    const currentStatus = (tx as any).is_paid === true;
    await updateTransaction(tx.id, { is_paid: !currentStatus } as any);
  };

  const handleDeleteWithFuture = async (id: string, deleteAllFuture?: boolean) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) {
      if (confirm('Excluir este lançamento?')) {
        await deleteTransaction(id);
      }
      return;
    }

    if (!deleteAllFuture) {
      if (confirm('Excluir este lançamento?')) {
        await deleteTransaction(id);
      }
      return;
    }

    if (confirm('Deseja realmente excluir este e todos os lançamentos futuros/restantes relacionados?')) {
      const cleanDescription = txToDelete.description
        .replace(/ \(\d+\/\d+\)$/, '')
        .replace(/ \d{2}\/\d{2}\/\d{4}$/, '')
        .trim();

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user?.id)
        .ilike('description', `${cleanDescription}%`)
        .gte('transaction_date', txToDelete.transaction_date);

      if (!error) {
        loadData();
      } else {
        console.error('Erro ao excluir lançamentos futuros:', error.message);
        alert('Erro ao excluir lançamentos futuros: ' + error.message);
      }
    }
  };

  // Pending approval screen
  if (!isApproved && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E14] p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10">
            <ShieldAlert className="text-yellow-400" size={32} />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">Conta em análise</h1>
          <p className="mb-6 text-slate-400">
            Olá {profile?.full_name || 'usuário'}! Sua conta foi criada com sucesso e está aguardando aprovação do administrador.
            Você receberá acesso em breve.
          </p>
          <button
            onClick={signOut}
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-white transition hover:border-[#6C5CE7]"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-slate-800 bg-[#121824] transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE]">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="font-bold text-white">WF Finanças</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-[#6C5CE7]/15 text-[#A29BFE]'
                  : 'text-slate-400 hover:bg-[#0B0E14] hover:text-slate-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6C5CE7]/20">
              <span className="text-sm font-bold text-[#A29BFE]">
                {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Usuário'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 glass px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-400 lg:hidden">
              <span className="sr-only">Abrir Menu</span>
              <Wallet size={22} />
            </button>
            {/* Month selector */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#121824] px-3 py-2">
              <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <span className="min-w-[140px] text-center text-sm font-medium text-white capitalize">
                {formatMonthYear(monthDate)}
              </span>
              <button onClick={handleNextMonth} className="text-slate-400 hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <button
            onClick={openNewTx}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#5A4BD1] px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Lançar</span>
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {loading && activeTab === 'overview' ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <Overview
                  transactions={transactions}
                  onEdit={openEditTx}
                  onDelete={handleDeleteWithFuture}
                  onTogglePaid={handleTogglePaid}
                />
              )}
              {activeTab === 'transactions' && (
                <TransactionsList transactions={transactions} onEdit={openEditTx} onDelete={handleDeleteTx} />
              )}
              {activeTab === 'cards' && <CardsPage cards={cards} transactions={transactions} onReload={loadData} />}
              {activeTab === 'goals' && <GoalsPage goals={goals} onReload={loadData} />}
              {activeTab === 'subscriptions' && <SubscriptionsPage subscriptions={subscriptions} onReload={loadData} />}
              {activeTab === 'reports' && <ReportsPage />}
              {activeTab === 'settings' && <SettingsPage categories={categories} onReload={loadData} />}
              {activeTab === 'admin' && isAdmin && <AdminPage />}
            </>
          )}
        </main>
      </div>

      {/* New transaction modal */}
      <NewTransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTx}
        categories={categories as Category[]}
        cards={cards}
        editData={editTx ? {
          id: editTx.id,
          description: editTx.description,
          amount: Number(editTx.amount),
          type: editTx.type,
          category: editTx.category,
          account: editTx.account,
          transaction_date: editTx.transaction_date,
          frequency: editTx.frequency,
          installment_number: editTx.installment_number,
          installment_total: editTx.installment_total,
        } : null}
      />

      {/* AI Chat Widget */}
      <AIChatWidget
        transactions={transactions}
        selectedMonth={selectedMonth}
        onCreateTransaction={async (tx) => {
          return await createTransaction(tx);
        }}
        onReload={loadData}
      />
    </div>
  );
}