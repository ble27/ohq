-- CreateIndex
CREATE INDEX IF NOT EXISTS "Queue_isOpen_endsAt_idx" ON "Queue"("isOpen", "endsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Queue_courseId_isOpen_idx" ON "Queue"("courseId", "isOpen");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "QueueTicket_studentId_status_idx" ON "QueueTicket"("studentId", "status");
