-- CreateEnum
CREATE TYPE "Side" AS ENUM ('buy', 'sell');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('market', 'limit');

-- CreateEnum
CREATE TYPE "TimeInForce" AS ENUM ('day', 'gtc', 'opg');

-- CreateEnum
CREATE TYPE "OrderClass" AS ENUM ('simple', 'bracket', 'oco', 'oto');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "qty" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "type" "Type" NOT NULL,
    "time_in_force" "TimeInForce" NOT NULL,
    "order_class" "OrderClass" NOT NULL,
    "limit_price" TEXT,
    "stop_price" TEXT,
    "trail_price" TEXT,
    "trail_percent" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TakeProfit" (
    "id" SERIAL NOT NULL,
    "limit_price" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "TakeProfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StopLoss" (
    "id" SERIAL NOT NULL,
    "stop_price" TEXT NOT NULL,
    "stop_limit_price" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "StopLoss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TakeProfit_orderId_key" ON "TakeProfit"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "StopLoss_orderId_key" ON "StopLoss"("orderId");

-- AddForeignKey
ALTER TABLE "TakeProfit" ADD CONSTRAINT "TakeProfit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopLoss" ADD CONSTRAINT "StopLoss_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
