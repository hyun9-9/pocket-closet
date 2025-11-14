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

  console.log(`✅ 의류 카테고리 생성: ${topCategory.id}, ${bottomCategory.id}`);

  // 6. 옷 아이템 생성
  console.log("👕 옷 아이템 생성 중...");
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

  const clothing2 = await prisma.myClothing.create({
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

  console.log(`✅ 옷 아이템 생성: ${clothing1.id}, ${clothing2.id}`);

  // 7. 스타일 조합 생성
  console.log("🎯 스타일 조합 생성 중...");
  const combination = await prisma.styleCombination.create({
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
            clothingId: clothing2.id,
            layer: 3,
          },
        ],
      },
    },
  });

  console.log(`✅ 스타일 조합 생성: ${combination.id}`);

  // 8. 사용 통계 생성
  console.log("📊 사용 통계 생성 중...");
  await prisma.userUsageStats.create({
    data: {
      userId: user.id,
      clothingRegistrations: 2,
      aiRecommendations: 0,
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
