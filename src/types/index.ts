export interface AppUser {
  id: string;
  phone: string;
  password?: string;
  name: string;
  role: string;
  notes?: string;
  created_at?: string;
}

export interface Dealer {
  id: string;
  user_id?: string;
  name: string;
  dealer_number: string;
  wallet_number: string;
  phone?: string;
  notes?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  dealer_id: string;
  dealer?: Dealer;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  description?: string;
  reference_no?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  user_id?: string;
  dealer_id: string;
  dealer?: Dealer;
  amount: number;
  date: string; // YYYY-MM-DD
  payment_method?: string;
  reference_no?: string;
  notes?: string;
  created_at?: string;
}

export interface DealerReportSummary {
  dealer: Dealer;
  totalTransactions: number;
  totalPayments: number;
  balance: number;
  lastActivityDate?: string;
}

export interface DailyReportItem {
  date: string;
  dealer_id: string;
  dealer_name: string;
  dealer_number: string;
  wallet_number: string;
  type: 'TRANSACTION' | 'PAYMENT';
  amount: number;
  reference_no?: string;
  notes?: string;
}

export interface MonthlyReportSummary {
  monthYear: string;
  displayMonth: string;
  totalTransactions: number;
  totalPayments: number;
  netDifference: number;
  transactionCount: number;
  paymentCount: number;
}
