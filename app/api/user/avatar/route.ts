import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { AVATAR_OPTIONS } from "@/lib/utils";

const AVATAR_BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// The bucket is created lazily on first upload rather than provisioned out of
// band, since this project has no Supabase migration/CLI setup checked in.
async function ensureAvatarBucket(admin: SupabaseClient) {
  const { data: bucket } = await admin.storage.getBucket(AVATAR_BUCKET);
  if (bucket) return;
  const { error } = await admin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Object.keys(EXT_BY_MIME),
  });
  // Ignore a race where another request created it first.
  if (error && !/already exists/i.test(error.message)) throw error;
}

async function removeExistingAvatarFiles(admin: SupabaseClient, userId: string, keepPath?: string) {
  const { data } = await admin.storage.from(AVATAR_BUCKET).list(userId);
  if (!data?.length) return;
  const toRemove = data.map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (toRemove.length) await admin.storage.from(AVATAR_BUCKET).remove(toRemove);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Use a JPEG, PNG, WebP, or GIF image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const admin = createAdminClient();
  await ensureAvatarBucket(admin);

  // A fresh, unguessable filename per upload so a stale browser/CDN cache of
  // the old photo at the same URL is never served after a replace.
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, bytes, { contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  await removeExistingAvatarFiles(admin, user.id, path);

  const { data: { publicUrl } } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: { avatarUrl: publicUrl },
  });

  return NextResponse.json(profile);
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  await removeExistingAvatarFiles(admin, user.id);

  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: { avatarUrl: AVATAR_OPTIONS[0].key },
  });

  return NextResponse.json(profile);
}
