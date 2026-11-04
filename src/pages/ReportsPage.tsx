import React, { useState, useMemo } from 'react';
import { 
  Wallet as WalletIcon, 
  Calendar, 
  CalendarDays,
  Percent,
  Download, 
  Printer, 
  Search,
  RotateCcw
} from 'lucide-react';
import { Dealer, Transaction, Payment } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportWalletReportToPDF } from '../utils/pdfExport';

interface ReportsPageProps {
  dealers: Dealer[];
  transactions: Transaction[];
  payments?: Payment[];
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onEditPayment?: (payment: Payment) => void;
  onDeletePayment?: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  dealers,
  transactions,
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

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [commissionRate, setCommissionRate] = useState<string>('1.2');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isViewingToday = selectedDate === todayStr;
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

      // Today / Selected Day Transaction Total
      const todayTxList = dTx.filter((t) => t.date === selectedDate);
      const todayTx = todayTxList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Monthly Transaction Total based on selectedMonth (YYYY-MM)
      const monthlyTxList = dTx.filter((t) => t.date && t.date.slice(0, 7) === selectedMonth);
      const monthlyTx = monthlyTxList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Calculated Commissions based on percentage input
      const todayCommission = (todayTx * commissionRateNum) / 100;
      const monthlyCommission = (monthlyTx * commissionRateNum) / 100;

      return {
        dealer,
        todayTx,
        monthlyTx,
        todayCommission,
        monthlyCommission,
        todayCount: todayTxList.length,
        monthlyCount: monthlyTxList.length,
      };
    });
  }, [dealers, transactions, selectedDate, selectedMonth, commissionRateNum]);

  // Filtered by search term
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
        acc.monthlyTx += row.monthlyTx;
        acc.todayCommission += row.todayCommission;
        acc.monthlyCommission += row.monthlyCommission;
        acc.todayCount += row.todayCount;
        acc.monthlyCount += row.monthlyCount;
        return acc;
      },
      { todayTx: 0, monthlyTx: 0, todayCommission: 0, monthlyCommission: 0, todayCount: 0, monthlyCount: 0 }
    );
  }, [filteredData]);

  const handleExportPDF = () => {
    const rows = filteredData.map((row) => ({
      walletNumber: row.dealer.wallet_number || row.dealer.dealer_number || '',
      note: row.dealer.notes || '',
      todayTx: row.todayTx,
      monthlyTx: row.monthlyTx,
      commission: row.monthlyCommission,
    }));

    exportWalletReportToPDF({
      rows,
      totals: {
        todayTx: totals.todayTx,
        monthlyTx: totals.monthlyTx,
        walletCount: filteredData.length,
        commission: totals.monthlyCommission,
      },
      selectedDate,
      monthLabel: targetMonthLabel,
      commissionRate: commissionRateNum,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-sky-600" />
            Wallet Report
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Wallet-wise Today & Monthly Transaction & Commission Summary
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto print:hidden">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-sm active:scale-95"
            title="Download report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs active:scale-95"
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Today Transaction Card */}
        <div className="bg-white rounded-2xl border-2 border-sky-100 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
              {isViewingToday ? 'Today Tx' : `Tx (${selectedDate})`}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">
              {totals.todayCount} tx
            </span>
          </div>
          <div className="mt-1 font-mono font-black text-lg sm:text-2xl text-slate-900">
            {formatCurrency(totals.todayTx)}
          </div>
        </div>

        {/* Monthly Transaction Card */}
        <div className="bg-white rounded-2xl border-2 border-indigo-100 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
              Monthly Tx
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {targetMonthLabel}
            </span>
          </div>
          <div className="mt-1 font-mono font-black text-lg sm:text-2xl text-slate-900">
            {formatCurrency(totals.monthlyTx)}
          </div>
        </div>

        {/* Commission Card */}
        <div className="bg-white rounded-2xl border-2 border-amber-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
              Commission
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono">
              {commissionRateNum}%
            </span>
          </div>
          <div className="mt-1 font-mono font-black text-lg sm:text-2xl text-amber-900">
            {formatCurrency(totals.monthlyCommission)}
          </div>
          {totals.todayCommission > 0 && (
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Today: {formatCurrency(totals.todayCommission)}
            </div>
          )}
        </div>

        {/* Total Wallets Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Total Wallets
          </span>
          <div className="mt-1 font-mono font-black text-lg sm:text-2xl text-slate-800">
            {filteredData.length}
            {dealers.length !== filteredData.length && (
              <span className="text-xs font-normal text-slate-400 ml-1">
                of {dealers.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Date / Month / Commission Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 print:hidden">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search wallet number or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Pickers for Day, Month, and Commission */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day / Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || todayStr)}
              className="text-xs font-mono font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            />
            {!isViewingToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-[10px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-1.5 py-0.5 rounded transition"
                title="Reset to today"
              >
                Today
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-indigo-50/70 px-2.5 py-1.5 border border-indigo-200/80 rounded-xl">
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
          <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1.5 border border-amber-300 rounded-xl">
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

      {/* Main Report Table (Desktop & Tablet) */}
      <div className="hidden sm:block bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
              <th className="py-3 px-3.5 w-10 text-center text-slate-400">#</th>
              <th className="py-3 px-3.5">Wallet</th>
              <th className="py-3 px-3.5">Note</th>
              <th className="py-3 px-3.5 text-right">Today Transaction</th>
              <th className="py-3 px-3.5 text-right">Monthly Transaction ({targetMonthLabel})</th>
              <th className="py-3 px-3.5 text-right text-amber-800">Commission ({commissionRateNum}%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No wallets found.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={row.dealer.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5 font-mono font-extrabold text-slate-900">
                    {row.dealer.wallet_number || row.dealer.dealer_number || 'Wallet'}
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 italic max-w-xs truncate">
                    {row.dealer.notes || '—'}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold text-sky-700">
                    {formatCurrency(row.todayTx)}
                    {row.todayCount > 0 && (
                      <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                        ({row.todayCount})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-900">
                    {formatCurrency(row.monthlyTx)}
                    {row.monthlyCount > 0 && (
                      <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                        ({row.monthlyCount})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-extrabold text-amber-800">
                    <div>{formatCurrency(row.monthlyCommission)}</div>
                    {row.todayCommission > 0 && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        Today: {formatCurrency(row.todayCommission)}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-xs font-black text-slate-900">
                <td colSpan={3} className="py-3.5 px-3.5 uppercase tracking-wider text-slate-700">
                  Total ({filteredData.length} Wallets)
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-sm text-sky-700">
                  {formatCurrency(totals.todayTx)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-sm text-slate-900">
                  {formatCurrency(totals.monthlyTx)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-sm text-amber-800">
                  <div>{formatCurrency(totals.monthlyCommission)}</div>
                  {totals.todayCommission > 0 && (
                    <div className="text-[10px] text-slate-500 font-normal">
                      Today: {formatCurrency(totals.todayCommission)}
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Main Report Cards (Mobile) */}
      <div className="sm:hidden space-y-2.5">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-medium">
            No wallets found.
          </div>
        ) : (
          filteredData.map((row) => (
            <div
              key={row.dealer.id}
              className="bg-white rounded-2xl border-2 border-slate-200/90 p-3.5 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-mono font-black text-slate-900">
                    {row.dealer.wallet_number || row.dealer.dealer_number || 'Wallet'}
                  </span>
                  {row.dealer.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      Note: {row.dealer.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-sky-50/60 rounded-xl p-2">
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

                <div className="bg-slate-50 rounded-xl p-2">
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

                {/* Mobile Commission Box */}
                <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-200 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Commission ({commissionRateNum}%)
                    </span>
                    {row.todayCommission > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        Today: {formatCurrency(row.todayCommission)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-sm text-amber-900">
                    {formatCurrency(row.monthlyCommission)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Grand Total Summary Box */}
        {filteredData.length > 0 && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
              <span>Grand Total</span>
              <span>{filteredData.length} Wallets</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 font-mono text-center sm:text-left">
              <div>
                <span className="text-[9px] text-sky-300 uppercase block font-semibold truncate">
                  Today Tx
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {formatCurrency(totals.todayTx)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-semibold truncate">
                  Monthly Tx
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {formatCurrency(totals.monthlyTx)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-amber-300 uppercase block font-semibold truncate">
                  Comm ({commissionRateNum}%)
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                  {formatCurrency(totals.monthlyCommission)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
