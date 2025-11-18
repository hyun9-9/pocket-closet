import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * App.tsx - 루트 컴포넌트
 *
 * ✅ 기능:
 * 1. React Router로 모든 페이지의 라우팅 관리
 * 2. 인증 보호 (ProtectedRoute) - 로그인하지 않으면 /login으로 리다이렉트
 * 3. 로그인 상태 추적 (useAuthStore)
 * 4. 토큰이 있으면 로그인된 것으로 간주
 *
 * 💡 이 컴포넌트의 동작:
 * - 앱 시작 시 Zustand authStore에서 토큰 가져오기
 * - 토큰이 있으면 user 상태도 확인
 * - ProtectedRoute: 토큰 없으면 /login으로 강제 이동
 *
 * 📍 라우팅 구조:
 * / → 로그인 또는 대시보드로 리다이렉트
 * /login → LoginPage
 * /register → RegisterPage
 * /dashboard → DashboardPage (보호됨)
 * /upload → UploadPage (보호됨)
 * /recommendations → RecommendationsPage (보호됨)
 */

/**
 * ProtectedRoute 컴포넌트
 *
 * 🛡️ 인증 보호 역할:
 * - 토큰이 없으면 /login으로 리다이렉트
 * - 토큰이 있으면 해당 컴포넌트 렌더링
 *
 * 💡 사용 예시:
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);

  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * 임시 DashboardPage (아직 구현 안 함)
 * Phase 3 [3-1]의 다음 단계에서 구현할 페이지들
 */
function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    // 로그아웃 후 로그인 페이지로 가는 것은 LoginPage의 useEffect에서 처리됨
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Pocket Closet</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              {user?.name} ({user?.email})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">대시보드</h2>
          <p className="text-gray-600 mb-4">
            Pocket Closet에 오신 것을 환영합니다! 🎉
          </p>

          {/* 🚧 Phase 3 [3-1]의 다음 페이지들 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📸 의류 업로드</h3>
              <p className="text-sm text-blue-800 mb-3">
                사진을 찍고 AI가 의류를 분석합니다
              </p>
              <button
                disabled
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                업로드 (개발 중)
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">👕 옷장</h3>
              <p className="text-sm text-green-800 mb-3">
                나의 옷들을 관리하고 필터링합니다
              </p>
              <button
                disabled
                className="bg-green-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                옷장 보기 (개발 중)
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">✨ 추천</h3>
              <p className="text-sm text-purple-800 mb-3">
                AI가 추천하는 최고의 스타일 조합
              </p>
              <button
                disabled
                className="bg-purple-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추천 받기 (개발 중)
              </button>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">⚙️ 설정</h3>
              <p className="text-sm text-orange-800 mb-3">
                프로필 및 환경설정을 관리합니다
              </p>
              <button
                disabled
                className="bg-orange-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                설정 (개발 중)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 👤 인증 페이지 (로그인, 회원가입) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 🛡️ 보호된 페이지 (대시보드) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 🏠 루트 경로 - 로그인 상태에 따라 리다이렉트 */}
        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />

        {/* 🚫 404 - 존재하지 않는 페이지 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
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
