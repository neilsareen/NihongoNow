-- Adds the per-learner kanji depth setting: how far into the corpus they have
-- asked to go. Ikou is built around understanding and speaking, and kanji is
-- the part of that most likely to stall someone before they can order lunch,
-- so the character set is banded and the learner chooses their own ceiling.
-- See lib/kanji-tiers.ts for the bands themselves.
--
-- Run this against the database before deploying the code that reads the
-- column — `prisma db push` will also apply it, and this file exists so the
-- change can go in on its own, ahead of a deploy.
--
-- The default is deliberately ESSENTIAL rather than ADVANCED: an existing
-- learner who never opens the setting gets the travel-critical characters and
-- nothing else, which is the point of the change. Their reviews for anything
-- outside that band are untouched and come back the moment they widen the
-- setting — nothing is deleted here.

CREATE TYPE "KanjiDepth" AS ENUM ('ESSENTIAL', 'INTERMEDIATE', 'ADVANCED');

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "kanjiDepth" "KanjiDepth" NOT NULL DEFAULT 'ESSENTIAL';
