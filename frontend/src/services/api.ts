const API_BASE = '/api';

export class ApiError extends Error {
  code: string;
  fields?: Record<string, string[]>;
  status: number;

  constructor(message: string, code = 'GENERIC_ERROR', status = 500, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const deviceToken = localStorage.getItem('guardian_device_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(options.headers as Record<string, string> || {}),
  };

  if (deviceToken && endpoint.startsWith('/guardian/')) {
    headers['Authorization'] = `DeviceToken ${deviceToken}`;
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    data = { error: { message: response.statusText } };
  }

  if (!response.ok) {
    const errorObj = data.error || {};
    const message = errorObj.message || data.detail || 'Ocurrió un error al procesar la solicitud.';
    const code = errorObj.code || 'HTTP_ERROR';
    const fields = errorObj.fields;
    throw new ApiError(message, code, response.status, fields);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ access_token: string; refresh_token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me/'),
  logout: (refreshToken?: string) =>
    request<{ message: string }>('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // Academics
  getAcademicYears: () => request<any[]>('/academic-years/'),
  getCourses: (params?: { academic_year_id?: string }) => {
    const q = params?.academic_year_id ? `?academic_year_id=${params.academic_year_id}` : '';
    return request<any>(`/courses/${q}`);
  },
  getSubjects: () => request<any>('/subjects/'),
  getTeachers: () => request<any>('/teachers/'),
  getStudents: (params?: { course_id?: string }) => {
    const q = params?.course_id ? `?course_id=${params.course_id}` : '';
    return request<any>(`/students/${q}`);
  },
  getGuardians: () => request<any>('/guardians/'),
  getStudentGuardians: () => request<any>('/student-guardians/'),
  getEnrollments: (params?: { course_id?: string; academic_year_id?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any>(`/enrollments/${search ? `?${search}` : ''}`);
  },
  getTeachingAssignments: (params?: { course_id?: string; academic_year_id?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any>(`/teaching-assignments/${search ? `?${search}` : ''}`);
  },

  // Grades
  getGrades: (params?: { teaching_assignment_id?: string; term?: string; student_id?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any>(`/grades/${search ? `?${search}` : ''}`);
  },
  saveBulkGrades: (payload: any) =>
    request<{ message: string; count: number; grades: any[] }>('/grades/bulk/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudentMeGrades: (params?: { term?: string }) => {
    const q = params?.term ? `?term=${params.term}` : '';
    return request<{ student: any; results: any[] }>(`/me/grades/${q}`);
  },

  // Attendance
  getAttendance: (params?: { teaching_assignment_id?: string; date?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any>(`/attendance/${search ? `?${search}` : ''}`);
  },
  saveBulkAttendance: (payload: any) =>
    request<{ message: string; count: number; rows: any[] }>('/attendance/bulk/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudentMeAttendance: (params?: { subject_id?: string }) => {
    const q = params?.subject_id ? `?subject_id=${params.subject_id}` : '';
    return request<{ student: any; stats: any; results: any[] }>(`/me/attendance/${q}`);
  },

  // QA
  getQuestions: (params?: { status?: string }) => {
    const q = params?.status ? `?status=${params.status}` : '';
    return request<any>(`/questions/${q}`);
  },
  createQuestion: (payload: { teaching_assignment: string; subject: string; body: string }) =>
    request<any>('/questions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  answerQuestion: (questionId: string, body: string) =>
    request<any>(`/questions/${questionId}/answers/`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  getStudentMeQuestions: () => request<any[]>('/me/questions/'),

  // Guardian PWA
  verifyGuardianCode: (payload: { code: string; device_name?: string; platform?: string }) =>
    request<any>('/guardian/activation/verify/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGuardianMe: () => request<any>('/guardian/me/'),
  registerPushSubscription: (payload: { token: string; provider?: string; platform?: string }) =>
    request<{ message: string; push_enabled: boolean }>('/guardian/devices/push-subscription/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePushSubscription: () =>
    request<{ message: string; push_enabled: boolean }>('/guardian/devices/push-subscription/', {
      method: 'DELETE',
    }),
  unlinkGuardianDevice: () =>
    request<{ message: string }>('/guardian/device/unlink/', {
      method: 'POST',
    }),
  getGuardianNotifications: () => request<any>('/guardian/notifications/'),
  getGuardianNotificationDetail: (id: string) => request<any>(`/guardian/notifications/${id}/`),

  // Admin Alertas & Notificaciones
  getNotificationRules: () => request<any>('/notification-rules/'),
  updateNotificationRule: (id: string, payload: any) =>
    request<any>(`/notification-rules/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  runAlertEvaluation: () =>
    request<{ message: string; results: any }>('/alerts/run-evaluation/', {
      method: 'POST',
    }),
  getAlertEvents: () => request<any>('/alerts/'),
  getAdminNotifications: () => request<any>('/notifications/'),
  retryNotification: (id: string) =>
    request<any>(`/notifications/${id}/retry/`, {
      method: 'POST',
    }),
  getAdminGuardianCodes: () => request<any>('/admin/guardian-codes/'),
  generateGuardianCode: (guardianId: string) =>
    request<any>('/admin/guardian-codes/generate/', {
      method: 'POST',
      body: JSON.stringify({ guardian_id: guardianId }),
    }),
  revokeGuardianCode: (codeId: string) =>
    request<any>(`/admin/guardian-codes/${codeId}/revoke/`, {
      method: 'POST',
    }),
  getAuditLogs: () => request<any>('/audit-logs/'),

  // Reports
  getAdminOverview: () => request<any>('/reports/admin-overview/'),
  getTeacherCourseSummary: (teachingAssignmentId: string) =>
    request<any>(`/reports/teacher-course-summary/?teaching_assignment_id=${teachingAssignmentId}`),
};
