import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0E14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#6C5CE7] border-t-transparent" />
      </div>
    );
  }

  return session ? <Dashboard /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}