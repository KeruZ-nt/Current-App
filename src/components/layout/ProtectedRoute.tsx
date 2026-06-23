import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const ProtectedRoute = () => {
  const { user, profile, loading: authLoading } = useAuthStore();
  const { activeWorkspace, loading: wsLoading } = useWorkspaceStore();
  const location = useLocation();

  if (authLoading || wsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is incomplete (missing full_name)
  if (profile && !profile.full_name && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  // Allow access to workspaces picker, welcome, and profile without an active workspace
  if (!activeWorkspace && location.pathname !== '/workspaces' && location.pathname !== '/profile' && location.pathname !== '/welcome') {
    return <Navigate to="/workspaces" replace />;
  }

  return <Outlet />;
};
