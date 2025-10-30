-- AlterTable
ALTER TABLE "WatchlistMovie" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "watched" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "Like_reviewId_idx" ON "Like"("reviewId");

-- CreateIndex
CREATE INDEX "Watchlist_isPublic_idx" ON "Watchlist"("isPublic");

-- CreateIndex
CREATE INDEX "WatchlistMovie_watchlistId_idx" ON "WatchlistMovie"("watchlistId");
