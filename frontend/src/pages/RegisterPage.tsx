import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';

/**
 * RegisterPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 이름, 이메일, 비밀번호, 비밀번호 확인 입력 폼
 * 2. 폼 유효성 검사 (비밀번호 일치 확인)
 * 3. 회원가입 API 호출 (ApiClient 사용)
 * 4. 응답 받은 토큰/사용자 정보를 Zustand에 저장
 * 5. 성공 시 대시보드로 자동 이동
 * 6. 에러 메시지 표시
 *
 * 💡 LoginPage와의 차이점:
 * - "name" 필드 추가
 * - "confirmPassword" 유효성 검사 (비밀번호 일치)
 * - ApiClient.register() 호출 (login 대신)
 * - 비밀번호 강도 검증 (선택사항)
 */
export function RegisterPage() {
  // 📍 상태 관리 (5가지 상태)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
   * 회원가입 유효성 검사
   *
   * ✅ 검사 항목:
   * 1. 이름 필수
   * 2. 이메일 필수 + 이메일 형식
   * 3. 비밀번호 필수 + 최소 6자
   * 4. 비밀번호 확인 필수 + 일치
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return false;
    }

    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return false;
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('유효한 이메일을 입력해주세요');
      return false;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요');
      return false;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return false;
    }

    if (!confirmPassword) {
      setError('비밀번호 확인을 입력해주세요');
      return false;
    }

    // 핵심: 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return false;
    }

    return true;
  };

  /**
   * 회원가입 처리 함수
   *
   * 🔄 동작 순서:
   * 1. validateForm() 으로 유효성 검사
   * 2. ApiClient.register() 호출 → 백엔드 POST /api/auth/register
   * 3. 응답 받기 → { success, message, data: { token, user } }
   * 4. Zustand에 저장 → setToken(token), setUser(user)
   * 5. 대시보드로 이동 → navigate('/dashboard')
   * 6. 에러 발생 시 setError로 표시
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 방지

    // 유효성 검사
    if (!validateForm()) {
      return;
    }

    setError(''); // 이전 에러 메시지 초기화
    setIsLoading(true); // 로딩 시작

    try {
      // 1️⃣ apiClient.register() 호출
      const response = await apiClient.register(name, email, password);

      // 2️⃣ 응답 구조: ApiResponse<{ token: string, user: User }>
      // apiClient.register() 반환값: { success, message, data: { token, user } }
      const { token, user: userData } = response.data;

      // 3️⃣ Zustand 전역 상태에 저장
      setToken(token);
      setUser(userData);

      // 4️⃣ 회원가입 성공 → 대시보드로 이동
      navigate('/dashboard');
    } catch (err: any) {
      // 에러 처리
      // 백엔드에서 "이미 존재하는 이메일" 같은 에러 메시지 반환
      const errorMessage =
        err.response?.data?.message || '회원가입 실패. 다시 시도해주세요.';
      setError(errorMessage);
      console.error('회원가입 오류:', err);
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
          <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
          <p className="text-gray-600 text-sm mt-2">
            Pocket Closet 계정을 만들어 스타일을 관리하세요
          </p>
        </div>

        {/* ❌ 에러 메시지 (조건부 렌더링) */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 📝 회원가입 폼 */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* 이름 입력 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              disabled={isLoading}
              autoComplete="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

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
              비밀번호 (6자 이상)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 비밀번호 확인 입력 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="new-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
