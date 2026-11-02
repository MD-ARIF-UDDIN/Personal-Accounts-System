import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Download 
} from 'lucide-react';
import { Dealer, Transaction } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

interface TransactionsPageProps {
  transactions: Transaction[];
  dealers: Dealer[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  dealers,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealerId, setSelectedDealerId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedDealerId !== 'ALL' && tx.dealer_id !== selectedDealerId) return false;
      if (dateFilter && tx.date !== dateFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const dName = tx.dealer?.name?.toLowerCase() || '';
        const dNum = tx.dealer?.dealer_number?.toLowerCase() || '';
        const ref = tx.reference_no?.toLowerCase() || '';
        if (!dName.includes(q) && !dNum.includes(q) && !ref.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, selectedDealerId, dateFilter, searchTerm]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filtered]);

  const handleExport = () => {
    const rows = filtered.map((tx) => ({
      Date: tx.date,
      Dealer: tx.dealer?.name || '',
      Dealer_No: tx.dealer?.dealer_number || '',
      Amount: tx.amount,
      Reference: tx.reference_no || '',
    }));
    exportToCSV('Transactions', rows);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          Transactions ({filtered.length})
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExport}
            className="p-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onAddTransaction}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={selectedDealerId}
          onChange={(e) => setSelectedDealerId(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="ALL">All Dealers ({dealers.length})</option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.dealer_number})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-rose-600 font-bold px-1.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            No transactions found.
          </div>
        ) : (
          filtered.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">
                  {tx.dealer?.name || 'Dealer'}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span>{formatDate(tx.date)}</span>
                  {tx.reference_no && (
                    <span className="bg-slate-100 px-1 rounded text-slate-700">
                      {tx.reference_no}
                    </span>
                  )}
                </div>
                {(tx.notes || tx.description) && (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded">
                    Note: {tx.notes || tx.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-extrabold text-base text-slate-900">
                  {formatCurrency(tx.amount)}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => onEditTransaction(tx)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete transaction?')) {
                        onDeleteTransaction(tx.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Total Bar */}
      <div className="sticky bottom-18 lg:bottom-4 z-20 bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Total Transactions
        </span>
        <span className="font-mono font-extrabold text-lg text-sky-400">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
};
