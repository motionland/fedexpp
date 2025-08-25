-- CreateTable
CREATE TABLE "Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackingId" INTEGER,
    CONSTRAINT "Image_trackingId_fkey" FOREIGN KEY ("trackingId") REFERENCES "Tracking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
