import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 데이터베이스 시딩 시작...");

  // 1. 기존 데이터 삭제 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("🗑️  기존 데이터 초기화 중...");
    await prisma.userUsageStats.deleteMany({});
    await prisma.stylePreference.deleteMany({});
    await prisma.bodyInfo.deleteMany({});
    await prisma.combinationItem.deleteMany({});
    await prisma.styleCombination.deleteMany({});
    await prisma.clothingPair.deleteMany({});
    await prisma.myClothing.deleteMany({});
    await prisma.clothingCategory.deleteMany({});
    await prisma.user.deleteMany({});
  }

  // 2. 테스트 사용자 생성
  console.log("👤 테스트 사용자 생성 중...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      password: hashedPassword,
      name: "테스트 사용자",
    },
  });

  console.log(`✅ 사용자 생성: ${user.email}`);

  // 3. 체형 정보 생성
  console.log("📏 체형 정보 생성 중...");
  const bodyInfo = await prisma.bodyInfo.create({
    data: {
      userId: user.id,
      height: 175,
      weight: 70,
      chest: 95,
      waist: 80,
      hip: 95,
      legLength: 82,
      topSize: "M",
      bottomSize: "32",
    },
  });

  console.log(`✅ 체형 정보 생성: ${bodyInfo.id}`);

  // 4. 스타일 선호도 생성
  console.log("🎨 스타일 선호도 생성 중...");
  const stylePreference = await prisma.stylePreference.create({
    data: {
      userId: user.id,
      preferredColors: ["검정", "하양", "파랑"],
      preferredStyles: ["캐주얼", "미니멀"],
      avoidedStyles: ["화려한"],
      preferredBrands: ["Nike", "Adidas"],
      mainActivities: ["출근", "데이트"],
    },
  });

  console.log(`✅ 스타일 선호도 생성: ${stylePreference.id}`);

  // 5. 의류 카테고리 생성
  console.log("📂 의류 카테고리 생성 중...");
  const topCategory = await prisma.clothingCategory.create({
    data: {
      name: "상의",
      nameEn: "top",
      requiredMeasurements: {
        chest: true,
        length: true,
        shoulder: true,
        sleeve: true,
      },
    },
  });

  const bottomCategory = await prisma.clothingCategory.create({
    data: {
      name: "하의",
      nameEn: "bottom",
      requiredMeasurements: {
        waist: true,
        hip: true,
        length: true,
        thigh: true,
      },
    },
  });

  const shoeCategory = await prisma.clothingCategory.create({
    data: {
      name: "신발",
      nameEn: "shoes",
      requiredMeasurements: {
        size: true,
      },
    },
  });

  const hatCategory = await prisma.clothingCategory.create({
    data: {
      name: "모자",
      nameEn: "hat",
      requiredMeasurements: {
        headSize: true,
      },
    },
  });

  const sockCategory = await prisma.clothingCategory.create({
    data: {
      name: "양말",
      nameEn: "socks",
      requiredMeasurements: {
        size: true,
      },
    },
  });

  const accessoryCategory = await prisma.clothingCategory.create({
    data: {
      name: "악세서리",
      nameEn: "accessory",
      requiredMeasurements: {},
    },
  });

  const outerwearCategory = await prisma.clothingCategory.create({
    data: {
      name: "아우터",
      nameEn: "outerwear",
      requiredMeasurements: {
        chest: true,
        length: true,
        shoulder: true,
        sleeve: true,
      },
    },
  });

  const dressCategory = await prisma.clothingCategory.create({
    data: {
      name: "원피스",
      nameEn: "dress",
      requiredMeasurements: {
        chest: true,
        waist: true,
        hip: true,
        length: true,
      },
    },
  });

  const underwearCategory = await prisma.clothingCategory.create({
    data: {
      name: "속옷",
      nameEn: "underwear",
      requiredMeasurements: {
        size: true,
      },
    },
  });

  const beltCategory = await prisma.clothingCategory.create({
    data: {
      name: "벨트",
      nameEn: "belt",
      requiredMeasurements: {
        waist: true,
      },
    },
  });

  const bagCategory = await prisma.clothingCategory.create({
    data: {
      name: "가방",
      nameEn: "bag",
      requiredMeasurements: {},
    },
  });

  const scarvesCategory = await prisma.clothingCategory.create({
    data: {
      name: "스카프",
      nameEn: "scarves",
      requiredMeasurements: {},
    },
  });

  const swimwearCategory = await prisma.clothingCategory.create({
    data: {
      name: "수영복",
      nameEn: "swimwear",
      requiredMeasurements: {
        chest: true,
        waist: true,
        hip: true,
      },
    },
  });

  const gloveCategory = await prisma.clothingCategory.create({
    data: {
      name: "장갑",
      nameEn: "glove",
      requiredMeasurements: {
        handSize: true,
      },
    },
  });

  console.log(`✅ 의류 카테고리 생성 완료 (총 14개 카테고리)`);

  // 6. 옷 아이템 생성
  console.log("👕 옷 아이템 생성 중...");

  // 상의 - 검정 후드집업
  const clothing1 = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: topCategory.id,
      name: "검정 후드집업",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "코튼",
      pattern: "무지",
      style: ["캐주얼"],
      season: ["봄", "가을", "겨울"],
      occasion: ["일상", "집"],
      purchaseDate: new Date("2024-01-15"),
      brand: "Nike",
      formality: 2,
      originalImage: "https://example.com/hoodie.jpg",
      measurements: {
        chest: 100,
        length: 70,
        shoulder: 45,
        sleeve: 60,
      },
      matchingRules: {
        goodWith: {
          colors: ["하양", "그레이", "파랑"],
          patterns: ["무지"],
          styles: ["캐주얼", "미니멀"],
        },
        avoidWith: {
          colors: ["분홍"],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 상의 - 하양 셔츠
  const clothing2_top = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: topCategory.id,
      name: "하양 드레스 셔츠",
      primaryColor: "하양",
      colorHex: "#FFFFFF",
      material: "코튼",
      pattern: "무지",
      style: ["포멀", "캐주얼"],
      season: ["봄", "여름", "가을"],
      occasion: ["출근", "데이트", "면접"],
      purchaseDate: new Date("2024-03-10"),
      brand: "ZARA",
      formality: 4,
      originalImage: "https://example.com/white_shirt.jpg",
      measurements: {
        chest: 95,
        length: 75,
        shoulder: 42,
        sleeve: 62,
      },
      matchingRules: {
        goodWith: {
          colors: ["검정", "파랑", "베이지", "그레이"],
          patterns: ["무지"],
          styles: ["포멀", "캐주얼", "미니멀"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 하의 - 청 바지
  const clothing3 = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: bottomCategory.id,
      name: "청 바지",
      primaryColor: "파랑",
      colorHex: "#1E3A8A",
      material: "데님",
      pattern: "무지",
      style: ["캐주얼"],
      season: ["봄", "여름", "가을"],
      occasion: ["일상", "데이트"],
      purchaseDate: new Date("2024-02-20"),
      brand: "Levi's",
      formality: 3,
      originalImage: "https://example.com/jeans.jpg",
      measurements: {
        waist: 80,
        hip: 95,
        length: 100,
        thigh: 60,
      },
      matchingRules: {
        goodWith: {
          colors: ["검정", "하양", "베이지"],
          patterns: ["무지"],
          styles: ["캐주얼", "미니멀"],
        },
        avoidWith: {
          colors: [],
          patterns: ["플로럴"],
          styles: [],
        },
      },
    },
  });

  // 하의 - 검정 슬랙스
  const clothing4_bottom = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: bottomCategory.id,
      name: "검정 슬랙스",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "폴리에스터",
      pattern: "무지",
      style: ["포멀"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["출근", "면접", "공식행사"],
      purchaseDate: new Date("2024-04-05"),
      brand: "Hugo Boss",
      formality: 5,
      originalImage: "https://example.com/slacks.jpg",
      measurements: {
        waist: 80,
        hip: 95,
        length: 105,
        thigh: 62,
      },
      matchingRules: {
        goodWith: {
          colors: ["하양", "파랑", "그레이"],
          patterns: ["무지", "줄무늬"],
          styles: ["포멀", "비즈니스"],
        },
        avoidWith: {
          colors: ["형광색"],
          patterns: ["플로럴", "체크"],
          styles: ["캐주얼"],
        },
      },
    },
  });

  // 신발 - 검정 스니커즈
  const clothing5_shoes = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: shoeCategory.id,
      name: "검정 스니커즈",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "캔버스",
      pattern: "무지",
      style: ["캐주얼"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["일상", "데이트"],
      purchaseDate: new Date("2024-01-20"),
      brand: "Converse",
      formality: 2,
      originalImage: "https://example.com/sneakers.jpg",
      measurements: {
        size: 260,
      },
      matchingRules: {
        goodWith: {
          colors: ["모든 색"],
          patterns: ["무지"],
          styles: ["캐주얼"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: ["포멀"],
        },
      },
    },
  });

  // 신발 - 검정 구두
  const clothing6_shoes = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: shoeCategory.id,
      name: "검정 구두",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "가죽",
      pattern: "무지",
      style: ["포멀"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["출근", "면접", "공식행사"],
      purchaseDate: new Date("2024-02-15"),
      brand: "Johnson & Murphy",
      formality: 5,
      originalImage: "https://example.com/oxford.jpg",
      measurements: {
        size: 260,
      },
      matchingRules: {
        goodWith: {
          colors: ["검정", "그레이", "파랑"],
          patterns: ["무지"],
          styles: ["포멀", "비즈니스"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: ["캐주얼"],
        },
      },
    },
  });

  // 모자 - 검정 캡
  const clothing7_hat = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: hatCategory.id,
      name: "검정 캡모자",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "코튼",
      pattern: "무지",
      style: ["캐주얼"],
      season: ["봄", "여름", "가을"],
      occasion: ["일상", "운동"],
      purchaseDate: new Date("2024-05-01"),
      brand: "Nike",
      formality: 1,
      originalImage: "https://example.com/cap.jpg",
      measurements: {
        headSize: 56,
      },
      matchingRules: {
        goodWith: {
          colors: ["모든 색"],
          patterns: ["무지"],
          styles: ["캐주얼"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: ["포멀"],
        },
      },
    },
  });

  // 양말 - 검정 양말
  const clothing8_socks = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: sockCategory.id,
      name: "검정 발목양말",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "코튼",
      pattern: "무지",
      style: ["캐주얼"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["일상"],
      purchaseDate: new Date("2024-03-20"),
      brand: "Generic",
      formality: 1,
      originalImage: "https://example.com/socks.jpg",
      measurements: {
        size: "M",
      },
      matchingRules: {
        goodWith: {
          colors: ["모든 색"],
          patterns: ["무지"],
          styles: ["모든 스타일"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 악세서리 - 은색 목걸이
  const clothing9_accessory = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: accessoryCategory.id,
      name: "은색 목걸이",
      primaryColor: "은색",
      colorHex: "#C0C0C0",
      material: "은",
      pattern: "무지",
      style: ["우아한", "미니멀"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["데이트", "공식행사"],
      purchaseDate: new Date("2024-01-30"),
      brand: "PANDORA",
      formality: 4,
      originalImage: "https://example.com/necklace.jpg",
      measurements: {},
      matchingRules: {
        goodWith: {
          colors: ["모든 색"],
          patterns: ["무지"],
          styles: ["우아한", "미니멀"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 아우터 - 검정 코트
  const clothing10_outerwear = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: outerwearCategory.id,
      name: "검정 울 코트",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "울",
      pattern: "무지",
      style: ["클래식", "포멀"],
      season: ["가을", "겨울"],
      occasion: ["출근", "데이트", "공식행사"],
      purchaseDate: new Date("2024-10-15"),
      brand: "Burberry",
      formality: 4,
      originalImage: "https://example.com/coat.jpg",
      measurements: {
        chest: 105,
        length: 95,
        shoulder: 46,
        sleeve: 64,
      },
      matchingRules: {
        goodWith: {
          colors: ["검정", "그레이", "흰색"],
          patterns: ["무지"],
          styles: ["클래식", "포멀", "캐주얼"],
        },
        avoidWith: {
          colors: ["형광색"],
          patterns: ["형광패턴"],
          styles: [],
        },
      },
    },
  });

  // 원피스 - 검정 미니 드레스
  const clothing11_dress = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: dressCategory.id,
      name: "검정 미니 드레스",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "폴리에스터",
      pattern: "무지",
      style: ["세련된", "우아한"],
      season: ["봄", "여름", "가을"],
      occasion: ["데이트", "파티"],
      purchaseDate: new Date("2024-05-20"),
      brand: "ASOS",
      formality: 4,
      originalImage: "https://example.com/dress.jpg",
      measurements: {
        chest: 90,
        waist: 75,
        hip: 95,
        length: 80,
      },
      matchingRules: {
        goodWith: {
          colors: ["금색", "은색"],
          patterns: ["무지"],
          styles: ["세련된", "우아한"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: ["캐주얼"],
        },
      },
    },
  });

  // 벨트 - 검정 가죽벨트
  const clothing12_belt = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: beltCategory.id,
      name: "검정 가죽벨트",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "가죽",
      pattern: "무지",
      style: ["클래식"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["출근", "데이트"],
      purchaseDate: new Date("2024-02-28"),
      brand: "Fossil",
      formality: 3,
      originalImage: "https://example.com/belt.jpg",
      measurements: {
        waist: 80,
      },
      matchingRules: {
        goodWith: {
          colors: ["검정", "하양", "파랑", "갈색"],
          patterns: ["무지"],
          styles: ["모든 스타일"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 가방 - 검정 숄더백
  const clothing13_bag = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: bagCategory.id,
      name: "검정 숄더백",
      primaryColor: "검정",
      colorHex: "#000000",
      material: "가죽",
      pattern: "무지",
      style: ["캐주얼", "우아한"],
      season: ["봄", "여름", "가을", "겨울"],
      occasion: ["일상", "데이트"],
      purchaseDate: new Date("2024-04-10"),
      brand: "COACH",
      formality: 3,
      originalImage: "https://example.com/bag.jpg",
      measurements: {},
      matchingRules: {
        goodWith: {
          colors: ["모든 색"],
          patterns: ["무지"],
          styles: ["모든 스타일"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  // 스카프 - 흰색 스카프
  const clothing14_scarves = await prisma.myClothing.create({
    data: {
      userId: user.id,
      categoryId: scarvesCategory.id,
      name: "흰색 실크 스카프",
      primaryColor: "흰색",
      colorHex: "#FFFFFF",
      material: "실크",
      pattern: "플로럴",
      style: ["우아한", "클래식"],
      season: ["봄", "여름", "가을"],
      occasion: ["데이트", "공식행사"],
      purchaseDate: new Date("2024-06-05"),
      brand: "Hermès",
      formality: 4,
      originalImage: "https://example.com/scarf.jpg",
      measurements: {},
      matchingRules: {
        goodWith: {
          colors: ["파랑", "검정", "베이지"],
          patterns: ["무지", "플로럴"],
          styles: ["우아한", "클래식"],
        },
        avoidWith: {
          colors: [],
          patterns: [],
          styles: [],
        },
      },
    },
  });

  console.log(`✅ 옷 아이템 생성 완료 (총 14개 아이템)`);

  // 7. 스타일 조합 생성
  console.log("🎯 스타일 조합 생성 중...");

  // 조합 1 - 캐주얼 일상복
  const combination1 = await prisma.styleCombination.create({
    data: {
      userId: user.id,
      name: "캐주얼 일상복",
      description: "편한 일상용 조합",
      season: "봄",
      occasion: "일상",
      rating: 4,
      usedCount: 5,
      items: {
        create: [
          {
            clothingId: clothing1.id,
            layer: 2,
          },
          {
            clothingId: clothing3.id,
            layer: 3,
          },
          {
            clothingId: clothing5_shoes.id,
            layer: 4,
          },
          {
            clothingId: clothing8_socks.id,
            layer: 1,
          },
        ],
      },
    },
  });

  // 조합 2 - 출근 정장
  const combination2 = await prisma.styleCombination.create({
    data: {
      userId: user.id,
      name: "출근 정장룩",
      description: "직장에 입고 가는 정장 조합",
      season: "봄",
      occasion: "출근",
      rating: 5,
      usedCount: 10,
      items: {
        create: [
          {
            clothingId: clothing2_top.id,
            layer: 2,
          },
          {
            clothingId: clothing4_bottom.id,
            layer: 3,
          },
          {
            clothingId: clothing6_shoes.id,
            layer: 4,
          },
          {
            clothingId: clothing12_belt.id,
            layer: 2,
          },
          {
            clothingId: clothing8_socks.id,
            layer: 1,
          },
        ],
      },
    },
  });

  // 조합 3 - 겨울 따뜻한 룩
  const combination3 = await prisma.styleCombination.create({
    data: {
      userId: user.id,
      name: "겨울 따뜻한 룩",
      description: "추운 날씨에 입기 좋은 따뜻한 조합",
      season: "겨울",
      occasion: "일상",
      rating: 4,
      usedCount: 8,
      items: {
        create: [
          {
            clothingId: clothing10_outerwear.id,
            layer: 1,
          },
          {
            clothingId: clothing1.id,
            layer: 2,
          },
          {
            clothingId: clothing3.id,
            layer: 3,
          },
          {
            clothingId: clothing5_shoes.id,
            layer: 4,
          },
          {
            clothingId: clothing8_socks.id,
            layer: 1,
          },
        ],
      },
    },
  });

  // 조합 4 - 데이트 우아한 룩
  const combination4 = await prisma.styleCombination.create({
    data: {
      userId: user.id,
      name: "데이트 우아한 룩",
      description: "특별한 날 입기 좋은 우아한 조합",
      season: "봄",
      occasion: "데이트",
      rating: 5,
      usedCount: 3,
      items: {
        create: [
          {
            clothingId: clothing11_dress.id,
            layer: 2,
          },
          {
            clothingId: clothing6_shoes.id,
            layer: 4,
          },
          {
            clothingId: clothing9_accessory.id,
            layer: 1,
          },
          {
            clothingId: clothing14_scarves.id,
            layer: 1,
          },
        ],
      },
    },
  });

  // 조합 5 - 캐주얼 외출룩
  const combination5 = await prisma.styleCombination.create({
    data: {
      userId: user.id,
      name: "캐주얼 외출룩",
      description: "쇼핑이나 영화볼 때 입기 좋은 편한 조합",
      season: "여름",
      occasion: "일상",
      rating: 4,
      usedCount: 6,
      items: {
        create: [
          {
            clothingId: clothing2_top.id,
            layer: 2,
          },
          {
            clothingId: clothing3.id,
            layer: 3,
          },
          {
            clothingId: clothing5_shoes.id,
            layer: 4,
          },
          {
            clothingId: clothing13_bag.id,
            layer: 1,
          },
          {
            clothingId: clothing7_hat.id,
            layer: 1,
          },
        ],
      },
    },
  });

  console.log(`✅ 스타일 조합 생성 완료 (총 5개 조합)`);

  // 8. 사용 통계 생성
  console.log("📊 사용 통계 생성 중...");
  await prisma.userUsageStats.create({
    data: {
      userId: user.id,
      clothingRegistrations: 14,
      aiRecommendations: 5,
    },
  });

  console.log(`✅ 사용 통계 생성 완료`);

  console.log("\n✨ 데이터베이스 시딩 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 시딩 중 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
