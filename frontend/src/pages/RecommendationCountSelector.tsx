/**
 * RecommendationCountSelector 컴포넌트
 *
 * ✅ 기능:
 * 1. 추천 받을 개수 선택 UI 제공 (1, 3, 5, 10개)
 * 2. 각 옵션에 대한 설명 표시
 * 3. 선택 후 콜백 함수 실행
 *
 * 💡 사용 방식:
 * - RecommendationsPage에서 렌더링
 * - 사용자가 개수를 선택하면 onSelect 콜백 실행
 * - 선택 후 결과 화면으로 전환
 */

interface RecommendationCountSelectorProps {
  onSelect: (count: number) => void;
  isLoading?: boolean;
}

export function RecommendationCountSelector({
  onSelect,
  isLoading = false,
}: RecommendationCountSelectorProps) {
  const options = [
    {
      count: 1,
      label: '1개 추천받기',
      description: '가장 추천하는 조합 1가지',
      icon: '👔',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
    },
    {
      count: 3,
      label: '3개 추천받기',
      description: '다양한 조합 3가지',
      icon: '👗',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
    },
    {
      count: 5,
      label: '5개 추천받기',
      description: '다양한 스타일 5가지',
      icon: '👠',
      color: 'bg-pink-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-600',
    },
    {
      count: 10,
      label: '10개 추천받기',
      description: '최대한 많은 선택지 (시간 소요)',
      icon: '🎨',
      color: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            스타일 추천
          </h1>
          <p className="text-lg text-gray-600">
            AI가 당신의 옷장을 분석하여 최고의 조합을 추천합니다
          </p>
          <p className="text-sm text-gray-500 mt-2">
            추천받을 개수를 선택해주세요
          </p>
        </div>

        {/* 옵션 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {options.map((option) => (
            <button
              key={option.count}
              onClick={() => onSelect(option.count)}
              disabled={isLoading}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${option.color} ${option.borderColor}`}
            >
              {/* 아이콘 */}
              <div className="text-5xl mb-4">{option.icon}</div>

              {/* 제목 */}
              <h3 className={`text-xl font-bold mb-2 ${option.textColor}`}>
                {option.label}
              </h3>

              {/* 설명 */}
              <p className="text-sm text-gray-600">{option.description}</p>

              {/* 로딩 상태 */}
              {isLoading && (
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-current"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 하단 팁 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-blue-600">💡 팁:</span> 처음에는{' '}
            <span className="text-blue-600 font-semibold">1개</span>나{' '}
            <span className="text-blue-600 font-semibold">3개</span>를 추천합니다.
            마음에 드는 추천이 없으면 다시 생성할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
