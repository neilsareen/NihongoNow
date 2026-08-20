-- Adds the SPEAKING exercise type used by the say-it-back lesson cards.
--
-- Run this against the database before deploying the code that generates
-- SPEAKING lesson items — `prisma db push` will also add the value, and this
-- file exists so the change can be applied on its own, ahead of a deploy.
--
-- Postgres cannot add an enum value inside a transaction block that then uses
-- it, so this runs as its own statement.
ALTER TYPE "ExerciseType" ADD VALUE IF NOT EXISTS 'SPEAKING';
