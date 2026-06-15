// SM-2 spaced repetition algorithm
// quality: 0-1 complete failure, 2 wrong but recalled, 3 correct with difficulty, 4 correct, 5 perfect

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SRSItem {
  easeFactor: number;
  interval: number;
  consecutiveSuccesses: number;
  srsLevel: "NEW" | "LEARNING" | "FAMILIAR" | "STRONG" | "MASTERED";
}

export interface SRSResult {
  easeFactor: number;
  interval: number;
  consecutiveSuccesses: number;
  srsLevel: "NEW" | "LEARNING" | "FAMILIAR" | "STRONG" | "MASTERED";
  nextReviewAt: Date;
}

export function calculateNextReview(
  item: SRSItem,
  quality: SRSQuality
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

  const srsLevel = getSRSLevel(consecutiveSuccesses, interval);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return { easeFactor, interval, consecutiveSuccesses, srsLevel, nextReviewAt };
}

function getSRSLevel(
  consecutiveSuccesses: number,
  interval: number
): SRSResult["srsLevel"] {
  if (consecutiveSuccesses === 0) return "NEW";
  if (consecutiveSuccesses < 3) return "LEARNING";
  if (interval < 7) return "FAMILIAR";
  if (interval < 21) return "STRONG";
  return "MASTERED";
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
