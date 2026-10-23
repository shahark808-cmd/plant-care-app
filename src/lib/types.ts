export type Visibility = "private" | "shared";
export type TxType = "income" | "expense";

export interface Household {
  id: string;
  name: string;
  period_start_day: number;
  invite_code: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  color: string;
  kind: TxType;
  sort_order: number;
  archived: boolean;
  bucket: "needs" | "wants" | "savings" | null;
}

export interface Profile {
  id: string;
  display_name: string;
}

export interface Transaction {
  id: string;
  household_id: string;
  owner_id: string;
  amount: number; // אגורות
  type: TxType;
  category_id: string | null;
  date: string; // YYYY-MM-DD
  charge_date: string | null;
  visibility: Visibility;
  paid_by: string;
  split_ratio: number;
  note: string | null;
  account_id: string | null;
  installment_index: number | null;
  installments_total: number | null;
  created_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  owner_id: string;
  name: string;
  kind: "cash" | "bank" | "credit_card";
  charge_day: number | null;
}

export interface Budget {
  id: string;
  category_id: string | null;
  period_start: string;
  amount: number;
  visibility: Visibility;
}

export interface RecurringRule {
  id: string;
  owner_id: string;
  visibility: Visibility;
  category_id: string | null;
  account_id: string | null;
  amount: number;
  type: TxType;
  day_of_month: number;
  note: string | null;
  active: boolean;
  is_subscription: boolean;
}
