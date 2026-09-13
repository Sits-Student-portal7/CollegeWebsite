import React, { useState } from 'react';
import { UserProfile, TabType } from '../types';

interface FacultyViewProps {
  currentUser: UserProfile;
  activeTab: TabType;
  searchQuery: string;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: TabType) => void;
}

interface StudentGradeRecord {
  rollNo: string;
  name: string;
  attendancePct: number;
  statusToday: 'present' | 'absent' | 'late';
  mid1Marks: number;
  mid2Marks: number;
  assignmentMarks: number;
}

const INITIAL_ROSTER: StudentGradeRecord[] = [
  { rollNo: '22CS001', name: 'Aakash Verma', attendancePct: 88, statusToday: 'present', mid1Marks: 26, mid2Marks: 28, assignmentMarks: 9 },
  { rollNo: '22CS012', name: 'Ananya Reddy', attendancePct: 94, statusToday: 'present', mid1Marks: 29, mid2Marks: 30, assignmentMarks: 10 },
  { rollNo: '22CS025', name: 'Bhavya Sri', attendancePct: 76, statusToday: 'absent', mid1Marks: 21, mid2Marks: 22, assignmentMarks: 7 },
  { rollNo: '22CS045', name: 'Arjun Kumar', attendancePct: 85, statusToday: 'present', mid1Marks: 25, mid2Marks: 27, assignmentMarks: 9 },
  { rollNo: '22CS052', name: 'Chaitanya Teja', attendancePct: 82, statusToday: 'present', mid1Marks: 23, mid2Marks: 24, assignmentMarks: 8 },
  { rollNo: '22CS061', name: 'Divya Sharma', attendancePct: 91, statusToday: 'present', mid1Marks: 28, mid2Marks: 29, assignmentMarks: 10 },
  { rollNo: '22CS078', name: 'Karthik Raju', attendancePct: 68, statusToday: 'absent', mid1Marks: 18, mid2Marks: 20, assignmentMarks: 6 },
  { rollNo: '22CS089', name: 'Meghana Rao', attendancePct: 89, statusToday: 'present', mid1Marks: 27, mid2Marks: 26, assignmentMarks: 9 },
];

export const FacultyView: React.FC<FacultyViewProps> = ({
  currentUser,
  activeTab,
  searchQuery,
  onShowToast,
  onNavigateTab,
}) => {
  const [selectedCourse, setSelectedCourse] = useState('CS401 Data Structures & Algorithms');
  const [roster, setRoster] = useState<StudentGradeRecord[]>(INITIAL_ROSTER);
  const [activeGradeTab, setActiveGradeTab] = useState<'attendance' | 'marks'>('attendance');
  
  // Notice form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const filteredRoster = roster.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAttendance = (rollNo: string, newStatus: 'present' | 'absent' | 'late') => {
    setRoster((prev) =>
      prev.map((s) => (s.rollNo === rollNo ? { ...s, statusToday: newStatus } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, statusToday: 'present' })));
    onShowToast('All students marked as Present for today\'s lecture.');
  };

  const handleSaveAttendance = () => {
    const presentCount = roster.filter((s) => s.statusToday === 'present').length;
    onShowToast(`Attendance saved for ${selectedCourse}: ${presentCount}/${roster.length} Present.`);
  };

  const handleMarksChange = (rollNo: string, field: 'mid1Marks' | 'mid2Marks' | 'assignmentMarks', val: number) => {
    setRoster((prev) =>
      prev.map((s) => (s.rollNo === rollNo ? { ...s, [field]: Math.max(0, Math.min(30, val)) } : s))
    );
  };

  const handleSaveMarks = () => {
    onShowToast(`Internal marks & assignments updated successfully for ${selectedCourse}.`);
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;
    onShowToast(`Class Circular "${noticeTitle}" published to ${selectedCourse} students.`);
    setNoticeTitle('');
    setNoticeBody('');
  };

  if (activeTab === 'grading') {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-sm">fact_check</span>
              Faculty Gradebook &amp; Attendance Register
            </div>
            <h2 className="text-2xl font-bold text-white">Student Evaluation Portal</h2>
            <p className="text-emerald-100/80 text-sm mt-0.5">
              Record daily attendance, upload mid-semester test marks, and track student performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-emerald-950/80 text-white border border-emerald-600 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm"
            >
              <option value="CS401 Data Structures & Algorithms">CS401 Data Structures (Sem 4 - CSE A)</option>
              <option value="CS402 Relational DBMS">CS402 Relational DBMS (Sem 4 - CSE B)</option>
              <option value="CS403 Design & Analysis of Algorithms">CS403 Algorithms Lab (Sem 4 - Lab 2)</option>
              <option value="CS404 Operating Systems">CS404 Operating Systems (Sem 4 - CSE C)</option>
            </select>
          </div>
        </div>

        {/* View Switcher: Attendance vs Marks */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveGradeTab('attendance')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeGradeTab === 'attendance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">event_available</span>
                Daily Attendance Register
              </button>
              <button
                onClick={() => setActiveGradeTab('marks')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  activeGradeTab === 'marks'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                Internal Marks Entry
              </button>
            </div>

            {activeGradeTab === 'attendance' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">select_all</span>
                  Mark All Present
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save Attendance
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveMarks}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">publish</span>
                Publish Internal Marks
              </button>
            )}
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Total Attendance</th>
                  {activeGradeTab === 'attendance' ? (
                    <th className="py-3 px-4 text-center">Today's Status</th>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-center">Mid-1 (Max 30)</th>
                      <th className="py-3 px-4 text-center">Mid-2 (Max 30)</th>
                      <th className="py-3 px-4 text-center">Assignment (Max 10)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((student) => (
                  <tr key={student.rollNo} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{student.rollNo}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{student.name}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              student.attendancePct >= 85
                                ? 'bg-emerald-500'
                                : student.attendancePct >= 75
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${student.attendancePct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{student.attendancePct}%</span>
                      </div>
                    </td>

                    {activeGradeTab === 'attendance' ? (
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.rollNo, 'present')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              student.statusToday === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.rollNo, 'absent')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              student.statusToday === 'absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAttendance(student.rollNo, 'late')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              student.statusToday === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={student.mid1Marks}
                            onChange={(e) => handleMarksChange(student.rollNo, 'mid1Marks', Number(e.target.value))}
                            className="w-16 text-center font-semibold text-slate-900 border border-slate-300 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={student.mid2Marks}
                            onChange={(e) => handleMarksChange(student.rollNo, 'mid2Marks', Number(e.target.value))}
                            className="w-16 text-center font-semibold text-slate-900 border border-slate-300 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={student.assignmentMarks}
                            onChange={(e) => handleMarksChange(student.rollNo, 'assignmentMarks', Number(e.target.value))}
                            className="w-16 text-center font-semibold text-slate-900 border border-slate-300 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Default: Faculty Dashboard ('faculty-dashboard' or main overview)
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full border-2 border-emerald-400 object-cover shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Faculty Portal
                </span>
                <span className="text-slate-300 text-xs font-mono">{currentUser.idNumber}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{currentUser.name}</h1>
              <p className="text-slate-300 text-sm">{currentUser.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('grading')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              Mark Attendance &amp; Grades
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">menu_book</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Courses</p>
            <h3 className="text-xl font-bold text-slate-900">4 Subjects</h3>
            <p className="text-[11px] text-emerald-600 font-medium">18 Teaching Hours/wk</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Enrolled</p>
            <h3 className="text-xl font-bold text-slate-900">180 Students</h3>
            <p className="text-[11px] text-indigo-600 font-medium">B.Tech CSE Sem 4</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">fact_check</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg. Class Attendance</p>
            <h3 className="text-xl font-bold text-slate-900">88.4%</h3>
            <p className="text-[11px] text-emerald-600 font-medium">+2.1% this week</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Evaluation</p>
            <h3 className="text-xl font-bold text-slate-900">24 Papers</h3>
            <p className="text-[11px] text-amber-600 font-medium">Mid-Sem 2 Data Struct.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Schedule + Announcement Broadcaster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Class Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">calendar_month</span>
              <h3 className="font-bold text-slate-900 text-lg">Today's Teaching Schedule</h3>
            </div>
            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              4 Lectures Today
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  09:30
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">CS401 - Data Structures &amp; Algorithms</h4>
                  <p className="text-xs text-slate-600">B.Tech CSE • Semester 4 (Sec A) • Room 302</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('grading')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Mark Attendance
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  11:00
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">CS402 - Relational Database Systems</h4>
                  <p className="text-xs text-slate-600">B.Tech CSE • Semester 4 (Sec B) • Room 204</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('grading')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                View Roster
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  02:00
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">CS403 - Algorithms Laboratory (Batch A)</h4>
                  <p className="text-xs text-slate-600">Computer Center 2 • Hardware Lab Annex</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('resources')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Upload Lab Manual
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Class Circular Broadcaster */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="material-symbols-outlined text-emerald-600">campaign</span>
            <h3 className="font-bold text-slate-900 text-lg">Broadcast Class Notice</h3>
          </div>

          <form onSubmit={handlePublishNotice} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
              <select className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="all">All Assigned Classes (CSE Sem 4)</option>
                <option value="cs401">CS401 Data Structures</option>
                <option value="cs402">CS402 Relational DBMS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Circular Title</label>
              <input
                type="text"
                placeholder="e.g. Assignment 3 Submission Deadline Extended"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Description</label>
              <textarea
                rows={3}
                placeholder="Write message for students..."
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              Publish Notice to Students
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
