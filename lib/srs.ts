// SM-2 spaced repetition algorithm
// quality: 0-1 complete failure, 2 wrong but recalled, 3 correct with difficulty, 4 correct, 5 perfect

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type SRSLevel = "NEW" | "LEARNING" | "FAMILIAR" | "STRONG" | "MASTERED";

/** Ordered weakest → strongest, so levels can be compared and stepped. */
export const SRS_LEVELS: SRSLevel[] = ["NEW", "LEARNING", "FAMILIAR", "STRONG", "MASTERED"];

export interface SRSItem {
  easeFactor: number;
  interval: number;
  consecutiveSuccesses: number;
  srsLevel: SRSLevel;
}

/** Lifetime tallies, which outlive the current streak. */
export interface SRSHistory {
  correctCount: number;
  totalAttempts: number;
}

export interface SRSResult {
  easeFactor: number;
  interval: number;
  consecutiveSuccesses: number;
  srsLevel: SRSLevel;
  nextReviewAt: Date;
}

function rank(level: SRSLevel): number {
  const i = SRS_LEVELS.indexOf(level);
  return i === -1 ? 0 : i;
}

/**
 * A level's position on the scale, as the learner sees it: NEW is 0, LEARNING
 * is 1, up to MASTERED at 4 — the same steps the mastery pips draw. Exported
 * so gates elsewhere can be stated in the levels shown on the cards rather
 * than in a private ordering of their own.
 */
export function srsRank(level: SRSLevel | string): number {
  return rank(level as SRSLevel);
}

function strongest(...levels: SRSLevel[]): SRSLevel {
  return levels.reduce((best, l) => (rank(l) > rank(best) ? l : best), "NEW");
}

/** One stage down, never past LEARNING: an item that has been answered is never "New" again. */
function demote(level: SRSLevel): SRSLevel {
  const i = rank(level);
  if (i <= 1) return level;
  return SRS_LEVELS[i - 1];
}

export function calculateNextReview(
  item: SRSItem,
  quality: SRSQuality,
  history: SRSHistory
): SRSResult {
  let { easeFactor, interval, consecutiveSuccesses } = item;

  if (quality < 3) {
    consecutiveSuccesses = 0;
    interval = quality === 0 ? 0 : 1;
  } else {
    consecutiveSuccesses += 1;

    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );
  }

  // Mastery is a record of what the learner knows, not of their current
  // streak. A miss costs one stage; it never erases the history that got the
  // item there, and it can never send an item that has been answered back to
  // "New" — that label is reserved for content never seen before.
  const carried = quality < 3 ? demote(item.srsLevel) : item.srsLevel;
  const srsLevel = strongest(
    carried,
    scheduleLevel(consecutiveSuccesses, interval),
    historyFloor(history)
  );

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { easeFactor, interval, consecutiveSuccesses, srsLevel, nextReviewAt };
}

/** What the current streak alone has earned. */
function scheduleLevel(consecutiveSuccesses: number, interval: number): SRSLevel {
  if (consecutiveSuccesses === 0) return "NEW";
  if (consecutiveSuccesses < 2) return "LEARNING";
  if (consecutiveSuccesses < 3 || interval < 7) return "FAMILIAR";
  if (interval < 21) return "STRONG";
  return "MASTERED";
}

/**
 * The level a learner's lifetime record justifies on its own, so a lapse — or a
 * row written before levels survived one — still reads as the progress it is.
 * Caps below MASTERED: mastery has to be held, not just accumulated.
 */
function historyFloor({ correctCount, totalAttempts }: SRSHistory): SRSLevel {
  if (totalAttempts <= 0) return "NEW";
  if (correctCount <= 0) return "LEARNING";
  const accuracy = correctCount / totalAttempts;
  if (correctCount >= 8 && accuracy >= 0.9) return "STRONG";
  if (correctCount >= 4 && accuracy >= 0.75) return "FAMILIAR";
  return "LEARNING";
}

/**
 * The level to show for a stored review. Reviews written before a lapse stopped
 * resetting progress can sit at a level below what their own tallies support,
 * so read it back through the same floor rather than reporting "New" for an
 * item the learner has answered dozens of times.
 */
export function effectiveSrsLevel(review: {
  srsLevel: string;
  consecutiveSuccesses: number;
  interval: number;
  correctCount: number;
  totalAttempts: number;
}): SRSLevel {
  const stored = (SRS_LEVELS as string[]).includes(review.srsLevel)
    ? (review.srsLevel as SRSLevel)
    : "NEW";
  return strongest(
    stored,
    scheduleLevel(review.consecutiveSuccesses, review.interval),
    historyFloor(review)
  );
}

export function isMastered(
  correctCount: number,
  totalAttempts: number,
  consecutiveSuccesses: number
): boolean {
  if (totalAttempts < 10) return false;
  const accuracy = correctCount / totalAttempts;
  return accuracy >= 0.9 && consecutiveSuccesses >= 5;
}
