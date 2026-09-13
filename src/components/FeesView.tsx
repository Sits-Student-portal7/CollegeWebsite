import React from 'react';
import { StudentProfile, FeeItem, PaymentReceipt } from '../types';

interface FeesViewProps {
  student: StudentProfile;
  fees: FeeItem[];
  history: PaymentReceipt[];
  onOpenPaymentModal: (fee?: FeeItem) => void;
  onDownloadReceipt: (receiptNo: string) => void;
  searchQuery: string;
  onSemesterChange?: (semester: number) => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  student,
  fees,
  history,
  onOpenPaymentModal,
  onDownloadReceipt,
  searchQuery,
  onSemesterChange,
}) => {
  const filteredHistory = history.filter(
    (item) =>
      item.feeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Student Info Chips */}
      <div className="flex flex-wrap gap-2.5">
        <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#1E40AF]">laptop_mac</span>
          <span className="text-xs text-[#1E40AF] font-bold">{student.department}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#1E40AF]">calendar_today</span>
          <select
            className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-xs text-[#1E40AF] font-bold"
            value={student.semester}
            onChange={(e) => onSemesterChange?.(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#1E40AF]">badge</span>
          <span className="text-xs text-[#1E40AF] font-bold">Roll No: {student.rollNo}</span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Dues Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#1E40AF] opacity-70 uppercase tracking-wider">
              TOTAL DUES REMAINING
            </span>
            <span className="material-symbols-outlined text-rose-500">warning</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl text-[#1E40AF] font-black">
              ₹{student.pendingDues.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-between mt-auto pt-2">
            <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Due in 12 Days
            </div>
            {student.pendingDues > 0 && (
              <button
                onClick={() => onOpenPaymentModal()}
                className="bg-[#1E40AF] hover:bg-blue-800 text-white transition-colors text-xs font-bold px-4 py-2 rounded-lg shadow-sm active:scale-95"
              >
                Pay All Now
              </button>
            )}
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#1E40AF] opacity-70 uppercase tracking-wider">
              PAID THIS ACADEMIC YEAR
            </span>
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl text-[#1E40AF] font-black">
              ₹{student.paidAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-auto pt-2">
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1 w-max">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Cleared Sem 1-3
            </div>
          </div>
        </div>

        {/* Scholarship Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#1E40AF] opacity-70 uppercase tracking-wider">
              SCHOLARSHIP / WAIVER
            </span>
            <span className="material-symbols-outlined text-[#1E40AF]">workspace_premium</span>
          </div>
          <div>
            <span className="text-3xl md:text-4xl text-[#1E40AF] font-black">
              ₹{student.scholarshipAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-auto pt-2">
            <span className="text-xs font-semibold text-[#1E40AF] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Merit-based Waiver Applied
            </span>
          </div>
        </div>
      </div>

      {/* Semester 4 Fee Breakdown */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xl font-bold text-[#1E40AF] flex items-center gap-2">
          <span className="material-symbols-outlined">account_tree</span>
          Semester 4 Fee Breakdown
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 shadow-sm transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-base text-[#1E40AF] font-bold flex-1">{fee.title}</h4>
                <div
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ml-2 ${
                    fee.status === 'FULLY PAID'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {fee.status}
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-[#1E40AF] opacity-70">Amount</span>
                  <span className="text-[#1E40AF] font-bold">₹{fee.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-[#1E40AF] opacity-70">Paid</span>
                  <span className="text-emerald-600 font-bold">₹{fee.paid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#1E40AF] font-medium">Balance</span>
                  <span className="text-[#1E40AF] font-black">
                    ₹{fee.balance.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fee.balance === 0 ? 'bg-emerald-500' : 'bg-[#1E40AF]'
                    }`}
                    style={{ width: `${Math.min(100, (fee.paid / fee.amount) * 100)}%` }}
                  />
                </div>
              </div>

              {fee.balance > 0 ? (
                <button
                  onClick={() => onOpenPaymentModal(fee)}
                  className="w-full bg-transparent border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 transition-colors text-sm py-2 px-4 rounded-lg font-bold active:scale-95"
                >
                  Pay Balance (₹{fee.balance.toLocaleString('en-IN')})
                </button>
              ) : (
                <button
                  onClick={() => onDownloadReceipt(`REC-${fee.id}`)}
                  className="w-full bg-gray-50 border border-gray-200 text-[#1E40AF] hover:bg-gray-100 transition-colors text-sm py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Receipt
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-[#1E40AF] flex items-center gap-2">
            <span className="material-symbols-outlined">history</span>
            Recent Payment History
          </h3>
          <button
            onClick={() => onDownloadReceipt('FULL-STATEMENT')}
            className="bg-gray-50 border border-gray-200 text-[#1E40AF] hover:bg-gray-100 transition-colors text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Statement PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-[#1E40AF] font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Receipt No</th>
                <th className="p-4">Fee Type</th>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredHistory.map((item) => (
                <tr key={item.receiptNo} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 pl-6 font-bold text-[#1E40AF]">{item.receiptNo}</td>
                  <td className="p-4 text-[#1E40AF] font-semibold">{item.feeType}</td>
                  <td className="p-4 text-[#1E40AF] opacity-75">{item.date}</td>
                  <td className="p-4 text-[#1E40AF] opacity-75 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    {item.method}
                  </td>
                  <td className="p-4 text-[#1E40AF] text-right font-bold">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => onDownloadReceipt(item.receiptNo)}
                      aria-label="Download Receipt PDF"
                      className="text-[#1E40AF] p-1.5 rounded hover:bg-blue-50 transition-colors"
                      title="Download PDF Receipt"
                    >
                      <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
