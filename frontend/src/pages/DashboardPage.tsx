import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * DashboardPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 사용자가 로그인 후 보는 메인 대시보드
 * 2. 네비게이션 바 (로그아웃 버튼)
 * 3. 사용자 정보 표시
 * 4. 주요 기능 네비게이션
 *
 * 💡 특징:
 * - Tailwind CSS로 반응형 레이아웃
 * - 모바일(sm), 태블릿(md), 데스크톱(lg) 모두 지원
 * - 각 기능 카드는 클릭 가능
 */
export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ✨ 네비게이션 바 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* 로고 */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">👔</div>
              <h1 className="text-2xl font-bold text-gray-900">Pocket Closet</h1>
            </div>

            {/* 사용자 정보 + 로그아웃 */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 📱 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 🎉 환영 메시지 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            환영합니다, {user?.name}님! 👋
          </h2>
          <p className="text-gray-600">
            나의 옷장을 관리하고 AI가 추천하는 최고의 스타일을 찾아보세요.
          </p>
        </div>

        {/* 🎨 기능 카드 그리드 (반응형) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 📸 의류 업로드 */}
          <div
            onClick={() => handleNavigate('/upload')}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
          >
            <div className="bg-blue-50 p-8 group-hover:bg-blue-100 transition text-center">
              <div className="text-4xl mb-2">📸</div>
              <h3 className="font-semibold text-blue-900 text-lg mb-2">
                의류 업로드
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                새로운 옷을 추가하고 AI가 자동으로 분석합니다
              </p>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition font-medium">
                업로드하기
              </button>
            </div>
          </div>

          {/* 👕 옷장 */}
          <div
            onClick={() => handleNavigate('/wardrobe')}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
          >
            <div className="bg-green-50 p-8 group-hover:bg-green-100 transition text-center">
              <div className="text-4xl mb-2">👕</div>
              <h3 className="font-semibold text-green-900 text-lg mb-2">
                나의 옷장
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                내 옷들을 관리하고 필터링합니다
              </p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition font-medium">
                옷장 보기
              </button>
            </div>
          </div>

          {/* ✨ 스타일 추천 */}
          <div
            onClick={() => handleNavigate('/recommendations')}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
          >
            <div className="bg-purple-50 p-8 group-hover:bg-purple-100 transition text-center">
              <div className="text-4xl mb-2">✨</div>
              <h3 className="font-semibold text-purple-900 text-lg mb-2">
                스타일 추천
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                AI가 추천하는 최고의 스타일 조합
              </p>
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-md transition font-medium">
                추천 받기
              </button>
            </div>
          </div>

          {/* ⚙️ 설정 */}
          <div
            onClick={() => handleNavigate('/settings')}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
          >
            <div className="bg-orange-50 p-8 group-hover:bg-orange-100 transition text-center">
              <div className="text-4xl mb-2">⚙️</div>
              <h3 className="font-semibold text-orange-900 text-lg mb-2">
                설정
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                프로필 및 환경설정 관리
              </p>
              <button
                disabled
                className="w-full bg-orange-500 text-white py-2 rounded-md transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                개발 중
              </button>
            </div>
          </div>
        </div>

        {/* 📊 통계 (선택사항) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-blue-600">0</div>
            <p className="text-gray-600 text-sm mt-2">내 옷 개수</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-green-600">0</div>
            <p className="text-gray-600 text-sm mt-2">이번달 추천</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-purple-600">0</div>
            <p className="text-gray-600 text-sm mt-2">좋아요한 조합</p>
          </div>
        </div>
      </main>
    </div>
  );
}
