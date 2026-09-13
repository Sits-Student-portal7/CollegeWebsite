import React, { useState } from 'react';
import { AssignmentItem } from '../types';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  assignment?: AssignmentItem;
  onClose: () => void;
  onSubmit: (assignmentId: string, fileName: string) => void;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  isOpen,
  assignment,
  onClose,
  onSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');

  if (!isOpen || !assignment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fileName = selectedFile ? selectedFile.name : `Arjun_Kumar_${assignment.subjectCode}_Assignment.pdf`;
    onSubmit(assignment.id, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 bg-[#171f33] text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Assignment Submission</h3>
            <p className="text-xs text-indigo-300">{assignment.subjectName}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <h4 className="font-bold text-slate-900">{assignment.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">Due in {assignment.daysRemaining} days • Max Points: 100</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Attach Solution Document (PDF, ZIP, DOCX)
            </label>
            <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 transition-colors cursor-pointer block">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <span className="material-symbols-outlined text-indigo-600 text-3xl">upload_file</span>
              <p className="font-semibold text-slate-800 text-xs mt-1">
                {selectedFile ? selectedFile.name : 'Click to browse file or drag and drop'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Max size 25MB</p>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Submission Comments (Optional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Notes for course instructor..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">send</span> Submit Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
