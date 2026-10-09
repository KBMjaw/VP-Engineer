import { Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from './auth';
import { AdminLayout, ForgotPasswordPage, LoginPage, ResetPasswordPage } from './AdminShell';
import { Dashboard, ProjectsList } from './ProjectsPages';
import { ProjectEditor } from './ProjectEditor';
import NotFound from '../pages/NotFound';

/** Remount the editor per project so state never leaks between projects. */
function EditorRoute() {
  const { id } = useParams();
  return <ProjectEditor key={id ?? 'new'} />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/new" element={<EditorRoute />} />
          <Route path="projects/:id" element={<EditorRoute />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
