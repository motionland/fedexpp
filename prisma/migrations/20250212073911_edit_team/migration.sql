/*
  Warnings:

  - Added the required column `password` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL
);
INSERT INTO "new_Team" ("department", "email", "id", "name", "role", "status") SELECT "department", "email", "id", "name", "role", "status" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_email_key" ON "Team"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
