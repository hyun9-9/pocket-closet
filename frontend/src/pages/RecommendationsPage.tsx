import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';
import { RecommendationCountSelector } from './RecommendationCountSelector';

/**
 * RecommendationsPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 2단계 UI:
 *    - 단계 1️⃣: RecommendationCountSelector에서 개수 선택
 *    - 단계 2️⃣: 선택 후 추천 결과 표시
 * 2. AI 생성 의류 조합 표시 (그리드)
 * 3. 각 조합의 AI 설명 표시
 * 4. 별점 평가 시스템 (1-5점)
 * 5. 추천 다시 생성 버튼
 * 6. 로딩 상태 표시
 * 7. 에러 처리
 *
 * 💡 핵심 기술:
 * - API 연동 (getRecommendations)
 * - 상태 관리 (useState)
 * - 이미지 표시
 * - 별점 UI
 * - 로딩/에러 처리
 * - 2단계 UI 플로우
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
  reason: string | string[]; // 문자열 또는 배열 모두 지원
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
  const [step, setStep] = useState<'select' | 'result'>('select'); // 1️⃣ 선택 단계 추가
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clothingMap, setClothingMap] = useState<ClothingMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationCount, setRecommendationCount] = useState(1);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});

  // 📍 초기 로드 제거 - 사용자가 개수 선택할 때까지 대기
  useEffect(() => {
    // 페이지 로드 시 아무것도 하지 않음
    // handleCountSelect에서만 loadRecommendations 호출
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
   * 개수 선택 처리 (첫 진입 시)
   * 2️⃣ 새로운 함수 - 선택 단계에서 결과 단계로 전환
   */
  const handleCountSelect = async (count: number) => {
    setRecommendationCount(count);
    setStep('result'); // 결과 단계로 전환
    await loadRecommendations(count);
  };

  /**
   * 추천 개수 변경 (결과 화면에서)
   */
  const handleCountChange = async (count: number) => {
    setRecommendationCount(count);
    // 새로운 개수로 추천 다시 로드
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
    console.log(`추천 ${rankIndex + 1} 평점: ${rating}점`);
  };

  /**
   * 조합 저장
   */
  const handleSaveCombination = async (rec: Recommendation) => {
    try {
      setLoading(true);

      // 의류 레이어 정보 생성 (순서 기반)
      const combinationItems = rec.combination.map((item, index) => ({
        clothingId: item.id,
        layer: index + 1,
      }));

      // reason을 문자열로 변환 (배열이면 줄바꿈으로 연결)
      const reasonText = Array.isArray(rec.reason)
        ? rec.reason.join('\n')
        : rec.reason;

      // 저장 API 호출
      const result = await apiClient.saveRecommendation({
        recommendationRank: rec.rank,
        recommendationScore: rec.score,
        combinationItems,
        occasion: '일반', // TODO: 사용자가 선택한 용도로 변경 필요
        season: undefined, // TODO: 계절 정보 추가 필요
        name: undefined, // 자동 생성되도록 함
        description: reasonText, // AI 설명을 description으로 사용 (배열이면 줄바꿈으로 연결)
      });

      // 성공 메시지 (data 필드가 없을 수도 있으므로 안전하게 처리)
      const savedName = result.data?.name || result.data?.id || '저장된 조합';
      alert(`조합이 저장되었습니다: ${savedName}`);
      console.log('저장된 조합:', result.data || result);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || '조합 저장 실패';

      // 중복 저장 에러 메시지 처리
      if (
        errorMessage.includes('이미 저장된') ||
        axiosError.response?.data?.code === 'COMBINATION_ALREADY_SAVED'
      ) {
        alert('이미 저장된 조합입니다!');
      } else {
        alert(`오류: ${errorMessage}`);
      }

      console.error('조합 저장 오류:', error);
    } finally {
      setLoading(false);
    }
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

  // 📍 1️⃣ 선택 단계 - RecommendationCountSelector 표시
  if (step === 'select') {
    return (
      <RecommendationCountSelector
        onSelect={handleCountSelect}
        isLoading={loading}
      />
    );
  }

  // 📍 로딩 상태 (결과 단계에서)
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

  // 📍 2️⃣ 결과 단계 - 추천 결과 표시
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">스타일 추천</h1>
            <p className="text-gray-600">AI가 당신의 옷장을 분석해 최고의 조합을 추천합니다</p>
          </div>
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => setStep('select')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition"
            title="개수 선택 화면으로 돌아가기"
          >
            ← 다시 선택
          </button>
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
                    {Array.isArray(rec.reason) ? (
                      <div className="space-y-2">
                        {rec.reason.map((reason, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <p className="text-gray-700 text-sm leading-relaxed flex-1">
                              {reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm leading-relaxed">{rec.reason}</p>
                    )}
                  </div>
                </div>

                {/* 의류 조합 그리드 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {rec.combination.map((item) => renderClothingItem(item))}
                  </div>

                  {/* 평가 섹션 */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                      <div className="flex-1">
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

                      {/* 저장 버튼 */}
                      <button
                        onClick={() => handleSaveCombination(rec)}
                        disabled={loading}
                        className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="이 조합을 저장하기"
                      >
                        💾 저장하기
                      </button>
                    </div>
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
