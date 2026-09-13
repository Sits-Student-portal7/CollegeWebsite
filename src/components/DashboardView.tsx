import React from 'react';
import { StudentProfile, Notice, UpcomingEvent } from '../types';

interface DashboardViewProps {
  student: StudentProfile;
  notices: Notice[];
  events: UpcomingEvent[];
  onNavigateTab: (tab: 'academics' | 'fees' | 'resources' | 'lost-found') => void;
  onOpenAIPrompt: (prompt: string) => void;
  onSemesterChange?: (semester: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  notices,
  events,
  onNavigateTab,
  onOpenAIPrompt,
  onSemesterChange,
}) => {
  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Header Greeting & Info Chips */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {student.name.split(' ')[0]} 👋
          </h1>
          <div className="inline-flex flex-wrap items-center gap-2 bg-white border border-slate-200 shadow-2xs rounded-full px-3.5 py-1 mt-2 text-xs font-medium text-slate-600">
            <span>{student.department}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <select
              className="bg-transparent border-none p-0 text-slate-600 font-medium text-xs focus:ring-0 cursor-pointer"
              value={student.semester}
              onChange={(e) => onSemesterChange?.(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="font-mono">Roll No: {student.rollNo}</span>
          </div>
        </div>
      </section>

      {/* Metric Grid (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div
          onClick={() => onNavigateTab('academics')}
          className="bg-white border border-slate-200 shadow-2xs p-4 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Attendance
            </h3>
            <div className="text-2xl font-black text-slate-900">{student.attendancePercent}%</div>
            <p className="text-xs text-slate-500 mt-1">Target: 75%</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="text-emerald-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${student.attendancePercent}, 100`}
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>
            <span className="absolute material-symbols-outlined text-emerald-600 text-sm">
              trending_up
            </span>
          </div>
        </div>

        {/* CGPA Card */}
        <div
          onClick={() => onNavigateTab('academics')}
          className="bg-white border border-slate-200 shadow-2xs p-4 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">CGPA</h3>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Top 5%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl font-black text-slate-900">{student.cgpa}</span>
            <span className="text-xs text-slate-500 font-medium">/ 10</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${(student.cgpa / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Pending Fees Card */}
        <div
          onClick={() => onNavigateTab('fees')}
          className="bg-white border border-slate-200 shadow-2xs p-4 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Pending Fees
            </h3>
            <div className="text-2xl font-black text-slate-900">
              ₹{student.pendingDues.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
              <span className="material-symbols-outlined text-[13px]">check_circle</span> Cleared
            </span>
            <span className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5">
              History <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 shadow-2xs p-4 rounded-xl flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-200 overflow-hidden shrink-0 shadow-2xs">
            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 leading-tight">{student.name}</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{student.rollNo}</p>
            <span className="inline-block mt-1 bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded">
              Active Student
            </span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (66%): Recent Notices */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 shadow-2xs rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-indigo-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">notifications_active</span>
                Recent Notices
              </h2>
              <button
                onClick={() => onOpenAIPrompt('Summarize the latest exam and campus notices')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200"
              >
                <span className="material-symbols-outlined text-xs">smart_toy</span> Summarize with AI
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {notices.map((notice) => (
                <div key={notice.id} className="py-3 hover:bg-slate-50 transition-colors rounded-lg p-2">
                  <div className="flex gap-3.5 items-start">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 mt-0.5">
                      <span className="material-symbols-outlined text-[20px]">{notice.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                          {notice.title}
                        </h4>
                        <span className="text-xs text-slate-500 shrink-0 font-mono">{notice.timeAgo}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                          {notice.category}
                        </span>
                        <p className="text-xs text-slate-600 truncate">{notice.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="bg-white border border-slate-200 shadow-2xs rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold text-indigo-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">event</span>
                Upcoming Campus Events
              </h2>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-4 items-center hover:border-indigo-300 transition-colors shadow-2xs"
                >
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex flex-col items-center justify-center border border-indigo-100 shrink-0">
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase font-mono leading-none">
                      {ev.dateMonth}
                    </span>
                    <span className="text-lg font-black text-slate-900 leading-none mt-0.5">
                      {ev.dateDay}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900">{ev.title}</h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {ev.location} • {ev.time}
                    </span>
                  </div>
                  {ev.rsvpd ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check</span> RSVP'd
                    </span>
                  ) : (
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      RSVP Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (33%): Quick Jump Cards & Academic Snapshot */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-5">
            <h3 className="font-bold text-sm text-indigo-900 mb-3 uppercase tracking-wider text-[12px]">
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigateTab('academics')}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-colors group"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl block mb-1">
                  school
                </span>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                  View Grades
                </span>
              </button>
              <button
                onClick={() => onNavigateTab('fees')}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-colors group"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl block mb-1">
                  receipt_long
                </span>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                  Pay Dues
                </span>
              </button>
              <button
                onClick={() => onNavigateTab('resources')}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-colors group"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl block mb-1">
                  folder_open
                </span>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                  Study Material
                </span>
              </button>
              <button
                onClick={() => onNavigateTab('lost-found')}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-left transition-colors group"
              >
                <span className="material-symbols-outlined text-indigo-600 text-xl block mb-1">
                  search_check
                </span>
                <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700">
                  Lost & Found
                </span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#171f33] to-[#222a3d] text-white rounded-xl p-5 shadow-md border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-indigo-300 uppercase font-mono font-bold tracking-wider">
                Exam Preparation
              </span>
              <span className="material-symbols-outlined text-indigo-400">auto_awesome</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Mid-Semester exams begin in 14 days. Review lecture notes for DAA and DBMS.
            </p>
            <button
              onClick={() => onOpenAIPrompt('Generate a study timetable for Semester 4 mid-terms')}
              className="mt-4 w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              Ask AI Study Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
