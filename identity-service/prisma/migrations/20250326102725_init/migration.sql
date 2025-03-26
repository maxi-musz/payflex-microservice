-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "banking";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "transaction_histories";

-- CreateEnum
CREATE TYPE "identity"."Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "identity"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "transaction_histories"."TransactionType" AS ENUM ('transfer', 'deposit', 'airtime', 'data', 'cable', 'education', 'betting');

-- CreateEnum
CREATE TYPE "transaction_histories"."TransactionStatus" AS ENUM ('pending', 'success', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "transaction_histories"."CurrencyType" AS ENUM ('NGN', 'USD', 'GBP', 'EUR');

-- CreateEnum
CREATE TYPE "transaction_histories"."PaymentMethod" AS ENUM ('card', 'bank_transfer', 'wallet', 'ussd');

-- CreateEnum
CREATE TYPE "banking"."AccountType" AS ENUM ('NGN', 'USD', 'EURGBP');

-- CreateTable
CREATE TABLE "identity"."User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "password" TEXT,
    "otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "role" "identity"."Role" NOT NULL DEFAULT 'USER',
    "gender" "identity"."Gender",
    "date_of_birth" TIMESTAMP(3),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."ProfileImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,

    CONSTRAINT "ProfileImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "home_address" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_histories"."TransactionHistory" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "transaction_type" "transaction_histories"."TransactionType",
    "description" TEXT,
    "status" "transaction_histories"."TransactionStatus",
    "recipient_mobile" TEXT,
    "currency_type" "transaction_histories"."CurrencyType",
    "payment_method" "transaction_histories"."PaymentMethod",
    "fee" DOUBLE PRECISION DEFAULT 0.0,
    "transaction_number" TEXT,
    "transaction_reference" TEXT,
    "session_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_histories"."SenderDetails" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_bank" TEXT NOT NULL,
    "sender_account_number" TEXT NOT NULL,

    CONSTRAINT "SenderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_histories"."TransactionIcon" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,

    CONSTRAINT "TransactionIcon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banking"."Account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "accountType" "banking"."AccountType" NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "identity"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileImage_userId_key" ON "identity"."ProfileImage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_key" ON "identity"."Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "identity"."RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_userId_key" ON "identity"."RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "expires_at_idx" ON "identity"."RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionHistory_transaction_reference_key" ON "transaction_histories"."TransactionHistory"("transaction_reference");

-- CreateIndex
CREATE UNIQUE INDEX "SenderDetails_transaction_id_key" ON "transaction_histories"."SenderDetails"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionIcon_transaction_id_key" ON "transaction_histories"."TransactionIcon"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "Account_account_number_key" ON "banking"."Account"("account_number");

-- AddForeignKey
ALTER TABLE "identity"."ProfileImage" ADD CONSTRAINT "ProfileImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_histories"."SenderDetails" ADD CONSTRAINT "SenderDetails_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction_histories"."TransactionHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_histories"."TransactionIcon" ADD CONSTRAINT "TransactionIcon_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction_histories"."TransactionHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
