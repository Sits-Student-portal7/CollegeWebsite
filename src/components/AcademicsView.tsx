import React, { useState } from 'react';
import { StudentProfile, SubjectResult } from '../types';

interface AcademicsViewProps {
  student: StudentProfile;
  searchQuery: string;
  onSemesterChange?: (semester: number) => void;
  internalResults?: SubjectResult[];
  externalResults?: SubjectResult[];
}

export const AcademicsView: React.FC<AcademicsViewProps> = ({ 
  student, 
  searchQuery, 
  onSemesterChange,
  internalResults = [],
  externalResults = []
}) => {
  const [resultType, setResultType] = useState<'internal' | 'external'>('internal');
  const [sortField, setSortField] = useState<'code' | 'name' | 'marks' | 'attendance'>('code');

  const currentList = resultType === 'internal' ? internalResults : externalResults;

  const filteredList = currentList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortField === 'name') return a.name.localeCompare(b.name);
    if (sortField === 'marks') return b.internalMarks - a.internalMarks;
    if (sortField === 'attendance') return b.attendancePercent - a.attendancePercent;
    return a.code.localeCompare(b.code);
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Top Header & Student Info Chips */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#4338ca] tracking-tight">
            Academic Results & Performance
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 text-[#4338ca] font-mono text-xs font-semibold border border-indigo-200">
              <span className="material-symbols-outlined text-[15px]">badge</span>
              Roll No: {student.rollNo}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 text-[#4338ca] text-xs font-semibold border border-indigo-200">
              <span className="material-symbols-outlined text-[15px]">computer</span>
              {student.department}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <select
                className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-semibold text-blue-700"
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
          </div>
        </div>
      </div>

      {/* Results Tab Switcher */}
      <div className="border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={() => setResultType('internal')}
            className={`px-4 py-2.5 font-bold text-sm transition-colors border-b-2 ${
              resultType === 'internal'
                ? 'text-[#4338ca] border-[#4338ca]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            Internal Results (Mid-Terms)
          </button>
          <button
            onClick={() => setResultType('external')}
            className={`px-4 py-2.5 font-bold text-sm transition-colors border-b-2 ${
              resultType === 'external'
                ? 'text-[#4338ca] border-[#4338ca]'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            External Results (Previous Semester)
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-600 pb-1">
          <span className="font-semibold">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-indigo-500"
          >
            <option value="code">Subject Code</option>
            <option value="name">Subject Name</option>
            <option value="marks">Marks Achieved</option>
            <option value="attendance">Attendance %</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current SGPA Target
          </span>
          <div className="text-2xl font-black text-[#4338ca] mt-1">8.8 / 10</div>
          <p className="text-xs text-slate-500 mt-1">Estimated based on internal assessments</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Cumulative GPA (CGPA)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{student.cgpa}</div>
          <p className="text-xs text-slate-500 mt-1">Verified up to Semester 3</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Attendance Eligibility
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {student.attendancePercent}%
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span> All subjects above 80%
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">table_chart</span>
            {resultType === 'internal' ? 'Semester 4 Internal Assessment' : 'Semester 3 Grade Sheet'}
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Showing {sortedList.length} subjects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4">Subject Code</th>
                <th className="p-3.5">Subject Name</th>
                <th className="p-3.5 text-center">Credits</th>
                <th className="p-3.5 text-right">Marks Secured</th>
                <th className="p-3.5 text-center">Attendance</th>
                <th className="p-3.5 text-center">Grade</th>
                <th className="p-3.5 text-center pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedList.map((subject) => (
                <tr key={subject.code} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3.5 pl-4 font-mono font-bold text-[#4338ca]">
                    {subject.code}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">{subject.name}</td>
                  <td className="p-3.5 text-center font-mono">{subject.credits}</td>
                  <td className="p-3.5 text-right font-bold text-slate-900">
                    {subject.internalMarks} / {subject.maxInternalMarks}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        subject.attendancePercent >= 85
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {subject.attendancePercent}%
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-black text-indigo-600">
                    {subject.grade}
                  </td>
                  <td className="p-3.5 text-center pr-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                      {subject.status}
                    </span>
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
