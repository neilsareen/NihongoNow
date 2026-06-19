export interface CulturalTip {
  id: string;
  title: string;
  question: string;
  body: string;
  category: "etiquette" | "communication" | "daily-life" | "travel";
}

export const CULTURAL_TIPS: CulturalTip[] = [
  {
    id: "cultural-0",
    title: "No tipping",
    question: "You receive exceptional service at a restaurant in Japan. Should you leave a tip?",
    body: "Tipping is not expected in Japan and can confuse or mildly offend. Excellent service is simply part of omotenashi — a deeply held hospitality ethic — not something extra you reward separately.",
    category: "etiquette",
  },
  {
    id: "cultural-1",
    title: "Shoes off indoors",
    question: "You're about to enter a Japanese home or ryokan. What should you do at the entryway?",
    body: "Remove your shoes at the genkan (entryway) before entering homes, ryokan, and many traditional restaurants. Look for where shoes are lined up neatly — that's your cue. Slippers are usually provided.",
    category: "etiquette",
  },
  {
    id: "cultural-2",
    title: "Quiet on trains",
    question: "Your phone rings while you're on a Japanese train. What's the expected etiquette?",
    body: "Phone calls are avoided on trains and buses. Set your ringer to silent before boarding. Loud conversations are frowned upon. The Japanese call it 'manner mode' — silent mode on your phone.",
    category: "travel",
  },
  {
    id: "cultural-3",
    title: "'It's a bit difficult' means no",
    question: "A Japanese colleague says 'chotto muzukashii ne...' to your request. What do they likely mean?",
    body: "Direct refusals are rare in Japan. If someone says 'chotto muzukashii ne' (that's a bit difficult) or hesitates with 'sou desu ne...', they are almost certainly declining. Pushing further causes discomfort for everyone.",
    category: "communication",
  },
  {
    id: "cultural-4",
    title: "Cash is still king",
    question: "You're visiting a small shrine shop in rural Japan. Can you rely on paying by card?",
    body: "Despite Japan's tech-forward reputation, many small restaurants, shrines, and local shops are cash-only. Always carry yen. 7-Eleven and Japan Post ATMs reliably accept foreign cards.",
    category: "daily-life",
  },
  {
    id: "cultural-5",
    title: "Bowing basics",
    question: "When is a deep bow (30–45°) used vs a casual nod in Japan?",
    body: "A slight nod (5–15°) is a casual greeting. A deeper bow (30–45°) shows real respect or apology. Don't force a handshake — follow the other person's lead and match what they do.",
    category: "etiquette",
  },
  {
    id: "cultural-6",
    title: "Chopstick rules",
    question: "Which two chopstick behaviors are considered taboo at a Japanese table, and why?",
    body: "Never stick chopsticks upright in a bowl of rice — it mimics incense at a funeral. Never pass food chopstick-to-chopstick — same funeral connotation. Rest them on the holder or across your bowl instead.",
    category: "etiquette",
  },
  {
    id: "cultural-7",
    title: "Konbini are a way of life",
    question: "Beyond snacks, what can you do at a Japanese convenience store (konbini)?",
    body: "7-Eleven, FamilyMart, and Lawson are far more than convenience stores. They serve genuinely good hot food, fresh onigiri, quality coffee, and handle bill payments, ATMs, and package shipping.",
    category: "daily-life",
  },
  {
    id: "cultural-8",
    title: "Trash cans are scarce",
    question: "You finish a drink walking around Tokyo. Why is finding a bin so hard, and what should you do?",
    body: "Public bins are rare in Japan (a legacy of post-1995 security measures). Carry a small bag for your trash and hold onto it until you find a bin — usually at convenience stores or train stations.",
    category: "travel",
  },
  {
    id: "cultural-9",
    title: "Queue culture",
    question: "How do Japanese commuters board a train at a busy platform?",
    body: "Japanese queuing is precise and polite. At train platforms, look for painted lines showing exactly where to stand. Boarding only starts after everyone has exited. Always wait your turn without pushing.",
    category: "travel",
  },
  {
    id: "cultural-10",
    title: "Seasonal awareness",
    question: "Why do seasons matter so much in everyday Japanese culture?",
    body: "Seasons matter deeply in Japan. Cherry blossoms in spring (sakura), autumn leaves in fall (kouyou), and summer festivals (matsuri) shape everything from menus to greetings to what you wear.",
    category: "daily-life",
  },
  {
    id: "cultural-11",
    title: "Omiyage — bring souvenirs",
    question: "You've just returned from a trip to Kyoto. What's the cultural expectation for your coworkers?",
    body: "If you visit another city or region, it's customary to bring back omiyage (food gifts) for coworkers or anyone you stayed with. Prefectural specialties in nice packaging are expected and appreciated.",
    category: "etiquette",
  },
];

export function getRandomCulturalTip(exclude: string[] = []): CulturalTip {
  const available = CULTURAL_TIPS.filter((t) => !exclude.includes(t.id));
  const pool = available.length > 0 ? available : CULTURAL_TIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}
