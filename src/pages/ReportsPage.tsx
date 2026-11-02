import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Users, 
  Calendar, 
  CalendarDays, 
  Download, 
  Printer,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Dealer, Transaction, Payment } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

interface ReportsPageProps {
  dealers: Dealer[];
  transactions: Transaction[];
  payments: Payment[];
}

type ReportTab = 'dealers' | 'daily' | 'monthly';

export const ReportsPage: React.FC<ReportsPageProps> = ({
  dealers,
  transactions,
  payments,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('dealers');

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7);
  const getLastMonthStr = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  };

  const [dailyDate, setDailyDate] = useState<string>(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [expandedDealerId, setExpandedDealerId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedDealerId(expandedDealerId === id ? null : id);
  };

  // ==============================================================
  // 1. ALL-TIME DEALER-WISE REPORT
  // ==============================================================
  const allTimeDealerData = useMemo(() => {
    return dealers.map((dealer) => {
      const dTx = transactions.filter((t) => t.dealer_id === dealer.id);
      const dPay = payments.filter((p) => p.dealer_id === dealer.id);
      const totalTx = dTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const totalPay = dPay.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return {
        dealer,
        totalTx,
        totalPay,
        balance: totalTx - totalPay,
        transactions: dTx,
        payments: dPay,
      };
    });
  }, [dealers, transactions, payments]);

  const allTimeTotals = useMemo(() => {
    return allTimeDealerData.reduce(
      (acc, curr) => {
        acc.totalTx += curr.totalTx;
        acc.totalPay += curr.totalPay;
        acc.balance += curr.balance;
        return acc;
      },
      { totalTx: 0, totalPay: 0, balance: 0 }
    );
  }, [allTimeDealerData]);

  // ==============================================================
  // 2. DAILY DEALER-WISE REPORT
  // ==============================================================
  const dailyDealerData = useMemo(() => {
    return dealers
      .map((dealer) => {
        const dTx = transactions.filter(
          (t) => t.dealer_id === dealer.id && t.date === dailyDate
        );
        const dPay = payments.filter(
          (p) => p.dealer_id === dealer.id && p.date === dailyDate
        );

        const totalTx = dTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalPay = dPay.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        return {
          dealer,
          totalTx,
          totalPay,
          balance: totalTx - totalPay,
          transactions: dTx,
          payments: dPay,
          hasActivity: dTx.length > 0 || dPay.length > 0,
        };
      })
      .filter((item) => item.hasActivity);
  }, [dealers, transactions, payments, dailyDate]);

  const dailyTotals = useMemo(() => {
    return dailyDealerData.reduce(
      (acc, curr) => {
        acc.totalTx += curr.totalTx;
        acc.totalPay += curr.totalPay;
        acc.balance += curr.balance;
        return acc;
      },
      { totalTx: 0, totalPay: 0, balance: 0 }
    );
  }, [dailyDealerData]);

  // ==============================================================
  // 3. MONTHLY DEALER-WISE REPORT
  // ==============================================================
  const monthlyDealerData = useMemo(() => {
    return dealers
      .map((dealer) => {
        const dTx = transactions.filter(
          (t) => t.dealer_id === dealer.id && t.date && t.date.startsWith(selectedMonth)
        );
        const dPay = payments.filter(
          (p) => p.dealer_id === dealer.id && p.date && p.date.startsWith(selectedMonth)
        );

        const totalTx = dTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const totalPay = dPay.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        return {
          dealer,
          totalTx,
          totalPay,
          balance: totalTx - totalPay,
          transactions: dTx,
          payments: dPay,
          hasActivity: dTx.length > 0 || dPay.length > 0,
        };
      })
      .filter((item) => item.hasActivity);
  }, [dealers, transactions, payments, selectedMonth]);

  const monthlyTotals = useMemo(() => {
    return monthlyDealerData.reduce(
      (acc, curr) => {
        acc.totalTx += curr.totalTx;
        acc.totalPay += curr.totalPay;
        acc.balance += curr.balance;
        return acc;
      },
      { totalTx: 0, totalPay: 0, balance: 0 }
    );
  }, [monthlyDealerData]);

  // ==============================================================
  // CSV EXPORT (DEALER WISE)
  // ==============================================================
  const handleExport = () => {
    if (activeTab === 'dealers') {
      const rows: Record<string, any>[] = allTimeDealerData.map((d) => ({
        Dealer_Name: d.dealer.name,
        Dealer_No: d.dealer.dealer_number,
        Wallet_No: d.dealer.wallet_number,
        Transactions: d.totalTx,
        Payments: d.totalPay,
        Balance: d.balance,
      }));
      rows.push({
        Dealer_Name: 'TOTAL ALL DEALERS',
        Dealer_No: '',
        Wallet_No: '',
        Transactions: allTimeTotals.totalTx,
        Payments: allTimeTotals.totalPay,
        Balance: allTimeTotals.balance,
      });
      exportToCSV('All_Dealers_Report', rows);
    } else if (activeTab === 'daily') {
      const rows: Record<string, any>[] = dailyDealerData.map((d) => ({
        Date: dailyDate,
        Dealer_Name: d.dealer.name,
        Dealer_No: d.dealer.dealer_number,
        Wallet_No: d.dealer.wallet_number,
        Daily_Transactions: d.totalTx,
        Daily_Payments: d.totalPay,
        Daily_Balance: d.balance,
      }));
      rows.push({
        Date: dailyDate,
        Dealer_Name: 'TOTAL ALL DEALERS',
        Dealer_No: '',
        Wallet_No: '',
        Daily_Transactions: dailyTotals.totalTx,
        Daily_Payments: dailyTotals.totalPay,
        Daily_Balance: dailyTotals.balance,
      });
      exportToCSV(`Daily_Dealer_Report_${dailyDate}`, rows);
    } else {
      const rows: Record<string, any>[] = monthlyDealerData.map((d) => ({
        Month: selectedMonth,
        Dealer_Name: d.dealer.name,
        Dealer_No: d.dealer.dealer_number,
        Wallet_No: d.dealer.wallet_number,
        Monthly_Transactions: d.totalTx,
        Monthly_Payments: d.totalPay,
        Monthly_Balance: d.balance,
      }));
      rows.push({
        Month: selectedMonth,
        Dealer_Name: 'TOTAL ALL DEALERS',
        Dealer_No: '',
        Wallet_No: '',
        Monthly_Transactions: monthlyTotals.totalTx,
        Monthly_Payments: monthlyTotals.totalPay,
        Monthly_Balance: monthlyTotals.balance,
      });
      exportToCSV(`Monthly_Dealer_Report_${selectedMonth}`, rows);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-slate-900">Dealer Reports</h2>
        <div className="flex items-center gap-1.5 no-print">
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition active:scale-95"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2.5 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 transition active:scale-95"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Mobile Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/90 rounded-2xl text-xs font-extrabold no-print">
        <button
          onClick={() => {
            setActiveTab('dealers');
            setExpandedDealerId(null);
          }}
          className={`py-2.5 rounded-xl text-center transition active:scale-95 ${
            activeTab === 'dealers'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Dealers
        </button>
        <button
          onClick={() => {
            setActiveTab('daily');
            setExpandedDealerId(null);
          }}
          className={`py-2.5 rounded-xl text-center transition active:scale-95 ${
            activeTab === 'daily'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily (Dealer)
        </button>
        <button
          onClick={() => {
            setActiveTab('monthly');
            setExpandedDealerId(null);
          }}
          className={`py-2.5 rounded-xl text-center transition active:scale-95 ${
            activeTab === 'monthly'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly (Dealer)
        </button>
      </div>

      {/* ==================== 1. ALL-TIME DEALER-WISE REPORT ==================== */}
      {activeTab === 'dealers' && (
        <div className="space-y-2.5">
          {allTimeDealerData.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
              No dealers found.
            </div>
          ) : (
            allTimeDealerData.map((item) => {
              const isExpanded = expandedDealerId === item.dealer.id;
              const isDue = item.balance > 0;
              return (
                <div
                  key={item.dealer.id}
                  className="bg-white rounded-3xl border-2 border-slate-200/90 p-4 shadow-xs space-y-2.5 transition"
                >
                  <div 
                    onClick={() => toggleExpand(item.dealer.id)}
                    className="flex items-start justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                          {item.dealer.name}
                        </h4>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex gap-1.5 text-xs font-mono mt-1">
                        <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-lg">
                          No: {item.dealer.dealer_number}
                        </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                          Wlt: {item.dealer.wallet_number}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-xl">
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-sans block font-semibold">Total Tx</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(item.totalTx)}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl text-right">
                      <span className="text-[10px] text-slate-500 font-sans block font-semibold">Total Paid</span>
                      <span className="font-extrabold text-emerald-700">{formatCurrency(item.totalPay)}</span>
                    </div>
                  </div>

                  {/* Expandable itemized entries for this dealer */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Transactions for {item.dealer.name} ({item.transactions.length})
                      </p>
                      {item.transactions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No transactions recorded.</p>
                      ) : (
                        item.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-slate-600 font-sans block">
                                {formatDate(tx.date)} {tx.reference_no && `[${tx.reference_no}]`}
                              </span>
                              {(tx.notes || tx.description) && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {tx.notes || tx.description}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                          </div>
                        ))
                      )}

                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider pt-1.5">
                        Payments for {item.dealer.name} ({item.payments.length})
                      </p>
                      {item.payments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No payments recorded.</p>
                      ) : (
                        item.payments.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-emerald-800 font-sans block">
                                {formatDate(p.date)} ({p.payment_method || 'Wallet'})
                              </span>
                              {p.notes && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {p.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* IN BOTTOM WE SEE TOTAL */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-2 mt-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
              TOTAL FOR ALL DEALERS
            </span>
            <div className="grid grid-cols-2 gap-4 font-mono text-center pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Tx</span>
                <span className="font-extrabold text-sky-400 text-sm sm:text-base">
                  {formatCurrency(allTimeTotals.totalTx)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Paid</span>
                <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                  {formatCurrency(allTimeTotals.totalPay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. DAILY DEALER-WISE REPORT ==================== */}
      {activeTab === 'daily' && (
        <div className="space-y-2.5">
          {/* Quick Date Selector Bar */}
          <div className="bg-white p-3 rounded-3xl border-2 border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Select Date
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDailyDate(getTodayStr())}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                    dailyDate === getTodayStr()
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDailyDate(getYesterdayStr())}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                    dailyDate === getYesterdayStr()
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="w-full text-sm font-bold text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {dailyDealerData.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
                No dealer transactions on {formatDate(dailyDate)}.
              </div>
            ) : (
              dailyDealerData.map((item) => {
                const isExpanded = expandedDealerId === item.dealer.id;
                return (
                  <div
                    key={item.dealer.id}
                    className="bg-white rounded-3xl border-2 border-slate-200/90 p-4 shadow-xs space-y-2.5"
                  >
                    <div 
                      onClick={() => toggleExpand(item.dealer.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                            {item.dealer.name}
                          </h4>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          No: {item.dealer.dealer_number} • Wlt: {item.dealer.wallet_number}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-xl">
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-sans block font-semibold">Today Tx</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(item.totalTx)}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-right">
                        <span className="text-[10px] text-slate-500 font-sans block font-semibold">Today Paid</span>
                        <span className="font-extrabold text-emerald-700">{formatCurrency(item.totalPay)}</span>
                      </div>
                    </div>

                    {/* Breakdown list for this dealer today */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {item.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-slate-600 font-sans block">
                                Transaction {tx.reference_no && `[${tx.reference_no}]`}
                              </span>
                              {(tx.notes || tx.description) && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {tx.notes || tx.description}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                        {item.payments.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-emerald-800 font-sans block">
                                Payment ({p.payment_method || 'Wallet'}) {p.reference_no && `[${p.reference_no}]`}
                              </span>
                              {p.notes && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {p.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* IN BOTTOM WE SEE TOTAL */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-2 mt-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
              DAILY GRAND TOTAL ({formatDate(dailyDate)})
            </span>
            <div className="grid grid-cols-2 gap-4 font-mono text-center pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Tx</span>
                <span className="font-extrabold text-sky-400 text-sm sm:text-base">
                  {formatCurrency(dailyTotals.totalTx)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Paid</span>
                <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                  {formatCurrency(dailyTotals.totalPay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. MONTHLY DEALER-WISE REPORT ==================== */}
      {activeTab === 'monthly' && (
        <div className="space-y-2.5">
          {/* Quick Month Selector Bar */}
          <div className="bg-white p-3 rounded-3xl border-2 border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Select Month
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonth(getCurrentMonthStr())}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                    selectedMonth === getCurrentMonthStr()
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(getLastMonthStr())}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                    selectedMonth === getLastMonthStr()
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Last Month
                </button>
              </div>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-sm font-bold text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            {monthlyDealerData.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
                No dealer transactions in {selectedMonth}.
              </div>
            ) : (
              monthlyDealerData.map((item) => {
                const isExpanded = expandedDealerId === item.dealer.id;
                return (
                  <div
                    key={item.dealer.id}
                    className="bg-white rounded-3xl border-2 border-slate-200/90 p-4 shadow-xs space-y-2.5"
                  >
                    <div 
                      onClick={() => toggleExpand(item.dealer.id)}
                      className="flex items-start justify-between gap-2 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                            {item.dealer.name}
                          </h4>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          No: {item.dealer.dealer_number} • Wlt: {item.dealer.wallet_number}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-xl">
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-sans block font-semibold">Month Tx</span>
                        <span className="font-extrabold text-slate-900">{formatCurrency(item.totalTx)}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl text-right">
                        <span className="text-[10px] text-slate-500 font-sans block font-semibold">Month Paid</span>
                        <span className="font-extrabold text-emerald-700">{formatCurrency(item.totalPay)}</span>
                      </div>
                    </div>

                    {/* Breakdown list for this dealer this month */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Transactions ({item.transactions.length})
                        </p>
                        {item.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-slate-600 font-sans block">
                                {formatDate(tx.date)} {tx.reference_no && `[${tx.reference_no}]`}
                              </span>
                              {(tx.notes || tx.description) && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {tx.notes || tx.description}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}

                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider pt-1">
                          Payments ({item.payments.length})
                        </p>
                        {item.payments.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-emerald-800 font-sans block">
                                {formatDate(p.date)} ({p.payment_method || 'Wallet'}) {p.reference_no && `[${p.reference_no}]`}
                              </span>
                              {p.notes && (
                                <span className="text-[11px] text-slate-500 italic block">
                                  Note: {p.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* IN BOTTOM WE SEE TOTAL */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-2 mt-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
              MONTHLY GRAND TOTAL ({selectedMonth})
            </span>
            <div className="grid grid-cols-2 gap-4 font-mono text-center pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Tx</span>
                <span className="font-extrabold text-sky-400 text-sm sm:text-base">
                  {formatCurrency(monthlyTotals.totalTx)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-400 block font-bold">Total Paid</span>
                <span className="font-extrabold text-emerald-400 text-sm sm:text-base">
                  {formatCurrency(monthlyTotals.totalPay)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
