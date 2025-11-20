import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { apiClient } from '../services/api';

/**
 * UploadPage 컴포넌트
 *
 * ✅ 기능:
 * 1. 드래그 앤 드롭으로 이미지 업로드
 * 2. 파일 선택 (input file)
 * 3. 이미지 미리보기
 * 4. 파일 검증 (타입, 크기)
 * 5. 업로드 진행률 표시
 * 6. AI 분석 결과 표시 (색상, 패턴, 스타일 등)
 * 7. 성공 시 옷장으로 이동
 *
 * 💡 핵심 기술:
 * - HTML5 Drag & Drop API
 * - FileReader (이미지 미리보기)
 * - FormData (파일 전송)
 * - Tailwind CSS (반응형)
 *
 * 📐 반응형 디자인:
 * - 모바일: 전체 너비
 * - 태블릿+: 최대 600px 중앙 정렬
 */
export function UploadPage() {
  // 📍 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadedItem, setUploadedItem] = useState<any>(null);

  // 📋 폼 필드
  const [clothingName, setClothingName] = useState('');
  const [clothingBrand, setClothingBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; nameEn: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // 🔀 라우팅
  const navigate = useNavigate();

  // 🔄 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiClient.getCategories();
        setCategories(response.data || []);
        // 첫 번째 카테고리를 기본값으로 설정 (UUID id 사용)
        if (response.data && response.data.length > 0) {
          setCategoryId(response.data[0].id);
        }
      } catch (err) {
        console.error('카테고리 로드 실패:', err);
        setError('카테고리를 불러올 수 없습니다');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  /**
   * 파일 검증
   *
   * ✅ 검사 항목:
   * 1. 파일 타입 (image/jpeg, image/png만 허용)
   * 2. 파일 크기 (10MB 이하)
   */
  const validateFile = (file: File): boolean => {
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('JPG, JPEG, PNG, WebP 파일만 업로드 가능합니다');
      return false;
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return false;
    }

    return true;
  };

  /**
   * 이미지 미리보기 생성
   *
   * 🔄 동작:
   * 1. FileReader 생성
   * 2. readAsDataURL()로 이미지 읽기
   * 3. onload 이벤트에서 preview 상태 업데이트
   */
  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result); // Data URL 저장
    };
    reader.readAsDataURL(file);
  };

  /**
   * 파일 선택 처리
   *
   * 🔄 동작:
   * 1. 파일 검증
   * 2. 미리보기 생성
   * 3. 상태 업데이트
   */
  const handleFileSelect = (file: File) => {
    setError('');

    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    createPreview(file);
  };

  /**
   * 드래그 오버
   *
   * 💡 dragover 이벤트:
   * - preventDefault()로 기본 동작 차단 (파일 열기)
   * - isDragging으로 UI 업데이트 (시각적 피드백)
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * 드래그 영역 떠남
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * 드롭
   *
   * 💡 drop 이벤트:
   * - dataTransfer.files로 파일 접근
   * - preventDefault()로 기본 동작 차단
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * 파일 입력 (input file)
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * 업로드 처리
   *
   * 🔄 동작 순서:
   * 1. 필드 검증 (파일, 이름, 카테고리)
   * 2. 백엔드 API 요구사항 확인:
   *    - image: File (필수)
   *    - name: string (필수)
   *    - categoryId: string (필수)
   *    - brand: string (선택)
   * 3. apiClient.uploadClothing() 호출
   * 4. 응답 받기 (AI 분석 결과)
   * 5. 성공 시 결과 표시 또는 옷장으로 이동
   */
  const handleUpload = async () => {
    // 1️⃣ 필수 필드 검증
    if (!selectedFile) {
      setError('파일을 선택해주세요');
      return;
    }

    if (!clothingName.trim()) {
      setError('의류 이름을 입력해주세요');
      return;
    }

    if (!categoryId) {
      setError('카테고리를 선택해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 2️⃣ apiClient.uploadClothing() 호출
      // 백엔드 API 요구사항: name, categoryId는 필수, brand는 선택
      const response = await apiClient.uploadClothing(selectedFile, {
        name: clothingName.trim(),
        categoryId,
        brand: clothingBrand.trim() || undefined,
      });

      // 3️⃣ 응답 처리
      // 응답 구조: { success, message, data: { id, name, primaryColor, metadata: { ... } } }
      console.log('업로드 성공:', response);
      setUploadedItem(response.data);
    } catch (err) {
      // 에러 처리
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          '업로드 실패. 다시 시도해주세요.';
        setError(errorMessage);
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 파일 재선택
   */
  const handleReset = () => {
    setSelectedFile(null);
    setPreview('');
    setError('');
    setUploadedItem(null);
    setClothingName('');
    setClothingBrand('');
    // 첫 번째 카테고리를 기본값으로 설정 (UUID id 사용)
    if (categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  };

  // ✅ 업로드 성공 표시 (상태: analyzing)
  if (uploadedItem) {
    const isAnalyzing = uploadedItem.status === 'analyzing';

    return (
      <div className={`min-h-screen bg-gradient-to-br ${
        isAnalyzing
          ? 'from-blue-50 to-cyan-100'
          : 'from-green-50 to-emerald-100'
      } flex items-center justify-center p-4`}>
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            {/* 🔄 분석 중 상태 */}
            {isAnalyzing ? (
              <>
                <h2 className="text-2xl font-bold text-blue-600 mb-2">
                  분석 중입니다
                </h2>
                <p className="text-gray-600 mb-6">
                  <strong>{uploadedItem.name}</strong>을 AI가 분석 중입니다.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 mb-2 font-semibold">
                    📝 업로드 완료!
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    이미지가 저장되었습니다. AI 분석은 백그라운드에서 진행 중입니다.
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>✓ 분석 소요 시간: 10~30초</li>
                    <li>✓ 옷장 페이지에서 새로고침하면 결과를 확인할 수 있습니다</li>
                    <li>✓ 정보가 부정확하면 수동으로 편집할 수 있습니다</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  업로드 성공!
                </h2>
                <p className="text-gray-600 mb-4">
                  <strong>{uploadedItem.name}</strong> 이 옷장에 추가되었습니다.
                </p>
              </>
            )}

            {/* 📊 AI 분석 결과 (분석 완료 후만 표시) */}
            {!isAnalyzing && (
              <div className="bg-gray-50 rounded-lg p-6 text-left mb-6 text-sm space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    주요 색상
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{
                        backgroundColor: uploadedItem.primaryColor || '#808080'
                      }}
                    />
                    <span className="font-semibold text-gray-800">
                      {uploadedItem.primaryColor}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    재질
                  </p>
                  <p className="font-semibold text-gray-800">
                    {uploadedItem.metadata?.material || uploadedItem.material || '-'}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    패턴
                  </p>
                  <p className="font-semibold text-gray-800">
                    {uploadedItem.pattern}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    스타일
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedItem.metadata?.style?.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    )) || uploadedItem.style?.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    시즌
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedItem.metadata?.season?.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    )) || uploadedItem.season?.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {(uploadedItem.metadata?.occasion || uploadedItem.occasion) && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      활용 용도
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uploadedItem.metadata?.occasion?.map((o: string) => (
                        <span
                          key={o}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {o}
                        </span>
                      )) || uploadedItem.occasion?.map((o: string) => (
                        <span
                          key={o}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🔘 버튼 */}
            <div className="flex gap-3">
              {isAnalyzing ? (
                <>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    추가 등록하기
                  </button>
                  <button
                    onClick={() => navigate('/wardrobe')}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    옷장으로 이동
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    추가 등록하기
                  </button>
                  <button
                    onClick={() => navigate('/wardrobe')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    옷장으로 이동
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 📋 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            의류 업로드
          </h1>
          <p className="text-gray-600">
            새로운 옷 사진을 업로드하세요. AI가 자동으로 분석합니다.
          </p>
        </div>

        {/* 🎨 메인 카드 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* ❌ 에러 메시지 (조건부 렌더링) */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 📸 드래그 앤 드롭 영역 또는 미리보기 */}
          {!selectedFile ? (
            // 파일 선택 전: 드래그 앤 드롭 영역
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  이미지를 여기로 드래그하세요
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  또는 클릭하여 파일 선택
                </p>
                <p className="text-xs text-gray-500">
                  JPG, JPEG, PNG, WebP (최대 10MB)
                </p>
              </label>
            </div>
          ) : (
            // 파일 선택 후: 미리보기 + 폼
            <div>
              {/* 🖼️ 이미지 미리보기 */}
              <div className="mb-6">
                <img
                  src={preview}
                  alt="미리보기"
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>

              {/* 📝 파일 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">파일명:</span> {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">크기:</span>{' '}
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              {/* 📋 의류 정보 입력 폼 */}
              <div className="mb-6 space-y-4">
                {/* 의류 이름 */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    의류 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clothingName}
                    onChange={(e) => setClothingName(e.target.value)}
                    placeholder="예: 검정 후드집업"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                  {!clothingName.trim() && error.includes('의류 이름') && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>

                {/* 브랜드 (선택) */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    브랜드 <span className="text-gray-500 text-xs">(선택사항)</span>
                  </label>
                  <input
                    type="text"
                    value={clothingBrand}
                    onChange={(e) => setClothingBrand(e.target.value)}
                    placeholder="예: Nike"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={categoriesLoading || categories.length === 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {categoriesLoading ? '카테고리 로딩 중...' : '카테고리를 선택하세요'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {!categoryId && error.includes('카테고리') && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>
              </div>

              {/* 🔘 버튼 (업로드 / 재선택) */}
              <div className="flex gap-4">
                <button
                  onClick={handleUpload}
                  disabled={isLoading || !clothingName.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      업로드 중...
                    </span>
                  ) : (
                    '업로드'
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition disabled:cursor-not-allowed"
                >
                  재선택
                </button>
              </div>
            </div>
          )}

          {/* 💡 팁 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 팁:</span> 옷을 명확하게 촬영하면 AI 분석이
              더 정확합니다. 배경이 단순하고 조명이 충분한 곳에서 촬영하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
