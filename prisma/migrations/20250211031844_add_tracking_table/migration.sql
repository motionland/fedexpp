-- CreateTable
CREATE TABLE "Tracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
