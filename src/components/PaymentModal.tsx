import React, { useState } from 'react';
import { FeeItem } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  feeItem?: FeeItem;
  totalPending: number;
  onClose: () => void;
  onSuccess: (amountPaid: number, feeTitle: string, method: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  feeItem,
  totalPending,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [upiId, setUpiId] = useState('arjun@upi');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const payAmount = feeItem ? feeItem.balance : totalPending;
  const payTitle = feeItem ? feeItem.title : 'All Outstanding Semester Dues';

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      onSuccess(payAmount, payTitle, method === 'UPI' ? 'UPI / PhonePe' : method === 'Card' ? 'Credit Card' : 'Net Banking');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 bg-[#171f33] text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">ScholarCore Payment Gateway</h3>
            <p className="text-xs text-indigo-300">Secure 256-Bit Encrypted Portal</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-5 text-sm">
          {/* Summary Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-indigo-700 font-bold uppercase">{payTitle}</p>
              <p className="text-xs text-slate-600 font-mono mt-0.5">Student ID: 22CS045</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#1E40AF]">
                ₹{payAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  method === 'UPI'
                    ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                    : 'border-slate-200 text-slate-700 bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">qr_code_2</span>
                UPI / PhonePe
              </button>

              <button
                type="button"
                onClick={() => setMethod('Card')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  method === 'Card'
                    ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                    : 'border-slate-200 text-slate-700 bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">credit_card</span>
                Debit/Credit Card
              </button>

              <button
                type="button"
                onClick={() => setMethod('NetBanking')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  method === 'NetBanking'
                    ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                    : 'border-slate-200 text-slate-700 bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">account_balance</span>
                Net Banking
              </button>
            </div>
          </div>

          {/* Method Input Details */}
          {method === 'UPI' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Enter VPA / UPI ID</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@upi or mobile@paytm"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#1E40AF]"
              />
            </div>
          )}

          {method === 'Card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4532 •••• •••• 8821"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900"
                />
              </div>
            </div>
          )}

          {method === 'NetBanking' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Select Bank</label>
              <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900">
                <option>State Bank of India (SBI)</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
              </select>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={processing}
            className="w-full bg-[#1E40AF] hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Processing Payment...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">lock</span>
                Authorize Payment of ₹{payAmount.toLocaleString('en-IN')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
