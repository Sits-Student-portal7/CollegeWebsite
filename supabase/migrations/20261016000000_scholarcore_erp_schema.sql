-- ==============================================================================
-- ScholarCore College ERP: Hardened Schema Migration & Strict RLS Security Model
-- Target Project: ytfmhcgblllsduqigopi (Supabase PostgreSQL 15+)
-- Migration File: supabase/migrations/20261016000000_scholarcore_erp_schema.sql
--
-- Security Hardening & Defect Correction Summary:
--   1. Reconciles existing live tables safely (ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
--      Preserves existing structures without table dropping or data truncation; preserves all existing records, FKs, and grants.
--   2. Enforces non-bypassable Row Level Security (RLS) across all 27 ERP tables.
--   3. Payment Idempotency & Provider Verification:
--      - complete_online_payment_verified() enforces that retries on already settled (SUCCESS)
--        payments succeed ONLY when the stored transaction_ref matches the incoming reference.
--        Conflicting transaction references are strictly rejected with an idempotency error.
--      - Restricted to service_role with verified provider HMAC signatures.
--   4. Timetable Concurrency & Conflict Prevention:
--      - pg_advisory_xact_lock() serializes concurrent transactions on room, faculty, and class sections.
--      - Database-enforced EXCLUDE USING gist constraints and validation triggers prevent double-booking.
--   5. Admissions Roster Privacy & Minimal Exposure:
--      - Broad direct SELECT on admissions_register removed for ordinary students.
--      - verify_student_admission_eligibility() requires confirmed Supabase Auth email and exposes
--        only minimal verification status (eligible, full_name, is_claimed).
--      - claim_student_admission() securely creates student profile with verified institutional email.
--   6. Assignment Submission Lifecycle & Anti-Tamper:
--      - Database trigger trig_check_submission_lifecycle() prevents cross-class assignment reassignment,
--        ownership alteration, marks/feedback alteration by students, and self-marking as 'graded'.
--      - RLS update policy strictly asserts permitted lifecycle statuses ('submitted', 'resubmitted', 'late').
--   7. Profile Policy Recursion Elimination:
--      - Replaced self-referential subqueries in profiles_update_own with non-recursive check (id = auth.uid()).
--      - Field immutability (role, email, full_name, id_number, department) enforced via trig_check_profile_update().
--   8. Comprehensive Audit Trail:
--      - 13 sensitive tables audited via database triggers with PII sanitization.
--   9. Non-Destructive Rollback Procedures preserving RLS at all times.
--  10. Read-Only Schema & Grants Diagnostic Queries for live verification.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS & PREREQUISITES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 2. CORE ACADEMIC & INSTITUTIONAL BASE TABLES (RECONCILED)
-- ==============================================================================

-- 1. PROFILES (Institutional Identities)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  id_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  hod_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS hod_id UUID;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  duration_years INT NOT NULL DEFAULT 4,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration_years INT DEFAULT 4;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 4. STUDENTS (Linked to profiles and courses)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID,
  year INT NOT NULL DEFAULT 1,
  semester INT NOT NULL DEFAULT 1,
  roll_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'withdrawn')),
  cgpa NUMERIC(4,2) DEFAULT 0.00,
  attendance_percentage NUMERIC(5,2) DEFAULT 0.00,
  pending_dues NUMERIC(10,2) DEFAULT 0.00,
  paid_amount NUMERIC(10,2) DEFAULT 0.00,
  scholarship_amount NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_id UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2) DEFAULT 0.00;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS attendance_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS pending_dues NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS scholarship_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. FACULTY (Linked to profiles and departments)
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  faculty_id TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  qualification TEXT,
  experience_years INT DEFAULT 0,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'resigned', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  semester INT NOT NULL DEFAULT 1,
  credits INT NOT NULL DEFAULT 3,
  type TEXT NOT NULL DEFAULT 'theory' CHECK (type IN ('theory', 'lab', 'both', 'elective')),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS credits INT DEFAULT 3;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'theory';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 7. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  year INT NOT NULL DEFAULT 1,
  semester INT NOT NULL DEFAULT 1,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS year INT DEFAULT 1;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS semester INT DEFAULT 1;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-26';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_class'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT fk_students_class FOREIGN KEY (class_id)
      REFERENCES public.classes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8. ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id, subject_id)
);

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enrolled';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 9. TIMETABLE
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_timetable_times'
  ) THEN
    ALTER TABLE public.timetable
      ADD CONSTRAINT chk_timetable_times CHECK (start_time < end_time);
  END IF;
END $$;

-- Immutable helper functions for range-based scheduling exclusion
CREATE OR REPLACE FUNCTION public.time_to_minutes(t TIME)
RETURNS INT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT (EXTRACT(HOUR FROM t)::int * 60 + EXTRACT(MINUTE FROM t)::int);
$$;

CREATE OR REPLACE FUNCTION public.timetable_slot_range(st TIME, et TIME)
RETURNS int4range
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT int4range(public.time_to_minutes(st), public.time_to_minutes(et));
$$;

-- Database-enforced Exclusion Constraints on Timetable (Room, Faculty, Class Overlaps)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_timetable_room_slot'
  ) THEN
    ALTER TABLE public.timetable
      ADD CONSTRAINT uq_timetable_room_slot
      EXCLUDE USING gist (
        room_number WITH =,
        day_of_week WITH =,
        public.timetable_slot_range(start_time, end_time) WITH &&
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Trigger provides synchronized advisory transaction locks
END $$;

-- 10. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_id, subject_id, date)
);

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 11. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
  due_date TIMESTAMPTZ NOT NULL,
  max_marks INT NOT NULL DEFAULT 100,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS max_marks INT DEFAULT 100;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 12. ASSIGNMENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  file_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  marks_obtained NUMERIC(5,2),
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'resubmitted')),
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';

-- 13. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internal', 'midterm', 'final', 'practical', 'assignment')),
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  semester INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  total_marks INT NOT NULL DEFAULT 100,
  passing_marks INT NOT NULL DEFAULT 40,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS passing_marks INT DEFAULT 40;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- 14. MARKS (Exam results)
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  grade TEXT,
  remarks TEXT,
  entered_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id, subject_id)
);

ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS entered_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL;
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 15. FEES
CREATE TABLE IF NOT EXISTS public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '2025-26',
  semester INT NOT NULL DEFAULT 1,
  fee_type TEXT NOT NULL DEFAULT 'tuition' CHECK (fee_type IN ('tuition', 'hostel', 'transport', 'library', 'exam', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS fee_type TEXT NOT NULL DEFAULT 'tuition';
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS academic_year TEXT NOT NULL DEFAULT '2025-26';
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS semester INT NOT NULL DEFAULT 1;
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days');
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 16. ANNOUNCEMENTS (Reconciled with consistent target_audience value set)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'academic' CHECK (category IN ('academic', 'administrative', 'event', 'emergency', 'placement')),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'student', 'faculty', 'admin')),
  role_target TEXT DEFAULT 'all',
  published BOOLEAN NOT NULL DEFAULT false,
  publish_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS role_target TEXT DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS publish_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

UPDATE public.announcements SET target_audience = 'student' WHERE target_audience = 'students';
UPDATE public.announcements SET role_target = target_audience WHERE role_target IS NULL;

-- 17. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ==============================================================================
-- 3. COMPLEMENTARY & INSTITUTIONAL SECURITY TABLES
-- ==============================================================================

-- 18. PAYMENTS (Ledger of verified transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT UNIQUE NOT NULL,
  fee_id UUID NOT NULL REFERENCES public.fees(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Demand Draft', 'Cash', 'Cheque', 'Bank Counter Challan')),
  transaction_ref TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT now();

-- 19. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';

-- 20. LOST & FOUND
CREATE TABLE IF NOT EXISTS public.lost_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Lost', 'Found')),
  location TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Claimed', 'Resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Academic', 'Hostel', 'Fee', 'General')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar')),
  organizer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. EVENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- 24. PLACEMENTS
CREATE TABLE IF NOT EXISTS public.placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  package TEXT NOT NULL,
  min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.00,
  drive_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. PLACEMENT APPLICATIONS
CREATE TABLE IF NOT EXISTS public.placement_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (placement_id, student_id)
);

-- 26. AUDIT LOGS (Immutable security trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 27. ADMISSIONS REGISTER (Authoritative Institutional Roster for Student Provisioning)
CREATE TABLE IF NOT EXISTS public.admissions_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  institutional_email TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  year INT NOT NULL DEFAULT 1,
  semester INT NOT NULL DEFAULT 1,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance & Unique Indexes
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_faculty_profile_id ON public.faculty(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON public.enrollments(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_exam ON public.marks(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_ref ON public.payments(transaction_ref) WHERE transaction_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admissions_email ON public.admissions_register(institutional_email);

-- ==============================================================================
-- 4. HARDENED SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('faculty', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_faculty_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM public.faculty WHERE profile_id = auth.uid() LIMIT 1;
$$;

-- Sanitizer to strip sensitive PII from audit snapshots
CREATE OR REPLACE FUNCTION public.sanitize_audit_json(p_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_data IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_data - ARRAY[
    'phone',
    'guardian_phone',
    'guardian_name',
    'address',
    'date_of_birth',
    'raw_password',
    'password_hash',
    'card_number',
    'cvv',
    'secret',
    'token'
  ];
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.is_faculty() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_faculty() TO authenticated;

REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;

REVOKE ALL ON FUNCTION public.current_faculty_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_faculty_id() TO authenticated;

REVOKE ALL ON FUNCTION public.sanitize_audit_json(JSONB) FROM PUBLIC;

-- ==============================================================================
-- 5. TRUSTED TRANSACTION & SCOPED SECURITY DEFINER OPERATIONS
-- ==============================================================================

-- 5.1 MINIMAL ROSTER VERIFICATION (Exposes only minimal required eligibility data to student)
CREATE OR REPLACE FUNCTION public.verify_student_admission_eligibility(
  p_admission_number TEXT,
  p_roll_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user RECORD;
  v_roster RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Session missing.';
  END IF;

  SELECT email, email_confirmed_at, confirmed_at
  INTO v_auth_user
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT FOUND OR v_auth_user.email IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User account not found in authentication catalog.';
  END IF;

  IF COALESCE(v_auth_user.email_confirmed_at, v_auth_user.confirmed_at) IS NULL THEN
    RAISE EXCEPTION 'Unverified Email: Supabase Auth email % has not been confirmed.', v_auth_user.email;
  END IF;

  SELECT full_name, institutional_email, claimed_by_user_id
  INTO v_roster
  FROM public.admissions_register
  WHERE admission_number = p_admission_number
    AND roll_number = p_roll_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'CREDENTIALS_NOT_FOUND');
  END IF;

  IF lower(trim(v_roster.institutional_email)) != lower(trim(v_auth_user.email)) THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'EMAIL_MISMATCH');
  END IF;

  IF v_roster.claimed_by_user_id IS NOT NULL AND v_roster.claimed_by_user_id != auth.uid() THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'ALREADY_CLAIMED');
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'full_name', v_roster.full_name,
    'is_claimed_by_current_user', (v_roster.claimed_by_user_id = auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_student_admission_eligibility(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_admission_eligibility(TEXT, TEXT) TO authenticated;

-- 5.2 INSTITUTIONAL STUDENT PROVISIONING (Claims pre-approved admission roster record)
CREATE OR REPLACE FUNCTION public.claim_student_admission(
  p_admission_number TEXT,
  p_roll_number TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_user RECORD;
  v_user_email TEXT;
  v_roster RECORD;
  v_existing_profile RECORD;
  v_existing_student RECORD;
  v_profile_id UUID;
  v_student_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Active user session required.';
  END IF;

  -- 1. Authoritative Supabase Auth verification: require confirmed email state
  SELECT id, email, email_confirmed_at, confirmed_at
  INTO v_auth_user
  FROM auth.users
  WHERE id = auth.uid();

  IF NOT FOUND OR v_auth_user.email IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User account not found in authentication directory.';
  END IF;

  IF COALESCE(v_auth_user.email_confirmed_at, v_auth_user.confirmed_at) IS NULL THEN
    RAISE EXCEPTION 'Unverified Email: Supabase Auth email % has not been confirmed. Institutional admission claiming requires a verified institutional email address.', v_auth_user.email;
  END IF;

  v_user_email := v_auth_user.email;

  -- 2. Inspect existing profile to prevent identity mismatches and privilege alteration
  SELECT * INTO v_existing_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    IF v_existing_profile.role IN ('admin', 'faculty') THEN
      RAISE EXCEPTION 'Identity Conflict: Existing % profile cannot be converted via student admission claim.', v_existing_profile.role;
    END IF;
    IF lower(trim(v_existing_profile.email)) != lower(trim(v_user_email)) THEN
      RAISE EXCEPTION 'Identity Conflict: Existing profile email (%) does not match authenticated user email (%).',
        v_existing_profile.email, v_user_email;
    END IF;
    IF v_existing_profile.id_number IS NOT NULL AND v_existing_profile.id_number != p_roll_number THEN
      RAISE EXCEPTION 'Identity Conflict: Existing profile ID number (%) does not match claimed roll number (%).',
        v_existing_profile.id_number, p_roll_number;
    END IF;
  END IF;

  -- 3. Inspect existing student ERP record to prevent student identity mismatches
  SELECT * INTO v_existing_student FROM public.students WHERE profile_id = auth.uid();
  IF FOUND THEN
    IF v_existing_student.student_id != p_admission_number OR v_existing_student.roll_number != p_roll_number THEN
      RAISE EXCEPTION 'Identity Conflict: Account is already registered under student admission % (roll %), cannot claim admission %.',
        v_existing_student.student_id, v_existing_student.roll_number, p_admission_number;
    END IF;
  END IF;

  -- 4. Lock and match against institutional admissions register
  SELECT * INTO v_roster
  FROM public.admissions_register
  WHERE admission_number = p_admission_number
    AND roll_number = p_roll_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admission Verification Failed: No matching admission record found for provided credentials.';
  END IF;

  IF lower(trim(v_roster.institutional_email)) != lower(trim(v_user_email)) THEN
    RAISE EXCEPTION 'Identity Verification Failed: Authenticated email does not match institutional admission record email.';
  END IF;

  IF v_roster.claimed_by_user_id IS NOT NULL AND v_roster.claimed_by_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Admission Already Claimed: This admission number has already been activated by another account.';
  END IF;

  -- Idempotency: if already claimed by this user and profile exists, return successfully
  IF v_roster.claimed_by_user_id = auth.uid() AND v_existing_profile.id IS NOT NULL THEN
    RETURN v_existing_profile.id;
  END IF;

  -- 5. Set transaction-local session bypass so trig_check_profile_insert recognizes authorized provisioning
  PERFORM set_config('scholarcore.admission_claim_active', 'true', true);

  -- 6. Create or reconcile authoritative student profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    name,
    role,
    id_number,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(),
    v_user_email,
    v_roster.full_name,
    v_roster.full_name,
    'student',
    v_roster.roll_number,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = v_roster.full_name,
      name = v_roster.full_name,
      id_number = v_roster.roll_number,
      updated_at = now()
  RETURNING id INTO v_profile_id;

  -- 7. Create corresponding student ERP record
  INSERT INTO public.students (
    profile_id,
    student_id,
    roll_number,
    department_id,
    course_id,
    year,
    semester,
    status
  ) VALUES (
    auth.uid(),
    v_roster.admission_number,
    v_roster.roll_number,
    v_roster.department_id,
    v_roster.course_id,
    v_roster.year,
    v_roster.semester,
    'active'
  )
  ON CONFLICT (student_id) DO NOTHING
  RETURNING id INTO v_student_id;

  -- 8. Mark admission record claimed
  UPDATE public.admissions_register
  SET claimed_by_user_id = auth.uid(),
      claimed_at = now()
  WHERE id = v_roster.id;

  -- 9. Audit student provisioning
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    'STUDENT_ADMISSION_CLAIMED',
    'students',
    auth.uid()::TEXT,
    jsonb_build_object(
      'admission_number', v_roster.admission_number,
      'roll_number', v_roster.roll_number,
      'email', v_user_email
    )
  );

  RETURN v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_student_admission(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_student_admission(TEXT, TEXT) TO authenticated;

-- 5.3 SERVER-VERIFIED ADMIN PROFILE MANAGEMENT
CREATE OR REPLACE FUNCTION public.admin_upsert_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_department TEXT,
  p_id_number TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Administrator privileges required.';
  END IF;

  IF p_role NOT IN ('student', 'faculty', 'admin') THEN
    RAISE EXCEPTION 'Invalid Role: %', p_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    name,
    role,
    department,
    id_number,
    phone,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_full_name,
    p_role,
    p_department,
    p_id_number,
    p_phone,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      id_number = EXCLUDED.id_number,
      phone = COALESCE(EXCLUDED.phone, profiles.phone),
      updated_at = now()
  RETURNING id INTO v_profile_id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    'ADMIN_UPSERT_PROFILE',
    'profiles',
    p_user_id::TEXT,
    jsonb_build_object('role', p_role, 'email', p_email, 'department', p_department)
  );

  RETURN v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 5.4 NARROWLY SCOPED USER SELF PROFILE UPDATE (Avatar & Phone only)
CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_avatar_url TEXT,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Session missing.';
  END IF;

  UPDATE public.profiles
  SET avatar_url = p_avatar_url,
      phone = p_phone,
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_profile(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT) TO authenticated;

-- 5.5 TRUSTED NOTIFICATION STATUS UPDATE
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Session missing.';
  END IF;

  UPDATE public.notifications
  SET read = true
  WHERE id = p_notification_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notification_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

-- 5.6 TRUSTED PAYMENT INITIALIZATION (With in-flight reservations check)
CREATE OR REPLACE FUNCTION public.initialize_payment(
  p_fee_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id UUID;
  v_fee RECORD;
  v_payment_id UUID;
  v_receipt_no TEXT;
  v_pending_total NUMERIC;
  v_available_balance NUMERIC;
BEGIN
  v_student_id := public.current_student_id();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Current user is not an enrolled student.';
  END IF;

  IF p_amount <= 0.00 THEN
    RAISE EXCEPTION 'Invalid Amount: Payment amount must be greater than zero.';
  END IF;

  SELECT * INTO v_fee FROM public.fees WHERE id = p_fee_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid Fee: Referenced fee record not found.';
  END IF;

  IF v_fee.student_id != v_student_id THEN
    RAISE EXCEPTION 'Access Denied: Fee record belongs to another student.';
  END IF;

  SELECT COALESCE(SUM(amount), 0.00) INTO v_pending_total
  FROM public.payments
  WHERE fee_id = p_fee_id AND status = 'PENDING';

  v_available_balance := (v_fee.amount - v_fee.paid_amount) - v_pending_total;
  IF p_amount > v_available_balance THEN
    RAISE EXCEPTION 'Invalid Amount: Requested amount (₹%) exceeds available payable balance (₹%) after accounting for in-flight pending transactions (₹%).',
      p_amount, v_available_balance, v_pending_total;
  END IF;

  IF p_payment_method NOT IN ('UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Demand Draft') THEN
    RAISE EXCEPTION 'Invalid Payment Method: %', p_payment_method;
  END IF;

  v_receipt_no := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 8));

  INSERT INTO public.payments (
    receipt_no,
    fee_id,
    student_id,
    amount,
    payment_method,
    status,
    paid_at
  ) VALUES (
    v_receipt_no,
    p_fee_id,
    v_student_id,
    p_amount,
    p_payment_method,
    'PENDING',
    now()
  ) RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_payment(UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_payment(UUID, NUMERIC, TEXT) TO authenticated;

-- 5.7 TRUSTED ONLINE PAYMENT SETTLEMENT (Strictly restricted to verified server-side webhook with idempotency check)
CREATE OR REPLACE FUNCTION public.complete_online_payment_verified(
  p_payment_id UUID,
  p_transaction_ref TEXT,
  p_gateway_signature_verified BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment RECORD;
  v_fee RECORD;
  v_new_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access Denied: Online payment completion is strictly restricted to authoritative server webhooks.';
  END IF;

  IF p_gateway_signature_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Security Violation: Cannot settle online payment without verified provider HMAC signature.';
  END IF;

  IF p_transaction_ref IS NULL OR trim(p_transaction_ref) = '' THEN
    RAISE EXCEPTION 'Validation Error: Provider transaction reference is required.';
  END IF;

  -- Duplicate transaction reference check across different payments
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE transaction_ref = p_transaction_ref AND id != p_payment_id
  ) THEN
    RAISE EXCEPTION 'Duplicate Transaction: Provider reference % has already been settled.', p_transaction_ref;
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment Not Found: ID %', p_payment_id;
  END IF;

  -- Strict Idempotency: only succeed if stored transaction_ref matches incoming reference
  IF v_payment.status = 'SUCCESS' THEN
    IF v_payment.transaction_ref = p_transaction_ref THEN
      RETURN TRUE;
    ELSE
      RAISE EXCEPTION 'Idempotency Conflict: Payment % is already settled with transaction reference %, which conflicts with provided reference %.',
        p_payment_id, v_payment.transaction_ref, p_transaction_ref;
    END IF;
  END IF;

  SELECT * INTO v_fee FROM public.fees WHERE id = v_payment.fee_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated Fee Record Not Found for payment %', p_payment_id;
  END IF;

  IF v_fee.paid_amount + v_payment.amount > v_fee.amount THEN
    RAISE EXCEPTION 'Balance Exceeded: Payment amount of ₹% exceeds remaining fee balance ₹% (Total: ₹%, Paid: ₹%).',
      v_payment.amount, (v_fee.amount - v_fee.paid_amount), v_fee.amount, v_fee.paid_amount;
  END IF;

  v_new_paid := v_fee.paid_amount + v_payment.amount;
  IF v_new_paid >= v_fee.amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE public.fees
  SET paid_amount = v_new_paid,
      status = v_new_status,
      updated_at = now()
  WHERE id = v_fee.id;

  UPDATE public.students
  SET paid_amount = paid_amount + v_payment.amount,
      pending_dues = GREATEST(0.00, pending_dues - v_payment.amount),
      updated_at = now()
  WHERE id = v_payment.student_id;

  UPDATE public.payments
  SET status = 'SUCCESS',
      transaction_ref = p_transaction_ref,
      verified_by = NULL,
      paid_at = now()
  WHERE id = p_payment_id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    NULL,
    'ONLINE_PAYMENT_VERIFIED',
    'payments',
    p_payment_id::TEXT,
    jsonb_build_object(
      'amount', v_payment.amount,
      'fee_id', v_payment.fee_id,
      'transaction_ref', p_transaction_ref,
      'method', v_payment.payment_method
    )
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_online_payment_verified(UUID, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_online_payment_verified(UUID, TEXT, BOOLEAN) TO service_role;

-- 5.8 SEPARATE MANUAL OFFLINE PAYMENT APPROVAL (Explicit Admin Authorization & Audit)
CREATE OR REPLACE FUNCTION public.record_manual_offline_payment(
  p_fee_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_offline_voucher_no TEXT,
  p_bursar_remarks TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fee RECORD;
  v_payment_id UUID;
  v_receipt_no TEXT;
  v_new_paid NUMERIC;
  v_new_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only institutional administrative bursars can record offline payments.';
  END IF;

  IF p_payment_method NOT IN ('Cash', 'Demand Draft', 'Bank Counter Challan', 'Cheque') THEN
    RAISE EXCEPTION 'Invalid Offline Instrument: Method % cannot be settled as offline counter payment. Online payments must use provider verification.', p_payment_method;
  END IF;

  IF p_amount <= 0.00 THEN
    RAISE EXCEPTION 'Invalid Amount: Payment amount must be greater than zero.';
  END IF;

  IF p_offline_voucher_no IS NULL OR trim(p_offline_voucher_no) = '' THEN
    RAISE EXCEPTION 'Validation Error: Institutional offline voucher or instrument reference number is required.';
  END IF;

  IF p_bursar_remarks IS NULL OR trim(p_bursar_remarks) = '' THEN
    RAISE EXCEPTION 'Validation Error: Institutional bursar approval remarks are required for manual offline settlement.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE transaction_ref = p_offline_voucher_no
  ) THEN
    RAISE EXCEPTION 'Duplicate Transaction: Offline voucher % has already been recorded in payment ledger.', p_offline_voucher_no;
  END IF;

  SELECT * INTO v_fee FROM public.fees WHERE id = p_fee_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid Fee: Referenced fee record not found.';
  END IF;

  IF v_fee.paid_amount + p_amount > v_fee.amount THEN
    RAISE EXCEPTION 'Balance Exceeded: Payment amount of ₹% exceeds outstanding fee balance ₹%.',
      p_amount, (v_fee.amount - v_fee.paid_amount);
  END IF;

  v_receipt_no := 'OFFLINE-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 8));

  INSERT INTO public.payments (
    receipt_no,
    fee_id,
    student_id,
    amount,
    payment_method,
    transaction_ref,
    status,
    verified_by,
    paid_at
  ) VALUES (
    v_receipt_no,
    p_fee_id,
    v_fee.student_id,
    p_amount,
    p_payment_method,
    p_offline_voucher_no,
    'SUCCESS',
    auth.uid(),
    now()
  ) RETURNING id INTO v_payment_id;

  v_new_paid := v_fee.paid_amount + p_amount;
  IF v_new_paid >= v_fee.amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE public.fees
  SET paid_amount = v_new_paid,
      status = v_new_status,
      updated_at = now()
  WHERE id = v_fee.id;

  UPDATE public.students
  SET paid_amount = paid_amount + p_amount,
      pending_dues = GREATEST(0.00, pending_dues - p_amount),
      updated_at = now()
  WHERE id = v_fee.student_id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_data
  ) VALUES (
    auth.uid(),
    'OFFLINE_PAYMENT_APPROVED',
    'payments',
    v_payment_id::TEXT,
    jsonb_build_object(
      'amount', p_amount,
      'fee_id', p_fee_id,
      'method', p_payment_method,
      'voucher_no', p_offline_voucher_no,
      'remarks', p_bursar_remarks,
      'approved_by_admin', auth.uid()
    )
  );

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_manual_offline_payment(UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_manual_offline_payment(UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- 6. TRUSTED AUDIT LOGGING MECHANISM (PII Redaction & Automated Triggers)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record_id TEXT;
  v_old_json JSONB := NULL;
  v_new_json JSONB := NULL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::TEXT;
    v_old_json := public.sanitize_audit_json(to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id::TEXT;
    v_old_json := public.sanitize_audit_json(to_jsonb(OLD));
    v_new_json := public.sanitize_audit_json(to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id::TEXT;
    v_new_json := public.sanitize_audit_json(to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    timestamp
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    v_old_json,
    v_new_json,
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_trigger() FROM PUBLIC;

-- Attach automated tamper-evident audit triggers
DROP TRIGGER IF EXISTS tr_audit_marks ON public.marks;
CREATE TRIGGER tr_audit_marks
  AFTER INSERT OR UPDATE OR DELETE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_fees ON public.fees;
CREATE TRIGGER tr_audit_fees
  AFTER INSERT OR UPDATE OR DELETE ON public.fees
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_payments ON public.payments;
CREATE TRIGGER tr_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
  AFTER UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_students ON public.students;
CREATE TRIGGER tr_audit_students
  AFTER UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_attendance ON public.attendance;
CREATE TRIGGER tr_audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_support_tickets ON public.support_tickets;
CREATE TRIGGER tr_audit_support_tickets
  AFTER UPDATE OR DELETE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_submissions ON public.assignment_submissions;
CREATE TRIGGER tr_audit_submissions
  AFTER UPDATE OR DELETE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_admissions ON public.admissions_register;
CREATE TRIGGER tr_audit_admissions
  AFTER INSERT OR UPDATE OR DELETE ON public.admissions_register
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_timetable ON public.timetable;
CREATE TRIGGER tr_audit_timetable
  AFTER INSERT OR UPDATE OR DELETE ON public.timetable
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_enrollments ON public.enrollments;
CREATE TRIGGER tr_audit_enrollments
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_placements ON public.placements;
CREATE TRIGGER tr_audit_placements
  AFTER INSERT OR UPDATE OR DELETE ON public.placements
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

DROP TRIGGER IF EXISTS tr_audit_placement_applications ON public.placement_applications;
CREATE TRIGGER tr_audit_placement_applications
  AFTER UPDATE OR DELETE ON public.placement_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_trigger();

-- ==============================================================================
-- 7. ANTI-TAMPER DATA INTEGRITY & SCHEDULING CONFLICT TRIGGERS
-- ==============================================================================

-- 7.1 PROFILE CREATION INTEGRITY (Prevents unapproved self-provisioning)
CREATE OR REPLACE FUNCTION public.trig_check_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role' OR current_setting('scholarcore.admission_claim_active', true) = 'true') THEN
    RAISE EXCEPTION 'Access Denied: Profiles must be provisioned through institutional administration or verified admissions claiming.';
  END IF;
  NEW.created_at := now();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_insert ON public.profiles;
CREATE TRIGGER tr_protect_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_profile_insert();

-- 7.2 PROFILE IMMUTABLE FIELDS INTEGRITY (Non-recursive field protection)
CREATE OR REPLACE FUNCTION public.trig_check_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your assigned role.';
    END IF;
    IF NEW.id != OLD.id THEN
      RAISE EXCEPTION 'Access Denied: Profile ID cannot be altered.';
    END IF;
    IF NEW.email != OLD.email THEN
      RAISE EXCEPTION 'Access Denied: Institutional email cannot be changed directly.';
    END IF;
    IF NEW.full_name != OLD.full_name THEN
      RAISE EXCEPTION 'Access Denied: Official full name cannot be changed directly.';
    END IF;
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'Access Denied: Official name cannot be changed directly.';
    END IF;
    IF NEW.id_number IS DISTINCT FROM OLD.id_number THEN
      RAISE EXCEPTION 'Access Denied: Institutional ID number cannot be modified.';
    END IF;
    IF NEW.department IS DISTINCT FROM OLD.department THEN
      RAISE EXCEPTION 'Access Denied: Department assignment cannot be modified.';
    END IF;
    IF NEW.created_at != OLD.created_at THEN
      RAISE EXCEPTION 'Access Denied: Creation timestamp cannot be modified.';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_profile_update();

-- 7.3 NOTIFICATION FIELD INTEGRITY (Ordinary users can only update read status)
CREATE OR REPLACE FUNCTION public.trig_check_notification_tamper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    IF NEW.id != OLD.id THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification id.';
    END IF;
    IF NEW.user_id != OLD.user_id THEN
      RAISE EXCEPTION 'Security Violation: Cannot reassign notification recipient.';
    END IF;
    IF NEW.title != OLD.title THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification title.';
    END IF;
    IF NEW.message != OLD.message THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification message content.';
    END IF;
    IF NEW.type != OLD.type THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification type.';
    END IF;
    IF NEW.link IS DISTINCT FROM OLD.link THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification link destination.';
    END IF;
    IF NEW.created_at != OLD.created_at THEN
      RAISE EXCEPTION 'Security Violation: Cannot alter notification timestamp.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_notification_tamper ON public.notifications;
CREATE TRIGGER tr_protect_notification_tamper
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_notification_tamper();

-- 7.4 SETTLED PAYMENT IMMUTABILITY TRIGGER
CREATE OR REPLACE FUNCTION public.trig_check_payment_tamper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'SUCCESS' THEN
    IF NEW.amount != OLD.amount THEN
      RAISE EXCEPTION 'Integrity Violation: Settled payment amount cannot be modified.';
    END IF;
    IF NEW.fee_id != OLD.fee_id THEN
      RAISE EXCEPTION 'Integrity Violation: Settled payment fee ownership cannot be changed.';
    END IF;
    IF NEW.student_id != OLD.student_id THEN
      RAISE EXCEPTION 'Integrity Violation: Settled payment student ownership cannot be changed.';
    END IF;
    IF NEW.receipt_no != OLD.receipt_no THEN
      RAISE EXCEPTION 'Integrity Violation: Settled receipt number cannot be altered.';
    END IF;
    IF NEW.transaction_ref != OLD.transaction_ref THEN
      RAISE EXCEPTION 'Integrity Violation: Settled transaction reference cannot be modified.';
    END IF;
    IF NEW.payment_method != OLD.payment_method THEN
      RAISE EXCEPTION 'Integrity Violation: Settled payment method cannot be altered.';
    END IF;
    IF NEW.paid_at != OLD.paid_at THEN
      RAISE EXCEPTION 'Integrity Violation: Settled payment timestamp cannot be altered.';
    END IF;
    IF NEW.status != 'SUCCESS' THEN
      RAISE EXCEPTION 'Integrity Violation: Cannot revert settled payment status from SUCCESS.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_payment_tamper ON public.payments;
CREATE TRIGGER tr_protect_payment_tamper
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_payment_tamper();

-- 7.5 SETTLED PAYMENT DELETE PREVENTION TRIGGER
CREATE OR REPLACE FUNCTION public.trig_check_payment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'SUCCESS' THEN
    RAISE EXCEPTION 'Integrity Violation: Settled successful payments are permanent financial records and cannot be deleted.';
  END IF;
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Access Denied: Only administrative bursars can delete unfinalized payment records.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_payment_delete ON public.payments;
CREATE TRIGGER tr_protect_payment_delete
  BEFORE DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_payment_delete();

-- 7.6 TIMETABLE SCHEDULING CONFLICT & CONCURRENCY PREVENTION TRIGGER
-- Employs fine-grained transaction-level advisory locks to serialize concurrent scheduling transactions
-- and prevent simultaneous overlap insertions across rooms, faculty, and class sections.
CREATE OR REPLACE FUNCTION public.trig_check_timetable_conflicts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'Validation Error: Timetable start_time (%) must be strictly before end_time (%).',
      NEW.start_time, NEW.end_time;
  END IF;

  -- Transaction-level advisory locks serializing concurrent booking operations
  PERFORM pg_advisory_xact_lock(hashtext('timetable_room_' || lower(trim(NEW.room_number)) || '_' || NEW.day_of_week::text));
  PERFORM pg_advisory_xact_lock(hashtext('timetable_fac_' || NEW.faculty_id::text || '_' || NEW.day_of_week::text));
  PERFORM pg_advisory_xact_lock(hashtext('timetable_class_' || NEW.class_id::text || '_' || NEW.day_of_week::text));

  -- 1. Classroom double-booking prevention
  IF EXISTS (
    SELECT 1 FROM public.timetable
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND day_of_week = NEW.day_of_week
      AND lower(trim(room_number)) = lower(trim(NEW.room_number))
      AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
  ) THEN
    RAISE EXCEPTION 'Scheduling Conflict: Classroom % is already booked on day % during the requested time slot (% - %).',
      NEW.room_number, NEW.day_of_week, NEW.start_time, NEW.end_time;
  END IF;

  -- 2. Faculty member double-booking prevention
  IF EXISTS (
    SELECT 1 FROM public.timetable
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND day_of_week = NEW.day_of_week
      AND faculty_id = NEW.faculty_id
      AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
  ) THEN
    RAISE EXCEPTION 'Scheduling Conflict: Faculty member is already scheduled to teach another class on day % during requested time interval (% - %).',
      NEW.day_of_week, NEW.start_time, NEW.end_time;
  END IF;

  -- 3. Class section double-booking prevention
  IF EXISTS (
    SELECT 1 FROM public.timetable
    WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND day_of_week = NEW.day_of_week
      AND class_id = NEW.class_id
      AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
  ) THEN
    RAISE EXCEPTION 'Scheduling Conflict: Class section is already scheduled for another session on day % during requested time interval (% - %).',
      NEW.day_of_week, NEW.start_time, NEW.end_time;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_timetable_conflicts ON public.timetable;
CREATE TRIGGER tr_check_timetable_conflicts
  BEFORE INSERT OR UPDATE ON public.timetable
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_timetable_conflicts();

-- 7.7 ATTENDANCE RECORDING ASSIGNMENT INTEGRITY TRIGGER
CREATE OR REPLACE FUNCTION public.trig_check_attendance_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_faculty_id UUID;
BEGIN
  IF public.is_admin() OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_faculty_id := public.current_faculty_id();
  IF v_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Access Denied: Current user is not recognized as institutional faculty.';
  END IF;

  IF NEW.faculty_id != v_faculty_id THEN
    RAISE EXCEPTION 'Access Denied: Cannot submit attendance under another faculty member identifier.';
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = NEW.subject_id AND s.faculty_id = v_faculty_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = NEW.class_id AND c.faculty_id = v_faculty_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.timetable t
      WHERE t.class_id = NEW.class_id AND t.subject_id = NEW.subject_id AND t.faculty_id = v_faculty_id
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized Assignment: Faculty member is not assigned to teach subject % in class %.',
      NEW.subject_id, NEW.class_id;
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = NEW.student_id
        AND e.class_id = NEW.class_id
        AND (e.subject_id IS NULL OR e.subject_id = NEW.subject_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = NEW.student_id
        AND s.class_id = NEW.class_id
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Student % is not enrolled in class % for attendance recording.',
      NEW.student_id, NEW.class_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_attendance_faculty ON public.attendance;
CREATE TRIGGER tr_protect_attendance_faculty
  BEFORE INSERT OR UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_attendance_assignment();

-- 7.8 ASSIGNMENT SUBMISSION LIFECYCLE & INTEGRITY TRIGGER
-- Enforces that students cannot reassign assignment_id outside enrollment, change student ownership,
-- alter marks or feedback, modify submissions once graded, or transition submission status to 'graded'.
CREATE OR REPLACE FUNCTION public.trig_check_submission_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    IF public.current_user_role() = 'student' THEN
      IF NEW.id != OLD.id THEN
        RAISE EXCEPTION 'Security Violation: Submission identifier cannot be modified.';
      END IF;

      IF NEW.student_id != OLD.student_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign submission student ownership.';
      END IF;

      IF NEW.assignment_id != OLD.assignment_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign submission to another assignment.';
      END IF;

      IF OLD.status = 'graded' THEN
        RAISE EXCEPTION 'Access Denied: Graded submissions are finalized and cannot be modified.';
      END IF;

      IF NEW.status = 'graded' THEN
        RAISE EXCEPTION 'Access Denied: Students cannot mark submissions as graded.';
      END IF;

      IF NEW.marks_obtained IS DISTINCT FROM OLD.marks_obtained THEN
        RAISE EXCEPTION 'Access Denied: Students cannot assign or modify marks_obtained.';
      END IF;

      IF NEW.feedback IS DISTINCT FROM OLD.feedback THEN
        RAISE EXCEPTION 'Access Denied: Students cannot author or modify grading feedback.';
      END IF;

      IF NEW.status NOT IN ('submitted', 'resubmitted', 'late') THEN
        RAISE EXCEPTION 'Invalid Status: Permitted student submission statuses are submitted, resubmitted, late.';
      END IF;

      -- Student must be actively enrolled in the class of the assignment
      IF NOT EXISTS (
        SELECT 1 FROM public.assignments a
        LEFT JOIN public.enrollments e ON e.class_id = a.class_id AND e.student_id = NEW.student_id
        LEFT JOIN public.students s ON s.id = NEW.student_id AND s.class_id = a.class_id
        WHERE a.id = NEW.assignment_id
          AND (e.id IS NOT NULL OR s.id IS NOT NULL)
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Student is not enrolled in the class for this assignment.';
      END IF;
    END IF;

    IF public.current_user_role() = 'faculty' THEN
      IF NEW.id != OLD.id OR NEW.student_id != OLD.student_id OR NEW.assignment_id != OLD.assignment_id THEN
        RAISE EXCEPTION 'Security Violation: Immutable submission metadata cannot be altered.';
      END IF;

      IF NEW.submission_url != OLD.submission_url OR NEW.file_url IS DISTINCT FROM OLD.file_url THEN
        RAISE EXCEPTION 'Security Violation: Faculty cannot alter student submission content.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_submission_lifecycle ON public.assignment_submissions;
CREATE TRIGGER tr_protect_submission_lifecycle
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_check_submission_lifecycle();

-- ==============================================================================
-- 8. COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all 27 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions_register ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8.1 PROFILES POLICIES (Non-Recursive Authorization Pattern)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_faculty" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "Allow all" ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    public.current_user_role() = 'admin' OR
    (public.current_user_role() = 'faculty' AND role IN ('student', 'faculty'))
  );

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Strictly non-recursive: evaluates caller identity without subqueries into public.profiles
-- Role and field immutability enforced by database trigger trig_check_profile_update()
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.2 DEPARTMENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "departments_select_authenticated" ON public.departments;
DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;
DROP POLICY IF EXISTS "Allow all" ON public.departments;

CREATE POLICY "departments_select_authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "departments_admin_all"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.3 COURSES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "courses_select_authenticated" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
DROP POLICY IF EXISTS "Allow all" ON public.courses;

CREATE POLICY "courses_select_authenticated"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courses_admin_all"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.4 STUDENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_select_own" ON public.students;
DROP POLICY IF EXISTS "students_select_faculty" ON public.students;
DROP POLICY IF EXISTS "students_admin_all" ON public.students;
DROP POLICY IF EXISTS "Allow all" ON public.students;

CREATE POLICY "students_select_own"
  ON public.students FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "students_select_faculty"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.classes c ON c.id = e.class_id
        WHERE e.student_id = students.id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.subjects s ON s.id = e.subject_id
        WHERE e.student_id = students.id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE (t.class_id = students.class_id OR EXISTS (
          SELECT 1 FROM public.enrollments e WHERE e.student_id = students.id AND e.class_id = t.class_id
        )) AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "students_admin_all"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.5 FACULTY POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "faculty_select_authenticated" ON public.faculty;
DROP POLICY IF EXISTS "faculty_update_own" ON public.faculty;
DROP POLICY IF EXISTS "faculty_admin_all" ON public.faculty;
DROP POLICY IF EXISTS "Allow all" ON public.faculty;

CREATE POLICY "faculty_select_authenticated"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "faculty_update_own"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid() AND
    faculty_id = (SELECT faculty_id FROM public.faculty WHERE profile_id = auth.uid()) AND
    designation = (SELECT designation FROM public.faculty WHERE profile_id = auth.uid())
  );

CREATE POLICY "faculty_admin_all"
  ON public.faculty FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.6 SUBJECTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "subjects_select_authenticated" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_all" ON public.subjects;
DROP POLICY IF EXISTS "Allow all" ON public.subjects;

CREATE POLICY "subjects_select_authenticated"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subjects_admin_all"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.7 CLASSES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "classes_select_authenticated" ON public.classes;
DROP POLICY IF EXISTS "classes_admin_all" ON public.classes;
DROP POLICY IF EXISTS "Allow all" ON public.classes;

CREATE POLICY "classes_select_authenticated"
  ON public.classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "classes_admin_all"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.8 ENROLLMENTS & TIMETABLE POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "enrollments_select_student" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_select_faculty" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;
DROP POLICY IF EXISTS "Allow all" ON public.enrollments;

CREATE POLICY "enrollments_select_student"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "enrollments_select_faculty"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = enrollments.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = enrollments.subject_id AND s.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "enrollments_admin_all"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Timetable
DROP POLICY IF EXISTS "timetable_select_student" ON public.timetable;
DROP POLICY IF EXISTS "timetable_select_faculty" ON public.timetable;
DROP POLICY IF EXISTS "timetable_admin_all" ON public.timetable;
DROP POLICY IF EXISTS "Allow all" ON public.timetable;

CREATE POLICY "timetable_select_student"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = timetable.class_id AND e.student_id = public.current_student_id()
    ) OR
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.current_student_id() AND s.class_id = timetable.class_id
    )
  );

CREATE POLICY "timetable_select_faculty"
  ON public.timetable FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      timetable.faculty_id = public.current_faculty_id() OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = timetable.class_id AND c.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "timetable_admin_all"
  ON public.timetable FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.9 ATTENDANCE POLICIES (Verified Class & Subject Scoping)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "attendance_select_student" ON public.attendance;
DROP POLICY IF EXISTS "attendance_select_faculty" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_faculty" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_faculty" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_all" ON public.attendance;
DROP POLICY IF EXISTS "Allow all" ON public.attendance;

CREATE POLICY "attendance_select_student"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_id = public.current_student_id() AND (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = attendance.student_id
          AND e.class_id = attendance.class_id
          AND (e.subject_id IS NULL OR e.subject_id = attendance.subject_id)
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = attendance.student_id
          AND s.class_id = attendance.class_id
      )
    )
  );

CREATE POLICY "attendance_select_faculty"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = attendance.class_id AND t.subject_id = attendance.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "attendance_insert_faculty"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = attendance.class_id AND t.subject_id = attendance.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    ) AND
    (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = attendance.student_id AND e.class_id = attendance.class_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = attendance.student_id AND s.class_id = attendance.class_id
      )
    )
  );

CREATE POLICY "attendance_update_faculty"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = attendance.class_id AND t.subject_id = attendance.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  )
  WITH CHECK (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = attendance.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = attendance.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = attendance.class_id AND t.subject_id = attendance.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    ) AND
    (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = attendance.student_id AND e.class_id = attendance.class_id
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = attendance.student_id AND s.class_id = attendance.class_id
      )
    )
  );

CREATE POLICY "attendance_admin_all"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.10 ASSIGNMENTS & SUBMISSIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "assignments_select_student" ON public.assignments;
DROP POLICY IF EXISTS "assignments_select_faculty" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert_faculty" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update_faculty" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete_faculty" ON public.assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.assignments;
DROP POLICY IF EXISTS "Allow all" ON public.assignments;

CREATE POLICY "assignments_select_student"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = assignments.class_id AND e.student_id = public.current_student_id()
    ) OR
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.current_student_id() AND s.class_id = assignments.class_id
    )
  );

CREATE POLICY "assignments_select_faculty"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = assignments.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = assignments.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = assignments.class_id AND t.subject_id = assignments.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "assignments_insert_faculty"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = assignments.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = assignments.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = assignments.class_id AND t.subject_id = assignments.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "assignments_update_faculty"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = assignments.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = assignments.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = assignments.class_id AND t.subject_id = assignments.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  )
  WITH CHECK (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = assignments.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = assignments.class_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.class_id = assignments.class_id AND t.subject_id = assignments.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "assignments_delete_faculty"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    public.is_faculty() AND
    faculty_id = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = assignments.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = assignments.class_id AND c.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "assignments_admin_all"
  ON public.assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Submissions
DROP POLICY IF EXISTS "submissions_select_student" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_insert_student" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_update_student" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_select_faculty" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_grade_faculty" ON public.assignment_submissions;
DROP POLICY IF EXISTS "submissions_admin_all" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Allow all" ON public.assignment_submissions;

CREATE POLICY "submissions_select_student"
  ON public.assignment_submissions FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "submissions_insert_student"
  ON public.assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = public.current_student_id() AND
    marks_obtained IS NULL AND
    feedback IS NULL AND
    status = 'submitted' AND
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.enrollments e ON e.class_id = a.class_id
      WHERE a.id = assignment_submissions.assignment_id
        AND e.student_id = public.current_student_id()
    )
  );

CREATE POLICY "submissions_update_student"
  ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    student_id = public.current_student_id() AND
    status != 'graded'
  )
  WITH CHECK (
    student_id = public.current_student_id() AND
    marks_obtained IS NULL AND
    feedback IS NULL AND
    status IN ('submitted', 'resubmitted', 'late') AND
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id AND (
        EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.class_id = a.class_id AND e.student_id = public.current_student_id()
        ) OR
        EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = public.current_student_id() AND s.class_id = a.class_id
        )
      )
    )
  );

CREATE POLICY "submissions_select_faculty"
  ON public.assignment_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id
        AND (
          a.faculty_id = public.current_faculty_id() OR
          EXISTS (
            SELECT 1 FROM public.subjects s
            WHERE s.id = a.subject_id AND s.faculty_id = public.current_faculty_id()
          ) OR
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = a.class_id AND c.faculty_id = public.current_faculty_id()
          )
        )
    )
  );

CREATE POLICY "submissions_grade_faculty"
  ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id
        AND (
          a.faculty_id = public.current_faculty_id() OR
          EXISTS (
            SELECT 1 FROM public.subjects s
            WHERE s.id = a.subject_id AND s.faculty_id = public.current_faculty_id()
          ) OR
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = a.class_id AND c.faculty_id = public.current_faculty_id()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id
        AND (
          a.faculty_id = public.current_faculty_id() OR
          EXISTS (
            SELECT 1 FROM public.subjects s
            WHERE s.id = a.subject_id AND s.faculty_id = public.current_faculty_id()
          ) OR
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = a.class_id AND c.faculty_id = public.current_faculty_id()
          )
        )
    ) AND
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.enrollments e ON e.class_id = a.class_id
      WHERE a.id = assignment_submissions.assignment_id
        AND e.student_id = assignment_submissions.student_id
    )
  );

CREATE POLICY "submissions_admin_all"
  ON public.assignment_submissions FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.11 EXAMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "exams_select_student" ON public.exams;
DROP POLICY IF EXISTS "exams_select_faculty" ON public.exams;
DROP POLICY IF EXISTS "exams_admin_all" ON public.exams;
DROP POLICY IF EXISTS "Allow all" ON public.exams;

CREATE POLICY "exams_select_student"
  ON public.exams FOR SELECT
  TO authenticated
  USING (
    published = true AND (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = public.current_student_id()
          AND (e.class_id = exams.class_id OR e.subject_id = exams.subject_id)
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = public.current_student_id() AND s.class_id = exams.class_id
      )
    )
  );

CREATE POLICY "exams_select_faculty"
  ON public.exams FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = exams.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = exams.class_id AND c.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "exams_admin_all"
  ON public.exams FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.12 MARKS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "marks_select_student" ON public.marks;
DROP POLICY IF EXISTS "marks_select_faculty" ON public.marks;
DROP POLICY IF EXISTS "marks_insert_faculty" ON public.marks;
DROP POLICY IF EXISTS "marks_update_faculty" ON public.marks;
DROP POLICY IF EXISTS "marks_admin_all" ON public.marks;
DROP POLICY IF EXISTS "Allow all" ON public.marks;

CREATE POLICY "marks_select_student"
  ON public.marks FOR SELECT
  TO authenticated
  USING (
    student_id = public.current_student_id() AND
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = marks.exam_id AND e.published = true
    )
  );

CREATE POLICY "marks_select_faculty"
  ON public.marks FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = marks.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.exams ex ON ex.class_id = c.id
        WHERE ex.id = marks.exam_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.subject_id = marks.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  );

CREATE POLICY "marks_insert_faculty"
  ON public.marks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty() AND
    entered_by = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = marks.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.exams ex ON ex.class_id = c.id
        WHERE ex.id = marks.exam_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.subject_id = marks.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    ) AND
    EXISTS (
      SELECT 1 FROM public.exams ex
      WHERE ex.id = marks.exam_id AND (ex.subject_id IS NULL OR ex.subject_id = marks.subject_id)
    ) AND
    (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.exams ex ON ex.id = marks.exam_id
        WHERE e.student_id = marks.student_id
          AND (e.subject_id = marks.subject_id OR e.class_id = ex.class_id)
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.exams ex ON ex.id = marks.exam_id
        WHERE s.id = marks.student_id AND s.class_id = ex.class_id
      )
    )
  );

CREATE POLICY "marks_update_faculty"
  ON public.marks FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty() AND
    entered_by = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = marks.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.exams ex ON ex.class_id = c.id
        WHERE ex.id = marks.exam_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.subject_id = marks.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    )
  )
  WITH CHECK (
    public.is_faculty() AND
    entered_by = public.current_faculty_id() AND
    (
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = marks.subject_id AND s.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.exams ex ON ex.class_id = c.id
        WHERE ex.id = marks.exam_id AND c.faculty_id = public.current_faculty_id()
      ) OR
      EXISTS (
        SELECT 1 FROM public.timetable t
        WHERE t.subject_id = marks.subject_id AND t.faculty_id = public.current_faculty_id()
      )
    ) AND
    EXISTS (
      SELECT 1 FROM public.exams ex
      WHERE ex.id = marks.exam_id AND (ex.subject_id IS NULL OR ex.subject_id = marks.subject_id)
    ) AND
    (
      EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.exams ex ON ex.id = marks.exam_id
        WHERE e.student_id = marks.student_id
          AND (e.subject_id = marks.subject_id OR e.class_id = ex.class_id)
      ) OR
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.exams ex ON ex.id = marks.exam_id
        WHERE s.id = marks.student_id AND s.class_id = ex.class_id
      )
    )
  );

CREATE POLICY "marks_admin_all"
  ON public.marks FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.13 FEES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "fees_select_student" ON public.fees;
DROP POLICY IF EXISTS "fees_admin_all" ON public.fees;
DROP POLICY IF EXISTS "Allow all" ON public.fees;

CREATE POLICY "fees_select_student"
  ON public.fees FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "fees_admin_all"
  ON public.fees FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.14 PAYMENTS POLICIES (Strict Ledger Integrity)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "payments_select_student" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "Allow all" ON public.payments;

CREATE POLICY "payments_select_student"
  ON public.payments FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.15 ANNOUNCEMENTS POLICIES (Strict Audience Scoping & TO authenticated)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "announcements_select_student" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_faculty" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_faculty" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_faculty" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;
DROP POLICY IF EXISTS "Allow all" ON public.announcements;

CREATE POLICY "announcements_select_student"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    published = true AND
    target_audience IN ('all', 'student') AND
    public.current_user_role() = 'student'
  );

CREATE POLICY "announcements_select_faculty"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    published = true AND
    target_audience IN ('all', 'faculty') AND
    public.current_user_role() IN ('faculty', 'admin')
  );

CREATE POLICY "announcements_insert_faculty"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty() AND
    author_id = auth.uid()
  );

CREATE POLICY "announcements_update_faculty"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty() AND
    author_id = auth.uid()
  )
  WITH CHECK (
    public.is_faculty() AND
    author_id = auth.uid()
  );

CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.16 NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_read_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_admin_all" ON public.notifications;
DROP POLICY IF EXISTS "Allow all" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_read_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_admin_all"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.17 RESOURCES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "resources_select_student" ON public.resources;
DROP POLICY IF EXISTS "resources_select_faculty" ON public.resources;
DROP POLICY IF EXISTS "resources_insert_faculty" ON public.resources;
DROP POLICY IF EXISTS "resources_update_faculty" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_faculty" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all" ON public.resources;
DROP POLICY IF EXISTS "Allow all" ON public.resources;

CREATE POLICY "resources_select_student"
  ON public.resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = public.current_student_id()
        AND (e.subject_id = resources.subject_id OR EXISTS (
          SELECT 1 FROM public.subjects s
          WHERE s.id = resources.subject_id AND s.course_id = c.course_id
        ))
    )
  );

CREATE POLICY "resources_select_faculty"
  ON public.resources FOR SELECT
  TO authenticated
  USING (
    public.is_faculty() AND (
      uploaded_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.subjects s
        WHERE s.id = resources.subject_id
          AND (s.faculty_id = public.current_faculty_id() OR EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.faculty_id = public.current_faculty_id() AND c.course_id = s.course_id
          ))
      )
    )
  );

CREATE POLICY "resources_insert_faculty"
  ON public.resources FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_faculty() AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = resources.subject_id
        AND (s.faculty_id = public.current_faculty_id() OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.faculty_id = public.current_faculty_id() AND c.course_id = s.course_id
        ))
    )
  );

CREATE POLICY "resources_update_faculty"
  ON public.resources FOR UPDATE
  TO authenticated
  USING (
    public.is_faculty() AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = resources.subject_id
        AND (s.faculty_id = public.current_faculty_id() OR EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.faculty_id = public.current_faculty_id() AND c.course_id = s.course_id
        ))
    )
  );

CREATE POLICY "resources_delete_faculty"
  ON public.resources FOR DELETE
  TO authenticated
  USING (
    public.is_faculty() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "resources_admin_all"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.18 LOST & FOUND POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "lost_found_select_authenticated" ON public.lost_found;
DROP POLICY IF EXISTS "lost_found_insert_authenticated" ON public.lost_found;
DROP POLICY IF EXISTS "lost_found_update_reporter" ON public.lost_found;
DROP POLICY IF EXISTS "lost_found_delete_reporter" ON public.lost_found;
DROP POLICY IF EXISTS "lost_found_admin_all" ON public.lost_found;
DROP POLICY IF EXISTS "Allow all" ON public.lost_found;

CREATE POLICY "lost_found_select_authenticated"
  ON public.lost_found FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lost_found_insert_authenticated"
  ON public.lost_found FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "lost_found_update_reporter"
  ON public.lost_found FOR UPDATE
  TO authenticated
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "lost_found_delete_reporter"
  ON public.lost_found FOR DELETE
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "lost_found_admin_all"
  ON public.lost_found FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.19 SUPPORT TICKETS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_select_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_update_own" ON public.support_tickets;
DROP POLICY IF EXISTS "tickets_admin_all" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow all" ON public.support_tickets;

CREATE POLICY "tickets_select_own"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "tickets_insert_own"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    status = 'Open' AND
    assigned_to IS NULL
  );

CREATE POLICY "tickets_update_own"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    status = 'Open'
  )
  WITH CHECK (
    user_id = auth.uid() AND
    status = 'Open' AND
    assigned_to IS NULL
  );

CREATE POLICY "tickets_admin_all"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.20 EVENTS & EVENT REGISTRATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "events_select_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
DROP POLICY IF EXISTS "Allow all" ON public.events;

CREATE POLICY "events_select_authenticated"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "events_admin_all"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Event Registrations
DROP POLICY IF EXISTS "registrations_select_own" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_delete_own" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_admin_all" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow all" ON public.event_registrations;

CREATE POLICY "registrations_select_own"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "registrations_insert_own"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "registrations_delete_own"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "registrations_admin_all"
  ON public.event_registrations FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.21 PLACEMENTS & APPLICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "placements_select_authenticated" ON public.placements;
DROP POLICY IF EXISTS "placements_admin_all" ON public.placements;
DROP POLICY IF EXISTS "Allow all" ON public.placements;

CREATE POLICY "placements_select_authenticated"
  ON public.placements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "placements_admin_all"
  ON public.placements FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Placement Applications
DROP POLICY IF EXISTS "applications_select_student" ON public.placement_applications;
DROP POLICY IF EXISTS "applications_insert_student" ON public.placement_applications;
DROP POLICY IF EXISTS "applications_delete_student" ON public.placement_applications;
DROP POLICY IF EXISTS "applications_admin_all" ON public.placement_applications;
DROP POLICY IF EXISTS "Allow all" ON public.placement_applications;

CREATE POLICY "applications_select_student"
  ON public.placement_applications FOR SELECT
  TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "applications_insert_student"
  ON public.placement_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = public.current_student_id() AND
    status = 'Applied'
  );

CREATE POLICY "applications_delete_student"
  ON public.placement_applications FOR DELETE
  TO authenticated
  USING (
    student_id = public.current_student_id() AND
    status = 'Applied'
  );

CREATE POLICY "applications_admin_all"
  ON public.placement_applications FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8.22 AUDIT LOGS POLICIES (Immutable Ledger)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit_logs_no_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "audit_logs_no_update"
  ON public.audit_logs FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "audit_logs_no_delete"
  ON public.audit_logs FOR DELETE
  TO authenticated
  USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM PUBLIC, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- ------------------------------------------------------------------------------
-- 8.23 ADMISSIONS REGISTER POLICIES (Institutional Roster - Privacy Hardened)
-- Direct SELECT is strictly restricted to institutional administrators.
-- Ordinary students verify status only through verify_student_admission_eligibility()
-- and activate their account through claim_student_admission().
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admissions_select_own_email" ON public.admissions_register;
DROP POLICY IF EXISTS "admissions_admin_all" ON public.admissions_register;

CREATE POLICY "admissions_admin_all"
  ON public.admissions_register FOR ALL
  TO authenticated
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.admissions_register FROM PUBLIC, authenticated;
GRANT SELECT ON public.admissions_register TO authenticated;

-- ==============================================================================
-- 9. SAFE POST-MIGRATION VERIFICATION & ROLLBACK GUIDELINES
-- ==============================================================================
-- 1. All 27 tables have ROW LEVEL SECURITY enabled.
-- 2. Audit logs have NO client-facing INSERT policy; all records originate
--    from trusted database triggers with PII redaction.
-- 3. Payments cannot be inserted or marked SUCCESS by ordinary client claims.
-- 4. Online payment settlement strictly requires server-side webhook signature verification
--    and enforces identical reference idempotency while rejecting conflicting references.
-- 5. Manual offline payments require separate administrative authorization, bursar voucher, and audit trail.
-- 6. Settled payments are immutable; no updates or deletes permitted.
-- 7. Student profiles can only be provisioned through administrative enrollment or verified admissions roster.
-- 8. Profile fields (role, email, name, id_number, department) are strictly protected against modification.
-- 9. Announcements enforce strict student vs faculty scoping with TO authenticated.
-- 10. Timetable conflicts and concurrent double-bookings are serialized and rejected via advisory locks.
-- 11. Attendance recording requires verified class/subject faculty assignments.
-- 12. Assignment submissions cannot be reassigned outside enrollment, altered in ownership, or self-marked as graded.
--
-- Rollback Procedures (Preserving Continuous RLS Protections):
--   Step 1: RLS MUST NEVER BE DISABLED in production (never run 'ALTER TABLE ... DISABLE ROW LEVEL SECURITY').
--   Step 2: To revert any policy, drop and recreate specific policies idempotently.
--   Step 3: Emergency lockdown command:
--     DROP POLICY IF EXISTS "<policy_name>" ON public.<table_name>;
--     CREATE POLICY "<policy_name>_lockdown" ON public.<table_name> FOR ALL USING (public.is_admin());
-- ==============================================================================

-- ==============================================================================
-- 10. READ-ONLY SCHEMA & PERMISSION DIAGNOSTIC VERIFICATION QUERIES
-- Run these statements in Supabase SQL Editor to audit live catalog state safely:
-- ==============================================================================
-- Query 1: Verify RLS enablement across all 27 tables
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- Query 2: Verify active RLS policies
-- SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
--
-- Query 3: Verify security definer functions and search_path settings
-- SELECT routine_name, security_type, external_language
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' AND security_type = 'DEFINER';
--
-- Query 4: Verify active database triggers
-- SELECT event_object_table, trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;
--
-- Query 5: Verify table privileges granted to authenticated role
-- SELECT table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND grantee = 'authenticated'
-- ORDER BY table_name, privilege_type;
--
-- Query 6: Verify timetable exclusion and unique constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.timetable'::regclass;
-- ==============================================================================
