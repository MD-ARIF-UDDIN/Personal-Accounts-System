import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dealer, Payment } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
  dealers: Dealer[];
  paymentToEdit?: Payment | null;
  defaultDealerId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dealers,
  paymentToEdit,
  defaultDealerId,
}) => {
  const [dealerId, setDealerId] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Wallet');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (paymentToEdit) {
      setDealerId(paymentToEdit.dealer_id || '');
      setAmount(paymentToEdit.amount?.toString() || '');
      setDate(paymentToEdit.date || getTodayStr());
      setPaymentMethod(paymentToEdit.payment_method || 'Wallet');
      setNotes(paymentToEdit.notes || '');
    } else {
      setDealerId(defaultDealerId || (dealers.length > 0 ? dealers[0].id : ''));
      setAmount('');
      setDate(getTodayStr());
      setPaymentMethod('Wallet');
      setNotes('');
    }
    setError(null);
  }, [paymentToEdit, defaultDealerId, dealers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) {
      setError('Please select a wallet.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        dealer_id: dealerId,
        amount: numAmount,
        date: date || getTodayStr(),
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDealer = dealers.find((d) => d.id === dealerId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl safe-bottom max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base">
            {paymentToEdit ? 'Edit Payment' : 'Record Payment Received'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl font-semibold">
              {error}
            </div>
          )}

          {/* Amount with Numeric Keypad */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Payment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              inputMode="decimal"
              pattern="[0-9]*"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-extrabold font-mono border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-emerald-700 shadow-2xs"
            />
          </div>

          {/* Select Wallet */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Wallet *
            </label>
            <select
              required
              value={dealerId}
              onChange={(e) => setDealerId(e.target.value)}
              className="w-full px-3.5 py-3 text-sm font-semibold border-2 border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-emerald-500 text-slate-900"
            >
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.wallet_number} {d.notes ? `(${d.notes})` : ''}
                </option>
              ))}
            </select>
            {selectedDealer?.notes && (
              <p className="text-[11px] text-slate-500 italic mt-1 px-1">
                Note: {selectedDealer.notes}
              </p>
            )}
          </div>

          {/* Date Picker + Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Payment Date *
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDate(getTodayStr())}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition ${
                    date === getTodayStr()
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDate(getYesterdayStr())}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition ${
                    date === getYesterdayStr()
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold border-2 border-slate-200 rounded-2xl bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Wallet">Wallet</option>
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
              <option value="Mobile">Mobile</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Note / Remarks */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared via agent, advance payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || dealers.length === 0}
              className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
