import React, { useState } from 'react';
import {
  TabType,
  StudentProfile,
  UserProfile,
  Notice,
  UpcomingEvent,
  FeeItem,
  PaymentReceipt,
  ResourceItem,
  AssignmentItem,
  LostFoundItem,
  NotificationItem,
  SupportTicket,
} from './types';
import {
  INITIAL_STUDENT_PROFILE,
  INITIAL_NOTICES,
  INITIAL_EVENTS,
  INITIAL_FEES,
  INITIAL_PAYMENT_HISTORY,
  INITIAL_RESOURCES,
  INITIAL_ASSIGNMENTS,
  INITIAL_LOST_FOUND,
  INITIAL_NOTIFICATION_FEED,
  INITIAL_SUPPORT_TICKETS,
  getMockDataForSemester,
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AIAssistantWidget } from './components/AIAssistantWidget';

import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { FacultyView } from './components/FacultyView';
import { AdminView } from './components/AdminView';
import { AcademicsView } from './components/AcademicsView';
import { FeesView } from './components/FeesView';
import { ResourcesView } from './components/ResourcesView';
import { LostFoundView } from './components/LostFoundView';
import { NotificationsView } from './components/NotificationsView';
import { SupportView } from './components/SupportView';

import { ReportItemModal } from './components/ReportItemModal';
import { PaymentModal } from './components/PaymentModal';
import { SubmitAssignmentModal } from './components/SubmitAssignmentModal';
import { NotificationsModal } from './components/NotificationsModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'student') {
      setActiveTab('dashboard');
      setStudent((prev) => ({
        ...prev,
        name: user.name,
        rollNo: user.idNumber,
        department: user.department,
        avatar: user.avatar,
      }));
    } else if (user.role === 'faculty') {
      setActiveTab('faculty-dashboard');
    } else if (user.role === 'admin') {
      setActiveTab('admin-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [events, setEvents] = useState<UpcomingEvent[]>(INITIAL_EVENTS);
  const [fees, setFees] = useState<FeeItem[]>(INITIAL_FEES);
  const [history, setHistory] = useState<PaymentReceipt[]>(INITIAL_PAYMENT_HISTORY);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [assignments, setAssignments] = useState<AssignmentItem[]>(INITIAL_ASSIGNMENTS);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>(INITIAL_LOST_FOUND);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATION_FEED);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);

  const [internalResults, setInternalResults] = useState(getMockDataForSemester(INITIAL_STUDENT_PROFILE.semester).internalResults);
  const [externalResults, setExternalResults] = useState(getMockDataForSemester(INITIAL_STUDENT_PROFILE.semester).externalResults);

  const handleSemesterChange = (newSemester: number) => {
    const freshData = getMockDataForSemester(newSemester);
    const newPendingDues = freshData.fees.reduce((acc, fee) => acc + fee.balance, 0);
    const newPaidAmount = freshData.fees.reduce((acc, fee) => acc + fee.paid, 0);
    const newAttendance = Math.min(100, 80 + (newSemester * 2.5));
    const newCgpa = Math.min(10, 8.0 + (newSemester * 0.15));

    setStudent({ 
      ...student, 
      semester: newSemester,
      pendingDues: newPendingDues,
      paidAmount: newPaidAmount,
      attendancePercent: parseFloat(newAttendance.toFixed(1)),
      cgpa: parseFloat(newCgpa.toFixed(2))
    });
    setNotices(freshData.notices);
    setFees(freshData.fees);
    setHistory(freshData.history);
    setInternalResults(freshData.internalResults);
    setExternalResults(freshData.externalResults);
  };

  // UI Drawer & Widget States
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | undefined>(undefined);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | undefined>(undefined);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAIAssistantWithPrompt = (promptText?: string) => {
    if (promptText) {
      setAiInitialPrompt(promptText);
    }
    setAiOpen(true);
  };

  // Handlers
  const handlePaymentSuccess = (amountPaid: number, feeTitle: string, method: string) => {
    const newReceiptNo = `#RCP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReceipt: PaymentReceipt = {
      receiptNo: newReceiptNo,
      feeType: feeTitle,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      method,
      amount: amountPaid,
      status: 'SUCCESS',
    };

    setHistory((prev) => [newReceipt, ...prev]);

    // Update student pending dues
    setStudent((prev) => ({
      ...prev,
      pendingDues: Math.max(0, prev.pendingDues - amountPaid),
      paidAmount: prev.paidAmount + amountPaid,
    }));

    // Update fee items
    setFees((prev) =>
      prev.map((f) => {
        if (selectedFeeForPayment ? f.id === selectedFeeForPayment.id : f.balance > 0) {
          const newPaid = f.paid + amountPaid;
          const newBal = Math.max(0, f.amount - newPaid);
          return {
            ...f,
            paid: newPaid,
            balance: newBal,
            status: newBal === 0 ? 'FULLY PAID' : 'PARTIALLY PAID',
          };
        }
        return f;
      })
    );

    showToast(`Payment of ₹${amountPaid.toLocaleString('en-IN')} successful! Receipt ${newReceiptNo} issued.`);
  };

  const handleDownloadReceipt = (receiptNo: string) => {
    showToast(`Downloading PDF receipt (${receiptNo})...`);
  };

  const handleDownloadResource = (title: string) => {
    showToast(`Downloading file: "${title}"`);
  };

  const handleAssignmentSubmit = (assignmentId: string, fileName: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, status: 'Submitted', grade: 'Pending Grading' } : a
      )
    );
    showToast(`Assignment submitted successfully with file: ${fileName}`);
  };

  const handleAddLostFoundItem = (newItem: Partial<LostFoundItem>) => {
    const fullItem: LostFoundItem = {
      id: `lf_${Date.now()}`,
      title: newItem.title || 'Untitled Item',
      category: newItem.category || 'Personal Belongings',
      type: newItem.type || 'lost',
      location: newItem.location || 'Campus Main Gate',
      reporter: newItem.reporter || 'Arjun Kumar (You)',
      timeAgo: 'Just now',
      isOwnerListing: true,
      description: newItem.description || '',
    };

    setLostFoundItems((prev) => [fullItem, ...prev]);
    showToast(`Listing published: "${fullItem.title}"`);
  };

  const handleClaimItem = (title: string) => {
    showToast(`Claim inquiry sent to finder for "${title}".`);
  };

  const handleIFoundThis = (title: string) => {
    showToast(`Alert sent to owner regarding lost item "${title}".`);
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIAssistant={() => setAiOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        desktopOpen={desktopOpen}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-h-screen bg-[#F8FAFC] transition-all duration-300 ${desktopOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Top App Bar Header */}
        <Header
          student={student}
          currentUser={currentUser}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileMenu={() => setMobileOpen(true)}
          onToggleDesktopMenu={() => setDesktopOpen(!desktopOpen)}
          onOpenNotifications={() => setNotificationsModalOpen(true)}
          onOpenAIAssistant={() => setAiOpen(true)}
          unreadCount={notifications.filter((n) => n.unread).length}
        />

        {/* Main Canvas Views */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Faculty Views */}
          {(activeTab === 'faculty-dashboard' ||
            (activeTab === 'dashboard' && currentUser?.role === 'faculty')) && (
            <FacultyView
              currentUser={currentUser}
              activeTab="faculty-dashboard"
              searchQuery={searchQuery}
              onShowToast={showToast}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'grading' && (
            <FacultyView
              currentUser={currentUser}
              activeTab="grading"
              searchQuery={searchQuery}
              onShowToast={showToast}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Admin Views */}
          {(activeTab === 'admin-dashboard' ||
            (activeTab === 'dashboard' && currentUser?.role === 'admin')) && (
            <AdminView
              currentUser={currentUser}
              activeTab="admin-dashboard"
              searchQuery={searchQuery}
              onShowToast={showToast}
              onNavigateTab={setActiveTab}
            />
          )}

          {(activeTab === 'student-mgmt' || activeTab === 'fee-audit' || activeTab === 'exam-control') && (
            <AdminView
              currentUser={currentUser}
              activeTab={activeTab}
              searchQuery={searchQuery}
              onShowToast={showToast}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Student Views */}
          {activeTab === 'dashboard' && currentUser?.role === 'student' && (
            <DashboardView
              student={student}
              notices={notices}
              events={events}
              onNavigateTab={setActiveTab}
              onOpenAIPrompt={() => setAiOpen(true)}
              onSemesterChange={handleSemesterChange}
            />
          )}

          {activeTab === 'academics' && (
            <AcademicsView
              student={student}
              searchQuery={searchQuery}
              onSemesterChange={handleSemesterChange}
              internalResults={internalResults}
              externalResults={externalResults}
            />
          )}

          {activeTab === 'fees' && (
            <FeesView
              student={student}
              fees={fees}
              history={history}
              onOpenPaymentModal={(f) => {
                setSelectedFeeForPayment(f);
                setPaymentModalOpen(true);
              }}
              onDownloadReceipt={handleDownloadReceipt}
              searchQuery={searchQuery}
              onSemesterChange={handleSemesterChange}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              student={student}
              resources={resources}
              assignments={assignments}
              searchQuery={searchQuery}
              onOpenSubmitAssignmentModal={(a) => {
                setSelectedAssignment(a);
                setSubmitModalOpen(true);
              }}
              onDownloadResource={handleDownloadResource}
            />
          )}

          {activeTab === 'lost-found' && (
            <LostFoundView
              items={lostFoundItems}
              searchQuery={searchQuery}
              onOpenReportModal={() => setReportModalOpen(true)}
              onClaimItem={handleClaimItem}
              onIFoundThis={handleIFoundThis}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              setNotifications={setNotifications}
              onDownloadReceipt={handleDownloadReceipt}
              onDownloadResource={handleDownloadResource}
              onNavigateTab={setActiveTab}
              onOpenAIAssistant={handleOpenAIAssistantWithPrompt}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 max-w-2xl">
              <h2 className="text-xl font-bold text-slate-900">Student Portal Preferences</h2>
              <p className="text-sm text-slate-500">
                Manage your profile settings, notification preferences, and portal appearance.
              </p>

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Email Notifications for Notices & Exam Updates</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>SMS Alerts for Fee Due Reminders</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Dark Mode Preference</span>
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <SupportView
              tickets={tickets}
              setTickets={setTickets}
              onShowToast={showToast}
              onNavigateTab={setActiveTab}
              onOpenAIAssistant={handleOpenAIAssistantWithPrompt}
            />
          )}
        </main>
      </div>

      {/* Floating AI Assistant Widget */}
      <AIAssistantWidget
        isOpen={aiOpen}
        onToggle={() => setAiOpen((prev) => !prev)}
        initialPrompt={aiInitialPrompt}
        onClearInitialPrompt={() => setAiInitialPrompt(undefined)}
      />

      {/* Modals */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        onDownloadReceipt={handleDownloadReceipt}
        onDownloadResource={handleDownloadResource}
        onNavigateTab={setActiveTab}
        onOpenAIAssistant={handleOpenAIAssistantWithPrompt}
        onShowToast={showToast}
      />

      <ReportItemModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleAddLostFoundItem}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        feeItem={selectedFeeForPayment}
        totalPending={student.pendingDues}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedFeeForPayment(undefined);
        }}
        onSuccess={handlePaymentSuccess}
      />

      <SubmitAssignmentModal
        isOpen={submitModalOpen}
        assignment={selectedAssignment}
        onClose={() => {
          setSubmitModalOpen(false);
          setSelectedAssignment(undefined);
        }}
        onSubmit={handleAssignmentSubmit}
      />
    </div>
  );
}
