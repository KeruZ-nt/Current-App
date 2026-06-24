import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { TopNavLayout } from './components/layout/TopNavLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/Dashboard';

import { Inventory } from './pages/Inventory';
import { Purchases } from './pages/Purchases';
import { Sales } from './pages/Sales';
import { History } from './pages/History';
import { Suppliers } from './pages/Suppliers';
import { Team } from './pages/Team';
import { ProfileSettings } from './pages/ProfileSettings';
import { Workspaces } from './pages/Workspaces';
import { WelcomeProfile } from './pages/auth/WelcomeProfile';

function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    // We ignore TOKEN_REFRESHED / INITIAL_SESSION to prevent unnecessary
    // re-fetches when the tab regains focus in the background.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<TopNavLayout />}>
            <Route path="/welcome" element={<WelcomeProfile />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/history" element={<History />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/team" element={<Team />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
