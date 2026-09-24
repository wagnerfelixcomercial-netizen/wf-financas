/*
# WF Finanças core data model

1. New tables
- `profiles`: account directory with display name, email, approval status, and admin flag.
- `transactions`: private income and expense entries, including recurrence metadata.
- `goals`: private savings goals with current and target amounts.
- `cards`: private credit/debit cards with limit and due-day information.
- `subscriptions`: private recurring services and monthly costs.
- `categories`: private custom categories per user.

2. Important columns
- Every private finance table has `user_id` with a default of `auth.uid()` and a foreign key to the signed-in account.
- Transactions store `amount`, `type`, `description`, `category`, `account`, `transaction_date`, `frequency`, and installment details.
- Profiles store `approval_status`, `is_admin`, and `is_blocked`; new accounts always insert as non-admin and pending.

3. Security
- RLS is enabled on every table.
- Financial records use four separate authenticated owner policies for SELECT, INSERT, UPDATE, and DELETE.
- Profiles are private to the owner, while the fixed administrator email may review and update account status only. Profiles do not expose financial rows.

4. Notes
- No existing data is removed or altered.
- The administrator identity is determined from the authenticated email `wagner.felix.comercial@gmail.com` for directory operations.
- A profile insert cannot self-assign administrator privileges.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  is_admin boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT 'Outros',
  account text NOT NULL DEFAULT 'Conta principal',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  frequency text NOT NULL DEFAULT 'single' CHECK (frequency IN ('single', 'recurring', 'installment')),
  installment_number integer,
  installment_total integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  current_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  color text NOT NULL DEFAULT '#6c5ce7',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank text NOT NULL,
  last_four text NOT NULL DEFAULT '0000',
  credit_limit numeric(12,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  used_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
  due_day integer NOT NULL DEFAULT 10 CHECK (due_day BETWEEN 1 AND 31),
  color text NOT NULL DEFAULT '#6c5ce7',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Assinaturas',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  billing_day integer NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 31),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6c5ce7',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_read_profiles" ON public.profiles;
CREATE POLICY "owners_read_profiles" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'wagner.felix.comercial@gmail.com');
DROP POLICY IF EXISTS "owners_insert_profiles" ON public.profiles;
CREATE POLICY "owners_insert_profiles" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND is_admin = false AND is_blocked = false);
DROP POLICY IF EXISTS "owners_update_profiles" ON public.profiles;
CREATE POLICY "owners_update_profiles" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'wagner.felix.comercial@gmail.com')
WITH CHECK ((auth.uid() = id AND is_admin = false) OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'wagner.felix.comercial@gmail.com');
DROP POLICY IF EXISTS "owners_delete_profiles" ON public.profiles;
CREATE POLICY "owners_delete_profiles" ON public.profiles FOR DELETE TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'wagner.felix.comercial@gmail.com');

DROP POLICY IF EXISTS "owners_read_transactions" ON public.transactions;
CREATE POLICY "owners_read_transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_insert_transactions" ON public.transactions;
CREATE POLICY "owners_insert_transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_update_transactions" ON public.transactions;
CREATE POLICY "owners_update_transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_delete_transactions" ON public.transactions;
CREATE POLICY "owners_delete_transactions" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_read_goals" ON public.goals;
CREATE POLICY "owners_read_goals" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_insert_goals" ON public.goals;
CREATE POLICY "owners_insert_goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_update_goals" ON public.goals;
CREATE POLICY "owners_update_goals" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_delete_goals" ON public.goals;
CREATE POLICY "owners_delete_goals" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_read_cards" ON public.cards;
CREATE POLICY "owners_read_cards" ON public.cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_insert_cards" ON public.cards;
CREATE POLICY "owners_insert_cards" ON public.cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_update_cards" ON public.cards;
CREATE POLICY "owners_update_cards" ON public.cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_delete_cards" ON public.cards;
CREATE POLICY "owners_delete_cards" ON public.cards FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_read_subscriptions" ON public.subscriptions;
CREATE POLICY "owners_read_subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_insert_subscriptions" ON public.subscriptions;
CREATE POLICY "owners_insert_subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_update_subscriptions" ON public.subscriptions;
CREATE POLICY "owners_update_subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_delete_subscriptions" ON public.subscriptions;
CREATE POLICY "owners_delete_subscriptions" ON public.subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_read_categories" ON public.categories;
CREATE POLICY "owners_read_categories" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_insert_categories" ON public.categories;
CREATE POLICY "owners_insert_categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_update_categories" ON public.categories;
CREATE POLICY "owners_update_categories" ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners_delete_categories" ON public.categories;
CREATE POLICY "owners_delete_categories" ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS goals_user_idx ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS cards_user_idx ON public.cards (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS categories_user_idx ON public.categories (user_id);
