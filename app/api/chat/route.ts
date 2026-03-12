import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase-server";
import { detectState } from "@/lib/detect-state";
import { US_STATES } from "@/lib/constants";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT_BASE =
  "You are AskAServer.AI, an AI assistant specialized in service of process law. " +
  "You help process servers, attorneys, and legal professionals understand state-specific " +
  "rules for serving legal documents. Always be helpful, accurate, and cite specific laws when possible. " +
  "If you don't have specific information about a state's laws in your context, say so and recommend " +
  "consulting the relevant state statutes directly. You are NOT a lawyer and cannot provide legal advice — " +
  "only informational guidance based on the state law data provided.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body as {
      message: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string" || message.length > 4000) {
      return NextResponse.json(
        { error: "Message is required and must be under 4000 characters" },
        { status: 400 }
      );
    }

    const state = detectState(message);

    const contextParts: string[] = [];

    if (state) {
      try {
        const { data: laws } = await supabase
          .from("state_laws")
          .select("title, content")
          .eq("state", state)
          .order("id");
        if (laws?.length) {
          contextParts.push(
            `=== STATE LAWS FOR ${US_STATES[state] || state} ===`
          );
          for (const law of laws) {
            contextParts.push(`--- ${law.title} ---\n${law.content}`);
          }
        }
      } catch {
        // Supabase fetch failed — continue without context
      }
    } else {
      try {
        const { data: nwLaws } = await supabase
          .from("state_laws")
          .select("title, content")
          .eq("state", "NW")
          .order("id");
        if (nwLaws?.length) {
          contextParts.push("=== NATIONWIDE / GENERAL LAWS ===");
          for (const law of nwLaws) {
            contextParts.push(`--- ${law.title} ---\n${law.content}`);
          }
        }
      } catch {
        // continue without context
      }
    }

    try {
      const { data: blogPosts } = await supabase
        .from("blog_posts")
        .select("title, body")
        .eq("status", "published")
        .eq("train_ai", true)
        .order("score", { ascending: false })
        .limit(10);

      if (blogPosts?.length) {
        const qLower = message.toLowerCase();
        const words = new Set(qLower.split(/\s+/).filter((w) => w.length > 3));
        const matched: typeof blogPosts = [];
        for (const bp of blogPosts) {
          const titleLower = (bp.title || "").toLowerCase();
          const bodyLower = (bp.body || "").toLowerCase();
          for (const w of words) {
            if (titleLower.includes(w) || bodyLower.includes(w)) {
              matched.push(bp);
              break;
            }
          }
          if (matched.length >= 3) break;
        }
        if (matched.length) {
          contextParts.push(
            "=== RELATED BLOG CONTENT (supplemental) ==="
          );
          for (const bp of matched) {
            contextParts.push(
              `--- ${bp.title} ---\n${(bp.body || "").slice(0, 500)}`
            );
          }
        }
      }
    } catch {
      // continue without blog context
    }

    let systemPrompt = SYSTEM_PROMPT_BASE;
    if (contextParts.length) {
      systemPrompt +=
        "\n\nREFERENCE DATA (use this to answer questions):\n" +
        contextParts.join("\n\n");
    }

    const oaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    if (history?.length) {
      for (const msg of history) {
        oaiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    oaiMessages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: oaiMessages,
      max_tokens: 2000,
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    let directoryResults: {
      company_name: string;
      website_url: string;
      notes: string;
      logo_url: string;
    }[] = [];

    if (state) {
      try {
        const { data: companies } = await supabase
          .from("company_notes")
          .select("company_name, website_url, notes, logo_url")
          .eq("state", state)
          .order("id");
        if (companies?.length) {
          directoryResults = companies.map((n) => ({
            company_name: n.company_name || "",
            website_url: n.website_url || "",
            notes: n.notes || "",
            logo_url: n.logo_url || "",
          }));
        }
      } catch {
        // continue without directory
      }
    }

    return NextResponse.json({
      response: aiResponse,
      directory_results: directoryResults,
      featured_companies: [],
      state_detected: state,
    });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
