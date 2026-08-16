import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { PublicLayout } from '@/components/PublicLayout';
import { HomePage } from '@/pages/HomePage';
import { DisciplinesPage } from '@/pages/DisciplinesPage';
import { SubjectPage } from '@/pages/SubjectPage';
import { LessonPage } from '@/pages/LessonPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminSubjectsPage } from '@/pages/admin/AdminSubjectsPage';
import { AdminLessonsPage } from '@/pages/admin/AdminLessonsPage';
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage';
import { Loader2 } from 'lucide-react';

function PublicRoutes() {
  return (
    <PublicLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/disciplinas" element={<DisciplinesPage />} />
        <Route path="/disciplinas/:slug" element={<SubjectPage />} />
        <Route path="/disciplinas/:slug/aula/:lessonId" element={<LessonPage />} />
        <Route path="/aulas/:lessonId" element={<LessonPage />} />
        <Route path="/avisos" element={<AnnouncementsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicLayout>
  );
}

function AdminRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="disciplinas" element={<AdminSubjectsPage />} />
        <Route path="aulas" element={<AdminLessonsPage />} />
        <Route path="avisos" element={<AdminAnnouncementsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<PublicRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
