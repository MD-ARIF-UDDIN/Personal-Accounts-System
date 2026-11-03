import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowLeftRight,
  CreditCard,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { Dealer, Transaction, Payment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DealersPageProps {
  dealers: Dealer[];
  transactions: Transaction[];
  payments: Payment[];
  onAddDealer: () => void;
  onEditDealer: (dealer: Dealer) => void;
  onDeleteDealer: (id: string) => void;
  onNewTransactionForDealer: (dealerId: string) => void;
  onNewPaymentForDealer: (dealerId: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (id: string) => void;
}

export const DealersPage: React.FC<DealersPageProps> = ({
  dealers,
  transactions,
  payments,
  onAddDealer,
  onEditDealer,
  onDeleteDealer,
  onNewTransactionForDealer,
  onNewPaymentForDealer,
  onEditTransaction,
  onDeleteTransaction,
  onEditPayment,
  onDeletePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedDealerForLedger, setSelectedDealerForLedger] = useState<Dealer | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const dealerBalances = useMemo(() => {
    const map = new Map<string, { totalTx: number; totalPay: number; balance: number }>();
    dealers.forEach((d) => map.set(d.id, { totalTx: 0, totalPay: 0, balance: 0 }));

    transactions.forEach((t) => {
      const entry = map.get(t.dealer_id);
      if (entry) {
        entry.totalTx += Number(t.amount || 0);
        entry.balance += Number(t.amount || 0);
      }
    });

    payments.forEach((p) => {
      const entry = map.get(p.dealer_id);
      if (entry) {
        entry.totalPay += Number(p.amount || 0);
        entry.balance -= Number(p.amount || 0);
      }
    });

    return map;
  }, [dealers, transactions, payments]);

  const filteredDealers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return dealers;
    return dealers.filter(
      (d) =>
        d.wallet_number.toLowerCase().includes(query) ||
        (d.notes && d.notes.toLowerCase().includes(query))
    );
  }, [dealers, searchTerm]);

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-slate-900">
          Wallets ({dealers.length})
        </h2>
        <button
          onClick={onAddDealer}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Wallet</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search wallet number or note..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-8 py-3 text-sm border-2 border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-sky-500 shadow-2xs font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Wallets Mobile Cards List */}
      <div className="space-y-3">
        {filteredDealers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
            No wallets found.
          </div>
        ) : (
          filteredDealers.map((dealer) => {
            const info = dealerBalances.get(dealer.id) || { totalTx: 0, totalPay: 0, balance: 0 };

            return (
              <div
                key={dealer.id}
                className="bg-white rounded-3xl border-2 border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                {/* Header: Wallet Number & Copy */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                        Wallet
                      </span>
                      <h3 className="font-extrabold text-lg font-mono text-slate-900 leading-tight">
                        {dealer.wallet_number}
                      </h3>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dealer.wallet_number, `wlt-${dealer.id}`)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg active:scale-95 transition"
                        title="Copy wallet number"
                      >
                        {copiedKey === `wlt-${dealer.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {dealer.notes && (
                      <p className="text-xs text-slate-600 italic mt-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 inline-block">
                        Note: {dealer.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary Row: Total Tx and Payments */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-sans block font-semibold">Total Tx</span>
                    <span className="font-extrabold text-slate-800">{formatCurrency(info.totalTx)}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-sans block font-semibold">Total Paid</span>
                    <span className="font-extrabold text-emerald-700">{formatCurrency(info.totalPay)}</span>
                  </div>
                </div>

                {/* Dealer Actions */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {/* Primary Quick Entries */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNewTransactionForDealer(dealer.id)}
                      className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>+ Transaction</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNewPaymentForDealer(dealer.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>+ Payment</span>
                    </button>
                  </div>

                  {/* Secondary Actions: History, Edit, Delete */}
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-bold pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDealerForLedger(dealer)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>History</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditDealer(dealer)}
                      className="py-1.5 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete wallet "${dealer.wallet_number}"? All its transactions and payments will also be deleted.`)) {
                          onDeleteDealer(dealer.id);
                        }
                      }}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MOBILE DRILL-DOWN LEDGER STATEMENT MODAL */}
      {selectedDealerForLedger && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 shadow-2xl safe-bottom">
            <div className="pt-2 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg">
                  Wallet Statement
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg font-mono mt-0.5">
                  {selectedDealerForLedger.wallet_number}
                </h3>
                {selectedDealerForLedger.notes && (
                  <p className="text-xs text-slate-500 italic mt-0.5">
                    Note: {selectedDealerForLedger.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDealerForLedger(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {(() => {
                const dTx = transactions
                  .filter((t) => t.dealer_id === selectedDealerForLedger.id)
                  .map((t) => ({
                    id: t.id,
                    date: t.date,
                    type: 'TX' as const,
                    amount: Number(t.amount || 0),
                    notes: t.notes || t.description,
                    raw: t,
                  }));

                const dPay = payments
                  .filter((p) => p.dealer_id === selectedDealerForLedger.id)
                  .map((p) => ({
                    id: p.id,
                    date: p.date,
                    type: 'PAY' as const,
                    amount: Number(p.amount || 0),
                    notes: p.notes,
                    raw: p,
                  }));

                const history = [...dTx, ...dPay].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                if (history.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 text-center py-8 font-medium">
                      No transactions or payments for this wallet yet.
                    </p>
                  );
                }

                return history.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-3 rounded-2xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${item.type === 'TX'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-emerald-100 text-emerald-800'
                              }`}
                          >
                            {item.type === 'TX' ? 'Transaction' : 'Payment'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                          {formatDate(item.date)}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-slate-500 italic block mt-0.5">
                            Note: {item.notes}
                          </span>
                        )}
                      </div>

                      <span
                        className={`font-mono font-extrabold text-sm ${item.type === 'TX' ? 'text-slate-900' : 'text-emerald-700'
                          }`}
                      >
                        {item.type === 'TX' ? '' : '+'}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    {(onEditTransaction || onDeleteTransaction || onEditPayment || onDeletePayment) && (
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                        {item.type === 'TX' && onEditTransaction && (
                          <button
                            type="button"
                            onClick={() => onEditTransaction(item.raw as Transaction)}
                            className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                          >
                            Edit
                          </button>
                        )}
                        {item.type === 'TX' && onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this transaction?')) {
                                onDeleteTransaction(item.id);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          >
                            Delete
                          </button>
                        )}
                        {item.type === 'PAY' && onEditPayment && (
                          <button
                            type="button"
                            onClick={() => onEditPayment(item.raw as Payment)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            Edit
                          </button>
                        )}
                        {item.type === 'PAY' && onDeletePayment && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this payment record?')) {
                                onDeletePayment(item.id);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDealerForLedger(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
