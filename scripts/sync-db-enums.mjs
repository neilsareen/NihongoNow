#!/usr/bin/env node
/* ===========================================================================
   Bring the database's enum types up to date with prisma/schema.prisma.
   ---------------------------------------------------------------------------
   Postgres enums are the one part of the schema that a deploy can silently
   fall behind on. Adding a value here is a schema change (`ContentType` gained
   NUMBERS, `ExerciseType` gained SPEAKING), but the code that sends the new
   value ships the moment `master` deploys — and if the database was never
   altered, every query carrying it fails with

     invalid input value for enum "ContentType": "NUMBERS"

   which surfaces to the learner as a flat "Failed to generate lesson". That is
   exactly what happened when the numbers & money track landed: the track's
   picker asks for reviews `notIn` (CULTURE, CONVERSATION, NUMBERS) on every
   single lesson, so an un-migrated database could not build any lesson at all,
   while the dashboard — which never names the value in a query — kept working
   and hid the cause.

   So the ALTERs run automatically as part of `npm run build`, ahead of
   `next build`, rather than being a hand-run SQL file someone has to remember.
   Every statement is `ADD VALUE IF NOT EXISTS`: it only ever adds labels the
   schema already declares, never drops or renames one, so it is idempotent and
   safe to run on every deploy.

     node scripts/sync-db-enums.mjs [--dry-run]

   It talks to DIRECT_URL when that is set (a pooler in transaction mode will
   not run DDL), falling back to DATABASE_URL. With neither set — a build with
   no database attached — it prints a warning and exits 0.
   =========================================================================== */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA_PATH = path.join(ROOT, "prisma", "schema.prisma");
const DRY_RUN = process.argv.includes("--dry-run");

// A momentary blip shouldn't fail a deploy, but a database that stays
// unreachable must: shipping code whose enum values may not exist is the
// failure this script is here to prevent.
const CONNECT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/** Every `enum Name { A B }` block in the schema, as { name, values }. */
function parseEnums(schema) {
  const enums = [];
  const blocks = schema.matchAll(/^enum\s+(\w+)\s*\{([^}]*)\}/gms);
  for (const [, name, body] of blocks) {
    const values = body
      .split("\n")
      .map((line) => line.replace(/\/\/.*$/, "").trim())
      .filter((line) => /^\w+$/.test(line));
    if (values.length) enums.push({ name, values });
  }
  return enums;
}

async function connect(prisma) {
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      if (attempt >= CONNECT_ATTEMPTS) throw err;
      console.warn(`  database unreachable (attempt ${attempt}/${CONNECT_ATTEMPTS}), retrying…`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.warn("sync-db-enums: no DIRECT_URL or DATABASE_URL set — skipping enum sync.");
    return;
  }

  const enums = parseEnums(await readFile(SCHEMA_PATH, "utf8"));
  const prisma = new PrismaClient({ datasources: { db: { url } }, log: ["error"] });

  try {
    await connect(prisma);

    // Labels already in the database, keyed by type name. A type that isn't
    // there yet belongs to a database `prisma db push` has never touched;
    // creating it is that command's job, not this one's.
    const existing = await prisma.$queryRawUnsafe(
      `SELECT t.typname AS type, e.enumlabel AS value
         FROM pg_type t
         JOIN pg_enum e ON e.enumtypid = t.oid
         JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = current_schema()`
    );
    const known = new Map();
    for (const row of existing) {
      if (!known.has(row.type)) known.set(row.type, new Set());
      known.get(row.type).add(row.value);
    }

    let added = 0;
    for (const { name, values } of enums) {
      const have = known.get(name);
      if (!have) {
        console.log(`  ${name}: not in the database yet — leaving it to \`prisma db push\``);
        continue;
      }
      for (const value of values) {
        if (have.has(value)) continue;
        console.log(`  ${name}: adding ${value}${DRY_RUN ? " (dry run)" : ""}`);
        added++;
        if (DRY_RUN) continue;
        // Postgres will not add an enum value inside a transaction block, so
        // each ALTER goes out on its own as a plain statement.
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "${name}" ADD VALUE IF NOT EXISTS '${value}'`
        );
      }
    }

    console.log(
      added === 0
        ? "sync-db-enums: database enums already match the schema."
        : `sync-db-enums: ${added} enum value${added === 1 ? "" : "s"} ${DRY_RUN ? "would be added" : "added"}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("sync-db-enums: failed to bring the database enums up to date.");
  console.error("The deploy is stopped on purpose: shipping code that sends an");
  console.error("enum value the database does not have breaks lesson generation.");
  console.error(err);
  process.exit(1);
});
