import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Transaction, Goal, Card, Subscription, Category } from '@/lib/types';
import { monthKey, parseMonthKey, addMonths, toISODate, MONTHS } from '@/lib/format';

export type TransactionWithMeta = Transaction;

export function useFinanceData(selectedMonth: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const monthDate = parseMonthKey(selectedMonth);
    const start = toISODate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
    const end = toISODate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));

    const [txRes, goalsRes, cardsRes, subsRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false }),
      supabase.from('goals').select('*').order('created_at', { ascending: true }),
      supabase.from('cards').select('*').order('created_at', { ascending: true }),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: true }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
    ]);

    setTransactions((txRes.data as Transaction[]) || []);
    setGoals((goalsRes.data as Goal[]) || []);
    setCards((cardsRes.data as Card[]) || []);
    setSubscriptions((subsRes.data as Subscription[]) || []);
    setCategories((catRes.data as Category[]) || []);
    setLoading(false);
  }, [user, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        account: tx.account,
        transaction_date: tx.transaction_date,
        frequency: tx.frequency,
        installment_number: tx.installment_number,
        installment_total: tx.installment_total,
      })
      .select()
      .maybeSingle();

    if (error || !data) return false;

    // Generate recurring/installment rows
    if (tx.frequency === 'recurring') {
      const baseDate = new Date(tx.transaction_date + 'T00:00:00');
      const rows: Record<string, unknown>[] = [];
      for (let i = 1; i <= 11; i++) {
        rows.push({
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          account: tx.account,
          transaction_date: toISODate(addMonths(baseDate, i)),
          frequency: 'recurring',
          installment_number: null,
          installment_total: null,
        });
      }
      if (rows.length) await supabase.from('transactions').insert(rows);
    } else if (tx.frequency === 'installment' && tx.installment_total) {
      const baseDate = new Date(tx.transaction_date + 'T00:00:00');
      const total = tx.installment_total;
      const rows: Record<string, unknown>[] = [];
      for (let i = 2; i <= total; i++) {
        rows.push({
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          account: tx.account,
          transaction_date: toISODate(addMonths(baseDate, i - 1)),
          frequency: 'installment',
          installment_number: i,
          installment_total: total,
        });
      }
      if (rows.length) await supabase.from('transactions').insert(rows);
    }

    await loadData();
    return true;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) return false;
    await loadData();
    return true;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return false;
    await loadData();
    return true;
  };

  return {
    transactions,
    goals,
    cards,
    subscriptions,
    categories,
    loading,
    loadData,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export { monthKey, parseMonthKey, addMonths, toISODate, MONTHS };
