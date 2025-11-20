import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';

/**
 * SavedCombinationsPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 저장된 조합 목록 조회 (페이지네이션)
 * 2. 필터링 (AI 추천 vs 직접 생성)
 * 3. 용도별 필터링
 * 4. 계절별 필터링
 * 5. 조합 평가 (1-5점)
 * 6. 조합 삭제
 * 7. 로딩/에러 상태 처리
 *
 * 💡 핵심 기술:
 * - API 연동 (getCombinations, updateRating, deleteCombination)
 * - 상태 관리 (useState)
 * - 필터링 및 페이지네이션
 * - 모달/확인 대화상자
 */

interface ClothingItem {
  clothingId: string;
  name: string;
  primaryColor: string;
  colorHex?: string;
  pattern: string;
  style: string[];
  originalImage: string;
  layer: number;
}

interface SavedCombination {
  id: string;
  name: string;
  description?: string;
  occasion: string;
  season?: string;
  isAiRecommended: boolean;
  savedAt: string;
  originalRecommendationRank?: number;
  rating?: number;
  feedback?: string;
  items: ClothingItem[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function SavedCombinationsPage() {
  const navigate = useNavigate();

  // 📍 상태 관리
  const [combinations, setCombinations] = useState<SavedCombination[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [filters, setFilters] = useState({
    isAiRecommended: undefined as boolean | undefined,
    occasion: '' as string,
    season: '' as string,
  });

  // 평가 상태
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // 삭제 확인
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 📍 초기 로드
  useEffect(() => {
    loadCombinations(0);
  }, []);

  /**
   * 저장된 조합 로드
   */
  const loadCombinations = async (offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getCombinations({
        isAiRecommended: filters.isAiRecommended,
        occasion: filters.occasion || undefined,
        season: filters.season || undefined,
        limit: 12,
        offset,
      });

      // 조합이 없어도 정상 처리 (빈 배열 반환)
      if (response.data !== undefined) {
        setCombinations(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || null);
      } else {
        // 데이터가 없으면 빈 상태로 설정
        setCombinations([]);
        setPagination(null);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || '조합 로드 실패';

      // 404 에러는 무시 (조합이 없는 경우)
      if (axiosError.response?.status === 404) {
        setCombinations([]);
        setPagination(null);
      } else {
        setError(errorMessage);
        console.error('조합 로드 오류:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 변경 처리
   */
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    loadCombinations(0); // 첫 페이지부터 다시 로드
  };

  /**
   * 페이지 변경
   */
  const handlePageChange = (page: number) => {
    const offset = (page - 1) * 12;
    loadCombinations(offset);
  };

  /**
   * 평가 저장
   */
  const handleSaveRating = async (combinationId: string) => {
    try {
      setLoading(true);

      await apiClient.updateCombinationRating(
        combinationId,
        ratingValue,
        ratingFeedback
      );

      // 목록 새로고침
      await loadCombinations(
        ((pagination?.page || 1) - 1) * (pagination?.limit || 12)
      );

      // 수정 모드 종료
      setEditingRating(null);
      setRatingValue(0);
      setRatingFeedback('');

      alert('평가가 저장되었습니다');
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || '평가 저장 실패';
      alert(`오류: ${errorMessage}`);
      console.error('평가 저장 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 조합 삭제
   */
  const handleDelete = async (combinationId: string) => {
    try {
      setLoading(true);

      await apiClient.deleteCombination(combinationId);

      // 목록 새로고침
      await loadCombinations(
        ((pagination?.page || 1) - 1) * (pagination?.limit || 12)
      );

      setDeleteConfirm(null);
      alert('조합이 삭제되었습니다');
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || '삭제 실패';
      alert(`오류: ${errorMessage}`);
      console.error('삭제 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 조합 카드 렌더링
   */
  const renderCombinationCard = (combo: SavedCombination, index: number) => {
    const isEditing = editingRating === combo.id;

    return (
      <div
        key={combo.id}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
        onClick={() => navigate(`/combinations/${combo.id}`)}
      >
        {/* 이미지 그리드 */}
        <div className="grid grid-cols-3 gap-1 h-40 bg-gray-200">
          {combo.items.slice(0, 3).map((item) => (
            <div
              key={item.clothingId}
              className="relative overflow-hidden bg-gray-300"
            >
              {item.originalImage ? (
                <img
                  src={item.originalImage}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  이미지 없음
                </div>
              )}
            </div>
          ))}
          {combo.items.length > 3 && (
            <div className="flex items-center justify-center bg-gray-400 text-white text-sm font-semibold">
              +{combo.items.length - 3}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-4">
          {/* 제목 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">
              {combo.name}
            </h3>
            {combo.isAiRecommended && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded whitespace-nowrap">
                AI 추천
              </span>
            )}
          </div>

          {/* 메타정보 */}
          <div className="space-y-1 mb-3 text-sm text-gray-600">
            <p>용도: <span className="font-semibold">{combo.occasion}</span></p>
            {combo.season && (
              <p>계절: <span className="font-semibold">{combo.season}</span></p>
            )}
            <p className="text-xs text-gray-500">
              저장: {new Date(combo.savedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* 평가 표시 또는 수정 모드 */}
          {isEditing ? (
            <div className="border-t pt-3 space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  평가 (1-5점)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      className={`text-lg transition ${
                        star <= ratingValue ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  피드백 (선택)
                </label>
                <textarea
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="조합에 대한 피드백을 입력하세요"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveRating(combo.id)}
                  disabled={loading || ratingValue === 0}
                  className="flex-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingRating(null);
                    setRatingValue(0);
                    setRatingFeedback('');
                  }}
                  className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-400 transition"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-3 flex items-center justify-between">
              {combo.rating ? (
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= Math.round(combo.rating || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {combo.feedback && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {combo.feedback}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">아직 평가하지 않음</p>
              )}

              <button
                onClick={() => {
                  setEditingRating(combo.id);
                  setRatingValue(combo.rating ? Math.round(combo.rating) : 0);
                  setRatingFeedback(combo.feedback || '');
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition whitespace-nowrap"
              >
                평가하기
              </button>
            </div>
          )}

          {/* 삭제 버튼 */}
          <div className="border-t mt-3 pt-3">
            {deleteConfirm === combo.id ? (
              <div className="space-y-2">
                <p className="text-xs text-red-600 font-semibold">
                  정말 삭제하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(combo.id)}
                    disabled={loading}
                    className="flex-1 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition disabled:opacity-50"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-400 transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(combo.id)}
                className="w-full px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded hover:bg-red-200 transition"
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 📍 메인 렌더링
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">저장된 조합</h1>
          <p className="text-gray-600">
            저장한 스타일 조합을 관리하고 평가해보세요
          </p>
        </div>

        {/* 필터 패널 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI 추천 필터 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                유형
              </label>
              <select
                value={
                  filters.isAiRecommended === undefined
                    ? ''
                    : filters.isAiRecommended.toString()
                }
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    isAiRecommended:
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="true">AI 추천</option>
                <option value="false">직접 생성</option>
              </select>
            </div>

            {/* 용도 필터 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                용도
              </label>
              <input
                type="text"
                placeholder="예: 데이트, 출근"
                value={filters.occasion}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    occasion: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 계절 필터 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                계절
              </label>
              <select
                value={filters.season}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    season: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="봄">봄</option>
                <option value="여름">여름</option>
                <option value="가을">가을</option>
                <option value="겨울">겨울</option>
                <option value="사계절">사계절</option>
              </select>
            </div>

            {/* 리셋 버튼 */}
            <div className="flex items-end">
              <button
                onClick={() =>
                  handleFilterChange({
                    isAiRecommended: undefined,
                    occasion: '',
                    season: '',
                  })
                }
                className="w-full px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">
              <strong>오류:</strong> {error}
            </p>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && combinations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">조합을 불러오는 중입니다...</p>
            </div>
          </div>
        ) : combinations.length > 0 ? (
          <>
            {/* 조합 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {combinations.map((combo, index) =>
                renderCombinationCard(combo, index)
              )}
            </div>

            {/* 페이지네이션 */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    handlePageChange(Math.max(1, (pagination?.page || 1) - 1))
                  }
                  disabled={!pagination?.hasPrevPage || loading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {Array.from({ length: pagination.pages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg transition ${
                        pageNum === pagination.page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    handlePageChange(
                      Math.min(pagination?.pages || 1, (pagination?.page || 1) + 1)
                    )
                  }
                  disabled={!pagination?.hasNextPage || loading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}

            {/* 통계 */}
            <div className="mt-8 text-center text-gray-600">
              <p>
                총 <span className="font-semibold">{pagination?.total}</span>개의 조합이 저장되었습니다
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">아직 저장된 조합이 없습니다</p>
            <p className="text-gray-500 text-sm">
              추천 페이지에서 마음에 드는 조합을 저장해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
