import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { isSupabaseConfigured } from './lib/supabase';
import AuthBootstrap from './components/AuthBootstrap';
import PageLoader from './components/PageLoader';

// Public pages — keep login/register eager for fast first paint
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ArticlesListPage from './pages/ArticlesListPage';
import ArticlePage from './pages/ArticlePage';
import { BillingSuccessPage, BillingFailPage, BillingCancelPage } from './pages/BillingResultPages';

// Lazy-loaded pages — cuts initial bundle ~60%
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const MyMemosPage = lazy(() => import('./pages/MyMemosPage'));
const MemoDetailPage = lazy(() => import('./pages/MemoDetailPage'));
const MemoCreatePage = lazy(() => import('./pages/MemoCreatePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CompletedMemosPage = lazy(() => import('./pages/CompletedMemosPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const PlatformAdminPage = lazy(() => import('./pages/PlatformAdminPage'));
const DelegationPage = lazy(() => import('./pages/DelegationPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PlatformRoute from './components/PlatformRoute';
import PendingRoute from './components/PendingRoute';
import Layout from './components/Layout';

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  const { token } = useAuthStore();

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-pattern p-6">
        <div className="max-w-lg card shadow-card-hover text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 font-bold text-lg">!</span>
          </div>
          <h1 className="text-xl font-bold text-charcoal mb-3">Configuration Required</h1>
          <p className="text-gray-500 mb-4 text-sm">
            Supabase environment variables are missing. Add{' '}
            <code className="bg-surface-muted px-2 py-0.5 rounded-lg text-xs">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-surface-muted px-2 py-0.5 rounded-lg text-xs">VITE_SUPABASE_ANON_KEY</code> in Vercel,
            then redeploy.
          </p>
          <p className="text-xs text-gray-400">The app works locally because your .env.local is set.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pending" element={<PendingRoute />} />

          <Route path="/articles" element={<ArticlesListPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/billing/fail" element={<BillingFailPage />} />
          <Route path="/billing/cancel" element={<BillingCancelPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Lazy><DashboardPage /></Lazy>} />
              <Route path="/inbox" element={<Lazy><InboxPage /></Lazy>} />
              <Route path="/my-memos" element={<Lazy><MyMemosPage /></Lazy>} />
              <Route path="/completed" element={<Lazy><CompletedMemosPage /></Lazy>} />
              <Route path="/search" element={<Lazy><SearchPage /></Lazy>} />
              <Route path="/notifications" element={<Lazy><NotificationsPage /></Lazy>} />
              <Route path="/messages" element={<Lazy><MessagesPage /></Lazy>} />
              <Route path="/profile" element={<Lazy><ProfilePage /></Lazy>} />
              <Route path="/delegation" element={<Lazy><DelegationPage /></Lazy>} />
              <Route path="/memos/create" element={<Lazy><MemoCreatePage /></Lazy>} />
              <Route path="/memos/:id" element={<Lazy><MemoDetailPage /></Lazy>} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<Lazy><AdminPage /></Lazy>} />
                <Route path="/billing" element={<Lazy><BillingPage /></Lazy>} />
              </Route>
            </Route>
            <Route element={<PlatformRoute />}>
              <Route element={<Layout />}>
                <Route path="/platform" element={<Lazy><PlatformAdminPage /></Lazy>} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
