# 드래그 앤 드롭 파일 업로드 UI 구현

## 📚 목차
1. [드래그 앤 드롭이란?](#드래그-앤-드롭이란)
2. [기본 개념](#기본-개념)
3. [파일 처리](#파일-처리)
4. [이미지 미리보기](#이미지-미리보기)
5. [FileReader API](#filereader-api)
6. [FormData와 파일 업로드](#formdata와-파일-업로드)
7. [Pocket Closet 사례](#pocket-closet-사례)
8. [완전한 구현 예제](#완전한-구현-예제)

---

## 드래그 앤 드롭이란?

### 🎯 HTML5 Drag & Drop API

**사용자가 파일을 드래그하여 웹 페이지에 놓는 기능**

- HTML5 표준 API
- 브라우저 기본 파일 처리 방지 (preventDefault)
- 파일 및 텍스트 전송 가능
- 사용자 경험 개선

### 📊 사용 흐름

```
1. 사용자가 파일을 드래그 시작
   ↓
2. dragover 이벤트 발생 (drop zone에 파일이 위에 있음)
   ↓
3. 브라우저 기본 동작 방지 (preventDefault)
   ↓
4. 시각적 피드백 (배경색 변경 등)
   ↓
5. 사용자가 파일을 놓음
   ↓
6. drop 이벤트 발생
   ↓
7. e.dataTransfer.files에서 파일 접근
   ↓
8. 파일 처리 (검증, 미리보기, 업로드)
```

---

## 기본 개념

### 🎪 드래그 앤 드롭 영역 만들기

```jsx
function DragDropZone() {
  const [isDragging, setIsDragging] = useState(false);

  // 1️⃣ dragover: 드래그 중인 파일이 영역 위에 있음
  const handleDragOver = (e) => {
    e.preventDefault();           // 기본 동작 차단 (파일 열기 등)
    e.stopPropagation();         // 이벤트 전파 차단
    setIsDragging(true);         // 시각적 피드백
  };

  // 2️⃣ dragleave: 드래그 중인 파일이 영역을 벗어남
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // 3️⃣ drop: 파일을 놓음
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // 파일 접근
    const files = e.dataTransfer.files;
    console.log('파일 개수:', files.length);
    console.log('첫 번째 파일:', files[0]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-lg font-semibold">
        파일을 여기로 드래그하세요
      </p>
    </div>
  );
}
```

### 📁 File 객체 이해

```jsx
// File 객체는 다음 정보를 포함합니다:
const file = files[0];

console.log(file.name);          // "photo.jpg" - 파일명
console.log(file.size);          // 2048576 - 파일 크기 (바이트)
console.log(file.type);          // "image/jpeg" - MIME 타입
console.log(file.lastModified);  // 1234567890000 - 마지막 수정 시간

// File은 Blob을 상속받음
console.log(file instanceof Blob); // true
```

### 🔍 파일 타입 확인

```jsx
// MIME 타입으로 확인
const isImage = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return imageTypes.includes(file.type);
};

// 파일 확장자로 확인
const isImageByExtension = (file) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const extension = file.name.split('.').pop().toLowerCase();
  return imageExtensions.includes(`.${extension}`);
};

// 또는 정규식 사용
const isImageByRegex = (file) => {
  return /^image\/(jpeg|jpg|png|webp)$/.test(file.type);
};
```

### 📏 파일 크기 확인

```jsx
// 파일 크기 검증
const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // MB → Bytes
  return file.size <= maxSizeBytes;
};

// 파일 크기를 인간친화적 형식으로 변환
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

console.log(formatFileSize(2048576)); // "2 MB"
```

---

## 파일 처리

### ✅ 파일 검증 함수

```jsx
function validateFile(file) {
  // 1️⃣ 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'JPG, PNG, WebP 파일만 업로드 가능합니다',
    };
  }

  // 2️⃣ 파일 크기 검증 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '파일 크기는 10MB 이하여야 합니다',
    };
  }

  // 3️⃣ 파일명 검증 (특수문자 제거)
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: '파일명에 특수문자가 포함되어 있습니다',
    };
  }

  return { isValid: true, error: null };
}

// 사용 예제
const file = files[0];
const { isValid, error } = validateFile(file);

if (!isValid) {
  console.error(error);
  return;
}

console.log('검증 통과:', file.name);
```

### 🎯 여러 파일 처리

```jsx
function handleDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;

  // 방법 1: 첫 번째 파일만 처리 (대부분의 경우)
  if (files.length > 0) {
    const file = files[0];
    processFile(file);
  }

  // 방법 2: 모든 파일 처리
  Array.from(files).forEach((file) => {
    const { isValid, error } = validateFile(file);
    if (isValid) {
      processFile(file);
    } else {
      console.error(error);
    }
  });
}
```

---

## 이미지 미리보기

### 👁️ DataURL로 미리보기 생성

```jsx
import { useState } from 'react';

function ImagePreview() {
  const [preview, setPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // FileReader를 사용하여 이미지 미리보기 생성
  const createPreview = (file) => {
    const reader = new FileReader();

    // 파일 읽기 완료 시
    reader.onload = (event) => {
      const result = event.target.result; // Data URL
      setPreview(result); // "data:image/jpeg;base64,/9j/4AAQSkZ..."
    };

    // 읽기 오류 처리
    reader.onerror = () => {
      console.error('파일 읽기 오류');
    };

    // 파일을 Data URL로 읽기
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    createPreview(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div>
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-12"
      >
        {!selectedFile ? (
          <p>파일을 드래그하세요</p>
        ) : (
          <div>
            {/* 미리보기 표시 */}
            <img
              src={preview}
              alt="미리보기"
              className="w-full h-80 object-cover rounded-lg"
            />
            <p className="mt-4">파일: {selectedFile.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 🎨 Object URL로 미리보기 (메모리 효율적)

```jsx
// DataURL의 문제점: 큰 파일은 메모리 사용량이 많음

function ImagePreviewOptimized() {
  const [preview, setPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const createPreview = (file) => {
    // Object URL 생성 (메모리 효율적)
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // 정리: 컴포넌트 언마운트 시 메모리 해제
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  useEffect(() => {
    if (!selectedFile) return;

    const cleanup = createPreview(selectedFile);
    return cleanup; // 정리 함수
  }, [selectedFile]);

  return (
    <div>
      {preview && (
        <img src={preview} alt="미리보기" className="w-full h-80 object-cover" />
      )}
    </div>
  );
}
```

### 📊 DataURL vs Object URL 비교

```
DataURL:
✅ 장점: 서버에 저장 가능, 브라우저 호환성 좋음
❌ 단점: 메모리 많이 사용, 큰 파일은 느림
📝 용도: 파일을 데이터로 저장할 때

Object URL:
✅ 장점: 메모리 효율적, 빠름
❌ 단점: 메모리 해제 필요, 서버 저장 불가
📝 용도: 미리보기만 표시할 때
```

---

## FileReader API

### 📖 FileReader의 주요 메서드

```jsx
const reader = new FileReader();

// 1️⃣ readAsText(file) - 텍스트로 읽기
reader.readAsText(file, 'utf-8'); // 인코딩 지정 가능
// 예: .txt, .json, .csv 파일

// 2️⃣ readAsDataURL(file) - Data URL로 읽기
reader.readAsDataURL(file);
// 예: 이미지 미리보기, 파일 저장

// 3️⃣ readAsArrayBuffer(file) - ArrayBuffer로 읽기
reader.readAsArrayBuffer(file);
// 예: 바이너리 데이터 처리, 파일 검증

// 4️⃣ abort() - 읽기 중단
reader.abort();
```

### 🎯 FileReader 이벤트

```jsx
const reader = new FileReader();

// onload: 읽기 성공
reader.onload = (event) => {
  const result = event.target.result;
  console.log('읽기 성공:', result);
};

// onerror: 읽기 실패
reader.onerror = () => {
  console.error('읽기 실패');
};

// onprogress: 읽기 진행
reader.onprogress = (event) => {
  if (event.lengthComputable) {
    const progress = Math.round((event.loaded / event.total) * 100);
    console.log(`진행률: ${progress}%`);
  }
};

// onabort: 읽기 중단
reader.onabort = () => {
  console.log('읽기가 중단되었습니다');
};

reader.readAsDataURL(file);
```

### 📊 파일 읽기 진행률 표시

```jsx
import { useState } from 'react';

function FileUploadWithProgress() {
  const [progress, setProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const handleFileSelect = (file) => {
    setIsReading(true);
    const reader = new FileReader();

    // 진행률 업데이트
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progressPercent = Math.round(
          (event.loaded / event.total) * 100
        );
        setProgress(progressPercent);
      }
    };

    // 읽기 완료
    reader.onload = (event) => {
      const result = event.target.result;
      console.log('읽기 완료:', result);
      setIsReading(false);
      setProgress(0);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div>
      {isReading && (
        <div className="w-full bg-gray-200 rounded-lg overflow-hidden">
          <div
            className="bg-blue-500 h-4 transition-all"
            style={{ width: `${progress}%` }}
          />
          <p className="text-center text-sm mt-2">{progress}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## FormData와 파일 업로드

### 📤 FormData로 파일 전송

```jsx
async function uploadFile(file) {
  // FormData 생성
  const formData = new FormData();

  // 파일 추가
  formData.append('file', file);

  // 추가 데이터 (선택사항)
  formData.append('description', '내 옷 사진');
  formData.append('category', 'outerwear');

  // API 요청
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData, // 자동으로 multipart/form-data 설정
    });

    const result = await response.json();
    console.log('업로드 성공:', result);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
}
```

### 📝 여러 파일 업로드

```jsx
function uploadMultipleFiles(files) {
  const formData = new FormData();

  // 방법 1: 각 파일을 개별적으로 추가
  Array.from(files).forEach((file, index) => {
    formData.append(`file[${index}]`, file);
  });

  // 방법 2: 같은 이름으로 추가 (권장)
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  // API 요청
  fetch('/api/upload/multiple', {
    method: 'POST',
    body: formData,
  });
}
```

### 🔄 FormData 확인

```jsx
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'John');

// FormData 내용 확인 (entries 사용)
for (const [key, value] of formData.entries()) {
  console.log(`${key}: ${value}`);
}

// 출력:
// file: File { ... }
// name: John
```

---

## Pocket Closet 사례

### 📸 UploadPage 완전한 분석

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export function UploadPage() {
  // 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedItem, setUploadedItem] = useState(null);

  const navigate = useNavigate();

  // 1️⃣ 파일 검증
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('JPG, PNG, WebP 파일만 업로드 가능합니다');
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return false;
    }

    return true;
  };

  // 2️⃣ 미리보기 생성
  const createPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 3️⃣ 파일 선택 처리
  const handleFileSelect = (file) => {
    setError('');
    if (!validateFile(file)) return;

    setSelectedFile(file);
    createPreview(file);
  };

  // 4️⃣ 드래그 이벤트
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 5️⃣ Input file 처리
  const handleInputChange = (e) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 6️⃣ 업로드 처리
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // apiClient.uploadClothing은 FormData를 자동으로 처리
      const response = await apiClient.uploadClothing(selectedFile, {});

      setUploadedItem(response.data);

      // 2초 후 옷장으로 이동
      setTimeout(() => {
        navigate('/wardrobe');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        '업로드 실패. 다시 시도해주세요.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 7️⃣ 파일 재선택
  const handleReset = () => {
    setSelectedFile(null);
    setPreview('');
    setError('');
    setUploadedItem(null);
  };

  // 업로드 성공 화면
  if (uploadedItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            업로드 성공!
          </h2>
          <p className="text-gray-600 mb-4">
            <strong>{uploadedItem.name}</strong> 이 옷장에 추가되었습니다.
          </p>

          {/* AI 분석 결과 */}
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-4 text-sm">
            <p className="mb-2">
              <span className="font-semibold">색상:</span>{' '}
              {uploadedItem.primaryColor}
            </p>
            <p className="mb-2">
              <span className="font-semibold">패턴:</span>{' '}
              {uploadedItem.pattern}
            </p>
          </div>

          <p className="text-gray-500 text-sm">
            2초 후 옷장으로 이동됩니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 페이지 제목 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">의류 업로드</h1>
          <p className="text-gray-600">
            새로운 옷 사진을 업로드하세요. AI가 자동으로 분석합니다.
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 드래그 앤 드롭 또는 미리보기 */}
          {!selectedFile ? (
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
                  JPG, PNG, WebP (최대 10MB)
                </p>
              </label>
            </div>
          ) : (
            <div>
              {/* 이미지 미리보기 */}
              <div className="mb-6">
                <img
                  src={preview}
                  alt="미리보기"
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>

              {/* 파일 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">파일명:</span>{' '}
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">크기:</span>{' '}
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-4">
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
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

          {/* 팁 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 팁:</span> 옷을 명확하게
              촬영하면 AI 분석이 더 정확합니다. 배경이 단순하고 조명이 충분한
              곳에서 촬영하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 🔌 API 클라이언트 통합

```jsx
// services/api.ts
const uploadClothing = async (imageFile, metadata = {}) => {
  // 1️⃣ FormData 생성
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('metadata', JSON.stringify(metadata));

  // 2️⃣ Axios로 전송 (Content-Type 자동 설정)
  const response = await apiClient.post('/clothing/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data; // { success, message, data: { id, ... } }
};
```

---

## 완전한 구현 예제

### 🎯 최종 패턴

```jsx
import { useState } from 'react';

// 1️⃣ 헬퍼 함수들
const validateFile = (file, maxSizeMB = 10) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다` };
  }

  return { valid: true, error: null };
};

const createPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
};

// 2️⃣ React 컴포넌트
export function FileUploadComponent() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // 파일 처리 로직
  const handleFileSelect = async (file) => {
    setError('');

    // 검증
    const { valid, error: validationError } = validateFile(file);
    if (!valid) {
      setError(validationError);
      return;
    }

    // 미리보기 생성
    try {
      const previewUrl = await createPreview(file);
      setFile(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('미리보기를 생성할 수 없습니다');
    }
  };

  // 업로드
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('업로드 실패');

      const data = await response.json();
      console.log('업로드 성공:', data);
      setFile(null);
      setPreview('');
    } catch (err) {
      setError('업로드 중 오류가 발생했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        {preview ? (
          <div>
            <img src={preview} alt="preview" className="w-full rounded-lg mb-4" />
            <p className="text-sm text-gray-600 mb-4">{file?.name}</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📸</div>
            <p className="font-semibold mb-1">파일을 드래그하세요</p>
            <p className="text-sm text-gray-600">또는 클릭</p>
          </div>
        )}

        <input
          type="file"
          id="file-input"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length > 0) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          {preview && <span className="text-sm">다시 선택</span>}
        </label>
      </div>

      {preview && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {isUploading ? '업로드 중...' : '업로드'}
        </button>
      )}
    </div>
  );
}
```

---

## 정리

### 📋 드래그 앤 드롭 구현 체크리스트

- ✅ `dragover` 이벤트에서 `preventDefault()` 호출
- ✅ `isDragging` 상태로 시각적 피드백 제공
- ✅ `drop` 이벤트에서 `e.dataTransfer.files` 접근
- ✅ 파일 검증 (타입, 크기)
- ✅ FileReader로 미리보기 생성
- ✅ FormData로 파일 전송
- ✅ 에러 처리 및 사용자 피드백

### 🎯 성능 최적화

- ✅ Object URL 사용 (DataURL 대신)
- ✅ 큰 파일은 청크 업로드 고려
- ✅ 업로드 진행률 표시
- ✅ 메모리 해제 (cleanup)

### 💡 Pocket Closet 적용 방법

```
1. UploadPage에서 드래그 앤 드롭 구현 ✅
2. 파일 검증 (타입, 크기) ✅
3. FileReader로 미리보기 ✅
4. FormData로 API 업로드 ✅
5. 로딩 상태 표시 ✅
6. 성공/실패 피드백 ✅
```

---

## 참고 자료

- [MDN: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [MDN: File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [MDN: FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

**학습 완료**: 5개의 핵심 블로그 포스트 완성! 🎉

다음 단계: Phase 3 [3-3] 옷장 페이지 구현 (TDD 접근법)
