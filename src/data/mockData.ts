import {
  UserRole,
  UserProfile,
  StudentProfile,
  Notice,
  UpcomingEvent,
  SubjectResult,
  FeeItem,
  PaymentReceipt,
  ResourceItem,
  AssignmentItem,
  LostFoundItem,
  NotificationItem,
  SupportTicket,
} from '../types';

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: "Arjun Kumar",
  rollNo: "22CS045",
  department: "B.Tech Computer Science",
  semester: 4,
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMUbxGdkHVSZ3ExLFViQ2WuJt3jAhCi211Jr4YCk22x9irBQL36ad-P3jprwRH4dxZ58Nif7o_qwCynsoRVKddBbz-m6U09iJVXvkFpDoYsQcsEQHMUoyDxjCiQGBJs_mayg5bjLrfLUM1s4BwwS7kPsHB8w5tBAskQLTndg6It_m3Vv-cCD2jcficbH4mzUvEeZ-HJRTMHRv_bgeOka1EEZfWE7OpeXf82FEbNUugNl4q3jNcbA4U",
  cgpa: 8.6,
  attendancePercent: 87.5,
  pendingDues: 15000,
  paidAmount: 125000,
  scholarshipAmount: 20000,
};

export const DEFAULT_USER_PROFILES: Record<UserRole, UserProfile> = {
  student: {
    name: "Arjun Kumar",
    idNumber: "22CS045",
    role: "student",
    department: "B.Tech Computer Science",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMUbxGdkHVSZ3ExLFViQ2WuJt3jAhCi211Jr4YCk22x9irBQL36ad-P3jprwRH4dxZ58Nif7o_qwCynsoRVKddBbz-m6U09iJVXvkFpDoYsQcsEQHMUoyDxjCiQGBJs_mayg5bjLrfLUM1s4BwwS7kPsHB8w5tBAskQLTndg6It_m3Vv-cCD2jcficbH4mzUvEeZ-HJRTMHRv_bgeOka1EEZfWE7OpeXf82FEbNUugNl4q3jNcbA4U",
    email: "arjun.22cs045@siddhartha.ac.in",
  },
  faculty: {
    name: "Dr. Rajesh Sharma",
    idNumber: "FAC-1024",
    role: "faculty",
    department: "Dept. of Computer Science & Engg.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    email: "r.sharma@siddhartha.ac.in",
  },
  admin: {
    name: "Academic Controller",
    idNumber: "ADM-001",
    role: "admin",
    department: "Office of the Registrar",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250",
    email: "admin.erp@siddhartha.ac.in",
  },
};

export const INITIAL_NOTICES: Notice[] = [
  {
    id: "n1",
    title: "Mid-Semester Examination Schedule Published",
    category: "Exam",
    timeAgo: "2h ago",
    description: "The schedule for Semester 4 mid-terms is now available on the portal. All exams start from 10:00 AM.",
    icon: "assignment",
    badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    id: "n2",
    title: "Tech Symposium '24 Registrations Open",
    category: "Event",
    timeAgo: "Yesterday",
    description: "Register before Friday to secure early bird slots for AI/ML workshops and competitive coding.",
    icon: "campaign",
    badgeColor: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    id: "n3",
    title: "Library Extended Hours for End-Sem Prep",
    category: "Academic",
    timeAgo: "3 days ago",
    description: "Central Library will remain open until 2:00 AM on weekdays starting next Monday.",
    icon: "menu_book",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
];

export const INITIAL_EVENTS: UpcomingEvent[] = [
  {
    id: "e1",
    title: "Campus Placement Drive",
    dateMonth: "OCT",
    dateDay: "12",
    location: "Main Auditorium",
    time: "09:00 AM",
    rsvpd: false,
  },
  {
    id: "e2",
    title: "Hackathon Kickoff",
    dateMonth: "OCT",
    dateDay: "15",
    location: "CS Block • Lab 4",
    time: "02:00 PM",
    rsvpd: true,
  },
  {
    id: "e3",
    title: "IEEE Guest Lecture: Quantum Computing",
    dateMonth: "OCT",
    dateDay: "22",
    location: "Seminar Hall B",
    time: "11:30 AM",
    rsvpd: false,
  }
];

export const INTERNAL_RESULTS: SubjectResult[] = [
  {
    code: "CS401",
    name: "Design & Analysis of Algorithms",
    credits: 4,
    internalMarks: 28,
    maxInternalMarks: 30,
    attendancePercent: 89,
    grade: "A+",
    status: "Pass"
  },
  {
    code: "CS402",
    name: "Operating Systems",
    credits: 4,
    internalMarks: 26,
    maxInternalMarks: 30,
    attendancePercent: 85,
    grade: "A",
    status: "Pass"
  },
  {
    code: "CS403",
    name: "Database Management Systems",
    credits: 4,
    internalMarks: 27,
    maxInternalMarks: 30,
    attendancePercent: 88,
    grade: "A+",
    status: "Pass"
  },
  {
    code: "MA401",
    name: "Discrete Mathematics & Probability",
    credits: 3,
    internalMarks: 24,
    maxInternalMarks: 30,
    attendancePercent: 82,
    grade: "B+",
    status: "Pass"
  },
  {
    code: "CS405",
    name: "Computer Networks Lab",
    credits: 2,
    internalMarks: 19,
    maxInternalMarks: 20,
    attendancePercent: 94,
    grade: "O",
    status: "Pass"
  }
];

export const EXTERNAL_RESULTS: SubjectResult[] = [
  {
    code: "CS301",
    name: "Data Structures & Algorithms (Sem 3)",
    credits: 4,
    internalMarks: 88,
    maxInternalMarks: 100,
    attendancePercent: 91,
    grade: "A+",
    status: "Pass"
  },
  {
    code: "CS302",
    name: "Computer Organization & Architecture",
    credits: 4,
    internalMarks: 82,
    maxInternalMarks: 100,
    attendancePercent: 86,
    grade: "A",
    status: "Pass"
  },
  {
    code: "CS303",
    name: "Object Oriented Programming (Java)",
    credits: 4,
    internalMarks: 91,
    maxInternalMarks: 100,
    attendancePercent: 93,
    grade: "O",
    status: "Pass"
  }
];

export const INITIAL_FEES: FeeItem[] = [
  {
    id: "f1",
    title: "Tuition & Academic Fee",
    amount: 65000,
    paid: 50000,
    balance: 15000,
    status: "PARTIALLY PAID"
  },
  {
    id: "f2",
    title: "Bus Transport Fee",
    amount: 18000,
    paid: 18000,
    balance: 0,
    status: "FULLY PAID"
  },
  {
    id: "f3",
    title: "Semester Examination Fee",
    amount: 2500,
    paid: 2500,
    balance: 0,
    status: "FULLY PAID"
  }
];

export const INITIAL_PAYMENT_HISTORY: PaymentReceipt[] = [
  {
    receiptNo: "#RCP-9821",
    feeType: "Tuition Fee (Part 1)",
    date: "Jul 15, 2026",
    method: "UPI / PhonePe",
    amount: 50000,
    status: "SUCCESS"
  },
  {
    receiptNo: "#RCP-8842",
    feeType: "Bus Transport Fee",
    date: "Jun 10, 2026",
    method: "Credit Card",
    amount: 18000,
    status: "SUCCESS"
  },
  {
    receiptNo: "#RCP-7719",
    feeType: "Exam Fee",
    date: "Jul 02, 2026",
    method: "Net Banking",
    amount: 2500,
    status: "SUCCESS"
  }
];

export const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: "r1",
    title: "Dynamic Programming",
    subject: "Design & Analysis of Algorithms",
    faculty: "Prof. R. Sharma",
    fileSize: "2.4 MB",
    category: "Lecture Notes",
    type: "pdf"
  },
  {
    id: "r2",
    title: "Process Synchronization",
    subject: "Operating Systems",
    faculty: "Dr. A. Gupta",
    fileSize: "5.1 MB",
    category: "Lecture Notes",
    type: "ppt"
  },
  {
    id: "r3",
    title: "DBMS Lab Code Snippets",
    subject: "Database Management Systems",
    faculty: "Prof. M. Reddy",
    fileSize: "12.8 MB",
    category: "Lab Manuals",
    type: "zip"
  },
  {
    id: "r4",
    title: "B-Trees & Indexing Lecture Slides",
    subject: "Database Management Systems",
    faculty: "Prof. M. Reddy",
    fileSize: "3.7 MB",
    category: "Lecture Notes",
    type: "ppt"
  },
  {
    id: "r5",
    title: "Memory Management & Paging Notes",
    subject: "Operating Systems",
    faculty: "Dr. A. Gupta",
    fileSize: "4.2 MB",
    category: "Lecture Notes",
    type: "pdf"
  }
];

export const INITIAL_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: "a1",
    title: "Assignment 2: Graph Algorithms",
    subjectCode: "CS401",
    subjectName: "DAA - CS401",
    daysRemaining: 2,
    status: "Pending"
  },
  {
    id: "a2",
    title: "SQL Query Optimization",
    subjectCode: "CS403",
    subjectName: "DBMS - CS403",
    daysRemaining: 5,
    status: "Pending"
  },
  {
    id: "a3",
    title: "OS Lab 3: Paging Simulation",
    subjectCode: "CS402",
    subjectName: "OS Lab - CS402",
    daysRemaining: 0,
    status: "Graded",
    grade: "10/10"
  }
];

export const INITIAL_LOST_FOUND: LostFoundItem[] = [
  {
    id: "lf1",
    title: "Blue Boat Earbuds Case",
    category: "Electronics",
    type: "found",
    location: "Lab Block 2",
    reporter: "Prof. S. Rao",
    timeAgo: "2h ago",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBn2GRJ6FoBbuBFqrgVcoYU4cYLamiJCT5lMLgSXamCCxcGN1pTTQl8SKIbYLFQP7obYaO-U_WY8F2ROvePFX56C0uWnBak3nRMZOhRgp4oFnsrfdNctCDtET-SmXDWSOJ_oHEHo-dmmTzMU5PkjQuRGY426FkD55vKX_HnPLiCIvNPUWuHiyloFZRIma_94qC3KaEeu7AB2DKlbCHruJXhnYt-SORyBScvzzs5FmZ-yEsAveVIrmkb",
    description: "Dark blue Boat wireless earbuds charging case found near computer lab 3."
  },
  {
    id: "lf2",
    title: "Brown Leather Wallet",
    category: "Personal Belongings",
    type: "lost",
    location: "Library",
    reporter: "Ananya Sharma",
    timeAgo: "1d ago",
    description: "Contains student ID card and library card. Please return if found."
  },
  {
    id: "lf3",
    title: "Casio Calculator fx-991EX",
    category: "Academic",
    type: "found",
    location: "Canteen",
    reporter: "Arjun Kumar (You)",
    timeAgo: "3d ago",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9LEhv1eT1qYFSF1D7INXRePbIvzWsUcyhW1DSOCo8Y4m043vHbjxkXDMdTjdTxVSNbdijZb0l6iLBR4E_mYx5jLurPJE8SaRxnD-Bv5eAL1Z63kOYbJiQojXO8oxFFAAr6FSgROuoFS4D2juAeyYfAU_NGpqNcKE_w0NM17ZBQpacwO47SSwsUaVx780zTG-iOTNmf5UGvrp7Q7G-jAC9b4zUPAz3Citm4P4mKYBgGMXtO3nYdyiP",
    isOwnerListing: true,
    inquiriesCount: 1,
    description: "Scientific calculator left on table 14 in central canteen."
  },
  {
    id: "lf4",
    title: "Milton Blue Water Bottle",
    category: "Accessories",
    type: "lost",
    location: "Sports Complex",
    reporter: "Dr. K. Patel",
    timeAgo: "2 days ago",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDT3Qgesob3-YevgXCqFMIz8a7azcSxrUDc3H3PLHGC_mBzapjrVNykJNezlv1_sOmuFX5LQXvNNth-PyIV_Zj_FHlaFocdgUV-6Z0p8rykQ-XapAb2YFukINHQcEKblDaJRKkCs5RnvpDSkyqqdo_dOmAdwdocJoz3DiEgTtBXG75JMueHIXAxGi2-xGHJ85B2spt-RzTbxfivn4MgAhbXlmhnFJ270lmwUYSMYocZ2vY4wQMKBaNW",
    description: "Insulated blue stainless steel water bottle with CS dept sticker."
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-4081',
    category: 'Fee Payment Discrepancy',
    subject: 'Tuition Fee Payment Status Pending after Bank Debit',
    description: 'My bank account was debited for Rs 12,500 on July 28th, but the portal still displays payment as pending. Attached is my bank transaction receipt.',
    status: 'Under Review',
    createdAt: '2 days ago',
    attachedFiles: [
      {
        name: 'Bank_Statement_July28.pdf',
        size: '1.2 MB',
        type: 'application/pdf',
      },
    ],
  },
  {
    id: 'TCK-3920',
    category: 'Academic Portal Access',
    subject: 'Attendance Discrepancy in CS302 Database Systems',
    description: 'Attendance on July 14th was marked absent despite being present for full lecture. Professor confirmed attendance sheet correction.',
    status: 'Resolved',
    createdAt: '1 week ago',
    attachedFiles: [
      {
        name: 'Class_Attendance_Sheet_Proof.png',
        size: '840 KB',
        type: 'image/png',
      },
    ],
  },
];

export const getMockDataForSemester = (semester: number) => {
  const isCurrent = semester === INITIAL_STUDENT_PROFILE.semester;
  
  const variedInternalResults: SubjectResult[] = INTERNAL_RESULTS.map((res, i) => ({
    ...res,
    code: res.code.replace(/([0-9])/, `${semester}`),
    internalMarks: isCurrent ? res.internalMarks : Math.min(res.maxInternalMarks, res.internalMarks + (semester % 3) * 2),
    attendancePercent: isCurrent ? res.attendancePercent : Math.min(100, res.attendancePercent + (semester % 2) * 5),
  }));

  const variedExternalResults: SubjectResult[] = EXTERNAL_RESULTS.map((res, i) => ({
    ...res,
    code: res.code.replace(/([0-9])/, `${Math.max(1, semester - 1)}`),
    name: res.name.replace(/Sem \d/, `Sem ${Math.max(1, semester - 1)}`),
  }));

  const variedFees: FeeItem[] = INITIAL_FEES.map((fee) => ({
    ...fee,
    paid: isCurrent ? fee.paid : fee.amount,
    balance: isCurrent ? fee.balance : 0,
    status: isCurrent ? fee.status : 'FULLY PAID'
  }));

  const variedHistory: PaymentReceipt[] = INITIAL_PAYMENT_HISTORY.map((h, i) => ({
    ...h,
    receiptNo: `#RCP-${9000 - semester * 100 + i}`,
  }));

  const variedNotices: Notice[] = INITIAL_NOTICES.map(n => ({
    ...n,
    description: n.description.replace(/Semester \d/, `Semester ${semester}`)
  }));

  return {
    internalResults: variedInternalResults,
    externalResults: variedExternalResults,
    fees: variedFees,
    history: variedHistory,
    notices: variedNotices,
  };
};
export const INITIAL_NOTIFICATION_FEED: NotificationItem[] = [
  {
    id: 'notif_1',
    category: 'Academic',
    timeAgo: '2h ago',
    title: 'Mid-Semester Examination Schedule for Semester 4 has been published.',
    unread: true,
    actionType: 'view_schedule',
  },
  {
    id: 'notif_2',
    category: 'Financial',
    timeAgo: 'Yesterday',
    title: 'Payment Confirmation: Receipt #RCP-9821 generated for Tuition Fee.',
    unread: true,
    actionType: 'download_receipt',
    actionData: {
      receiptNo: '#RCP-9821',
    },
  },
  {
    id: 'notif_3',
    category: 'Lost & Found',
    timeAgo: '3d ago',
    title: "New match reported for Lost Item: 'Casio Scientific Calculator'.",
    unread: false,
  },
  {
    id: 'notif_4',
    category: 'Resources',
    timeAgo: '4d ago',
    title: 'Dr. R. Sharma uploaded Module 3: Dynamic Programming PDF.',
    unread: false,
    actionType: 'download_file',
    actionData: {
      fileName: 'DP_Module_3_v2.pdf',
    },
  },
];

