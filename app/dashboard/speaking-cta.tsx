"use client";

import Link from "next/link";
import { Mic, VolumeX } from "lucide-react";
import { useSilentMode } from "@/app/components/silent-mode";
import { buttonStyles, buttonVars } from "@/app/components/ui";

/**
 * The way in to the speaking drill.
 *
 * Client-side only because it has to know about silent mode, which lives on the
 * device rather than on the account: offering "practise saying words out loud"
 * as the dashboard's brightest button to someone who has just told the app they
 * can't talk is the one place the mute would look like it hadn't worked.
 */
export function SpeakingCta() {
  const { active: silent } = useSilentMode();

  return silent ? (
    <Link
      href="/speak"
      className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
      style={buttonVars("secondary")}
    >
      <VolumeX className="w-[18px] h-[18px]" strokeWidth={2.5} />
      Speaking is paused — silent mode
    </Link>
  ) : (
    <Link
      href="/speak"
      className={buttonStyles({ variant: "grape", full: true, size: "lg" })}
      style={buttonVars("grape")}
    >
      <Mic className="w-[18px] h-[18px]" strokeWidth={2.5} />
      Practise saying words out loud
    </Link>
  );
}
