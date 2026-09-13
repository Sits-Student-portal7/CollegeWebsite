import React from 'react';
import { NotificationsView } from './NotificationsView';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onDownloadReceipt: (receiptNo: string) => void;
  onDownloadResource: (title: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenAIAssistant: (prompt?: string) => void;
  onShowToast: (message: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  onDownloadReceipt,
  onDownloadResource,
  onNavigateTab,
  onOpenAIAssistant,
  onShowToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto">
          <NotificationsView
            notifications={notifications}
            setNotifications={setNotifications}
            onDownloadReceipt={onDownloadReceipt}
            onDownloadResource={onDownloadResource}
            onNavigateTab={(tab) => {
              onNavigateTab(tab);
              onClose();
            }}
            onOpenAIAssistant={(prompt) => {
              onOpenAIAssistant(prompt);
              onClose();
            }}
            onShowToast={onShowToast}
            isModal={true}
            onCloseModal={onClose}
          />
        </div>
      </div>
    </div>
  );
};
