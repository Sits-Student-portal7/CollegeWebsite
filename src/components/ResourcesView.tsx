import React, { useState } from 'react';
import { StudentProfile, ResourceItem, AssignmentItem } from '../types';

interface ResourcesViewProps {
  student: StudentProfile;
  resources: ResourceItem[];
  assignments: AssignmentItem[];
  searchQuery: string;
  onOpenSubmitAssignmentModal: (assignment: AssignmentItem) => void;
  onDownloadResource: (title: string) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  student,
  resources,
  assignments,
  searchQuery,
  onOpenSubmitAssignmentModal,
  onDownloadResource,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Resources');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.faculty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategory === 'All Resources' || item.category === selectedCategory;

    const matchesSubj =
      selectedSubject === 'All Subjects' || item.subject.includes(selectedSubject);

    return matchesSearch && matchesCat && matchesSubj;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Student Profile Chips */}
      <div className="flex flex-wrap gap-2.5">
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-[#1E40AF]">
          <span className="material-symbols-outlined text-sm">terminal</span>
          {student.department}
        </div>
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-[#1E40AF]">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          Semester {student.semester}
        </div>
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-[#1E40AF]">
          <span className="material-symbols-outlined text-sm">badge</span>
          Roll No: {student.rollNo}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Category Pills */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          {['All Resources', 'Lecture Notes', 'Assignments', 'Lab Manuals'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#494bd6]/10 text-[#494bd6] border border-[#494bd6]/30'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subject Filter & View Toggle */}
        <div className="flex items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-lg p-2 outline-none focus:border-[#494bd6]"
          >
            <option value="All Subjects">All Subjects</option>
            <option value="Design & Analysis of Algorithms">Design & Analysis of Algorithms</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Database Management Systems">Database Management Systems</option>
          </select>

          <div className="flex bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-slate-200 text-[#494bd6]' : 'text-slate-500'}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-lg block">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-slate-200 text-[#494bd6]' : 'text-slate-500'}`}
              title="List View"
            >
              <span className="material-symbols-outlined text-lg block">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Study Materials
            </span>
            <div className="text-2xl font-black text-[#1E40AF] mt-1">42 <span className="text-xs font-normal text-slate-500">Files</span></div>
          </div>
          <div className="bg-[#494bd6]/10 p-2.5 rounded-lg text-[#494bd6]">
            <span className="material-symbols-outlined text-2xl">library_books</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Assignments
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1E40AF]">2</span>
              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                DUE SOON
              </span>
            </div>
          </div>
          <div className="bg-red-50 p-2.5 rounded-lg text-red-600">
            <span className="material-symbols-outlined text-2xl">assignment_late</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bookmarked Resources
            </span>
            <div className="text-2xl font-black text-[#1E40AF] mt-1">6 <span className="text-xs font-normal text-slate-500">Saved</span></div>
          </div>
          <div className="bg-cyan-50 p-2.5 rounded-lg text-cyan-600">
            <span className="material-symbols-outlined text-2xl">bookmark</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (66%): Faculty Lecture Notes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-extrabold text-[#1E40AF] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#494bd6]">folder_special</span>
            Faculty Lecture Notes & Materials
          </h2>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : 'space-y-3'
            }
          >
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-100 shrink-0">
                      <span className="material-symbols-outlined text-2xl block">
                        {res.type === 'ppt'
                          ? 'co_present'
                          : res.type === 'zip'
                          ? 'folder_zip'
                          : 'picture_as_pdf'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1E40AF] text-base truncate">{res.title}</h3>
                      <p className="text-xs text-slate-600 truncate">{res.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-medium">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>{res.faculty}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span>{res.fileSize}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onDownloadResource(res.title)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onDownloadResource(res.title)}
                    className="flex-1 bg-[#494bd6] hover:bg-[#3b3db5] text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">download</span> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (33%): Course Assignments */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-[#1E40AF] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#494bd6]">assignment</span>
            Course Assignments
          </h2>

          <div className="bg-white border border-slate-200 shadow-2xs rounded-xl overflow-hidden p-3.5 space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-[#1E40AF] text-sm">{assignment.title}</h4>
                  {assignment.status === 'Pending' ? (
                    <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2">
                      <span className="material-symbols-outlined text-[12px]">timer</span>
                      {assignment.daysRemaining} Days
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {assignment.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mb-3">{assignment.subjectName}</p>

                {assignment.status === 'Pending' ? (
                  <button
                    onClick={() => onOpenSubmitAssignmentModal(assignment)}
                    className="w-full bg-white border border-slate-300 text-[#03b5d3] hover:border-[#03b5d3] hover:bg-cyan-50/50 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Submit File
                  </button>
                ) : (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex justify-between items-center">
                    <span>Graded Score</span>
                    <span className="font-bold">{assignment.grade}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
