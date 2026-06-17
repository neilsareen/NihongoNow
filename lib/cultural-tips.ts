export interface CulturalTip {
  id: string;
  title: string;
  body: string;
  category: "etiquette" | "communication" | "daily-life" | "travel";
}

export const CULTURAL_TIPS: CulturalTip[] = [
  {
    id: "cultural-0",
    title: "No tipping",
    body: "Tipping is not expected in Japan and can confuse or mildly offend. Excellent service is simply part of omotenashi — a deeply held hospitality ethic — not something extra you reward separately.",
    category: "etiquette",
  },
  {
    id: "cultural-1",
    title: "Shoes off indoors",
    body: "Remove your shoes at the genkan (entryway) before entering homes, ryokan, and many traditional restaurants. Look for where shoes are lined up neatly — that's your cue. Slippers are usually provided.",
    category: "etiquette",
  },
  {
    id: "cultural-2",
    title: "Quiet on trains",
    body: "Phone calls are avoided on trains and buses. Set your ringer to silent before boarding. Loud conversations are frowned upon. The Japanese call it 'manner mode' — silent mode on your phone.",
    category: "travel",
  },
  {
    id: "cultural-3",
    title: "'It's a bit difficult' means no",
    body: "Direct refusals are rare in Japan. If someone says 'chotto muzukashii ne' (that's a bit difficult) or hesitates with 'sou desu ne...', they are almost certainly declining. Pushing further causes discomfort for everyone.",
    category: "communication",
  },
  {
    id: "cultural-4",
    title: "Cash is still king",
    body: "Despite Japan's tech-forward reputation, many small restaurants, shrines, and local shops are cash-only. Always carry yen. 7-Eleven and Japan Post ATMs reliably accept foreign cards.",
    category: "daily-life",
  },
  {
    id: "cultural-5",
    title: "Bowing basics",
    body: "A slight nod (5–15°) is a casual greeting. A deeper bow (30–45°) shows real respect or apology. Don't force a handshake — follow the other person's lead and match what they do.",
    category: "etiquette",
  },
  {
    id: "cultural-6",
    title: "Chopstick rules",
    body: "Never stick chopsticks upright in a bowl of rice — it mimics incense at a funeral. Never pass food chopstick-to-chopstick — same funeral connotation. Rest them on the holder or across your bowl instead.",
    category: "etiquette",
  },
  {
    id: "cultural-7",
    title: "Konbini are a way of life",
    body: "7-Eleven, FamilyMart, and Lawson are far more than convenience stores. They serve genuinely good hot food, fresh onigiri, quality coffee, and handle bill payments, ATMs, and package shipping.",
    category: "daily-life",
  },
  {
    id: "cultural-8",
    title: "Trash cans are scarce",
    body: "Public bins are rare in Japan (a legacy of post-1995 security measures). Carry a small bag for your trash and hold onto it until you find a bin — usually at convenience stores or train stations.",
    category: "travel",
  },
  {
    id: "cultural-9",
    title: "Queue culture",
    body: "Japanese queuing is precise and polite. At train platforms, look for painted lines showing exactly where to stand. Boarding only starts after everyone has exited. Always wait your turn without pushing.",
    category: "travel",
  },
  {
    id: "cultural-10",
    title: "Seasonal awareness",
    body: "Seasons matter deeply in Japan. Cherry blossoms in spring (sakura), autumn leaves in fall (kouyou), and summer festivals (matsuri) shape everything from menus to greetings to what you wear.",
    category: "daily-life",
  },
  {
    id: "cultural-11",
    title: "Omiyage — bring souvenirs",
    body: "If you visit another city or region, it's customary to bring back omiyage (food gifts) for coworkers or anyone you stayed with. Prefectural specialties in nice packaging are expected and appreciated.",
    category: "etiquette",
  },
];

export function getRandomCulturalTip(exclude: string[] = []): CulturalTip {
  const available = CULTURAL_TIPS.filter((t) => !exclude.includes(t.id));
  const pool = available.length > 0 ? available : CULTURAL_TIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}
