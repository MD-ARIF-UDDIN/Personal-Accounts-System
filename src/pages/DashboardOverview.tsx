import React from 'react';
import { 
  Users, 
  ArrowLeftRight, 
  CreditCard, 
  Plus, 
  ChevronRight 
} from 'lucide-react';
import { Dealer, Transaction, Payment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { NavTab } from '../components/Sidebar';

interface DashboardOverviewProps {
  dealers: Dealer[];
  transactions: Transaction[];
  payments: Payment[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewTransaction: () => void;
  onOpenNewPayment: () => void;
  onOpenNewDealer: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dealers,
  transactions,
  payments,
  onNavigate,
  onOpenNewTransaction,
  onOpenNewPayment,
  onOpenNewDealer,
}) => {
  const totalTransactions = transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netDueBalance = totalTransactions - totalPayments;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-4">
      {/* 3 Quick Action Buttons (Large, Mobile Touch-Friendly) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onOpenNewTransaction}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span className="leading-tight text-center">+ Transaction</span>
        </button>

        <button
          onClick={onOpenNewPayment}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span className="leading-tight text-center">+ Payment</span>
        </button>

        <button
          onClick={onOpenNewDealer}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span className="leading-tight text-center">+ Dealer</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Total Dealers */}
        <div
          onClick={() => onNavigate('dealers')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Dealers</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{dealers.length}</div>
        </div>

        {/* Total Transactions */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Transactions</span>
            <ArrowLeftRight className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-base sm:text-2xl font-extrabold text-slate-900 font-mono truncate">
            {formatCurrency(totalTransactions)}
          </div>
        </div>

        {/* Total Payments */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Payments</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-2xl font-extrabold text-emerald-700 font-mono truncate">
            {formatCurrency(totalPayments)}
          </div>
        </div>
      </div>

      {/* Recent Lists (Clean Mobile Friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Recent Transactions
            </span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-sky-600 font-semibold flex items-center"
            >
              All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No transactions yet</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{tx.dealer?.name || 'Dealer'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{formatDate(tx.date)}</p>
                    {(tx.notes || tx.description) && (
                      <p className="text-[10px] text-slate-400 italic truncate max-w-[180px]">
                        {tx.notes || tx.description}
                      </p>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Recent Payments
            </span>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-emerald-600 font-semibold flex items-center"
            >
              All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No payments yet</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{p.dealer?.name || 'Dealer'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatDate(p.date)} • {p.payment_method || 'Wallet'}
                    </p>
                    {p.notes && (
                      <p className="text-[10px] text-slate-400 italic truncate max-w-[180px]">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="font-mono font-bold text-emerald-700 text-sm">
                    +{formatCurrency(p.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
