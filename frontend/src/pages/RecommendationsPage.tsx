import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';

/**
 * RecommendationsPage 컴포넌트
 *
 * ✅ 기능:
 * 1. AI 생성 의류 조합 표시 (그리드)
 * 2. 각 조합의 AI 설명 표시
 * 3. 별점 평가 시스템 (1-5점)
 * 4. 추천 다시 생성 버튼
 * 5. 추천 개수 선택
 * 6. 로딩 상태 표시
 * 7. 에러 처리
 *
 * 💡 핵심 기술:
 * - API 연동 (getRecommendations)
 * - 상태 관리 (useState)
 * - 이미지 표시
 * - 별점 UI
 * - 로딩/에러 처리
 */

interface ClothingItem {
  id: string;
  name: string;
  color: string;
  pattern: string;
  style: string[];
}

interface Recommendation {
  rank: number;
  score: number;
  reason: string;
  combination: ClothingItem[];
}

interface ClothingDetail {
  originalImage: string;
  primaryColor: string;
  pattern: string;
  material: string;
  style: string[];
  season: string[];
  occasion: string[];
  colorHex: string;
}

interface ClothingMap {
  [key: string]: ClothingDetail;
}

export function RecommendationsPage() {
  // 📍 상태 관리
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clothingMap, setClothingMap] = useState<ClothingMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationCount, setRecommendationCount] = useState(1);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});

  // 📍 초기 로드
  useEffect(() => {
    loadRecommendations();
  }, []);

  /**
   * 추천 데이터 로드
   */
  const loadRecommendations = async (count: number = recommendationCount) => {
    try {
      setLoading(true);
      setError(null);

      // 1️⃣ 추천 데이터 조회
      const response = await apiClient.getRecommendations(count);

      // 2️⃣ 의류 상세 정보 로드
      if (response.data && response.data.recommendations) {
        const recs = response.data.recommendations;
        setRecommendations(recs);

        // 의류 ID 수집
        const clothingIds = new Set<string>();
        recs.forEach((rec: Recommendation) => {
          rec.combination.forEach((item: ClothingItem) => {
            if (item.id) clothingIds.add(item.id);
          });
        });

        // 3️⃣ 각 의류의 상세 정보 조회
        const clothingDetails: ClothingMap = {};
        for (const clothingId of clothingIds) {
          try {
            const clothingResponse = await apiClient.getClothingById(clothingId);
            if (clothingResponse.data) {
              clothingDetails[clothingId] = clothingResponse.data;
            }
          } catch (err) {
            console.error(`의류 ${clothingId} 조회 실패:`, err);
          }
        }

        setClothingMap(clothingDetails);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || '추천 로드 실패';
      setError(errorMessage);
      console.error('추천 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 추천 다시 생성
   */
  const handleRegenerate = async () => {
    await loadRecommendations(recommendationCount);
  };

  /**
   * 추천 개수 변경
   */
  const handleCountChange = async (count: number) => {
    setRecommendationCount(count);
    await loadRecommendations(count);
  };

  /**
   * 별점 설정
   */
  const handleRating = (rankIndex: number, rating: number) => {
    setRatings({
      ...ratings,
      [rankIndex]: rating,
    });
    // TODO: 별점을 서버에 저장할 때 구현
    console.log(`추천 ${rankIndex + 1} 평점: ${rating}점`);
  };

  /**
   * 의류 아이템 카드 렌더링
   */
  const renderClothingItem = (item: ClothingItem) => {
    const detail = clothingMap[item.id];

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
      >
        {/* 이미지 */}
        <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
          {detail?.originalImage ? (
            <img
              src={detail.originalImage}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>

          {/* 색상 */}
          {detail?.colorHex && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-5 h-5 rounded-full border border-gray-300"
                style={{ backgroundColor: detail.colorHex }}
                title={item.color}
              />
              <span className="text-xs text-gray-600">{item.color}</span>
            </div>
          )}

          {/* 패턴 */}
          <p className="text-xs text-gray-500 mb-2">패턴: {item.pattern}</p>

          {/* 스타일 태그 */}
          {detail?.style && detail.style.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {detail.style.map((s: string) => (
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
    );
  };

  /**
   * 별점 렌더링
   */
  const renderStars = (rankIndex: number) => {
    const currentRating = ratings[rankIndex] || 0;

    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(rankIndex, star)}
            className={`text-2xl transition ${
              star <= currentRating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
            title={`${star}점`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // 📍 로딩 상태
  if (loading && recommendations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">AI가 당신을 위한 추천을 생성 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">스타일 추천</h1>
          <p className="text-gray-600">AI가 당신의 옷장을 분석해 최고의 조합을 추천합니다</p>
        </div>

        {/* 제어 패널 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* 추천 개수 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                추천 개수
              </label>
              <div className="flex gap-2">
                {[1, 3, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleCountChange(count)}
                    className={`px-4 py-2 rounded transition ${
                      recommendationCount === count
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {count}개
                  </button>
                ))}
              </div>
            </div>

            {/* 다시 생성 버튼 */}
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '다시 생성하기'}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">
              <strong>오류:</strong> {error}
            </p>
            {error.includes('3개') && (
              <p className="text-red-700 text-sm mt-2">
                옷장에 최소 3개 이상의 의류를 등록해주세요.
              </p>
            )}
          </div>
        )}

        {/* 추천 리스트 */}
        {recommendations.length > 0 ? (
          <div className="space-y-8">
            {recommendations.map((rec, recIndex) => (
              <div key={recIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* 추천 헤더 */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* 순위 배지 */}
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {rec.rank}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">추천 조합 #{rec.rank}</h2>
                        <p className="text-sm text-gray-600">
                          점수: <span className="font-semibold text-blue-600">{rec.score}/10</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI 설명 */}
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{rec.reason}</p>
                  </div>
                </div>

                {/* 의류 조합 그리드 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {rec.combination.map((item) => renderClothingItem(item))}
                  </div>

                  {/* 평가 섹션 */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      이 조합은 어떤가요?
                    </label>
                    {renderStars(recIndex)}
                    {ratings[recIndex] && (
                      <p className="text-sm text-gray-600 mt-2">
                        {ratings[recIndex]}점을 평가했습니다
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">추천을 불러올 수 없습니다.</p>
            <button
              onClick={() => loadRecommendations()}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              다시 시도하기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
