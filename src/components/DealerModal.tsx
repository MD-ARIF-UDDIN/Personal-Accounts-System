import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { Dealer } from '../types';

interface DealerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dealerData: Omit<Dealer, 'id' | 'created_at'>) => Promise<void>;
  dealerToEdit?: Dealer | null;
}

export const DealerModal: React.FC<DealerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dealerToEdit,
}) => {
  const [walletNumber, setWalletNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dealerToEdit) {
      setWalletNumber(dealerToEdit.wallet_number || '');
      setNotes(dealerToEdit.notes || '');
    } else {
      setWalletNumber('');
      setNotes('');
    }
    setError(null);
  }, [dealerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletNumber.trim()) {
      setError('Please enter wallet number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        wallet_number: walletNumber.trim(),
        name: walletNumber.trim(),
        dealer_number: walletNumber.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl safe-bottom max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-2 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {dealerToEdit ? 'Edit Wallet' : 'Add Wallet'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - 2 Fields Only */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl font-semibold">
              {error}
            </div>
          )}

          {/* 1. Wallet Number */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Wallet Number *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. WLT-8849 or 01711223344"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              className="w-full px-4 py-3 text-lg font-mono font-bold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900 shadow-2xs"
            />
          </div>

          {/* 2. Note / Remarks */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Personal bKash, Nagad agent, Branch wallet"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 text-slate-900 font-medium"
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
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
