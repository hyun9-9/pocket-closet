-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "weight" INTEGER,
    "chest" INTEGER,
    "waist" INTEGER NOT NULL,
    "hip" INTEGER,
    "shoulderWidth" INTEGER,
    "armLength" INTEGER,
    "legLength" INTEGER,
    "neckCircumference" INTEGER,
    "topSize" TEXT,
    "bottomSize" TEXT,
    "shoeSize" INTEGER,
    "bodyType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredStyles" TEXT[],
    "preferredColors" TEXT[],
    "preferredBrands" TEXT[],
    "avoidedStyles" TEXT[],
    "mainActivities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clothing_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "requiredMeasurements" JSONB NOT NULL,

    CONSTRAINT "clothing_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_clothes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" INTEGER,
    "purchaseUrl" TEXT,
    "originalImage" TEXT NOT NULL,
    "processedImage" TEXT,
    "frontViewImage" TEXT,
    "sideViewImage" TEXT,
    "backViewImage" TEXT,
    "thumbnailImage" TEXT,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT,
    "colorHex" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "texture" TEXT,
    "silhouette" TEXT,
    "details" TEXT[],
    "material" TEXT NOT NULL,
    "materialWeight" TEXT,
    "stretch" TEXT,
    "transparency" TEXT,
    "formality" INTEGER NOT NULL,
    "style" TEXT[],
    "mood" TEXT[],
    "season" TEXT[],
    "occasion" TEXT[],
    "matchingRules" JSONB NOT NULL,
    "measurements" JSONB NOT NULL,
    "wearCount" INTEGER NOT NULL DEFAULT 0,
    "lastWornDate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_clothes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_combinations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "occasion" TEXT NOT NULL,
    "season" TEXT,
    "visualizationImage" TEXT,
    "isAiRecommended" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "feedback" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_combinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combination_items" (
    "id" TEXT NOT NULL,
    "combinationId" TEXT NOT NULL,
    "clothingId" TEXT NOT NULL,
    "layer" INTEGER NOT NULL,

    CONSTRAINT "combination_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clothing_pairs" (
    "id" TEXT NOT NULL,
    "clothing1Id" TEXT NOT NULL,
    "clothing2Id" TEXT NOT NULL,
    "usedTogether" INTEGER NOT NULL DEFAULT 1,
    "avgRating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clothing_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalApiCalls" INTEGER NOT NULL DEFAULT 0,
    "monthlyApiCalls" INTEGER NOT NULL DEFAULT 0,
    "lastMonthReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clothingRegistrations" INTEGER NOT NULL DEFAULT 0,
    "aiRecommendations" INTEGER NOT NULL DEFAULT 0,
    "avatarFittings" INTEGER NOT NULL DEFAULT 0,
    "realTimeEdits" INTEGER NOT NULL DEFAULT 0,
    "totalCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_usage_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "body_info_userId_key" ON "body_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "style_preferences_userId_key" ON "style_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_categories_name_key" ON "clothing_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_categories_nameEn_key" ON "clothing_categories"("nameEn");

-- CreateIndex
CREATE INDEX "my_clothes_userId_categoryId_idx" ON "my_clothes"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "style_combinations_userId_idx" ON "style_combinations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "combination_items_combinationId_clothingId_key" ON "combination_items"("combinationId", "clothingId");

-- CreateIndex
CREATE INDEX "clothing_pairs_clothing1Id_idx" ON "clothing_pairs"("clothing1Id");

-- CreateIndex
CREATE INDEX "clothing_pairs_clothing2Id_idx" ON "clothing_pairs"("clothing2Id");

-- CreateIndex
CREATE UNIQUE INDEX "clothing_pairs_clothing1Id_clothing2Id_key" ON "clothing_pairs"("clothing1Id", "clothing2Id");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_stats_userId_key" ON "user_usage_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_key_key" ON "cache_entries"("key");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "cache_entries"("expiresAt");

-- AddForeignKey
ALTER TABLE "body_info" ADD CONSTRAINT "body_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_preferences" ADD CONSTRAINT "style_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_clothes" ADD CONSTRAINT "my_clothes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_clothes" ADD CONSTRAINT "my_clothes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "clothing_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_combinations" ADD CONSTRAINT "style_combinations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combination_items" ADD CONSTRAINT "combination_items_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "style_combinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combination_items" ADD CONSTRAINT "combination_items_clothingId_fkey" FOREIGN KEY ("clothingId") REFERENCES "my_clothes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing_pairs" ADD CONSTRAINT "clothing_pairs_clothing1Id_fkey" FOREIGN KEY ("clothing1Id") REFERENCES "my_clothes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing_pairs" ADD CONSTRAINT "clothing_pairs_clothing2Id_fkey" FOREIGN KEY ("clothing2Id") REFERENCES "my_clothes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_stats" ADD CONSTRAINT "user_usage_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
