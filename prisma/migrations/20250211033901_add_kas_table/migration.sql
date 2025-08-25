/*
  Warnings:

  - Added the required column `kasId` to the `Tracking` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kasId" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "capturedImages" TEXT NOT NULL,
    "statusId" INTEGER NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "shippingDate" DATETIME NOT NULL,
    "transitTime" DATETIME NOT NULL,
    "destination" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "fedexDeliveryStatus" TEXT NOT NULL,
    CONSTRAINT "Tracking_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tracking" ("capturedImages", "deliveryDate", "destination", "fedexDeliveryStatus", "id", "origin", "shippingDate", "statusId", "trackingNumber", "transitTime") SELECT "capturedImages", "deliveryDate", "destination", "fedexDeliveryStatus", "id", "origin", "shippingDate", "statusId", "trackingNumber", "transitTime" FROM "Tracking";
DROP TABLE "Tracking";
ALTER TABLE "new_Tracking" RENAME TO "Tracking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
