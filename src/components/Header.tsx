import React from 'react';
import { StudentProfile, UserProfile } from '../types';

interface HeaderProps {
  student: StudentProfile;
  currentUser?: UserProfile;
  onLogout?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onToggleMobileMenu: () => void;
  onToggleDesktopMenu?: () => void;
  onOpenNotifications: () => void;
  onOpenAIAssistant: () => void;
  placeholderText?: string;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  student,
  currentUser,
  onLogout,
  searchQuery,
  setSearchQuery,
  onToggleMobileMenu,
  onToggleDesktopMenu,
  onOpenNotifications,
  onOpenAIAssistant,
  placeholderText = 'Search notes, fees, events, notices...',
  unreadCount = 2,
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-200 sticky top-0 z-30 w-full shadow-2xs">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Desktop Menu Toggle */}
        {onToggleDesktopMenu && (
          <button
            onClick={onToggleDesktopMenu}
            className="hidden md:block text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Toggle Desktop Navigation Menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        <span className="md:hidden font-bold text-lg text-[#6366F1]">ScholarCore</span>

        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center bg-slate-100 border border-slate-300 rounded-full px-3.5 py-1.5 w-full focus-within:border-[#6366F1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6366F1]/20 transition-all">
          <span className="material-symbols-outlined text-[#6366F1] text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholderText}
            className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-500 ml-2 w-full outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors relative flex items-center justify-center cursor-pointer"
          title="Notifications & Alerts"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* AI Assistant Quick Mobile Button */}
        <button
          onClick={onOpenAIAssistant}
          className="md:hidden text-[#6366F1] p-2 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center"
          title="AI Assistant"
        >
          <span className="material-symbols-outlined text-[22px]">smart_toy</span>
        </button>

        {/* User Profile & Role Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
            <img
              src={currentUser?.avatar || student.avatar}
              alt={currentUser?.name || student.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {currentUser?.name || student.name}
              </p>
              {currentUser?.role && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : currentUser.role === 'faculty'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {currentUser.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono leading-none mt-0.5">
              {currentUser?.idNumber || student.rollNo}
            </p>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
