/**
 * A short, true sentence about why a lesson couldn't be built, for the screen
 * the learner is actually looking at.
 *
 * A generic "Failed to generate lesson" is unfalsifiable from a phone: the one
 * time this fired in earnest — a database that had never been given the
 * NUMBERS content type — the message said nothing, and the server log that did
 * was somewhere the learner could not reach. The detail is worth surfacing:
 * this is a single-learner app, and the text below names a schema object at
 * worst, never anything of the learner's.
 */
export function describeLessonError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  // Prisma nests the driver's own error inside its message, quotes and all, so
  // the readable part arrives as `message: \"…\"`. Prefer it when it's there.
  const inner = raw.match(/message: \\?"((?:[^"\\]|\\.)*)\\?"/);
  const message = inner ? inner[1].replace(/\\+"/g, '"') : raw;

  // Postgres 22P02 on an enum: the code sent a value the database's type
  // doesn't carry, which means a deploy landed ahead of its schema change.
  // `npm run db:sync-enums` (also part of `npm run build`) is the fix.
  const enumMismatch = message.match(/invalid input value for enum "?(\w+)"?: "?(\w+)"?/);
  if (enumMismatch) {
    const [, type, value] = enumMismatch;
    return `The database is behind the app: its ${type} type has no "${value}" value yet. Run npm run db:sync-enums.`;
  }

  if (/Can't reach database server|Timed out fetching a new connection/i.test(raw)) {
    return "Couldn't reach the database. It may be waking up — try again in a moment.";
  }

  // Anything unrecognised: the real first line beats a shrug.
  return message.split("\n").map((l) => l.trim()).find(Boolean) ?? "Unknown error";
}

