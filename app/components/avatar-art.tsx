import type { ReactNode } from "react";
import type { AvatarKey } from "@/lib/utils";

/* ===========================================================================
   Avatar illustrations.
   ---------------------------------------------------------------------------
   One flat cartoon per preset, drawn as inline SVG on a 64x64 grid so a single
   drawing serves the 36px header mark and the 56px settings portrait without
   a raster asset per size. Each drawing fills its square edge to edge — the
   colour plate behind it is the background, and the plate clips the overflow,
   so busts crop at the bottom the way a portrait does.

   The palette is deliberately tiny and shared: the same ink, skin and cream
   across every drawing is what makes fifteen separate illustrations read as
   one set rather than fifteen stickers.
   =========================================================================== */

const INK = "#2A2233";
const SKIN = "#F8D3B0";
const SKIN2 = "#E8B48C";
const WHITE = "#FFFFFF";
const CREAM = "#FFF3DF";
const GOLD = "#F7C948";
const RED = "#DC4A54";

export const AVATAR_ART: Record<AvatarKey, ReactNode> = {
  samurai: (
    <>
    <path d="M8 64c1-11 10-17 24-17s23 6 24 17z" fill="#33407F"/>
    <path d="M23 48l9 6 9-6 4 3-13 8-13-8z" fill="#4A5AA8"/>
    <rect x="21" y="22" width="22" height="27" rx="11" fill={SKIN}/>
    <path d="M13 30l-2 15 8 3 2-16z" fill="#1E1A2B"/>
    <path d="M51 30l2 15-8 3-2-16z" fill="#1E1A2B"/>
    <path d="M15 27c0-11 8-19 17-19s17 8 17 19z" fill={INK}/>
    <rect x="12" y="25" width="40" height="6" rx="3" fill="#1E1A2B"/>
    <path d="M21 24c0-8 5-14 11-14s11 6 11 14c-3-6-6-9-11-9s-8 3-11 9z" fill={GOLD}/>
    <circle cx="26" cy="36" r="2.2" fill={INK}/>
    <circle cx="38" cy="36" r="2.2" fill={INK}/>
    <path d="M24 42c4-3 5-1 8-1s4-2 8 1c-4 3-5 2-8 2s-4 1-8-2z" fill={INK}/>
    </>
  ),
  ninja: (
    <>
    <path d="M10 64c0-11 10-17 22-17s22 6 22 17z" fill="#2E3350"/>
    <rect x="17" y="16" width="30" height="33" rx="15" fill="#3A4066"/>
    <path d="M17 30h30v9H17z" fill={SKIN}/>
    <path d="M17 26h30v6H17z" fill={RED}/>
    <path d="M46 27l16-4-2 12-14-4z" fill={RED}/>
    <ellipse cx="26" cy="35" rx="3.4" ry="2.6" fill={INK}/>
    <ellipse cx="38" cy="35" rx="3.4" ry="2.6" fill={INK}/>
    <circle cx="27" cy="34.4" r="1" fill={WHITE}/>
    <circle cx="39" cy="34.4" r="1" fill={WHITE}/>
    </>
  ),
  sumo: (
    <>
    <path d="M2 64c0-16 13-26 30-26s30 10 30 26z" fill={SKIN}/>
    <circle cx="9" cy="52" r="8" fill={SKIN2}/>
    <circle cx="55" cy="52" r="8" fill={SKIN2}/>
    <path d="M17 64c0-8 7-13 15-13s15 5 15 13z" fill="#5B47C9"/>
    <path d="M26 56h12v8H26z" fill="#7C68E0"/>
    <circle cx="32" cy="25" r="14" fill={SKIN}/>
    <path d="M18 24c1-9 6-14 14-14s13 5 14 14c-4-6-8-8-14-8s-10 2-14 8z" fill={INK}/>
    <path d="M27 12c1-4 9-4 10 0z" fill={INK}/>
    <rect x="28" y="2" width="8" height="10" rx="4" fill={INK}/>
    <circle cx="26" cy="26" r="2" fill={INK}/>
    <circle cx="38" cy="26" r="2" fill={INK}/>
    <path d="M28 32c2 2.5 6 2.5 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    <circle cx="20" cy="30" r="2.6" fill="#E9A98A" opacity=".7"/>
    <circle cx="44" cy="30" r="2.6" fill="#E9A98A" opacity=".7"/>
    </>
  ),
  sushi: (
    <>
    <path d="M9 64c0-11 10-17 23-17s23 6 23 17z" fill={WHITE}/>
    <path d="M32 47l-8 3 8 7 8-7z" fill="#4B6BD6"/>
    <rect x="21" y="24" width="22" height="24" rx="11" fill={SKIN}/>
    <path d="M18 22c0-7 6-12 14-12s14 5 14 12z" fill={INK}/>
    <rect x="13" y="19" width="38" height="7" rx="3.5" fill={WHITE}/>
    <path d="M51 19l10-4-1 14-9-5z" fill={WHITE}/>
    <circle cx="26" cy="34" r="2.1" fill={INK}/>
    <circle cx="38" cy="34" r="2.1" fill={INK}/>
    <path d="M27 40c3 3 7 3 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    <ellipse cx="32" cy="59" rx="14" ry="7" fill={CREAM} stroke="#C9BCA6" strokeWidth="1.6"/>
    <path d="M19 55c3-6 23-6 26 0-3 3-23 3-26 0z" fill="#FF8A5B"/>
    </>
  ),
  kimono: (
    <>
    <path d="M5 64c2-13 12-19 27-19s25 6 27 19z" fill="#D8455E"/>
    <path d="M32 45l-9 4 4 15h10l4-15z" fill={CREAM}/>
    <rect x="24" y="57" width="16" height="7" fill="#F0B429"/>
    <path d="M13 36c0-14 8-24 19-24s19 10 19 24v13l-8 2V32H21v19l-8-2z" fill={INK}/>
    <rect x="22" y="24" width="20" height="24" rx="10" fill={SKIN}/>
    <path d="M14 30c1-12 8-19 18-19s17 7 18 19c-2-7-6-10-11-10-4 3-15 4-20 1-2 1-4 3-5 9z" fill={INK}/>
    <circle cx="26" cy="34" r="2.1" fill={INK}/>
    <circle cx="38" cy="34" r="2.1" fill={INK}/>
    <path d="M29 39c2 2 4 2 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <circle cx="21" cy="39" r="2.4" fill="#F58BA8" opacity=".8"/>
    <circle cx="43" cy="39" r="2.4" fill="#F58BA8" opacity=".8"/>
    <circle cx="49" cy="21" r="5.5" fill="#FFC7DE"/>
    <circle cx="49" cy="21" r="2.2" fill={GOLD}/>
    </>
  ),
  taiko: (
    <>
    <circle cx="32" cy="16" r="11" fill={SKIN}/>
    <path d="M21 14c0-7 5-11 11-11s11 4 11 11c-3-5-6-6-11-6s-8 1-11 6z" fill={INK}/>
    <rect x="19" y="10" width="26" height="5" rx="2.5" fill={WHITE}/>
    <rect x="3" y="24" width="22" height="5" rx="2.5" fill="#EFD3A0" transform="rotate(40 14 26)"/>
    <rect x="39" y="24" width="22" height="5" rx="2.5" fill="#EFD3A0" transform="rotate(-40 50 26)"/>
    <circle cx="17" cy="37" r="5" fill={SKIN}/>
    <circle cx="47" cy="37" r="5" fill={SKIN}/>
    <rect x="10" y="38" width="44" height="24" rx="9" fill="#B5652E"/>
    <ellipse cx="32" cy="50" rx="15" ry="11" fill={CREAM}/>
    <circle cx="16" cy="50" r="1.7" fill="#8A4A20"/>
    <circle cx="48" cy="50" r="1.7" fill="#8A4A20"/>
    </>
  ),
  student: (
    <>
    <path d="M9 64c0-11 10-17 23-17s23 6 23 17z" fill="#2F3A63"/>
    <path d="M32 47l-8 3 3 14h10l3-14z" fill={WHITE}/>
    <path d="M32 50l-4 4 3 4 3-4z" fill="#DE4B57"/>
    <path d="M30 58h4l1 6h-6z" fill="#DE4B57"/>
    <rect x="21" y="23" width="22" height="25" rx="11" fill={SKIN}/>
    <path d="M16 27c0-11 7-18 16-18s16 7 16 18c-2-6-5-8-9-8-4 3-14 4-19 1-2 1-4 3-4 7z" fill={INK}/>
    <circle cx="26" cy="34" r="2.1" fill={INK}/>
    <circle cx="38" cy="34" r="2.1" fill={INK}/>
    <path d="M27 40c3 3 7 3 10 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    </>
  ),
  shiba: (
    <>
    <path d="M11 28L14 8l14 10z" fill="#E09447"/>
    <path d="M53 28L50 8 36 18z" fill="#E09447"/>
    <path d="M15 24l1-10 7 6z" fill="#F5B78D"/>
    <path d="M49 24l-1-10-7 6z" fill="#F5B78D"/>
    <ellipse cx="32" cy="35" rx="21" ry="19" fill="#E09447"/>
    <ellipse cx="19" cy="43" rx="10" ry="9" fill={CREAM}/>
    <ellipse cx="45" cy="43" rx="10" ry="9" fill={CREAM}/>
    <ellipse cx="32" cy="43" rx="12" ry="10" fill={CREAM}/>
    <path d="M18 27c3-1 6 0 7 2-3 1-6 1-7-2z" fill={CREAM}/>
    <path d="M46 27c-3-1-6 0-7 2 3 1 6 1 7-2z" fill={CREAM}/>
    <circle cx="24" cy="33" r="2.6" fill={INK}/>
    <circle cx="40" cy="33" r="2.6" fill={INK}/>
    <ellipse cx="32" cy="39" rx="3.6" ry="2.8" fill={INK}/>
    <path d="M32 42v2m0 0c-1.5 2-4 2-5 0m5 0c1.5 2 4 2 5 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M29 48c1.5 5 4.5 5 6 0z" fill="#F2708C"/>
    </>
  ),
  maneki: (
    <>
    <path d="M13 64c0-13 8-22 19-22s19 9 19 22z" fill={WHITE}/>
    <path d="M42 46c0-9 4-14 9-13s6 8 3 13z" fill={WHITE}/>
    <circle cx="48" cy="30" r="7" fill={WHITE}/>
    <path d="M45 28c1 1.8 3 1.8 4 0M49 28c1 1.8 3 1.8 4 0" stroke="#F7B6C2" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
    <path d="M17 22l1-12 11 8z" fill={WHITE}/>
    <path d="M45 22l-1-12-11 8z" fill={WHITE}/>
    <path d="M20 20l1-7 6 5z" fill="#F7B6C2"/>
    <path d="M42 20l-1-7-6 5z" fill="#F7B6C2"/>
    <circle cx="31" cy="27" r="14" fill={WHITE}/>
    <path d="M22 25c1.5 2.5 4.5 2.5 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M34 25c1.5 2.5 4.5 2.5 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <circle cx="31" cy="31" r="1.7" fill="#F2708C"/>
    <path d="M28 33c1 1.5 5 1.5 6 0" stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M11 26h7M11 31h7M44 26h6M44 31h6" stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity=".5"/>
    <path d="M19 42c4 3 20 3 24 0l1 5c-6 3-20 3-26 0z" fill={RED}/>
    <circle cx="31" cy="46" r="3.4" fill={GOLD}/>
    <ellipse cx="31" cy="57" rx="11" ry="6.5" fill={GOLD}/>
    <ellipse cx="31" cy="57" rx="6" ry="3" fill="#E0A81F"/>
    </>
  ),
  sakura: (
    <>
    <g fill="#FFC7DE">
    <path d="M32 33c-7 0-11-5-11-11 0-6 3-12 7-15 1 3 3 5 4 5s3-2 4-5c4 3 7 9 7 15 0 6-4 11-11 11z"/>
    <path d="M32 33c-7 0-11-5-11-11 0-6 3-12 7-15 1 3 3 5 4 5s3-2 4-5c4 3 7 9 7 15 0 6-4 11-11 11z" transform="rotate(72 32 33)"/>
    <path d="M32 33c-7 0-11-5-11-11 0-6 3-12 7-15 1 3 3 5 4 5s3-2 4-5c4 3 7 9 7 15 0 6-4 11-11 11z" transform="rotate(144 32 33)"/>
    <path d="M32 33c-7 0-11-5-11-11 0-6 3-12 7-15 1 3 3 5 4 5s3-2 4-5c4 3 7 9 7 15 0 6-4 11-11 11z" transform="rotate(216 32 33)"/>
    <path d="M32 33c-7 0-11-5-11-11 0-6 3-12 7-15 1 3 3 5 4 5s3-2 4-5c4 3 7 9 7 15 0 6-4 11-11 11z" transform="rotate(288 32 33)"/>
    </g>
    <circle cx="32" cy="33" r="6" fill="#FFF0C2"/>
    <g stroke={GOLD} strokeWidth="1.6" strokeLinecap="round">
    <path d="M32 33l-5-5M32 33l6-4M32 33l4 6M32 33l-6 4M32 33v-7"/>
    </g>
    </>
  ),
  shinkansen: (
    <>
    <path d="M3 21h30c14 0 25 7 28 15 1 3-1 6-4 6H3z" fill={WHITE}/>
    <path d="M3 32h32c9 0 16 3 20 7H3z" fill="#2C6ED5"/>
    <path d="M42 25c7 2 12 6 15 11h-9c-2-4-5-8-9-11z" fill="#1F2A44"/>
    <rect x="8" y="24" width="7" height="6" rx="2" fill="#1F2A44"/>
    <rect x="19" y="24" width="7" height="6" rx="2" fill="#1F2A44"/>
    <rect x="30" y="24" width="7" height="6" rx="2" fill="#1F2A44"/>
    <circle cx="14" cy="46" r="4" fill="#4A4358"/>
    <circle cx="42" cy="46" r="4" fill="#4A4358"/>
    <rect x="2" y="50" width="60" height="4" rx="2" fill="#6E6480"/>
    <path d="M4 13h16M8 8h18M2 18h9" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".65"/>
    </>
  ),
  fuji: (
    <>
    <circle cx="49" cy="15" r="8" fill="#FFF0B8"/>
    <path d="M2 54h60L38 15c-3-5-9-5-12 0z" fill="#4F6BC4"/>
    <path d="M23 27c2 2 4 1 6 2s4-2 6-1 3 3 5 2l-6-10c-2 3-4 3-6 1z" fill={WHITE}/>
    <path d="M2 54h60v3H2z" fill="#3A529E" opacity=".5"/>
    <path d="M6 60c3-3 7-3 10 0 3-3 7-3 10 0 3-3 7-3 10 0 3-3 7-3 10 0 3-3 7-3 10 0" stroke={WHITE} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".8"/>
    </>
  ),
  matcha: (
    <>
    <g stroke={WHITE} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".85">
    <path d="M25 20c3-3-2-6 1-9"/>
    <path d="M32 17c3-3-2-6 1-9"/>
    <path d="M39 20c3-3-2-6 1-9"/>
    </g>
    <path d="M10 32h44c0 14-9 24-22 24s-22-10-22-24z" fill="#F1EBDC"/>
    <ellipse cx="32" cy="32" rx="22" ry="7" fill="#DCD3C0"/>
    <ellipse cx="32" cy="33" rx="18" ry="5.4" fill="#7CBB3F"/>
    <ellipse cx="25" cy="32" rx="3" ry="1.4" fill="#B5E08A"/>
    <ellipse cx="37" cy="34" rx="4" ry="1.6" fill="#B5E08A"/>
    <path d="M13 44c4 4 34 4 38 0-2 8-9 12-19 12s-17-4-19-12z" fill="#E2DAC8"/>
    </>
  ),
  koi: (
    <>
    <path d="M8 34c8-13 26-16 36-8 6 5 8 11 6 14-9 9-30 8-42-6z" fill={WHITE}/>
    <path d="M50 26l12-8-2 12 4 10-14-4z" fill="#FF8A4B"/>
    <path d="M22 20c6-4 14-4 19 0-6 2-13 3-19 0z" fill="#FF8A4B"/>
    <path d="M14 40c6 4 14 6 21 5-5 5-15 4-21-5z" fill="#FF8A4B"/>
    <ellipse cx="26" cy="27" rx="8" ry="6" fill="#FF8A4B"/>
    <circle cx="16" cy="30" r="3.2" fill={INK}/>
    <circle cx="17" cy="29" r="1.1" fill={WHITE}/>
    <circle cx="12" cy="48" r="3.4" fill={WHITE} opacity=".7"/>
    <circle cx="22" cy="54" r="2.4" fill={WHITE} opacity=".6"/>
    <circle cx="34" cy="50" r="2" fill={WHITE} opacity=".5"/>
    </>
  ),
  torii: (
    <>
    <path d="M4 14h56l-4 7H8z" fill="#D93B36"/>
    <path d="M6 23h52v7H6z" fill="#D93B36"/>
    <rect x="13" y="28" width="9" height="34" fill="#D93B36"/>
    <rect x="42" y="28" width="9" height="34" fill="#D93B36"/>
    <rect x="10" y="59" width="15" height="5" rx="1.5" fill="#B22C28"/>
    <rect x="39" y="59" width="15" height="5" rx="1.5" fill="#B22C28"/>
    <rect x="27" y="24" width="10" height="9" rx="2" fill="#F2E3C4"/>
    <path d="M4 14h56l-4 4H8z" fill="#EF5A50"/>
    </>
  ),
};
