import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';

/**
 * LoginPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 이메일/비밀번호 입력 폼
 * 2. 로그인 API 호출 (ApiClient 사용)
 * 3. 응답 받은 토큰/사용자 정보를 Zustand에 저장
 * 4. 성공 시 대시보드로 자동 이동
 * 5. 에러 메시지 표시
 *
 * 💡 이 컴포넌트가 동작하는 이유:
 * - React Hook (useState, useEffect, useNavigate)로 상태 관리
 * - Zustand (useAuthStore)로 전역 상태에 토큰 저장
 * - Axios (ApiClient)로 백엔드와 통신
 * - React Router (Link, useNavigate)로 페이지 이동
 */
export function LoginPage() {
  // 📍 상태 관리 (3가지 상태)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 🌍 전역 상태 (Zustand)
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  // 🔀 라우팅
  const navigate = useNavigate();

  // 🛡️ 인증 보호: 이미 로그인되어 있으면 대시보드로
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  /**
   * 로그인 처리 함수
   *
   * 🔄 동작 순서:
   * 1. 입력값 검증 (이메일, 비밀번호 필수)
   * 2. ApiClient.login() 호출 → 백엔드 POST /api/auth/login
   * 3. 응답 받기 → { success, message, data: { token, user } }
   * 4. Zustand에 저장 → setToken(token), setUser(user)
   * 5. 대시보드로 이동 → navigate('/dashboard')
   * 6. 에러 발생 시 setError로 표시
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 방지 (페이지 새로고침 방지)

    // 입력값 검증
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    if (!password.trim()) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    setError(''); // 이전 에러 메시지 초기화
    setIsLoading(true); // 로딩 시작

    try {
      // 1️⃣ apiClient.login() 호출
      // 이것은 Axios를 사용한 POST 요청
      // 자동으로 Content-Type: application/json 설정됨
      const response = await apiClient.login(email, password);

      // 2️⃣ 응답 구조: ApiResponse<{ token: string, user: User }>
      // apiClient.login() 반환값: { success, message, data: { token, user } }
      // (res.data를 이미 반환하므로 response.data가 아니라 response.data로 접근)
      const { token, user: userData } = response.data;

      // 3️⃣ Zustand 전역 상태에 저장
      // 이렇게 저장하면 Axios 인터셉터가 자동으로 Authorization 헤더 추가
      setToken(token);
      setUser(userData);

      // 4️⃣ 로그인 성공 → 대시보드로 이동
      navigate('/dashboard');
    } catch (err: any) {
      // 에러 처리
      // Axios 에러는 response.data.message 구조
      const errorMessage = err.response?.data?.message || '로그인 실패. 다시 시도해주세요.';
      setError(errorMessage);
      console.error('로그인 오류:', err);
    } finally {
      setIsLoading(false); // 로딩 끝
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4">
      {/* 💼 카드 컨테이너 */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">로그인</h1>
          <p className="text-gray-600 text-sm mt-2">
            Pocket Closet에 로그인하여 스타일을 관리하세요
          </p>
        </div>

        {/* ❌ 에러 메시지 (조건부 렌더링) */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 📝 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              autoComplete="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
