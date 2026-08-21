import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  SIMULATION_COOKIE,
  canSimulate,
  ensureSandboxProfile,
  getSandboxSummary,
  resetSandbox,
} from "@/lib/simulation";

async function requireSimulator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if (!canSimulate(user.email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}

// Reports whether this account may simulate, whether it's currently on, and
// how far the sandbox learner has gotten — for the settings panel.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = canSimulate(user.email);
  if (!allowed) {
    return NextResponse.json({ canSimulate: false, isSimulating: false });
  }

  const cookieStore = await cookies();
  const isSimulating = cookieStore.get(SIMULATION_COOKIE)?.value === "1";
  const summary = await getSandboxSummary(user.id);

  return NextResponse.json({ canSimulate: true, isSimulating, summary });
}

export async function POST(request: Request) {
  const { user, error } = await requireSimulator();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = body.action as "start" | "stop" | "reset" | undefined;

  const cookieStore = await cookies();

  if (action === "start") {
    await ensureSandboxProfile(user);
    cookieStore.set(SIMULATION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else if (action === "stop") {
    cookieStore.delete(SIMULATION_COOKIE);
  } else if (action === "reset") {
    await resetSandbox(user);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const summary = await getSandboxSummary(user.id);
  const isSimulating = cookieStore.get(SIMULATION_COOKIE)?.value === "1";
  return NextResponse.json({ canSimulate: true, isSimulating, summary });
}
