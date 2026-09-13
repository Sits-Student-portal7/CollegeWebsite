import React from 'react';
import { TabType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAIAssistant: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  desktopOpen?: boolean;
  onLogout?: () => void;
  currentUser?: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAIAssistant,
  mobileOpen,
  setMobileOpen,
  desktopOpen = true,
  onLogout,
  currentUser,
}) => {
  const role = currentUser?.role || 'student';

  const navItems: { id: TabType; label: string; icon: string }[] =
    role === 'faculty'
      ? [
          { id: 'faculty-dashboard', label: 'Faculty Overview', icon: 'dashboard' },
          { id: 'grading', label: 'Grades & Attendance', icon: 'fact_check' },
          { id: 'resources', label: 'Study Resources', icon: 'menu_book' },
          { id: 'support', label: 'Student Support', icon: 'contact_support' },
          { id: 'lost-found', label: 'Lost & Found', icon: 'search_check' },
        ]
      : role === 'admin'
      ? [
          { id: 'admin-dashboard', label: 'Control Center', icon: 'admin_panel_settings' },
          { id: 'student-mgmt', label: 'Student Directory', icon: 'groups' },
          { id: 'fee-audit', label: 'Fee Accounting', icon: 'account_balance' },
          { id: 'support', label: 'Helpdesk Tickets', icon: 'contact_support' },
          { id: 'resources', label: 'Resource Library', icon: 'menu_book' },
        ]
      : [
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
          { id: 'academics', label: 'Academics', icon: 'school' },
          { id: 'fees', label: 'Fees and Payments', icon: 'account_balance_wallet' },
          { id: 'resources', label: 'Resources', icon: 'menu_book' },
          { id: 'lost-found', label: 'Lost and Found', icon: 'search_check' },
          { id: 'support', label: 'Support', icon: 'contact_support' },
        ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-[#171f33] text-gray-200 border-r border-[#464554] flex flex-col z-50 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${desktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#464554]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-[#c0c1ff] leading-none tracking-tight">
                ScholarCore
              </h1>
              <p className="text-[11px] text-[#c7c4d7] mt-0.5 font-mono">v2.4.0</p>
            </div>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-150 font-medium ${
                  isActive
                    ? 'bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/20'
                    : 'text-[#c7c4d7] hover:bg-[#222a3d] hover:text-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="text-[15px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer / CTA & Secondary links */}
        <div className="p-4 border-t border-[#464554] space-y-3">
          <button
            onClick={() => {
              onOpenAIAssistant();
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-2.5 px-4 rounded-[10px] transition-all font-medium text-sm shadow-md active:scale-98"
          >
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            AI Assistant
          </button>

          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#222a3d] text-white'
                  : 'text-[#c7c4d7] hover:bg-[#222a3d] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </button>

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
