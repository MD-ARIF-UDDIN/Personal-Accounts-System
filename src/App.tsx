import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DealerModal } from './components/DealerModal';
import { TransactionModal } from './components/TransactionModal';
import { PaymentModal } from './components/PaymentModal';
import { api } from './services/api';
import { Dealer, Transaction, Payment, AppUser } from './types';
import { RefreshCw, CheckCircle, AlertCircle, Database } from 'lucide-react';

// Lazy-loaded code-split pages for blazing fast load
const DashboardOverview = lazy(() => import('./pages/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const DealersPage = lazy(() => import('./pages/DealersPage').then(m => ({ default: m.DealersPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));

const CACHE_DEALERS = 'pas_cache_dealers';
const CACHE_TX = 'pas_cache_tx';
const CACHE_PAY = 'pas_cache_pay';

const getInitialCache = <T,>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const PageSkeleton = () => (
  <div className="space-y-3 animate-pulse pt-2">
    <div className="h-20 bg-slate-200/80 rounded-3xl" />
    <div className="grid grid-cols-3 gap-2">
      <div className="h-16 bg-slate-200/70 rounded-2xl" />
      <div className="h-16 bg-slate-200/70 rounded-2xl" />
      <div className="h-16 bg-slate-200/70 rounded-2xl" />
    </div>
    <div className="space-y-2 pt-1">
      <div className="h-14 bg-slate-200/60 rounded-2xl" />
      <div className="h-14 bg-slate-200/60 rounded-2xl" />
      <div className="h-14 bg-slate-200/60 rounded-2xl" />
    </div>
  </div>
);

export function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Core Data (Initialized from local cache for 0ms instant display)
  const [dealers, setDealers] = useState<Dealer[]>(() => getInitialCache(CACHE_DEALERS, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialCache(CACHE_TX, []));
  const [payments, setPayments] = useState<Payment[]>(() => getInitialCache(CACHE_PAY, []));
  const [dataLoading, setDataLoading] = useState(false);
  const [tableMissingError, setTableMissingError] = useState(false);

  // Sync state to local cache for instant return visits
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_DEALERS, JSON.stringify(dealers));
    } catch {}
  }, [dealers]);

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_TX, JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_PAY, JSON.stringify(payments));
    } catch {}
  }, [payments]);

  // Modals
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [dealerToEdit, setDealerToEdit] = useState<Dealer | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [defaultTxDealerId, setDefaultTxDealerId] = useState<string | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [defaultPaymentDealerId, setDefaultPaymentDealerId] = useState<string | undefined>(undefined);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Check Phone+Password Session
  useEffect(() => {
    const checkUser = async () => {
      try {
        const u = await api.getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkUser();
  }, []);

  // Fetch all live Supabase data
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setTableMissingError(false);
    try {
      const [d, t, p] = await Promise.all([
        api.getDealers(),
        api.getTransactions(),
        api.getPayments(),
      ]);
      setDealers(d);
      setTransactions(t);
      setPayments(p);
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      if (err.message?.includes('TABLE_NOT_FOUND')) {
        setTableMissingError(true);
      } else {
        showToast(err.message || 'Error connecting to database.', 'error');
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle Login & Logout
  const handleLoginSuccess = (authenticatedUser: AppUser) => {
    setUser(authenticatedUser);
    showToast(`Welcome, ${authenticatedUser.name || authenticatedUser.phone}!`);
  };

  const handleSignOut = async () => {
    await api.signOut();
    setUser(null);
    setDealers([]);
    setTransactions([]);
    setPayments([]);
    showToast('Signed out.');
  };

  // WALLET ACTIONS (Instant Optimistic UI)
  const handleSaveDealer = async (dealerData: Omit<Dealer, 'id' | 'created_at'>) => {
    try {
      if (dealerToEdit) {
        setDealers((prev) =>
          prev.map((d) => (d.id === dealerToEdit.id ? { ...d, ...dealerData } : d))
        );
        showToast('Wallet updated.');
        const updated = await api.updateDealer(dealerToEdit.id, dealerData);
        setDealers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await api.createDealer(dealerData);
        setDealers((prev) => [created, ...prev]);
        showToast('New wallet added.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save wallet.', 'error');
      fetchData();
    }
  };

  const handleDeleteDealer = async (id: string) => {
    const backup = [...dealers];
    setDealers((prev) => prev.filter((d) => d.id !== id));
    showToast('Wallet deleted.');
    try {
      await api.deleteDealer(id);
    } catch (err: any) {
      setDealers(backup);
      showToast(err.message || 'Failed to delete wallet.', 'error');
    }
  };

  // TRANSACTION ACTIONS (Instant Optimistic UI)
  const handleSaveTransaction = async (txData: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      const targetDealer = dealers.find((d) => d.id === txData.dealer_id);
      if (txToEdit) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === txToEdit.id ? { ...t, ...txData, dealer: targetDealer || t.dealer } : t
          )
        );
        showToast('Transaction updated.');
        const updated = await api.updateTransaction(txToEdit.id, txData);
        setTransactions((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...updated, dealer: targetDealer || updated.dealer } : t))
        );
      } else {
        const created = await api.createTransaction(txData);
        setTransactions((prev) => [{ ...created, dealer: targetDealer || created.dealer }, ...prev]);
        showToast('Transaction recorded.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save transaction.', 'error');
      fetchData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const backup = [...transactions];
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaction deleted.');
    try {
      await api.deleteTransaction(id);
    } catch (err: any) {
      setTransactions(backup);
      showToast(err.message || 'Failed to delete transaction.', 'error');
    }
  };

  // PAYMENT ACTIONS (Instant Optimistic UI)
  const handleSavePayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
    try {
      const targetDealer = dealers.find((d) => d.id === paymentData.dealer_id);
      if (paymentToEdit) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentToEdit.id ? { ...p, ...paymentData, dealer: targetDealer || p.dealer } : p
          )
        );
        showToast('Payment updated.');
        const updated = await api.updatePayment(paymentToEdit.id, paymentData);
        setPayments((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...updated, dealer: targetDealer || updated.dealer } : p))
        );
      } else {
        const created = await api.createPayment(paymentData);
        setPayments((prev) => [{ ...created, dealer: targetDealer || created.dealer }, ...prev]);
        showToast('Payment recorded.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save payment.', 'error');
      fetchData();
    }
  };

  const handleDeletePayment = async (id: string) => {
    const backup = [...payments];
    setPayments((prev) => prev.filter((p) => p.id !== id));
    showToast('Payment deleted.');
    try {
      await api.deletePayment(id);
    } catch (err: any) {
      setPayments(backup);
      showToast(err.message || 'Failed to delete payment.', 'error');
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-white">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Personal Accounting System
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Phone + Password Login Page
  if (!user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  // Logged In -> Render Main App Dashboard
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto z-50">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onOpenUsers={() => setCurrentTab('users')}
      />

      <div className="flex-1 flex">
        {/* Desktop Left Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab)} />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 pt-3 pb-24 lg:pb-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Missing Table Notice */}
          {tableMissingError && (
            <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 text-amber-900 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-sm">
                <Database className="w-5 h-5 text-amber-700" />
                <span>Supabase Tables Setup Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                The database tables (<code className="font-mono bg-amber-100 px-1 rounded">app_users</code>, <code className="font-mono bg-amber-100 px-1 rounded">dealers</code>, <code className="font-mono bg-amber-100 px-1 rounded">transactions</code>, <code className="font-mono bg-amber-100 px-1 rounded">payments</code>) do not exist yet in your Supabase project.
              </p>
              <div className="text-xs text-amber-900 pt-1 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <span>Open your Supabase SQL Editor, paste the contents of <strong>supabase_schema.sql</strong> and click <strong>Run</strong>.</span>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {dataLoading && (
            <div className="mb-3 flex items-center justify-center py-2 bg-sky-50 text-sky-700 text-xs rounded-2xl border border-sky-100 gap-2 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing with Supabase...</span>
            </div>
          )}

          <Suspense fallback={<PageSkeleton />}>
            {currentTab === 'dashboard' && (
              <DashboardOverview
                dealers={dealers}
                transactions={transactions}
                payments={payments}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenNewTransaction={() => {
                  setTxToEdit(null);
                  setDefaultTxDealerId(undefined);
                  setIsTxModalOpen(true);
                }}
                onOpenNewPayment={() => {
                  setPaymentToEdit(null);
                  setDefaultPaymentDealerId(undefined);
                  setIsPaymentModalOpen(true);
                }}
                onOpenNewDealer={() => {
                  setDealerToEdit(null);
                  setIsDealerModalOpen(true);
                }}
              />
            )}

            {currentTab === 'dealers' && (
              <DealersPage
                dealers={dealers}
                transactions={transactions}
                payments={payments}
                onAddDealer={() => {
                  setDealerToEdit(null);
                  setIsDealerModalOpen(true);
                }}
                onEditDealer={(dealer) => {
                  setDealerToEdit(dealer);
                  setIsDealerModalOpen(true);
                }}
                onDeleteDealer={handleDeleteDealer}
                onNewTransactionForDealer={(dealerId) => {
                  setTxToEdit(null);
                  setDefaultTxDealerId(dealerId);
                  setIsTxModalOpen(true);
                }}
                onNewPaymentForDealer={(dealerId) => {
                  setPaymentToEdit(null);
                  setDefaultPaymentDealerId(dealerId);
                  setIsPaymentModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onEditPayment={(p) => {
                  setPaymentToEdit(p);
                  setIsPaymentModalOpen(true);
                }}
                onDeletePayment={handleDeletePayment}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                dealers={dealers}
                onAddTransaction={() => {
                  setTxToEdit(null);
                  setDefaultTxDealerId(undefined);
                  setIsTxModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentsPage
                payments={payments}
                dealers={dealers}
                onAddPayment={() => {
                  setPaymentToEdit(null);
                  setDefaultPaymentDealerId(undefined);
                  setIsPaymentModalOpen(true);
                }}
                onEditPayment={(p) => {
                  setPaymentToEdit(p);
                  setIsPaymentModalOpen(true);
                }}
                onDeletePayment={handleDeletePayment}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsPage
                dealers={dealers}
                transactions={transactions}
                payments={payments}
                onEditTransaction={(tx) => {
                  setTxToEdit(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onEditPayment={(p) => {
                  setPaymentToEdit(p);
                  setIsPaymentModalOpen(true);
                }}
                onDeletePayment={handleDeletePayment}
              />
            )}

            {currentTab === 'users' && (
              <UsersPage
                currentUser={user}
                onUserUpdated={fetchData}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />

      {/* MODALS */}
      <DealerModal
        isOpen={isDealerModalOpen}
        onClose={() => setIsDealerModalOpen(false)}
        onSave={handleSaveDealer}
        dealerToEdit={dealerToEdit}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        dealers={dealers}
        txToEdit={txToEdit}
        defaultDealerId={defaultTxDealerId}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        dealers={dealers}
        paymentToEdit={paymentToEdit}
        defaultDealerId={defaultPaymentDealerId}
      />
    </div>
  );
}

export default App;
