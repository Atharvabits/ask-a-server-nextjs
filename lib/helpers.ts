import { supabase, SUPABASE_URL } from "./supabase-server";
import { US_STATES } from "./constants";

const STATE_ABBREVS: Record<string, string> = {};
for (const [abbr, name] of Object.entries(US_STATES)) {
  STATE_ABBREVS[name.toLowerCase()] = abbr;
}

const AMBIGUOUS = new Set([
  "IN", "OR", "OK", "ME", "HI", "AS", "DE", "LA", "MA", "PA", "ID", "AL", "OH", "NE", "DC",
]);

export function detectState(text: string): string | null {
  const t = text.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_ABBREVS)) {
    if (t.includes(name)) return abbr;
  }
  const words = text.split(/\s+/);
  const wl = t.split(/\s+/);
  for (let i = 0; i < wl.length; i++) {
    const a = wl[i].replace(/[^a-z]/g, "").toUpperCase();
    if (a in US_STATES && a !== "NW") {
      if (AMBIGUOUS.has(a)) {
        if (words[i].replace(/[^a-zA-Z]/g, "") === a) return a;
      } else return a;
    }
  }
  return null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .slice(0, 80);
}

const KEYWORD_MAP: Record<string, string[]> = {
  document_type: ["summons", "subpoena", "complaint", "writ", "petition", "motion", "order", "affidavit", "garnishment"],
  family_law: ["divorce", "custody", "child support", "alimony", "adoption", "paternity"],
  eviction_landlord: ["eviction", "unlawful detainer", "landlord", "tenant", "notice to quit"],
  service_method: ["personal service", "substituted service", "service by publication", "service by mail", "process server"],
  proof_filing: ["proof of service", "affidavit of service", "filing", "e-filing"],
  general: ["service of process", "legal notice", "civil procedure", "jurisdiction"],
};

export async function trackKeywords(question: string) {
  const q = question.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (q.includes(kw)) {
        try {
          const { data: existing } = await supabase.from("keyword_scores").select("id, score").eq("keyword", kw);
          if (existing?.length) {
            await supabase.from("keyword_scores").update({ score: existing[0].score + 1 }).eq("id", existing[0].id);
          } else {
            await supabase.from("keyword_scores").insert({ keyword: kw, category: cat, score: 1 });
          }
        } catch { /* ignore */ }
      }
    }
  }
  const state = detectState(question);
  if (state) {
    try {
      const { data: existing } = await supabase.from("state_scores").select("id, score").eq("state", state);
      if (existing?.length) {
        await supabase.from("state_scores").update({ score: existing[0].score + 1 }).eq("id", existing[0].id);
      } else {
        await supabase.from("state_scores").insert({ state, score: 1 });
      }
    } catch { /* ignore */ }
  }
}

const ALLOWED_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

export async function uploadToStorage(dataB64: string, filename: string, folder: string): Promise<string> {
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "png";
  if (!ALLOWED_EXTS.has(ext)) throw { status: 400, detail: `File type .${ext} not allowed` };

  const raw = dataB64.includes(",") ? dataB64.split(",")[1] : dataB64;
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length > 5 * 1024 * 1024) throw { status: 400, detail: "File too large (max 5MB)" };

  const uid = Math.random().toString(36).slice(2, 14);
  const path = `${folder}/${uid}.${ext}`;
  const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

  await supabase.storage.from("uploads").upload(path, bytes, { contentType });
  return `${SUPABASE_URL}/storage/v1/object/public/uploads/${path}`;
}
