import React, { useState } from 'react';
import { UserProfile, TabType } from '../types';

interface AdminViewProps {
  currentUser: UserProfile;
  activeTab: TabType;
  searchQuery: string;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: TabType) => void;
}

interface StudentAdminRecord {
  rollNo: string;
  name: string;
  branch: string;
  semester: number;
  cgpa: number;
  attendancePct: number;
  pendingFee: number;
  status: 'Active' | 'On Leave' | 'Graduated';
}

const INITIAL_ALL_STUDENTS: StudentAdminRecord[] = [
  { rollNo: '22CS001', name: 'Aakash Verma', branch: 'Computer Science', semester: 4, cgpa: 8.8, attendancePct: 88, pendingFee: 0, status: 'Active' },
  { rollNo: '22CS012', name: 'Ananya Reddy', branch: 'Computer Science', semester: 4, cgpa: 9.2, attendancePct: 94, pendingFee: 0, status: 'Active' },
  { rollNo: '22CS025', name: 'Bhavya Sri', branch: 'Computer Science', semester: 4, cgpa: 7.4, attendancePct: 76, pendingFee: 15000, status: 'Active' },
  { rollNo: '22CS045', name: 'Arjun Kumar', branch: 'Computer Science', semester: 4, cgpa: 8.4, attendancePct: 85, pendingFee: 25000, status: 'Active' },
  { rollNo: '22EC014', name: 'Deepak Mohan', branch: 'Electronics & Comm', semester: 6, cgpa: 8.1, attendancePct: 82, pendingFee: 10000, status: 'Active' },
  { rollNo: '22ME009', name: 'Eswar Prasad', branch: 'Mechanical Engg', semester: 2, cgpa: 7.9, attendancePct: 89, pendingFee: 0, status: 'Active' },
  { rollNo: '22CE033', name: 'Gautam Sharma', branch: 'Civil Engineering', semester: 8, cgpa: 8.6, attendancePct: 91, pendingFee: 0, status: 'Active' },
];

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  activeTab,
  searchQuery,
  onShowToast,
  onNavigateTab,
}) => {
  const [studentsList, setStudentsList] = useState<StudentAdminRecord[]>(INITIAL_ALL_STUDENTS);
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  
  // Notice broadcast form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Academic');
  const [noticeTarget, setNoticeTarget] = useState('All');

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const handlePromoteAllSemesters = () => {
    setStudentsList((prev) =>
      prev.map((s) => ({
        ...s,
        semester: Math.min(8, s.semester + 1),
      }))
    );
    onShowToast('Batch promotion applied: All active students promoted to next academic semester.');
  };

  const handleSendFeeReminder = (rollNo: string, name: string) => {
    onShowToast(`Fee collection reminder SMS & Email sent to ${name} (${rollNo}).`);
  };

  const handlePublishOfficialNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;
    onShowToast(`Institutional Circular "${noticeTitle}" published to ${noticeTarget}.`);
    setNoticeTitle('');
  };

  if (activeTab === 'student-mgmt') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-purple-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-sm">badge</span>
              ERP Administrative Directory
            </div>
            <h2 className="text-2xl font-bold text-white">Student Information System (SIS)</h2>
            <p className="text-purple-100/80 text-sm mt-0.5">
              Manage student enrollment records, academic standings, and semester progressions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-purple-950/80 text-white border border-purple-600 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-sm"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics & Comm">Electronics &amp; Comm</option>
              <option value="Mechanical Engg">Mechanical Engg</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>

            <button
              onClick={handlePromoteAllSemesters}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">publish</span>
              Batch Semester Roll-over
            </button>
          </div>
        </div>

        {/* Students Master Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department &amp; Branch</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Fee Dues</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.rollNo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{s.rollNo}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{s.branch}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700">Sem {s.semester}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">{s.cgpa}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">{s.attendancePct}%</td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {s.pendingFee > 0 ? (
                        <span className="text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-xs">
                          ₹{s.pendingFee.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {s.pendingFee > 0 && (
                        <button
                          onClick={() => handleSendFeeReminder(s.rollNo, s.name)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Send Fee Notice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'fee-audit') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">account_balance</span>
            Financial Compliance &amp; Revenue Audit
          </div>
          <h2 className="text-2xl font-bold text-white">Institutional Fee Accounting Portal</h2>
          <p className="text-indigo-100/80 text-sm mt-0.5">
            Monitor real-time fee collection stats, approve scholarship waivers, and generate financial reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Expected Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹2,80,00,000</h3>
            <p className="text-xs text-slate-500 mt-2">Academic Year 2025-2026</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Collected</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹2,45,80,000</h3>
            <p className="text-xs text-emerald-700 font-semibold mt-2">87.7% Realization Rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Outstanding Dues</p>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">₹34,20,000</h3>
            <button
              onClick={() => onShowToast('Bulk fee payment reminder emails dispatched to 84 students with pending dues.')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">mail</span> Send Bulk Reminder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: Admin Dashboard Control Center
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-md border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full border-2 border-purple-400 object-cover shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Admin Control Center
                </span>
                <span className="text-slate-300 text-xs font-mono">{currentUser.idNumber}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{currentUser.name}</h1>
              <p className="text-slate-300 text-sm">{currentUser.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('student-mgmt')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              Manage Student Directory
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Enrolled</p>
            <h3 className="text-xl font-bold text-slate-900">1,420 Students</h3>
            <p className="text-[11px] text-purple-600 font-medium">4 Engineering Branches</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">badge</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Faculty &amp; Staff</p>
            <h3 className="text-xl font-bold text-slate-900">85 Members</h3>
            <p className="text-[11px] text-indigo-600 font-medium">Full-time Faculty</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Fee Collection</p>
            <h3 className="text-xl font-bold text-slate-900">₹2.45 Cr</h3>
            <p className="text-[11px] text-emerald-600 font-medium">87.7% Realized</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">support_agent</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Open Tickets</p>
            <h3 className="text-xl font-bold text-slate-900">12 Support Cases</h3>
            <p className="text-[11px] text-amber-600 font-medium">Avg Resolution 24h</p>
          </div>
        </div>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">history</span>
              <h3 className="font-bold text-slate-900 text-lg">System Audit &amp; Event Log</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Payment Verified: Fee Receipt #RCP-8841</p>
                  <p className="text-[11px] text-slate-500">Arjun Kumar (22CS045) paid ₹45,000 via UPI</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">10m ago</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-600">grade</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Gradebook Updated: CS401 Data Structures</p>
                  <p className="text-[11px] text-slate-500">Mid-Sem 2 marks published by Dr. Rajesh Sharma</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">1h ago</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-indigo-600">campaign</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Official Notice Published</p>
                  <p className="text-[11px] text-slate-500">Mid-Semester Examination Schedule for Semester 4</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">3h ago</span>
            </div>
          </div>
        </div>

        {/* Official Circular Broadcaster */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="material-symbols-outlined text-purple-600">campaign</span>
            <h3 className="font-bold text-slate-900 text-lg">Institutional Circular</h3>
          </div>

          <form onSubmit={handlePublishOfficialNotice} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audience Group</label>
              <select
                value={noticeTarget}
                onChange={(e) => setNoticeTarget(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="All">All Campus (Students, Faculty &amp; Staff)</option>
                <option value="Students Only">Students Only</option>
                <option value="Faculty Only">Faculty Members Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Headline</label>
              <input
                type="text"
                placeholder="e.g. End Semester Final Exam Timetable"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              Broadcast Institutional Notice
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
