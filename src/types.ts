export type UserRole = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  name: string;
  idNumber: string; // Roll No, Faculty ID, or Admin ID
  role: UserRole;
  department: string;
  avatar: string;
  email: string;
}

export type TabType =
  | 'dashboard'
  | 'academics'
  | 'fees'
  | 'resources'
  | 'lost-found'
  | 'settings'
  | 'support'
  | 'notifications'
  | 'faculty-dashboard'
  | 'grading'
  | 'admin-dashboard'
  | 'student-mgmt'
  | 'fee-audit'
  | 'exam-control';

export interface NotificationItem {
  id: string;
  category: 'Academic' | 'Financial' | 'Lost & Found' | 'Resources' | 'Administrative';
  timeAgo: string;
  title: string;
  description?: string;
  unread: boolean;
  actionType?: 'view_schedule' | 'download_receipt' | 'download_file';
  actionData?: {
    receiptNo?: string;
    fileName?: string;
    link?: string;
  };
}

export interface StudentProfile {
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  avatar: string;
  cgpa: number;
  attendancePercent: number;
  pendingDues: number;
  paidAmount: number;
  scholarshipAmount: number;
}

export interface Notice {
  id: string;
  title: string;
  category: 'Exam' | 'Event' | 'Academic' | 'Administrative';
  timeAgo: string;
  description: string;
  icon: string;
  badgeColor: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  dateMonth: string;
  dateDay: string;
  location: string;
  time: string;
  rsvpd?: boolean;
}

export interface SubjectResult {
  code: string;
  name: string;
  credits: number;
  internalMarks: number;
  maxInternalMarks: number;
  attendancePercent: number;
  grade: string;
  status: 'Pass' | 'Fail';
}

export interface FeeItem {
  id: string;
  title: string;
  amount: number;
  paid: number;
  balance: number;
  status: 'FULLY PAID' | 'PARTIALLY PAID' | 'UNPAID';
}

export interface PaymentReceipt {
  receiptNo: string;
  feeType: string;
  date: string;
  method: string;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  fileSize: string;
  category: 'Lecture Notes' | 'Assignments' | 'Lab Manuals';
  type: 'pdf' | 'ppt' | 'zip' | 'doc';
  downloadUrl?: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  subjectCode: string;
  subjectName: string;
  daysRemaining: number;
  status: 'Pending' | 'Submitted' | 'Graded';
  grade?: string;
}

export interface AttachedFile {
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: 'Pending' | 'Under Review' | 'Resolved';
  createdAt: string;
  attachedFiles: AttachedFile[];
}

export interface LostFoundItem {
  id: string;
  title: string;
  category: 'Electronics' | 'Personal Belongings' | 'Academic' | 'Accessories';
  type: 'lost' | 'found';
  location: string;
  reporter: string;
  timeAgo: string;
  image?: string;
  isOwnerListing?: boolean;
  inquiriesCount?: number;
  description: string;
}
