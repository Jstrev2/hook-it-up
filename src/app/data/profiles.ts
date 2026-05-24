export interface ProfileData {
  id: string;
  name: string;
  age: number;
  initials: string;
  color: string;
  tagline: string;
  bio: string;
  rarity: number; // 1-5 stars
  fight: number;   // 1-5 how hard they fight the reel
}

export const MATCH_POOL: ProfileData[] = [
  {
    id: "maya", name: "Maya", age: 26, initials: "MK", color: "#f472b6",
    tagline: "Swipe right, cast a line — let's see where the tide takes us",
    bio: "Marine biologist by day, sunset surfer by evening. I talk to dolphins and they talk back. Looking for someone who doesn't mind sand in the car.",
    rarity: 1, fight: 1,
  },
  {
    id: "leo", name: "Leo", age: 29, initials: "LC", color: "#38bdf8",
    tagline: "Woodworking, weekend sailing, and whiskey",
    bio: "Built my own boat, now I just need a first mate. Dad jokes are non-negotiable. If you can't handle chop, stay on the dock.",
    rarity: 2, fight: 2,
  },
  {
    id: "zara", name: "Zara", age: 24, initials: "ZP", color: "#a78bfa",
    tagline: "Poetry in ink, moonlight swims, and trouble",
    bio: "I write love letters on typewriters and leave them in library books. Tattoo count: enough. Looking for someone who actually reads.",
    rarity: 2, fight: 2,
  },
  {
    id: "kai", name: "Kai", age: 31, initials: "KT", color: "#34d399",
    tagline: "Catch, cook, repeat. Simple formula.",
    bio: "Chef who learned to fish before I learned to walk. Can fillet anything. Competitive at board games. Competitive at everything actually.",
    rarity: 3, fight: 3,
  },
  {
    id: "nina", name: "Nina", age: 27, initials: "NR", color: "#fb923c",
    tagline: "Flight attendant. Passport is 80% stamps.",
    bio: "48 countries, 3 languages, zero impulse control at airport bookstores. Home is wherever my carry-on lands. Teach me something I don't know.",
    rarity: 2, fight: 2,
  },
  {
    id: "dom", name: "Dom", age: 33, initials: "DV", color: "#f87171",
    tagline: "Veterinarian. I fix broken wings.",
    bio: "Work with rescue animals. Cry at every adoption. Have 4 dogs, 2 cats, and a parrot that swears in Spanish. You've been warned.",
    rarity: 3, fight: 3,
  },
  {
    id: "sadie", name: "Sadie", age: 25, initials: "SW", color: "#2dd4bf",
    tagline: "Botanist who's definitely not a witch",
    bio: "Greenhouse full of plants I've named. Makes kombucha that's probably illegal. Reads tarot but only for fun. Looking for a co-adventurer.",
    rarity: 3, fight: 3,
  },
  {
    id: "rome", name: "Rome", age: 28, initials: "RJ", color: "#eab308",
    tagline: "Firefighter. Running into burning buildings since 2019.",
    bio: "Captain at Station 14. Cooks a mean chili. Will absolutely rescue your cat from a tree. Just please don't actually call about a cat in a tree.",
    rarity: 4, fight: 4,
  },
  {
    id: "ivy", name: "Ivy", age: 30, initials: "IC", color: "#22c55e",
    tagline: "Architect. I design spaces people fall in love in.",
    bio: "Brutalist buildings, soft heart. Obsessed with natural light. Can tell you why this room feels wrong in 3 seconds. Looking for structural integrity.",
    rarity: 4, fight: 4,
  },
  {
    id: "dax", name: "Dax", age: 35, initials: "DM", color: "#6366f1",
    tagline: "Astrophysicist. I study stars, but I'm looking at you.",
    bio: "PhD. Works at the observatory. Can name every constellation but can't remember to eat lunch. Looking for someone to pull me out of the lab.",
    rarity: 5, fight: 5,
  },
  {
    id: "faye", name: "Faye", age: 26, initials: "FK", color: "#ec4899",
    tagline: "Choreographer. I dance like nobody's watching (they are).",
    bio: "Contemporary dance company lead. Can touch my toes to my head — ask nicely. Coffee and croissant mornings, red wine nights.",
    rarity: 4, fight: 4,
  },
  {
    id: "oz", name: "Oz", age: 32, initials: "OK", color: "#14b8a6",
    tagline: "Record store owner. Vinyl, not Spotify.",
    bio: "3000 records. Knows every B-side. Makes mixtapes for people I like. If you say 'digital sounds the same' we're done here.",
    rarity: 5, fight: 5,
  },
  {
    id: "luna", name: "Luna", age: 23, initials: "LG", color: "#fbbf24",
    tagline: "Art school dropout. Now I'm the gallery.",
    bio: "Murals, installations, and public art that makes people stop walking. Paint in my hair 24/7. Looking for a muse — or a co-conspirator.",
    rarity: 5, fight: 4,
  },
];
