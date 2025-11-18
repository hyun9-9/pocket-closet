import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { WardrobePage } from './pages/WardrobePage';
import { RecommendationsPage } from './pages/RecommendationsPage';

/**
 * App.tsx - 루트 컴포넌트
 *
 * ✅ 기능:
 * 1. React Router로 모든 페이지의 라우팅 관리
 * 2. 인증 보호 (ProtectedRoute) - 로그인하지 않으면 /login으로 리다이렉트
 * 3. 전역 상태 관리 (Zustand authStore)
 *
 * 📍 라우팅 구조:
 * /login → LoginPage
 * /register → RegisterPage
 * / → RootRedirect (인증 상태에 따라 라우팅)
 * /dashboard → DashboardPage (보호됨)
 * /upload → UploadPage (보호됨, 개발 중)
 * /wardrobe → WardrobePage (보호됨, 개발 중)
 * /recommendations → RecommendationsPage (보호됨, 개발 중)
 */

/**
 * ProtectedRoute 컴포넌트
 *
 * 🛡️ 인증 보호 역할:
 * - 토큰이 없으면 /login으로 리다이렉트
 * - 토큰이 있으면 해당 컴포넌트 렌더링
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * RootRedirect 컴포넌트
 *
 * 🔄 동작:
 * - 토큰 있음 → /dashboard로 리다이렉트
 * - 토큰 없음 → /login으로 리다이렉트
 */
function RootRedirect() {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 👤 인증 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 🏠 루트 경로 - 인증 상태에 따라 리다이렉트 */}
        <Route path="/" element={<RootRedirect />} />

        {/* 🛡️ 보호된 페이지 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wardrobe"
          element={
            <ProtectedRoute>
              <WardrobePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />

        {/* 🚫 404 - 존재하지 않는 페이지 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
