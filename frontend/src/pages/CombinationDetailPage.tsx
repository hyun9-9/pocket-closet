import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';

/**
 * CombinationDetailPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 조합 상세 정보 표시
 * 2. 의류 아이템 상세 정보 (큰 이미지)
 * 3. 조합 메타데이터 (용도, 계절, 평가, 사용 횟수)
 * 4. 조합 편집 (이름, 설명, 메타데이터)
 * 5. 조합 삭제
 * 6. 조합 공유 (링크 복사)
 * 7. 사용 횟수 증가
 */

interface ClothingDetail {
  id: string;
  name: string;
  originalImage: string;
  primaryColor: string;
  colorHex: string;
  pattern: string;
  material: string;
  style: string[];
  season: string[];
  occasion: string[];
  brand?: string;
  formality?: number;
}

interface CombinationItem {
  clothingId: string;
  name: string;
  primaryColor: string;
  colorHex: string;
  pattern: string;
  style: string[];
  originalImage: string;
  layer: number;
}

interface CombinationDetail {
  id: string;
  userId: string;
  name: string;
  description: string;
  occasion: string;
  season: string | null;
  isAiRecommended: boolean;
  savedAt: string;
  originalRecommendationRank: number | null;
  rating: number | null;
  feedback: string | null;
  usedCount: number;
  items: CombinationItem[];
}

export function CombinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 📍 상태 관리
  const [combination, setCombination] = useState<CombinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    occasion: '',
    season: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'edit'>('overview');

  // 초기 로드
  useEffect(() => {
    loadCombinationDetail();
  }, [id]);

  /**
   * 조합 상세 정보 로드
   */
  const loadCombinationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // API에서 조합 조회 (SavedCombinationsPage와 동일한 엔드포인트 사용)
      const response = await apiClient.getCombinations(undefined, 1, 0);

      if (response.data && Array.isArray(response.data)) {
        const found = response.data.find((c: CombinationDetail) => c.id === id);
        if (found) {
          setCombination(found);
          setEditData({
            name: found.name,
            description: found.description || '',
            occasion: found.occasion,
            season: found.season || '',
          });
        } else {
          setError('조합을 찾을 수 없습니다');
        }
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(axiosError.response?.data?.message || '조합 로드 실패');
      console.error('조합 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 조합 삭제
   */
  const handleDelete = async () => {
    if (!combination) return;

    const confirmed = window.confirm('정말 이 조합을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await apiClient.deleteCombination(combination.id);
      alert('조합이 삭제되었습니다');
      navigate('/combinations');
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      alert(axiosError.response?.data?.message || '삭제 실패');
    }
  };

  /**
   * 조합 업데이트
   */
  const handleUpdate = async () => {
    if (!combination) return;

    try {
      setLoading(true);
      // 현재는 조회만 가능하므로, 나중에 업데이트 엔드포인트 추가 필요
      alert('조합 편집 기능은 준비 중입니다');
      setIsEditing(false);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      alert(axiosError.response?.data?.message || '업데이트 실패');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 사용 횟수 증가
   */
  const handleMarkAsUsed = async () => {
    if (!combination) return;

    try {
      // 현재는 별도 엔드포인트가 없으므로, 나중에 추가 필요
      alert('사용 기록 추가 기능은 준비 중입니다');
    } catch (err) {
      console.error('사용 기록 추가 오류:', err);
    }
  };

  /**
   * 링크 복사
   */
  const handleCopyLink = () => {
    if (!combination) return;

    const link = `${window.location.origin}/combinations/${combination.id}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('링크가 복사되었습니다');
    });
  };

  // 로딩 상태
  if (loading && !combination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">조합 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && !combination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/combinations')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!combination) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{combination.name}</h1>
            <p className="text-gray-600">
              {combination.isAiRecommended ? '🤖 AI 추천' : '💾 저장된 조합'}
              {combination.occasion && ` • ${combination.occasion}`}
              {combination.season && ` • ${combination.season}`}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              title="링크 복사"
            >
              🔗 공유
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
              title="편집"
            >
              ✏️ 편집
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              title="삭제"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 개요
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === 'items'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👕 의류 ({combination.items.length})
            </button>
            {isEditing && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  activeTab === 'edit'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✏️ 편집
              </button>
            )}
          </div>

          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <div className="p-8">
              {/* 메타데이터 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold mb-1">용도</p>
                  <p className="text-lg font-bold text-gray-900">{combination.occasion}</p>
                </div>
                {combination.season && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold mb-1">계절</p>
                    <p className="text-lg font-bold text-gray-900">{combination.season}</p>
                  </div>
                )}
                {combination.rating && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold mb-1">평가</p>
                    <p className="text-lg font-bold text-gray-900">
                      {'⭐'.repeat(combination.rating)} {combination.rating}/5
                    </p>
                  </div>
                )}
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold mb-1">사용 횟수</p>
                  <p className="text-lg font-bold text-gray-900">{combination.usedCount}회</p>
                </div>
              </div>

              {/* 설명 */}
              {combination.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">설명</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {combination.description}
                    </p>
                  </div>
                </div>
              )}

              {/* 피드백 */}
              {combination.feedback && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">피드백</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-700 italic text-sm">"{combination.feedback}"</p>
                  </div>
                </div>
              )}

              {/* 추가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">저장 정보</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📅 저장일: {new Date(combination.savedAt).toLocaleDateString('ko-KR')}</p>
                    {combination.isAiRecommended && combination.originalRecommendationRank && (
                      <p>🏆 원본 추천 순위: #{combination.originalRecommendationRank}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">작업</h3>
                  <button
                    onClick={handleMarkAsUsed}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    ✅ 이 조합을 입음
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 의류 탭 */}
          {activeTab === 'items' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combination.items.map((item) => (
                  <div
                    key={item.clothingId}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {/* 이미지 */}
                    <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                      {item.originalImage ? (
                        <img
                          src={item.originalImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          이미지 없음
                        </div>
                      )}
                      {/* 레이어 배지 */}
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Layer {item.layer}
                      </div>
                    </div>

                    {/* 정보 */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-3 truncate">{item.name}</h3>

                      {/* 색상 */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: item.colorHex }}
                          title={item.primaryColor}
                        />
                        <span className="text-sm text-gray-600">{item.primaryColor}</span>
                      </div>

                      {/* 세부 정보 */}
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>패턴: {item.pattern}</p>
                      </div>

                      {/* 스타일 태그 */}
                      {item.style.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.style.map((s) => (
                            <span
                              key={s}
                              className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 편집 탭 */}
          {activeTab === 'edit' && isEditing && (
            <div className="p-8">
              <div className="space-y-6 max-w-2xl">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    조합 이름
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 용도 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    용도
                  </label>
                  <select
                    value={editData.occasion}
                    onChange={(e) => setEditData({ ...editData, occasion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="일상">일상</option>
                    <option value="출근">출근</option>
                    <option value="데이트">데이트</option>
                    <option value="파티">파티</option>
                    <option value="운동">운동</option>
                  </select>
                </div>

                {/* 계절 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    계절 (선택사항)
                  </label>
                  <select
                    value={editData.season}
                    onChange={(e) => setEditData({ ...editData, season: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">계절 선택</option>
                    <option value="봄">봄</option>
                    <option value="여름">여름</option>
                    <option value="가을">가을</option>
                    <option value="겨울">겨울</option>
                  </select>
                </div>

                {/* 버튼 */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-semibold"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/combinations')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            ← 목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
