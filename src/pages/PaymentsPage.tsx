import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit2, 
  Trash2, 
  Download 
} from 'lucide-react';
import { Dealer, Payment } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

interface PaymentsPageProps {
  payments: Payment[];
  dealers: Dealer[];
  onAddPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({
  payments,
  dealers,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealerId, setSelectedDealerId] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (selectedDealerId !== 'ALL' && p.dealer_id !== selectedDealerId) return false;
      if (dateFilter && p.date !== dateFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const dName = p.dealer?.name?.toLowerCase() || '';
        const dNum = p.dealer?.dealer_number?.toLowerCase() || '';
        const ref = p.reference_no?.toLowerCase() || '';
        if (!dName.includes(q) && !dNum.includes(q) && !ref.includes(q)) return false;
      }
      return true;
    });
  }, [payments, selectedDealerId, dateFilter, searchTerm]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [filtered]);

  const handleExport = () => {
    const rows = filtered.map((p) => ({
      Date: p.date,
      Dealer: p.dealer?.name || '',
      Dealer_No: p.dealer?.dealer_number || '',
      Amount: p.amount,
      Method: p.payment_method || 'Wallet',
      Reference: p.reference_no || '',
    }));
    exportToCSV('Payments', rows);
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          Payments ({filtered.length})
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
            onClick={onAddPayment}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Payment</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={selectedDealerId}
          onChange={(e) => setSelectedDealerId(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* Payments List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            No payments found.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">
                  {p.dealer?.name || 'Dealer'}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                  <span>{formatDate(p.date)}</span>
                  <span className="bg-emerald-50 text-emerald-800 font-semibold px-1 rounded text-[10px]">
                    {p.payment_method || 'Wallet'}
                  </span>
                  {p.reference_no && (
                    <span className="bg-slate-100 px-1 rounded text-slate-700">
                      {p.reference_no}
                    </span>
                  )}
                </div>
                {p.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded">
                    Note: {p.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-extrabold text-base text-emerald-700">
                  +{formatCurrency(p.amount)}
                </span>
                <div className="flex items-center">
                  <button
                    onClick={() => onEditPayment(p)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete payment record?')) {
                        onDeletePayment(p.id);
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
      <div className="sticky bottom-18 lg:bottom-4 z-20 bg-emerald-950 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          Total Payments
        </span>
        <span className="font-mono font-extrabold text-lg text-emerald-400">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
};
