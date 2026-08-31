export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  is_active: boolean;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    code?: string;
    document_number?: string;
  } | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface Course {
  id: string;
  academic_year: string;
  academic_year_name?: string;
  name: string;
  parallel: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Teacher {
  id: string;
  user: string;
  first_name: string;
  last_name: string;
  full_name: string;
  document_number?: string;
}

export interface Student {
  id: string;
  user?: string | null;
  user_details?: {
    id?: string;
    username: string;
    email?: string | null;
  } | null;
  code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  active: boolean;
  guardians?: StudentGuardian[];
}

export interface Guardian {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notifications_enabled: boolean;
  active: boolean;
  students_count?: number;
}

export interface StudentGuardian {
  id: string;
  student: string;
  student_name?: string;
  guardian: string;
  guardian_name?: string;
  guardian_phone?: string;
  relationship: 'MOTHER' | 'FATHER' | 'TUTOR' | 'OTHER';
  is_primary: boolean;
  can_receive_notifications: boolean;
}

export interface Enrollment {
  id: string;
  student: string;
  student_name?: string;
  student_code?: string;
  course: string;
  course_name?: string;
  course_parallel?: string;
  academic_year: string;
  academic_year_name?: string;
  status: 'ACTIVE' | 'WITHDRAWN' | 'COMPLETED';
}

export interface TeachingAssignment {
  id: string;
  teacher: string;
  teacher_name?: string;
  course: string;
  course_name?: string;
  course_parallel?: string;
  subject: string;
  subject_name?: string;
  subject_code?: string;
  academic_year: string;
  academic_year_name?: string;
  active: boolean;
}

export interface Grade {
  id: string;
  student: string;
  student_name?: string;
  student_code?: string;
  teaching_assignment: string;
  subject_name?: string;
  course_name?: string;
  course_parallel?: string;
  term: string;
  activity_name: string;
  score: string | number;
  max_score: string | number;
  percentage?: number;
  date: string;
  comments?: string | null;
  created_at?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Attendance {
  id: string;
  student: string;
  student_name?: string;
  student_code?: string;
  teaching_assignment: string;
  subject_name?: string;
  course_name?: string;
  course_parallel?: string;
  date: string;
  status: AttendanceStatus;
  status_display?: string;
  comments?: string | null;
}

export interface Question {
  id: string;
  student: string;
  student_name?: string;
  teaching_assignment: string;
  subject_name?: string;
  course_name?: string;
  course_parallel?: string;
  teacher_name?: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  status_display?: string;
  answers?: Answer[];
  created_at: string;
}

export interface Answer {
  id: string;
  question: string;
  teacher: string;
  teacher_name?: string;
  body: string;
  published_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  type: 'LOW_GRADE' | 'ABSENCE' | 'REPEATED_ABSENCE' | 'LATE';
  type_display?: string;
  enabled: boolean;
  threshold_value?: string | number | null;
  period_days?: number | null;
  cooldown_hours?: number | null;
}

export interface AlertEvent {
  id: string;
  rule: string;
  rule_name?: string;
  student: string;
  student_name?: string;
  student_code?: string;
  source_type: string;
  source_id?: string | null;
  fingerprint: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  severity_display?: string;
  status: 'OPEN' | 'RESOLVED';
  status_display?: string;
  metadata?: Record<string, any>;
  first_detected_at: string;
}

export interface GuardianMe {
  guardian: {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    notifications_enabled: boolean;
  };
  device: {
    id: string;
    name?: string | null;
    platform: string;
    linked_at: string;
  };
  push_enabled: boolean;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    code: string;
    relationship: string;
    can_receive_notifications: boolean;
  }>;
}

export interface GuardianInboxItem {
  id: string;
  category: string;
  category_display: string;
  student_display: string;
  detailed_title: string;
  safe_title: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface GuardianNotificationDetail {
  id: string;
  category: string;
  category_display: string;
  student_display: string;
  student_code: string;
  detailed_title: string;
  detailed_body: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user?: string | null;
  actor_username?: string | null;
  actor_guardian_device_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  metadata: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export interface GuardianActivationCode {
  id: string;
  guardian: string;
  guardian_name?: string;
  expires_at: string;
  used_at?: string | null;
  revoked_at?: string | null;
  is_valid: boolean;
  created_by_name?: string | null;
  created_at: string;
}
