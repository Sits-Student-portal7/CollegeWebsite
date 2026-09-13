import React, { useState } from 'react';
import { LostFoundItem } from '../types';

interface LostFoundViewProps {
  items: LostFoundItem[];
  searchQuery: string;
  onOpenReportModal: () => void;
  onClaimItem: (title: string) => void;
  onIFoundThis: (title: string) => void;
}

export const LostFoundView: React.FC<LostFoundViewProps> = ({
  items,
  searchQuery,
  onOpenReportModal,
  onClaimItem,
  onIFoundThis,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found' | 'my-items'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reporter.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'lost'
        ? item.type === 'lost'
        : filterType === 'found'
        ? item.type === 'found'
        : item.isOwnerListing;

    const matchesCat =
      selectedCategory === 'All Categories' || item.category === selectedCategory;

    const matchesLoc =
      selectedLocation === 'All Locations' || item.location.includes(selectedLocation);

    return matchesSearch && matchesType && matchesCat && matchesLoc;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-indigo-700">Campus Lost & Found Portal</h2>
          <p className="text-xs text-slate-500">
            Reunite lost belongings with students and staff across university blocks.
          </p>
        </div>
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-[10px] text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Report an Item
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 text-indigo-600">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Reported</p>
            <p className="text-2xl font-black text-indigo-700 mt-0.5">
              20 <span className="text-xs text-indigo-500 font-normal">Items</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 text-emerald-600">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Recently Recovered
            </p>
            <p className="text-2xl font-black text-indigo-700 mt-0.5">
              14 <span className="text-xs text-indigo-500 font-normal">Items</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-700">
            <span className="material-symbols-outlined text-2xl">person_book</span>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Your Listings</p>
            <p className="text-2xl font-black text-indigo-700 mt-0.5">
              1 <span className="text-xs text-indigo-500 font-normal">Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'lost'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Lost Items
            <span className="w-4 h-4 flex items-center justify-center bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
              8
            </span>
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Found Items
            <span className="w-4 h-4 flex items-center justify-center bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
              12
            </span>
          </button>
          <button
            onClick={() => setFilterType('my-items')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterType === 'my-items'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-indigo-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            My Reported Items
          </button>
        </div>

        {/* Category & Location Selectors */}
        <div className="flex gap-2 w-full lg:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 text-indigo-700 font-semibold text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Personal Belongings</option>
            <option>Academic</option>
            <option>Accessories</option>
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-white border border-slate-200 text-indigo-700 font-semibold text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option>All Locations</option>
            <option>Lab Block</option>
            <option>Library</option>
            <option>Canteen</option>
            <option>Sports Complex</option>
          </select>
        </div>
      </div>

      {/* Item Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden ${
              item.isOwnerListing ? 'border-indigo-300 ring-1 ring-indigo-500/20' : 'border-slate-200'
            }`}
          >
            {/* Image / Thumbnail Container */}
            <div className="h-44 bg-slate-100 relative group flex items-center justify-center border-b border-slate-100 overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">
                    {item.category === 'Electronics'
                      ? 'devices'
                      : item.category === 'Academic'
                      ? 'calculate'
                      : 'wallet'}
                  </span>
                </div>
              )}

              {/* Status Tags */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {item.type === 'found' ? (
                  <span className="bg-emerald-100/90 backdrop-blur-sm text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Found
                  </span>
                ) : (
                  <span className="bg-rose-100/90 backdrop-blur-sm text-rose-800 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border border-rose-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Lost
                  </span>
                )}

                {item.isOwnerListing && (
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold border border-slate-700">
                    Your Listing
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-indigo-700 text-[10px] font-bold shadow-2xs border border-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {item.timeAgo}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="font-bold text-base text-indigo-900 leading-snug line-clamp-2">
                  {item.title}
                </h3>
                {item.inquiriesCount && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 ml-1">
                    {item.inquiriesCount} Inquiry
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {item.category}
                </span>
              </div>

              <div className="space-y-1.5 mb-5 flex-1 text-xs text-indigo-600">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  <span>{item.reporter}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  <span>{item.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
                {item.isOwnerListing ? (
                  <button
                    onClick={onOpenReportModal}
                    className="flex-1 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-indigo-700 rounded-lg text-xs font-bold transition-colors text-center flex justify-center items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span> Edit Listing
                  </button>
                ) : item.type === 'found' ? (
                  <button
                    onClick={() => onClaimItem(item.title)}
                    className="flex-1 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors text-center border border-emerald-200"
                  >
                    Claim Item
                  </button>
                ) : (
                  <button
                    onClick={() => onIFoundThis(item.title)}
                    className="flex-1 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors text-center border border-indigo-200"
                  >
                    I Found This!
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
