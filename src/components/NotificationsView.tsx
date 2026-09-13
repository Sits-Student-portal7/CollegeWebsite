import React, { useState } from 'react';
import { NotificationItem } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onDownloadReceipt: (receiptNo: string) => void;
  onDownloadResource: (title: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAIAssistant: (initialPrompt?: string) => void;
  onShowToast: (message: string) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  setNotifications,
  onDownloadReceipt,
  onDownloadResource,
  onNavigateTab,
  onOpenAIAssistant,
  onShowToast,
  isModal = false,
  onCloseModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Preference states
  const [preferences, setPreferences] = useState({
    emailDigest: true,
    whatsappAlerts: true,
    browserPush: false,
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    onShowToast('All notifications marked as read.');
  };

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const updated = !prev[key];
      const label =
        key === 'emailDigest'
          ? 'Email Digest'
          : key === 'whatsappAlerts'
          ? 'WhatsApp Alerts'
          : 'Browser Push';
      onShowToast(`${label} ${updated ? 'enabled' : 'disabled'}.`);
      return { ...prev, [key]: updated };
    });
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return item.unread;
    if (activeFilter === 'Academic') return item.category === 'Academic';
    if (activeFilter === 'Financial') return item.category === 'Financial';
    if (activeFilter === 'Lost & Found') return item.category === 'Lost & Found';
    if (activeFilter === 'Resources') return item.category === 'Resources';
    return true;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Financial':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Lost & Found':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Resources':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-6 max-h-[85vh] overflow-y-auto' : ''}`}>
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold text-[#4338CA] leading-none mb-3">
              Notifications & Alerts
            </h2>
            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#4338CA] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#4338CA] hover:text-[#4338CA]'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'unread'
                  ? 'bg-[#4338CA] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#4338CA] hover:text-[#4338CA]'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('Academic')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'Academic'
                  ? 'bg-[#4338CA] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#4338CA] hover:text-[#4338CA]'
              }`}
            >
              Academic
            </button>
            <button
              onClick={() => setActiveFilter('Financial')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === 'Financial'
                  ? 'bg-[#4338CA] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#4338CA] hover:text-[#4338CA]'
              }`}
            >
              Financial
            </button>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-xs font-bold text-[#4338CA] hover:underline flex items-center gap-1 self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">done_all</span> Mark all as read
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Activity Feed */}
        <section className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Recent Activity Feed
          </h3>

          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
                notifications_off
              </span>
              No notifications found matching your selected filter.
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`border rounded-2xl p-5 flex gap-4 items-start group hover:shadow-md transition-all ${
                  item.unread
                    ? 'bg-[#EEF2FF] border-indigo-100'
                    : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Unread indicator dot */}
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center">
                  {item.unread && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{item.timeAgo}</span>
                  </div>

                  <h4 className={`text-slate-900 font-bold mb-3 text-sm leading-snug`}>
                    {item.title}
                  </h4>

                  {/* Actions depending on notification type */}
                  {item.actionType === 'view_schedule' && (
                    <button
                      onClick={() => onNavigateTab('academics')}
                      className="inline-flex items-center gap-1 text-indigo-700 font-bold text-xs hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      View Schedule <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}

                  {item.actionType === 'download_receipt' && (
                    <button
                      onClick={() =>
                        onDownloadReceipt(item.actionData?.receiptNo || '#RCP-9821')
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 text-white rounded-lg font-bold text-xs hover:bg-indigo-800 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>{' '}
                      Download Receipt
                    </button>
                  )}

                  {item.actionType === 'download_file' && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">
                          picture_as_pdf
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {item.actionData?.fileName || 'DP_Module_3_v2.pdf'}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onDownloadResource(item.actionData?.fileName || 'Module Notes')
                        }
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">download</span> Get
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Right Column: Urgent Broadcasts & Preferences */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Card 1: Urgent Broadcasts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-red-600 text-xl">campaign</span>
              <h3 className="font-bold text-slate-900 text-sm">🚨 Urgent Broadcasts</h3>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium pl-1">
                Campus placement drive registration deadline closes on{' '}
                <span className="font-bold">Oct 12 at 11:59 PM</span>. Ensure your profile is updated.
              </p>
            </div>
          </div>

          {/* Card 2: Quick Preference Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Quick Preference Controls</h3>
            <div className="space-y-4">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Email Digest</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailDigest}
                    onChange={() => handleTogglePreference('emailDigest')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">WhatsApp Alerts</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsappAlerts}
                    onChange={() => handleTogglePreference('whatsappAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Browser Push</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.browserPush}
                    onChange={() => handleTogglePreference('browserPush')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            </div>
          </div>

          {/* Quick AI Prompt Pills */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-indigo-900 mb-2.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-sm">smart_toy</span>
              Ask AI Assistant
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setActiveFilter('unread');
                  onShowToast('Filtering unread notifications...');
                }}
                className="bg-white border border-indigo-200 px-3 py-1.5 rounded-full shadow-2xs text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors text-left"
              >
                "Show only unread exam notifications"
              </button>
              <button
                onClick={() => {
                  onOpenAIAssistant('Summarize alerts from this week');
                }}
                className="bg-white border border-indigo-200 px-3 py-1.5 rounded-full shadow-2xs text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors text-left"
              >
                "Summarize alerts from this week"
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
