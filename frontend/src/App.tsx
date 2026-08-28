import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { isSupabaseConfigured } from './lib/supabase';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import MyMemosPage from './pages/MyMemosPage';
import MemoDetailPage from './pages/MemoDetailPage';
import MemoCreatePage from './pages/MemoCreatePage';
import AdminPage from './pages/AdminPage';
import CompletedMemosPage from './pages/CompletedMemosPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

export default function App() {
  const { token } = useAuthStore();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-3">Configuration Required</h1>
          <p className="text-gray-600 mb-4">
            Supabase environment variables are missing. Add{' '}
            <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in Vercel,
            then redeploy.
          </p>
          <p className="text-sm text-gray-400">The app works locally because your .env.local is set.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/my-memos" element={<MyMemosPage />} />
            <Route path="/completed" element={<CompletedMemosPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/memos/create" element={<MemoCreatePage />} />
            <Route path="/memos/:id" element={<MemoDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* Redirect */}
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
