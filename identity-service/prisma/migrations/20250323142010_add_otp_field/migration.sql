-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otp" TEXT,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "date_of_birth" DROP NOT NULL;
