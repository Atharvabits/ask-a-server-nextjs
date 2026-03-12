import { US_STATES } from "./constants";

const STATE_ABBREVS: Record<string, string> = {};
for (const [abbr, name] of Object.entries(US_STATES)) {
  STATE_ABBREVS[name.toLowerCase()] = abbr;
}

const AMBIGUOUS_ABBREVS = new Set([
  "IN", "OR", "OK", "ME", "HI", "AS", "DE", "LA", "MA", "PA", "ID", "AL", "OH", "NE", "DC",
]);

export function detectState(text: string): string | null {
  const t = text.toLowerCase();

  for (const [name, abbr] of Object.entries(STATE_ABBREVS)) {
    if (t.includes(name)) return abbr;
  }

  const words = text.split(/\s+/);
  const wordsLower = t.split(/\s+/);
  for (let i = 0; i < wordsLower.length; i++) {
    const abbrUpper = wordsLower[i].replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (abbrUpper in US_STATES && abbrUpper !== "NW") {
      if (AMBIGUOUS_ABBREVS.has(abbrUpper)) {
        if (words[i].replace(/[^a-zA-Z]/g, "") === abbrUpper) return abbrUpper;
      } else {
        return abbrUpper;
      }
    }
  }

  return null;
}
