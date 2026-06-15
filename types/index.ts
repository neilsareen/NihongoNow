export type {
  UserProfile,
  JapaneseCharacter,
  Vocabulary,
  Kanji,
  Phrase,
  Review,
  Lesson,
  LessonItem,
  Achievement,
} from "@prisma/client";

export type { SRSQuality, SRSItem, SRSResult } from "@/lib/srs";

export interface DashboardStats {
  streak: number;
  xp: number;
  level: number;
  hiraganaProgress: { mastered: number; total: number };
  katakanaProgress: { mastered: number; total: number };
  kanjiProgress: { mastered: number; total: number };
  vocabProgress: { mastered: number; total: number };
  phraseProgress: { mastered: number; total: number };
  reviewsDue: number;
  todayLessonId: string | null;
  accuracy: number;
}

export interface LessonItemWithContent {
  id: string;
  lessonId: string;
  contentType: string;
  contentId: string;
  exerciseType: string;
  displayOrder: number;
  correct: boolean | null;
  answeredAt: Date | null;
  characterData?: import("@prisma/client").JapaneseCharacter;
  vocabularyData?: import("@prisma/client").Vocabulary;
  kanjiData?: import("@prisma/client").Kanji;
  phraseData?: import("@prisma/client").Phrase;
}
