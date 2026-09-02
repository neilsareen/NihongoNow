-- Adds the CONVERSATION content type and learning stage, so the survival
-- speaking track is scheduled and scored like every other kind of content
-- rather than being a phrasebook the learner reads once.
--
-- Run this against the database before deploying the code that writes
-- CONVERSATION reviews — `prisma db push` will also add the values, and this
-- file exists so the change can be applied on its own, ahead of a deploy.
--
-- Applying it by hand is now optional: `npm run build` runs
-- scripts/sync-db-enums.mjs, which adds every enum value the schema declares
-- and the database is missing. This file stays for applying the change ahead
-- of a deploy, or by hand against a database the build never touches.
--
-- Postgres cannot add an enum value inside a transaction block that then uses
-- it, so each runs as its own statement.
ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'CONVERSATION';
ALTER TYPE "LearningStage" ADD VALUE IF NOT EXISTS 'CONVERSATION';
