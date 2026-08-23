-- Optional Zoom/Meet URL per queue (separate from physical location).
ALTER TABLE "Queue" ADD COLUMN IF NOT EXISTS "zoomLink" TEXT;

-- Store schedule as absolute instants (UTC). Existing TIMESTAMP values were
-- written as UTC wall-clock by Prisma; reinterpret them as UTC.
ALTER TABLE "Queue"
  ALTER COLUMN "startsAt" TYPE TIMESTAMPTZ(3)
  USING "startsAt" AT TIME ZONE 'UTC';

ALTER TABLE "Queue"
  ALTER COLUMN "endsAt" TYPE TIMESTAMPTZ(3)
  USING "endsAt" AT TIME ZONE 'UTC';
