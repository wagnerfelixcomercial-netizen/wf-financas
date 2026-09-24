export type TransactionType = 'income' | 'expense';
export type Frequency = 'single' | 'recurring' | 'installment';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  transaction_date: string;
  frequency: Frequency;
  installment_number: number | null;
  installment_total: number | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  current_amount: number;
  target_amount: number;
  color: string;
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  last_four: string;
  credit_limit: number;
  used_amount: number;
  due_day: number;
  color: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  billing_day: number;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface NewTransaction {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  transaction_date: string;
  frequency: Frequency;
  installment_number?: number | null;
  installment_total?: number | null;
}
