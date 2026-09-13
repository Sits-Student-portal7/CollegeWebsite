import React, { useState } from 'react';
import { LostFoundItem } from '../types';

interface ReportItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Partial<LostFoundItem>) => void;
}

export const ReportItemModal: React.FC<ReportItemModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Electronics' | 'Personal Belongings' | 'Academic' | 'Accessories'>('Electronics');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    onSubmit({
      title,
      type: itemType,
      category,
      location,
      description,
      reporter: 'Arjun Kumar (You)',
      timeAgo: 'Just now',
      isOwnerListing: true,
    });

    // Reset form
    setTitle('');
    setLocation('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-extrabold text-lg text-slate-800">Report Lost or Found Item</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Radio Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2.5 uppercase tracking-wider">
              Item Status
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                onClick={() => setItemType('lost')}
                className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  itemType === 'lost'
                    ? 'border-rose-500 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  checked={itemType === 'lost'}
                  onChange={() => setItemType('lost')}
                  className="sr-only"
                />
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center">
                  {itemType === 'lost' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">I Lost Something</p>
                  <p className="text-xs text-slate-500">Create an alert for campus community.</p>
                </div>
              </label>

              <label
                onClick={() => setItemType('found')}
                className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  itemType === 'found'
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  checked={itemType === 'found'}
                  onChange={() => setItemType('found')}
                  className="sr-only"
                />
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center">
                  {itemType === 'found' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">I Found Something</p>
                  <p className="text-xs text-slate-500">Reunite item with its owner.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blue Milton Insulated Bottle"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Personal Belongings">Personal Belongings</option>
                <option value="Academic">Academic Material</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Date Lost/Found
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library 2nd Floor"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide distinctive features, brand name, scratch marks..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Photos Uploader */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                Photo Upload (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-slate-400 text-3xl">cloud_upload</span>
                <p className="font-medium text-slate-700 text-xs mt-1">
                  Click to choose image file or drop here
                </p>
                {fileName && <p className="text-xs text-indigo-600 font-bold mt-1">{fileName}</p>}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">publish</span> Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
