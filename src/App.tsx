import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Messenger from './components/Messenger';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return user ? <Messenger /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

