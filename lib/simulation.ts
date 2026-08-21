import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { prisma } from "./prisma";

// Beginner simulation.
//
// Turning it on doesn't touch the real account: every read and write is
// redirected to a sandbox profile whose id is the real one with a suffix. The
// sandbox starts with no reviews, no lessons and no stats, so the app answers
// exactly as it would for someone who signed up a minute ago — the welcome and
// script intros appear, kanji and vocabulary are locked until the kana they
// need is mastered, and the dashboard reads zero. Switching back off leaves the
// real progress exactly where it was, and the sandbox is kept, so a simulated
// run can be resumed rather than restarted.
export const SIMULATION_COOKIE = "nn_beginner_sim";

// Kept out of the id namespace real Supabase user ids use (UUIDs), so a
// sandbox id can never collide with a genuine account.
const SANDBOX_SUFFIX = "::beginner-sim";

// Accounts allowed to simulate. Extra addresses can be added without a code
// change via SIMULATION_EMAILS (comma-separated).
const DEFAULT_SIMULATOR_EMAILS = ["neil.sareen@gmail.com"];

function simulatorEmails(): string[] {
  const fromEnv = (process.env.SIMULATION_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_SIMULATOR_EMAILS, ...fromEnv];
}

export function canSimulate(email?: string | null): boolean {
  return !!email && simulatorEmails().includes(email.toLowerCase());
}

export function sandboxUserId(realUserId: string): string {
  return `${realUserId}${SANDBOX_SUFFIX}`;
}

export function isSandboxUserId(userId: string): boolean {
  return userId.endsWith(SANDBOX_SUFFIX);
}

export interface SessionUser {
  user: User;
  /** The signed-in account's own id — never the sandbox. */
  realUserId: string;
  /** The id every query should use: the sandbox id while simulating. */
  userId: string;
  isSimulating: boolean;
  /** Whether this account is allowed to simulate at all. */
  canSimulate: boolean;
}

/**
 * The signed-in user plus the id their data should be read and written under.
 * Use `userId` for every query; `realUserId` only for things that belong to the
 * person rather than the learner (e.g. deciding who may simulate).
 *
 * The cookie alone grants nothing: it is honoured only for an allow-listed
 * account, so setting it by hand in another browser does nothing.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const allowed = canSimulate(user.email);
  const cookieStore = await cookies();
  const isSimulating = allowed && cookieStore.get(SIMULATION_COOKIE)?.value === "1";

  if (isSimulating) {
    // Cheap when it already exists (one indexed lookup), and it keeps every
    // entry point working even if the sandbox was wiped from another tab.
    await ensureSandboxProfile(user);
  }

  return {
    user,
    realUserId: user.id,
    userId: isSimulating ? sandboxUserId(user.id) : user.id,
    isSimulating,
    canSimulate: allowed,
  };
}

/** Creates the sandbox learner if it isn't there yet. Never overwrites one. */
export async function ensureSandboxProfile(user: User): Promise<string> {
  const id = sandboxUserId(user.id);
  const existing = await prisma.userProfile.findUnique({ where: { id }, select: { id: true } });
  if (existing) return id;

  await prisma.userProfile.create({
    data: {
      id,
      // UserProfile.email is unique, so the sandbox needs its own address. It
      // is never mailed to — it exists to satisfy the constraint and to make
      // the row obvious in the database.
      email: `beginner-sim+${user.id}@simulation.local`,
      displayName: "Beginner",
      currentStage: "HIRAGANA",
      nativeLevel: "complete_beginner",
      studyGoalMinutes: 20,
    },
  });
  await prisma.userStatistics.create({ data: { userId: id } });
  return id;
}

/**
 * Returns the sandbox to day zero: no reviews, no lessons, no progress, no
 * stats. Only ever touches ids carrying the sandbox suffix.
 */
export async function resetSandbox(user: User): Promise<void> {
  const id = sandboxUserId(user.id);
  if (!isSandboxUserId(id)) throw new Error("Refusing to reset a non-sandbox profile");

  // Lesson items and achievements cascade from their parents.
  await prisma.$transaction([
    prisma.review.deleteMany({ where: { userId: id } }),
    prisma.lesson.deleteMany({ where: { userId: id } }),
    prisma.userProgress.deleteMany({ where: { userId: id } }),
    prisma.userAchievement.deleteMany({ where: { userId: id } }),
    prisma.userStatistics.deleteMany({ where: { userId: id } }),
  ]);

  await prisma.userProfile.deleteMany({ where: { id } });
  await ensureSandboxProfile(user);
}

/** How far along the simulated beginner is, for the settings panel. */
export async function getSandboxSummary(realUserId: string) {
  const id = sandboxUserId(realUserId);
  const [exists, reviews, lessons, mastered] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id }, select: { id: true } }),
    prisma.review.count({ where: { userId: id } }),
    prisma.lesson.count({ where: { userId: id, completedAt: { not: null } } }),
    prisma.review.count({ where: { userId: id, srsLevel: "MASTERED" } }),
  ]);
  return { exists: !!exists, itemsSeen: reviews, itemsMastered: mastered, lessonsCompleted: lessons };
}
