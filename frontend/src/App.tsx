import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GuardianProvider } from './context/GuardianContext';
import { Layout } from './components/common/Layout';

// Public & Auth Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';

// Guardian PWA Pages
import { GuardianActivate } from './pages/guardian/GuardianActivate';
import { GuardianInbox } from './pages/guardian/GuardianInbox';
import { GuardianNotificationDetail } from './pages/guardian/GuardianNotificationDetail';
import { GuardianSettings } from './pages/guardian/GuardianSettings';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherGrades } from './pages/teacher/TeacherGrades';
import { TeacherAttendance } from './pages/teacher/TeacherAttendance';
import { TeacherQuestions } from './pages/teacher/TeacherQuestions';
import { TeacherReports } from './pages/teacher/TeacherReports';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentGrades } from './pages/student/StudentGrades';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentQuestions } from './pages/student/StudentQuestions';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminGuardians } from './pages/admin/AdminGuardians';
import { AdminTeachers } from './pages/admin/AdminTeachers';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminAssignments } from './pages/admin/AdminAssignments';
import { AdminAlertRules } from './pages/admin/AdminAlertRules';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminAudit } from './pages/admin/AdminAudit';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-500 font-medium animate-pulse">Cargando sesión institucional...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuardianProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Guardian PWA Routes */}
            <Route path="/guardian/activate" element={<GuardianActivate />} />
            <Route path="/guardian/inbox" element={<GuardianInbox />} />
            <Route path="/guardian/notifications/:id" element={<GuardianNotificationDetail />} />
            <Route path="/guardian/settings" element={<GuardianSettings />} />

            {/* Internal Authenticated Routes inside AppShell Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guardians"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminGuardians />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/teachers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminTeachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/alert-rules"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAlertRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAudit />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/grades"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <TeacherGrades />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <TeacherAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/questions"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <TeacherQuestions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/reports"
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                    <TeacherReports />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/grades"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentGrades />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/attendance"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentAttendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/questions"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentQuestions />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GuardianProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
