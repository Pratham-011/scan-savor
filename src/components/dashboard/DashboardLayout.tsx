import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashboardSidebar />
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isMobile ? '' : 'ml-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}
