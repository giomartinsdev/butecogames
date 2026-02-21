import * as cheerio from "cheerio";
import type { UfcFight, UfcEventData } from "@butecogames/shared";

const UFC_BASE_URL = "https://www.ufc.com.br";
const FETCH_TIMEOUT = 15_000;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Weight class patterns (PT-BR from ufc.com.br) — ordered longest first for correct matching
const WEIGHT_CLASS_PATTERNS = [
  "Peso Meio-Pesado",
  "Peso Meio-Médio",
  "Peso Meio-Medio",
  "Peso Pesado",
  "Peso Médio",
  "Peso Medio",
  "Peso Leve",
  "Peso Pena",
  "Peso Galo",
  "Peso Mosca",
  "Peso Palha",
];

// Lowercase hyphenated variants that appear on ufc.com.br (e.g. "Peso-médio")
const WEIGHT_CLASS_HYPHENATED: Record<string, string> = {
  "peso-pesado": "Peso Pesado",
  "peso-meio-pesado": "Peso Meio-Pesado",
  "peso-médio": "Peso Médio",
  "peso-medio": "Peso Médio",
  "peso-meio-médio": "Peso Meio-Médio",
  "peso-meio-medio": "Peso Meio-Médio",
  "peso-leve": "Peso Leve",
  "peso-pena": "Peso Pena",
  "peso-galo": "Peso Galo",
  "peso-mosca": "Peso Mosca",
  "peso-palha": "Peso Palha",
};

// Fallback: English → Portuguese translations
const WEIGHT_CLASS_TRANSLATIONS: Record<string, string> = {
  "Heavyweight": "Peso Pesado",
  "Light Heavyweight": "Peso Meio-Pesado",
  "Middleweight": "Peso Médio",
  "Welterweight": "Peso Meio-Médio",
  "Lightweight": "Peso Leve",
  "Featherweight": "Peso Pena",
  "Bantamweight": "Peso Galo",
  "Flyweight": "Peso Mosca",
  "Strawweight": "Peso Palha",
  "Women's Strawweight": "Peso Palha Feminino",
  "Women's Flyweight": "Peso Mosca Feminino",
  "Women's Bantamweight": "Peso Galo Feminino",
  "Women's Featherweight": "Peso Pena Feminino",
};

// In-memory cache (5 minutes)
let cachedResult: { data: UfcEventData; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ao acessar ${url}`);
  }

  return res.text();
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractWeightClass(text: string): string {
  const normalized = normalizeWhitespace(text).toLowerCase();

  // Check for Women's variant first
  const isWomens = /feminino|women/i.test(normalized);

  // Try hyphenated patterns from ufc.com.br (e.g. "Peso-médio Luta")
  for (const [hyphenated, canonical] of Object.entries(WEIGHT_CLASS_HYPHENATED)) {
    if (normalized.includes(hyphenated)) {
      return isWomens ? `${canonical} Feminino` : canonical;
    }
  }

  // Try spaced patterns
  for (const pattern of WEIGHT_CLASS_PATTERNS) {
    if (normalized.includes(pattern.toLowerCase())) {
      return isWomens ? `${pattern} Feminino` : pattern;
    }
  }

  // Fallback: English → Portuguese
  for (const [en, pt] of Object.entries(WEIGHT_CLASS_TRANSLATIONS)) {
    if (normalized.includes(en.toLowerCase())) {
      return pt;
    }
  }

  return "";
}

function parseEventDate(text: string): string | null {
  // Format on ufc.com.br: "21.02.26 / 22:00 -03"
  const match = text.match(/(\d{2})\.(\d{2})\.(\d{2})\s*\/\s*(\d{2}):(\d{2})\s*(-?\d{2,3})/);
  if (match) {
    const [, day, month, year, hour, min, tz] = match;
    const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
    // Normalize timezone: "-03" → "-03:00", "-3" → "-03:00"
    const tzNum = parseInt(tz);
    const tzSign = tzNum <= 0 ? "-" : "+";
    const tzFormatted = `${tzSign}${String(Math.abs(tzNum)).padStart(2, "0")}:00`;
    return `${fullYear}-${month}-${day}T${hour}:${min}:00${tzFormatted}`;
  }

  return null;
}

async function findUpcomingEventUrl(): Promise<string> {
  const html = await fetchPage(`${UFC_BASE_URL}/events`);
  const $ = cheerio.load(html);

  // The page lists upcoming events first with links to /event/...
  let eventPath: string | null = null;

  $('a[href*="/event/"]').each((_, el) => {
    if (eventPath) return;
    const href = $(el).attr("href");
    if (href && href.includes("/event/") && !href.includes("#")) {
      eventPath = href.startsWith("http")
        ? new URL(href).pathname
        : href;
    }
  });

  if (!eventPath) {
    throw new Error("Nenhum evento UFC encontrado");
  }

  return `${UFC_BASE_URL}${eventPath}`;
}

async function scrapeEventPage(eventUrl: string): Promise<UfcEventData> {
  const html = await fetchPage(eventUrl);
  const $ = cheerio.load(html);

  // Extract event name from h1
  const eventName = normalizeWhitespace($("h1").first().text()) || "UFC Event";

  // Extract event date from page text
  const eventDate = parseEventDate($("body").text());

  const fights: UfcFight[] = [];
  const seenFights = new Set<string>();

  // UFC page structure:
  // - .main-card div contains main card fights
  // - .fight-card div contains ALL fights (main + prelim)
  // - Each fight is a li.l-listing__item with 4 athlete links:
  //   [0] empty text (image wrapper), [1] name, [2] name, [3] empty text (image wrapper)
  // - Fighter images: img[src*="event_fight_card"]

  // Get fight lis that have athlete links
  const fightLis = $("li.l-listing__item").filter((_, el) =>
    $(el).find('a[href*="/athlete/"]').length >= 2,
  );

  fightLis.each((_, li) => {
    const $li = $(li);

    // Extract fighter names from athlete links with non-empty text
    const names: string[] = [];
    $li.find('a[href*="/athlete/"]').each((__, a) => {
      const text = normalizeWhitespace($(a).text());
      if (text && !names.includes(text)) {
        names.push(text);
      }
    });

    if (names.length < 2) return;
    const fighter1 = names[0];
    const fighter2 = names[1];

    // Deduplicate
    const key = `${fighter1}|${fighter2}`;
    if (seenFights.has(key)) return;
    seenFights.add(key);

    // Get fighter images (event_fight_card style images, exactly 2 per fight)
    let fighter1ImageUrl: string | null = null;
    let fighter2ImageUrl: string | null = null;
    const fightImages = $li.find('img[src*="event_fight_card"]');
    if (fightImages.length >= 1) {
      const src = $(fightImages[0]).attr("src");
      if (src) fighter1ImageUrl = src.startsWith("http") ? src : `https://ufc.com${src}`;
    }
    if (fightImages.length >= 2) {
      const src = $(fightImages[1]).attr("src");
      if (src) fighter2ImageUrl = src.startsWith("http") ? src : `https://ufc.com${src}`;
    }

    // Extract weight class
    const weightClass = extractWeightClass($li.text());

    // Determine main card vs prelim:
    // Main card fights are inside .main-card div, prelim are not
    const isMainCard = $li.closest(".main-card").length > 0;

    fights.push({
      fighter1,
      fighter2,
      fighter1ImageUrl,
      fighter2ImageUrl,
      weightClass,
      isMainCard,
    });
  });

  return { eventName, eventUrl, eventDate, fights };
}

async function fetchUpcomingUfcEvent(): Promise<UfcEventData> {
  const eventUrl = await findUpcomingEventUrl();
  return scrapeEventPage(eventUrl);
}

export async function getUpcomingUfcEvent(): Promise<UfcEventData> {
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.data;
  }

  const data = await fetchUpcomingUfcEvent();
  cachedResult = { data, timestamp: Date.now() };
  return data;
}
