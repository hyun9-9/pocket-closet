import { useState, useEffect, useMemo } from 'react';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';

/**
 * WardrobePage 컴포넌트
 *
 * ✅ 기능:
 * 1. 의류 아이템 그리드 표시
 * 2. 색상, 소재, 스타일, 용도 필터
 * 3. 검색 기능
 * 4. 페이지네이션
 * 5. 상세 정보 모달
 * 6. 삭제 기능
 *
 * 💡 핵심 기술:
 * - 동적 필터링 (useEffect)
 * - 페이지네이션 (useMemo)
 * - 모달 관리
 * - 반응형 그리드
 */

interface Clothing {
  id: string;
  name: string;
  brand?: string;
  primaryColor: string;
  colorHex?: string;
  pattern: string;
  material: string;
  style: string[];
  season: string[];
  occasion: string[];
  originalImage: string;
  thumbnailImage?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function WardrobePage() {
  // 📍 상태 관리
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<Clothing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📋 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);

  // 📄 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // 🔍 모달
  const [selectedClothing, setSelectedClothing] = useState<Clothing | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 📊 필터 옵션 (동적으로 계산)
  const materials = useMemo(
    () => [...new Set(clothes.map(c => c.material).filter(Boolean))],
    [clothes]
  );
  const colors = useMemo(
    () => [...new Set(clothes.map(c => c.primaryColor).filter(Boolean))],
    [clothes]
  );
  const styles = useMemo(
    () => [...new Set(clothes.flatMap(c => c.style))],
    [clothes]
  );
  const occasions = useMemo(
    () => [...new Set(clothes.flatMap(c => c.occasion))],
    [clothes]
  );

  // 🔄 초기 데이터 로드
  useEffect(() => {
    loadClothes();
  }, []);

  // 📊 필터링 + 페이지네이션
  useEffect(() => {
    let filtered = clothes;

    // 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    }

    // 색상 필터 (OR)
    if (selectedColors.length > 0) {
      filtered = filtered.filter(c =>
        selectedColors.includes(c.primaryColor)
      );
    }

    // 소재 필터 (OR)
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter(c =>
        selectedMaterials.includes(c.material)
      );
    }

    // 스타일 필터 (OR - 하나 이상)
    if (selectedStyles.length > 0) {
      filtered = filtered.filter(c =>
        c.style.some(s => selectedStyles.includes(s))
      );
    }

    // 용도 필터 (OR - 하나 이상)
    if (selectedOccasions.length > 0) {
      filtered = filtered.filter(c =>
        c.occasion.some(o => selectedOccasions.includes(o))
      );
    }

    setFilteredClothes(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [clothes, searchQuery, selectedColors, selectedMaterials, selectedStyles, selectedOccasions]);

  // 📄 페이지네이션된 아이템
  const paginatedClothes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredClothes.slice(startIndex, endIndex);
  }, [filteredClothes, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredClothes.length / pageSize);

  /**
   * 의류 목록 로드
   */
  const loadClothes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.getClothing({
        limit: 100, // 로컬 필터링을 위해 모든 데이터 로드
        offset: 0,
      });

      setClothes(response.data || []);
      setPagination(response.pagination);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || '의류 목록을 불러올 수 없습니다');
      } else {
        setError('오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 초기화
   */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedStyles([]);
    setSelectedOccasions([]);
    setCurrentPage(1);
  };

  /**
   * 의류 삭제
   */
  const handleDelete = async () => {
    if (!selectedClothing) return;

    setDeleting(true);

    try {
      await apiClient.deleteClothing(selectedClothing.id);
      setClothes(clothes.filter(c => c.id !== selectedClothing.id));
      setShowDetailModal(false);
      setShowDeleteConfirm(false);
      setSelectedClothing(null);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || '삭제에 실패했습니다');
      }
    } finally {
      setDeleting(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">의류를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 📋 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            내 옷장
          </h1>
          <p className="text-gray-600">
            총 {clothes.length}개의 의류 | 검색 결과: {filteredClothes.length}개
          </p>
        </div>

        {/* ❌ 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 🎨 필터 패널 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* 검색 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">검색</label>
            <input
              type="text"
              placeholder="의류 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* 필터 그룹 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 색상 필터 */}
            <div>
              <label className="block text-sm font-semibold mb-3">색상</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {colors.sort().map((color) => (
                  <label key={color} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColors([...selectedColors, color]);
                        } else {
                          setSelectedColors(selectedColors.filter(c => c !== color));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 소재 필터 */}
            <div>
              <label className="block text-sm font-semibold mb-3">소재</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {materials.sort().map((material) => (
                  <label key={material} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMaterials([...selectedMaterials, material]);
                        } else {
                          setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{material}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 스타일 필터 */}
            <div>
              <label className="block text-sm font-semibold mb-3">스타일</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {styles.sort().map((style) => (
                  <label key={style} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStyles.includes(style)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStyles([...selectedStyles, style]);
                        } else {
                          setSelectedStyles(selectedStyles.filter(s => s !== style));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 용도 필터 */}
            <div>
              <label className="block text-sm font-semibold mb-3">활용 용도</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {occasions.sort().map((occasion) => (
                  <label key={occasion} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occasion)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOccasions([...selectedOccasions, occasion]);
                        } else {
                          setSelectedOccasions(selectedOccasions.filter(o => o !== occasion));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{occasion}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 필터 초기화 버튼 */}
          <button
            onClick={resetFilters}
            className="mt-6 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition"
          >
            필터 초기화
          </button>
        </div>

        {/* 📊 의류 그리드 */}
        {filteredClothes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">조건에 맞는 의류가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {paginatedClothes.map((clothing) => (
                <div
                  key={clothing.id}
                  onClick={() => {
                    setSelectedClothing(clothing);
                    setShowDetailModal(true);
                  }}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden"
                >
                  {/* 이미지 */}
                  <div className="relative h-40 bg-gray-200">
                    <img
                      src={clothing.thumbnailImage || clothing.originalImage}
                      alt={clothing.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate mb-2">
                      {clothing.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: clothing.colorHex || '#808080' }}
                      />
                      <span className="text-xs text-gray-600">{clothing.primaryColor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 📄 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 mb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 📋 상세 모달 */}
        {showDetailModal && selectedClothing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* 이미지 */}
                <img
                  src={selectedClothing.originalImage}
                  alt={selectedClothing.name}
                  className="w-full h-96 object-cover rounded-lg mb-6"
                />

                {/* 메타데이터 */}
                <h2 className="text-2xl font-bold mb-4">{selectedClothing.name}</h2>

                {/* 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
                  <div>
                    <p className="text-gray-600 text-sm">색상</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: selectedClothing.colorHex || '#808080' }}
                      />
                      <p className="font-semibold">{selectedClothing.primaryColor}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">소재</p>
                    <p className="font-semibold mt-1">{selectedClothing.material}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 text-sm">패턴</p>
                    <p className="font-semibold mt-1">{selectedClothing.pattern}</p>
                  </div>

                  {selectedClothing.brand && (
                    <div>
                      <p className="text-gray-600 text-sm">브랜드</p>
                      <p className="font-semibold mt-1">{selectedClothing.brand}</p>
                    </div>
                  )}

                  <div className="col-span-2">
                    <p className="text-gray-600 text-sm mb-2">스타일</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedClothing.style.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-600 text-sm mb-2">시즌</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedClothing.season.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-600 text-sm mb-2">활용 용도</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedClothing.occasion.map((o) => (
                        <span
                          key={o}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🗑️ 삭제 확인 모달 */}
        {showDeleteConfirm && selectedClothing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-4">정말로 삭제하시겠어요?</h3>
              <p className="text-gray-600 mb-6">
                <strong>{selectedClothing.name}</strong>을(를) 삭제하면 복구할 수 없습니다.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                  disabled={deleting}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
