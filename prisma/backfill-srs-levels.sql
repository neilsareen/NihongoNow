-- Repairs mastery levels written before a lapse stopped erasing progress.
--
-- The old rule derived srsLevel from the current streak alone, so a single
-- wrong answer sent an item all the way back to NEW no matter how many times
-- it had been answered correctly. The app now reads levels back through the
-- same floor this script applies, so running it is optional — it only brings
-- the stored column in line with what the UI already shows, which also fixes
-- review ordering and the "not yet mastered" filters.
--
-- Mirrors effectiveSrsLevel() in lib/srs.ts. Safe to run more than once.

WITH levels AS (
  SELECT
    id,
    GREATEST(
      -- what is already stored
      CASE "srsLevel"
        WHEN 'NEW' THEN 0
        WHEN 'LEARNING' THEN 1
        WHEN 'FAMILIAR' THEN 2
        WHEN 'STRONG' THEN 3
        ELSE 4
      END,
      -- what the current streak has earned
      CASE
        WHEN "consecutiveSuccesses" = 0 THEN 0
        WHEN "consecutiveSuccesses" < 2 THEN 1
        WHEN "consecutiveSuccesses" < 3 OR "interval" < 7 THEN 2
        WHEN "interval" < 21 THEN 3
        ELSE 4
      END,
      -- what the lifetime record justifies on its own (never MASTERED)
      CASE
        WHEN "totalAttempts" <= 0 THEN 0
        WHEN "correctCount" <= 0 THEN 1
        WHEN "correctCount" >= 8
          AND "correctCount"::numeric / "totalAttempts" >= 0.9 THEN 3
        WHEN "correctCount" >= 4
          AND "correctCount"::numeric / "totalAttempts" >= 0.75 THEN 2
        ELSE 1
      END
    ) AS level
  FROM reviews
)
UPDATE reviews r
SET "srsLevel" =
  (ARRAY['NEW', 'LEARNING', 'FAMILIAR', 'STRONG', 'MASTERED'])[levels.level + 1]::"SRSLevel"
FROM levels
WHERE r.id = levels.id
  AND r."srsLevel" <>
    (ARRAY['NEW', 'LEARNING', 'FAMILIAR', 'STRONG', 'MASTERED'])[levels.level + 1]::"SRSLevel";
