// Canonical RADIX // 01 data objects — single source of truth for all pages.

export const EVENT = {
  name: "RADIX // 01 (Pilot Edition)",
  short: "RADIX // 01",
  subtitle: "The Official Tech & Innovation Festival",
  oneLiner:
    "Rooted in first principles: compiling raw logic, physical hardware, digital design, and high-speed execution from the ground up.",
  shortLiner: "Rooted in first principles.",
};

// ---------------------------------------------------------------------
// Home radial wheel sectors
// ---------------------------------------------------------------------
export const SECTIONS = [
  {
    id: "connect",
    label: "CONNECT",
    path: "/connect",
    preview: "Four signal channels into the RADIX network.",
    accent: "#72efdd",
  },
  {
    id: "events",
    label: "EVENTS",
    path: "/events",
    preview: "Six contests across two phases, online to onstage.",
    accent: "#ff9e5e",
  },
  {
    id: "timeline",
    label: "TIMELINE",
    path: "/timeline",
    preview: "The master event-day schedule — soon.",
    accent: "#9d8bff",
  },
  {
    id: "team",
    label: "TEAM",
    path: "/team",
    preview: "The minds compiling RADIX from first principles.",
    accent: "#ff8fb8",
  },
  {
    id: "register",
    label: "REGISTER",
    path: "/register",
    preview: "Secure your seat in the pilot edition — soon.",
    accent: "#7fe36f",
  },
];

// ---------------------------------------------------------------------
// Connect — social matrix
// ---------------------------------------------------------------------
export const SOCIALS = [
  {
    id: "whatsapp",
    name: "WHATSAPP",
    handle: "chat.whatsapp.com/RADIX01",
    href: "https://chat.whatsapp.com/radix01",
    status: "members",
    base: 1284,
    accent: "#35e07f",
  },
  {
    id: "instagram",
    name: "INSTAGRAM",
    handle: "@radix.fest",
    href: "https://instagram.com/radix.fest",
    status: "followers",
    base: 8420,
    accent: "#ff5fa2",
  },
  {
    id: "discord",
    name: "DISCORD",
    handle: "discord.gg/radix01",
    href: "https://discord.gg/radix01",
    status: "online now",
    base: 2310,
    accent: "#7d8bff",
    preferredAnchor: "bottom-right",
  },
  {
    id: "telegram",
    name: "TELEGRAM",
    handle: "t.me/radix_fest",
    href: "https://t.me/radix_fest",
    status: "subscribers",
    base: 965,
    accent: "#39b8ff",
  },
];

// ---------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------
export const PHASES = [
  {
    id: "p1",
    pill: "PHASE 1",
    title: "PHASE 1: ONLINE PRELIMS",
    window: "Pre-Fest Week — Asynchronous",
    subtitle: "Designed to test baseline skills remotely and shortlist the top contenders.",
  },
  {
    id: "p2",
    pill: "PHASE 2",
    title: "PHASE 2: OFFLINE GRAND FINALE",
    window: "Main Fest Day — Concludes by 1:00 PM",
    subtitle: "Face-to-face competition featuring the top qualifiers.",
  },
];

export const EVENTS = [
  {
    id: "cipher-labyrinth",
    phase: "p1",
    no: "01",
    name: "Cipher Labyrinth",
    category: "Crypto & Logic",
    format: "Online Portal / Remote",
    summary: "Web puzzle trail to decode grid-based ciphers and logic locks.",
    description:
      "An online puzzle trail where participants decode a series of increasingly difficult ciphers, logic riddles, and hidden digital clues to advance on the leaderboard.",
    theme: "Deep Indigo · Ultraviolet · Electric Cyan",
    colors: ["#0a0a3a", "#4b2bff", "#a24dff", "#19e3ff"],
  },
  {
    id: "bit-sprint",
    phase: "p1",
    no: "02",
    name: "Bit-Sprint",
    category: "Foundational Coding",
    format: "Online Platform / Remote",
    summary: "Rapid algorithmic coding sprint to shortlist top programmers.",
    description:
      "A rapid-fire coding qualifier testing speed, accuracy, and algorithmic problem-solving against a strict countdown timer.",
    theme: "Emerald Matrix Green · Teal · Cyber Lime",
    colors: ["#012b1f", "#00c27a", "#0aa5a5", "#c6ff3a"],
  },
  {
    id: "open-bracket",
    phase: "p1",
    no: "03",
    name: "Open Bracket",
    category: "Esports Qualifiers / Gaming",
    format: "Online Lobbies / Remote",
    summary: "Remote Brawlhalla & Valorant matches to seed the finalists.",
    description:
      "The remote qualifying rounds. Players compete online through single-elimination brackets to secure their seed for the main stage.",
    theme: "Crimson Sunset · Magenta · Deep Amber",
    colors: ["#2a0612", "#e0173f", "#d41fa0", "#ff9d1c"],
  },
  {
    id: "algorithm-arcade",
    phase: "p2",
    no: "04",
    name: "The Algorithm Arcade",
    category: "Coding Showdown",
    format: "Offline (Timed Lab Sprint — Coding Lab / Hall A)",
    summary: "A 45-minute timed sprint to build a functional, creative mini-game.",
    description:
      "A 45-minute timed coding sprint where finalists build a working, creative mini-game from scratch, testing clean logic and execution under pressure.",
    theme: "Royal Sapphire Blue · Neon Sky · Violet",
    colors: ["#04114a", "#1f4dff", "#35c4ff", "#8a3dff"],
  },
  {
    id: "prompt-grand-prix",
    phase: "p2",
    no: "05",
    name: "Prompt Grand Prix",
    category: "AI Engineering",
    format: "Offline (Single-Session Live-Stage Challenge — AI Studio / Hall B)",
    summary: "Live-stage AI pitch battle solving bizarre creative prompt challenges.",
    description:
      "A streamlined challenge where teams are given a multi-layered problem statement and must use AI tools to build, curate, and present their final solution in one go.",
    theme: "Rose Gold · Warm Coral · Amethyst Purple",
    colors: ["#2b0f2e", "#f2b1a0", "#ff6f61", "#9a5cff"],
  },
  {
    id: "arena-showdown",
    phase: "p2",
    no: "06",
    name: "Arena Showdown",
    category: "Esports Grand Finale",
    format: "Offline (Main Stage — Main Auditorium)",
    summary: "The high-energy championship stage featuring two live knockout arenas:",
    subTracks: [
      {
        key: "A",
        name: "Platform Dynamics (Brawlhalla)",
        text: "High-energy arena combat tournament projected live on stage.",
      },
      {
        key: "B",
        name: "Strategic Reflex Arena (Valorant)",
        text: "Fast-paced 3-minute gun game knockout matches for the trophy.",
      },
    ],
    description:
      "The high-energy championship stage. Online qualifiers battle through intense final knockout matches projected on the giant screen for the entire audience.",
    theme: "Hyper Orange · Scarlet Red · Obsidian Gold",
    colors: ["#1c0a02", "#ff6a00", "#e01919", "#d9a520"],
  },
];

// ---------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------
export const TEAM = [
  {
    id: "aarav",
    name: "Aarav Vance",
    title: "Festival Director & First-Principles Architect",
    role: "DIRECTOR",
    photo:
      "https://images.pexels.com/photos/5349053/pexels-photo-5349053.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#72efdd",
  },
  {
    id: "mira",
    name: "Mira Kael",
    title: "Head of Cryptography & Cipher Labyrinth Lead",
    role: "CRYPTO",
    photo:
      "https://images.pexels.com/photos/20022691/pexels-photo-20022691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#9d8bff",
  },
  {
    id: "rohan",
    name: "Rohan Sterling",
    title: "Principal Systems Engineer & Bit-Sprint Director",
    role: "SYSTEMS",
    photo:
      "https://images.pexels.com/photos/14391923/pexels-photo-14391923.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#7fe36f",
  },
  {
    id: "zoya",
    name: "Zoya Thorne",
    title: "Neural Systems & Prompt Grand Prix Curator",
    role: "AI",
    photo:
      "https://images.pexels.com/photos/38969192/pexels-photo-38969192.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#ff8fb8",
  },
  {
    id: "kabir",
    name: "Kabir Vex",
    title: "Esports Commissioner & Arena Showdown Director",
    role: "ESPORTS",
    photo:
      "https://images.pexels.com/photos/30124371/pexels-photo-30124371.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#ff9e5e",
  },
  {
    id: "elena",
    name: "Elena Frost",
    title: "Lead Shader & Liquid Optics Designer",
    role: "OPTICS",
    photo:
      "https://images.pexels.com/photos/11429995/pexels-photo-11429995.png?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    hue: "#39b8ff",
  },
];

// ---------------------------------------------------------------------
// ARCHIVED — Master Event Day Timeline (draft)
// Intentionally NOT rendered: the live /timeline route prints
// "TBH [TO BE DISCUSSED]" until this schedule is signed off.
// Kept here, unused by the UI, ready for future deployment.
// ---------------------------------------------------------------------
export const ARCHIVED_MASTER_TIMELINE = Object.freeze([
  { time: "08:30 AM", label: "Arrival" },
  { time: "09:00 AM", label: "The Algorithm Arcade" },
  { time: "10:00 AM", label: "Prompt Grand Prix" },
  { time: "11:00 AM", label: "Arena Showdown" },
  { time: "12:30 PM", label: "Closing & Awards" },
]);
