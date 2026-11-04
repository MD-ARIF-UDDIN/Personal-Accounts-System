import React, { useState, useMemo } from 'react';
import {
  Wallet as WalletIcon,
  CalendarDays,
  Percent,
  Plus,
  Search,
  Download,
  ChevronRight
} from 'lucide-react';
import { Dealer, Transaction, Payment } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportWalletReportToPDF } from '../utils/pdfExport';
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
  onNavigate,
  onOpenNewTransaction,
  onOpenNewPayment,
  onOpenNewDealer,
}) => {
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const todayStr = getTodayStr();
  const currentMonthStr = getCurrentMonthStr();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [commissionRate, setCommissionRate] = useState<string>('1.2');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isViewingCurrentMonth = selectedMonth === currentMonthStr;
  const commissionRateNum = parseFloat(commissionRate) || 0;

  // Month label (e.g. "Nov 2026")
  const targetMonthLabel = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Compute dealer-wise report data
  const reportData = useMemo(() => {
    return dealers.map((dealer) => {
      const dTx = transactions.filter((t) => t.dealer_id === dealer.id);

      // Today's Transactions
      const todayTxList = dTx.filter((t) => t.date === todayStr);
      const todayTx = todayTxList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Monthly Transactions
      const monthlyTxList = dTx.filter((t) => t.date && t.date.slice(0, 7) === selectedMonth);
      const monthlyTx = monthlyTxList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Both Daily and Monthly Commissions
      const todayCommission = (todayTx * commissionRateNum) / 100;
      const monthlyCommission = (monthlyTx * commissionRateNum) / 100;

      return {
        dealer,
        todayTx,
        todayCommission,
        monthlyTx,
        monthlyCommission,
        todayCount: todayTxList.length,
        monthlyCount: monthlyTxList.length,
      };
    });
  }, [dealers, transactions, todayStr, selectedMonth, commissionRateNum]);

  // Filtered by search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return reportData;
    const q = searchTerm.toLowerCase().trim();
    return reportData.filter((row) => {
      const num = (row.dealer.wallet_number || row.dealer.dealer_number || '').toLowerCase();
      const note = (row.dealer.notes || row.dealer.name || '').toLowerCase();
      return num.includes(q) || note.includes(q);
    });
  }, [reportData, searchTerm]);

  // Grand Totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.todayTx += row.todayTx;
        acc.todayCommission += row.todayCommission;
        acc.monthlyTx += row.monthlyTx;
        acc.monthlyCommission += row.monthlyCommission;
        acc.todayCount += row.todayCount;
        acc.monthlyCount += row.monthlyCount;
        return acc;
      },
      { todayTx: 0, todayCommission: 0, monthlyTx: 0, monthlyCommission: 0, todayCount: 0, monthlyCount: 0 }
    );
  }, [filteredData]);

  const handleExportPDF = () => {
    const rows = filteredData.map((row) => ({
      walletNumber: row.dealer.wallet_number || row.dealer.dealer_number || '',
      note: row.dealer.notes || '',
      todayTx: row.todayTx,
      todayCommission: row.todayCommission,
      monthlyTx: row.monthlyTx,
      monthlyCommission: row.monthlyCommission,
    }));

    exportWalletReportToPDF({
      rows,
      totals: {
        todayTx: totals.todayTx,
        todayCommission: totals.todayCommission,
        monthlyTx: totals.monthlyTx,
        monthlyCommission: totals.monthlyCommission,
        walletCount: filteredData.length,
      },
      selectedDate: todayStr,
      monthLabel: targetMonthLabel,
      commissionRate: commissionRateNum,
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Quick Action Buttons */}
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
          <span className="leading-tight text-center">+ Wallet</span>
        </button>
      </div>

      {/* KPI Cards: Both Daily & Monthly Tx & Commissions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Today Transactions */}
        <div
          onClick={() => onNavigate('transactions')}
          className="bg-white p-3.5 rounded-2xl border-2 border-sky-100 shadow-xs cursor-pointer hover:border-sky-200 transition"
        >
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Today Tx</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">
              {totals.todayCount}
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 font-mono truncate">
            {formatCurrency(totals.todayTx)}
          </div>
        </div>

        {/* Today Commission */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Today Comm</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono">
              {commissionRateNum}%
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-amber-700 font-mono truncate">
            {formatCurrency(totals.todayCommission)}
          </div>
        </div>

        {/* Monthly Transactions */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-3.5 rounded-2xl border-2 border-indigo-100 shadow-xs cursor-pointer hover:border-indigo-200 transition"
        >
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Monthly Tx</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {targetMonthLabel}
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 font-mono truncate">
            {formatCurrency(totals.monthlyTx)}
          </div>
        </div>

        {/* Monthly Commission */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-3.5 rounded-2xl border-2 border-amber-300 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Monthly Comm</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
              {commissionRateNum}%
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-amber-900 font-mono truncate">
            {formatCurrency(totals.monthlyCommission)}
          </div>
        </div>

        {/* Total Wallets */}
        <div
          onClick={() => onNavigate('dealers')}
          className="col-span-2 sm:col-span-1 lg:col-span-1 bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Wallets</span>
            <WalletIcon className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900">
            {dealers.length}
          </div>
        </div>
      </div>

      {/* Wallet Report Section Header */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-sky-600" />
              Wallet Report
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily & Monthly Transaction & Commission Summary per Wallet
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-2xs active:scale-95"
              title="Download report as PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              All Reports <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Month Selector, and Commission Input */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wallet number or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-indigo-50/70 px-2.5 py-1 border border-indigo-200/80 rounded-xl">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || currentMonthStr)}
                className="text-xs font-mono font-bold text-indigo-950 bg-transparent focus:outline-none cursor-pointer"
              />
              {!isViewingCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth(currentMonthStr)}
                  className="text-[10px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-1.5 py-0.5 rounded transition"
                  title="Reset to current month"
                >
                  Current
                </button>
              )}
            </div>

            {/* Commission Input Field */}
            <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 border border-amber-300 rounded-xl">
              <Percent className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap">
                Commission:
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.2"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-14 text-xs font-mono font-bold text-amber-950 bg-transparent focus:outline-none text-right pr-0.5"
                />
                <span className="text-xs font-bold text-amber-800 font-mono">%</span>
              </div>
              {commissionRate !== '1.2' && (
                <button
                  type="button"
                  onClick={() => setCommissionRate('1.2')}
                  className="text-[10px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded transition ml-0.5"
                  title="Reset to default 1.2%"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table View - Both Daily & Monthly Commissions */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                <th className="py-2.5 px-3">Wallet</th>
                <th className="py-2.5 px-2 text-[10px] text-slate-400 w-20">Note</th>
                <th className="py-2.5 px-3 text-right">Today Tx</th>
                <th className="py-2.5 px-3 text-right text-amber-700">Today Comm ({commissionRateNum}%)</th>
                <th className="py-2.5 px-3 text-right">Monthly Tx ({targetMonthLabel})</th>
                <th className="py-2.5 px-3 text-right text-amber-900">Monthly Comm ({commissionRateNum}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No wallets found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={row.dealer.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900">
                      {row.dealer.wallet_number || row.dealer.dealer_number || 'Wallet'}
                    </td>
                    <td className="py-2.5 px-2 text-[10px] text-slate-400 italic max-w-[85px] truncate">
                      {row.dealer.notes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-sky-700">
                      {formatCurrency(row.todayTx)}
                      {row.todayCount > 0 && (
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">
                          ({row.todayCount})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                      {formatCurrency(row.todayCommission)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatCurrency(row.monthlyTx)}
                      {row.monthlyCount > 0 && (
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">
                          ({row.monthlyCount})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900">
                      {formatCurrency(row.monthlyCommission)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-xs font-black text-slate-900">
                  <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-slate-700">
                    Total ({filteredData.length} Wallets)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-sky-700">
                    {formatCurrency(totals.todayTx)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-amber-700">
                    {formatCurrency(totals.todayCommission)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-slate-900">
                    {formatCurrency(totals.monthlyTx)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-amber-900">
                    {formatCurrency(totals.monthlyCommission)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Cards View - Both Daily & Monthly Commissions */}
        <div className="sm:hidden space-y-2">
          {filteredData.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 text-xs">
              No wallets found.
            </div>
          ) : (
            filteredData.map((row) => (
              <div
                key={row.dealer.id}
                className="bg-slate-50/70 rounded-2xl border border-slate-200 p-3 space-y-2"
              >
                <div>
                  <span className="text-sm font-mono font-black text-slate-900">
                    {row.dealer.wallet_number || row.dealer.dealer_number || 'Wallet'}
                  </span>
                  {row.dealer.notes && (
                    <span className="text-[10px] text-slate-400 italic block mt-0.5">
                      Note: {row.dealer.notes}
                    </span>
                  )}
                </div>

                {/* 2x2 Grid for Mobile */}
                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/60">
                  <div className="bg-white rounded-xl p-2 border border-sky-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block">
                      Today Tx
                    </span>
                    <span className="font-mono font-black text-sm text-sky-800">
                      {formatCurrency(row.todayTx)}
                    </span>
                    {row.todayCount > 0 && (
                      <span className="text-[10px] text-sky-600 block">
                        {row.todayCount} tx
                      </span>
                    )}
                  </div>

                  <div className="bg-amber-50/70 rounded-xl p-2 border border-amber-200/70">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Today Comm ({commissionRateNum}%)
                    </span>
                    <span className="font-mono font-black text-sm text-amber-800">
                      {formatCurrency(row.todayCommission)}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-2 border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                      Monthly Tx ({targetMonthLabel})
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {formatCurrency(row.monthlyTx)}
                    </span>
                    {row.monthlyCount > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        {row.monthlyCount} tx
                      </span>
                    )}
                  </div>

                  <div className="bg-amber-100/70 rounded-xl p-2 border border-amber-300/80">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                      Monthly Comm ({commissionRateNum}%)
                    </span>
                    <span className="font-mono font-black text-sm text-amber-950">
                      {formatCurrency(row.monthlyCommission)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Mobile Grand Total Box */}
          {filteredData.length > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
                <span>Total ({filteredData.length} Wallets)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800 font-mono">
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[9px] text-sky-300 uppercase block font-semibold">
                    Today Tx Total
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {formatCurrency(totals.todayTx)}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[9px] text-amber-300 uppercase block font-semibold">
                    Today Comm Total
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                    {formatCurrency(totals.todayCommission)}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                    Monthly Tx Total
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {formatCurrency(totals.monthlyTx)}
                  </span>
                </div>
                <div className="bg-slate-800/80 rounded-xl p-2">
                  <span className="text-[9px] text-amber-400 uppercase block font-semibold">
                    Monthly Comm Total
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                    {formatCurrency(totals.monthlyCommission)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
