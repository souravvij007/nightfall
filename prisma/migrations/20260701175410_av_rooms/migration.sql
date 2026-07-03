-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "RoomRole" AS ENUM ('HOST', 'SPEAKER', 'LISTENER');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'LIVE',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoomRole" NOT NULL DEFAULT 'LISTENER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateIndex
CREATE INDEX "Room_status_createdAt_idx" ON "Room"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Room_hostId_idx" ON "Room"("hostId");

-- CreateIndex
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

