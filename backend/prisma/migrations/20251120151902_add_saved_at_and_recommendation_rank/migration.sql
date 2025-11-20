-- AlterTable
ALTER TABLE "style_combinations" ADD COLUMN "originalRecommendationRank" INTEGER,
ADD COLUMN "savedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "style_combinations_userId_isAiRecommended_idx" ON "style_combinations"("userId", "isAiRecommended");

-- CreateIndex
CREATE INDEX "style_combinations_userId_savedAt_idx" ON "style_combinations"("userId", "savedAt");
