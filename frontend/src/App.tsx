import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import MyMemosPage from './pages/MyMemosPage';
import MemoDetailPage from './pages/MemoDetailPage';
import MemoCreatePage from './pages/MemoCreatePage';
import AdminPage from './pages/AdminPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

export default function App() {
  const { token } = useAuthStore();

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
            <Route path="/memos/:id" element={<MemoDetailPage />} />
            <Route path="/memos/create" element={<MemoCreatePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        {/* Redirect */}
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}
