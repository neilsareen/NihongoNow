-- Adds the CULTURE content type and learning stage, so social conventions are
-- scheduled and scored like every other kind of content rather than being a
-- card the learner reads once and never sees again.
--
-- Run this against the database before deploying the code that writes CULTURE
-- reviews — `prisma db push` will also add the values, and this file exists so
-- the change can be applied on its own, ahead of a deploy.
--
-- Postgres cannot add an enum value inside a transaction block that then uses
-- it, so each runs as its own statement.
ALTER TYPE "ContentType" ADD VALUE IF NOT EXISTS 'CULTURE';
ALTER TYPE "LearningStage" ADD VALUE IF NOT EXISTS 'CULTURE';
