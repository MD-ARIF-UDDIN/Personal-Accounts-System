import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
  const [name, setName] = useState('');
  const [dealerNumber, setDealerNumber] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dealerToEdit) {
      setName(dealerToEdit.name || '');
      setDealerNumber(dealerToEdit.dealer_number || '');
      setWalletNumber(dealerToEdit.wallet_number || '');
      setPhone(dealerToEdit.phone || '');
      setNotes(dealerToEdit.notes || '');
    } else {
      setName('');
      setDealerNumber('');
      setWalletNumber('');
      setPhone('');
      setNotes('');
    }
    setError(null);
  }, [dealerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter dealer name.');
      return;
    }
    if (!dealerNumber.trim()) {
      setError('Please enter dealer number.');
      return;
    }
    if (!walletNumber.trim()) {
      setError('Please enter wallet number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        dealer_number: dealerNumber.trim(),
        wallet_number: walletNumber.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base">
            {dealerToEdit ? 'Edit Dealer' : 'Add Dealer'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dealer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahim Enterprise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dealer Number *
              </label>
              <input
                type="text"
                required
                placeholder="DLR-001"
                value={dealerNumber}
                onChange={(e) => setDealerNumber(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Wallet Number *
              </label>
              <input
                type="text"
                required
                placeholder="WLT-8849"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="text"
              placeholder="+12345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Branch, area or terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition active:scale-95"
            >
              {loading ? 'Saving...' : 'Save Dealer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
