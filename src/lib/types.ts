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
  created_at: string;
}
